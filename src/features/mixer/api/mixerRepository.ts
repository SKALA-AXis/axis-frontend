import { getAccessToken } from '../../../shared/api/authSession';
import { httpClient } from '../../../shared/api/httpClient';
import { env } from '../../../shared/config/env';
import type { MixerAnalysisResponse, MixerStageEvent } from '../model/mixer';

export interface MixerAnalyzeInput {
  cardIds: string[];
  ratios?: Record<string, unknown>;
  userContext?: string;
}

export interface MixerRepository {
  analyze(input: MixerAnalyzeInput): Promise<MixerAnalysisResponse>;
  /** SSE 스트리밍 — 실행 단계(onStage) 실시간 수신 후 최종 결과 반환. */
  analyzeStream(input: MixerAnalyzeInput, onStage: (event: MixerStageEvent) => void): Promise<MixerAnalysisResponse>;
}

function buildBody({ cardIds, ratios, userContext }: MixerAnalyzeInput): Record<string, unknown> {
  const body: Record<string, unknown> = { card_ids: cardIds };
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

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/mixer/stream`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(buildBody(input)),
      });
    } catch {
      throw new Error('백엔드 서버에 연결할 수 없습니다.');
    }

    if (!response.ok || !response.body) {
      throw new Error(response.status === 401 ? '로그인이 필요합니다.' : `믹서 스트리밍 요청 실패 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: MixerAnalysisResponse | null = null;
    let errorMessage: string | null = null;

    const drain = (rawEvent: string) => {
      const data = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('');
      if (!data) return;
      let payload: { type?: string; data?: MixerAnalysisResponse; message?: string };
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
      }
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        drain(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }
    if (buffer.trim()) {
      drain(buffer);
    }

    if (errorMessage) {
      throw new Error(errorMessage);
    }
    if (!result) {
      throw new Error('믹서 스트리밍 결과를 받지 못했습니다.');
    }
    return result;
  }
}

export const mixerRepository: MixerRepository = new HttpMixerRepository();
