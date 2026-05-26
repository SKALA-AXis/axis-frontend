import { httpClient } from '../../../shared/api/httpClient';
import type {
  GlobalIndustryTrendRow,
  GlobalTrendsResponse,
} from '../model/globalTrends';

export interface GlobalTrendsInput {
  companyIds?: string[];
  focusThemes?: string[];
  windowDays?: number;
  skAxBusinessLines?: string[];
}

export interface GlobalTrendsListInput {
  from?: string;
  to?: string;
  limit?: number;
}

export interface GlobalTrendsRepository {
  /**
   * 새로 5-phase 분석을 실행 (LLM 3 회, ₩600~1,000/회). 사용자가 "재분석"
   * 버튼을 누르거나 cron 결과(GET /latest)가 비어있을 때만 호출.
   */
  run(input: GlobalTrendsInput): Promise<GlobalTrendsResponse>;
  /**
   * cron 이 daily upsert 한 결과를 DB 에서 읽어옴. 페이지 진입 시 기본 호출.
   * 비용 ₩0.
   */
  listLatest(input?: GlobalTrendsListInput): Promise<GlobalIndustryTrendRow[]>;
}

class HttpGlobalTrendsRepository implements GlobalTrendsRepository {
  async run({
    companyIds,
    focusThemes,
    windowDays,
    skAxBusinessLines,
  }: GlobalTrendsInput): Promise<GlobalTrendsResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const body: Record<string, unknown> = {};
    if (companyIds && companyIds.length > 0) body.company_ids = companyIds;
    if (focusThemes && focusThemes.length > 0) body.focus_themes = focusThemes;
    if (windowDays !== undefined) body.window_days = windowDays;
    if (skAxBusinessLines && skAxBusinessLines.length > 0) body.sk_ax_business_lines = skAxBusinessLines;

    return httpClient.post<GlobalTrendsResponse>('/api/global/trends/run', body);
  }

  async listLatest(input?: GlobalTrendsListInput): Promise<GlobalIndustryTrendRow[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const params = new URLSearchParams();
    if (input?.limit !== undefined) params.set('limit', String(input.limit));
    const qs = params.toString();
    const path = qs ? `/api/global/trends/latest?${qs}` : '/api/global/trends/latest';
    return httpClient.get<GlobalIndustryTrendRow[]>(path);
  }
}

export const globalTrendsRepository: GlobalTrendsRepository = new HttpGlobalTrendsRepository();
