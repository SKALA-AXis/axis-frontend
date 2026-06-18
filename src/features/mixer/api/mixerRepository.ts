/*
 * 작성일: 2026-05-15
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-15 최종민 — Mixer 리포지토리 신설(mock→실 /api/mixer) 및 SSE 단계 스트리밍 추가
 *   2026-06-10 박진 — mock 비활성화 및 챗봇 프론트 플로우 수정
 */
import { getAccessToken } from '../../../shared/api/authSession';
import { HttpRequestError, httpClient } from '../../../shared/api/httpClient';
import { env } from '../../../shared/config/env';
import type { MixerAnalysisMode, MixerAnalysisResponse, MixerRecentResult, MixerStageEvent } from '../model/mixer';

export interface MixerAnalyzeInput {
  cardIds: string[];
  ratios?: Record<string, unknown>;
  userContext?: string;
  analysisMode?: MixerAnalysisMode;
}

export interface MixerRepository {
  analyze(input: MixerAnalyzeInput): Promise<MixerAnalysisResponse>;
  /** SSE 스트리밍 — 실행 단계(onStage) 실시간 수신 후 최종 결과 반환. */
  analyzeStream(input: MixerAnalyzeInput, onStage: (event: MixerStageEvent) => void): Promise<MixerAnalysisResponse>;
  recent(limit?: number): Promise<MixerRecentResult[]>;
}

const MIXER_STREAM_TIMEOUT_MS: Record<MixerAnalysisMode, number> = {
  quick: 45_000,
  deep: 150_000,
};

function normalizeAnalysisMode(mode?: MixerAnalysisMode): MixerAnalysisMode {
  return mode === 'deep' ? 'deep' : 'quick';
}

function buildBody({ cardIds, ratios, userContext, analysisMode }: MixerAnalyzeInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    card_ids: cardIds,
    analysis_mode: normalizeAnalysisMode(analysisMode),
  };
  if (ratios && Object.keys(ratios).length > 0) {
    body.ratios = ratios;
  }
  if (userContext && userContext.trim().length > 0) {
    body.user_context = userContext;
  }
  return body;
}

class HttpMixerRepository implements MixerRepository {
  async analyze(input: MixerAnalyzeInput): Promise<MixerAnalysisResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    return httpClient.post<MixerAnalysisResponse>('/api/mixer', buildBody(input));
  }

  async recent(limit = 5): Promise<MixerRecentResult[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const response = await httpClient.get<{ items?: MixerRecentResult[] }>(`/api/mixer/recent?limit=${limit}`);
    return response.items ?? [];
  }

  async analyzeStream(
    input: MixerAnalyzeInput,
    onStage: (event: MixerStageEvent) => void,
  ): Promise<MixerAnalysisResponse> {
    const baseUrl = env.apiBaseUrl;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const analysisMode = normalizeAnalysisMode(input.analysisMode);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), MIXER_STREAM_TIMEOUT_MS[analysisMode]);
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/mixer/stream`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(buildBody(input)),
        signal: controller.signal,
      });
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpRequestError(
          analysisMode === 'quick'
            ? '호출에 실패했다'
            : '호출에 실패했다',
          { code: analysisMode === 'quick' ? 'MIXER_STREAM_TIMEOUT_45S' : 'MIXER_STREAM_TIMEOUT_150S' },
        );
      }
      throw new HttpRequestError('호출에 실패했다', { code: 'MIXER_STREAM_NETWORK_FAILED' });
    }

    if (!response.ok || !response.body) {
      window.clearTimeout(timeoutId);
      throw new HttpRequestError(
        response.status === 401 ? '로그인이 필요합니다.' : '호출에 실패했다',
        { code: `MIXER_STREAM_HTTP_${response.status}`, status: response.status },
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: MixerAnalysisResponse | null = null;
    let errorMessage: string | null = null;
    let errorCode: string | null = null;

    const drain = (rawEvent: string) => {
      const data = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('');
      if (!data) return;
      let payload: { type?: string; data?: MixerAnalysisResponse; message?: string; error_code?: string };
      try {
        payload = JSON.parse(data);
      } catch {
        return;
      }
      if (payload.type === 'stage') {
        onStage(payload as unknown as MixerStageEvent);
      } else if (payload.type === 'result' && payload.data) {
        result = payload.data;
      } else if (payload.type === 'error') {
        errorMessage = payload.message ?? '믹서 분석 실패';
        errorCode = payload.error_code ?? 'MIXER_STREAM_FAILED';
      }
    };

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new HttpRequestError(
              analysisMode === 'quick'
                ? '호출에 실패했다'
                : '호출에 실패했다',
              { code: analysisMode === 'quick' ? 'MIXER_STREAM_TIMEOUT_45S' : 'MIXER_STREAM_TIMEOUT_150S' },
            );
          }
          throw error;
        }
        const { done, value } = chunk;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          drain(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');
        }
        if (result || errorMessage) {
          await reader.cancel().catch(() => undefined);
          break;
        }
      }
      if (buffer.trim() && !result && !errorMessage) {
        drain(buffer);
      }
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (errorMessage) {
      throw new HttpRequestError(errorMessage, { code: errorCode ?? 'MIXER_STREAM_FAILED' });
    }
    if (!result) {
      throw new HttpRequestError('호출에 실패했다', { code: 'MIXER_STREAM_EMPTY_RESPONSE' });
    }
    return result;
  }
}

export const mixerRepository: MixerRepository = new HttpMixerRepository();
