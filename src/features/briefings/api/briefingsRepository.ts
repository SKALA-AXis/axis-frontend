/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재구성 과정에서 브리핑 리포지토리 정리, 이후 UI 개선·키워드 그래프 API·브리핑 표시 동작·튜토리얼/관리자 UI 정리
 *   2026-06-09 최종민 — 홈 인사이트 anchor_date 및 브리핑 생성 클라이언트 연동
 *   2026-06-10 박진 — mock 비활성화·믹서 UX 개선, 챗봇 로직 수정, 생성 브리핑 UI 연결
 */
import type { BriefingPeriod } from '../data/periodMeta';
import type { BriefingsData } from '../model/briefing';
import { httpClient } from '../../../shared/api/httpClient';

export interface BriefingGenerateRequest {
  briefing_type: BriefingPeriod;
  anchor_date?: string;
  month?: string;
  week_index?: number;
  refine_display_copy?: boolean;
  save?: boolean;
  limit?: number;
  card_ids?: string[];
  peer_ids?: string[];
  sectors?: string[];
  user_context?: string;
}

export type BriefingGenerateResult = Record<string, unknown>;

export interface BriefingSummaryRequest {
  briefing_type: BriefingPeriod;
  anchor_date?: string;
  month?: string;
  week_index?: number;
}

export interface BriefingsRepository {
  getBriefings(): Promise<BriefingsData>;
  getBriefingSummary(request: BriefingSummaryRequest): Promise<BriefingGenerateResult>;
  getBriefingById(id: string): Promise<BriefingGenerateResult>;
  getCachedBriefingById(id: string): BriefingGenerateResult | null;
  prefetchBriefingById(id: string): void;
  generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult>;
}

const summaryCache = new Map<string, BriefingGenerateResult>();
const summaryInFlight = new Map<string, Promise<BriefingGenerateResult>>();
const briefingByIdCache = new Map<string, BriefingGenerateResult>();
const briefingByIdInFlight = new Map<string, Promise<BriefingGenerateResult>>();

function summaryCacheKey(request: BriefingSummaryRequest) {
  return [
    request.briefing_type,
    request.anchor_date ?? '',
    request.month ?? '',
    typeof request.week_index === 'number' ? request.week_index : '',
  ].join('|');
}

class HttpBriefingsRepository implements BriefingsRepository {
  async getBriefings(): Promise<BriefingsData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<BriefingsData>('/api/briefings');
  }

  async getBriefingSummary(request: BriefingSummaryRequest): Promise<BriefingGenerateResult> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const cacheKey = summaryCacheKey(request);
    const cached = summaryCache.get(cacheKey);
    if (cached) return cached;
    const inFlight = summaryInFlight.get(cacheKey);
    if (inFlight) return inFlight;

    const params = new URLSearchParams({ briefing_type: request.briefing_type });
    if (request.anchor_date) {
      params.set('anchor_date', request.anchor_date);
    }
    if (request.month) {
      params.set('month', request.month);
    }
    if (typeof request.week_index === 'number') {
      params.set('week_index', String(request.week_index));
    }

    const requestPromise = httpClient.get<BriefingGenerateResult>(`/api/briefings/summary?${params.toString()}`)
      .then((result) => {
        summaryCache.set(cacheKey, result);
        return result;
      })
      .finally(() => {
        summaryInFlight.delete(cacheKey);
      });
    summaryInFlight.set(cacheKey, requestPromise);
    return requestPromise;
  }

  async getBriefingById(id: string): Promise<BriefingGenerateResult> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error('브리핑 ID가 없습니다.');
    }
    const cached = briefingByIdCache.get(normalizedId);
    if (cached) return cached;
    const inFlight = briefingByIdInFlight.get(normalizedId);
    if (inFlight) return inFlight;

    const requestPromise = httpClient.get<BriefingGenerateResult>(`/api/briefings/${encodeURIComponent(normalizedId)}`)
      .then((result) => {
        briefingByIdCache.set(normalizedId, result);
        return result;
      })
      .finally(() => {
        briefingByIdInFlight.delete(normalizedId);
      });
    briefingByIdInFlight.set(normalizedId, requestPromise);
    return requestPromise;
  }

  getCachedBriefingById(id: string): BriefingGenerateResult | null {
    return briefingByIdCache.get(id.trim()) ?? null;
  }

  prefetchBriefingById(id: string): void {
    void this.getBriefingById(id).catch(() => {
      // 검색 결과 프리로드 실패는 클릭 시 정식 로딩 경로에서 다시 처리한다.
    });
  }

  async generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.post<BriefingGenerateResult>('/api/briefings/generate', request);
  }
}

export const briefingsRepository: BriefingsRepository = new HttpBriefingsRepository();
