import { httpClient } from '../../../shared/api/httpClient';
import type { GlobalTrendsResponse } from '../model/globalTrends';

export interface GlobalTrendsInput {
  companyIds?: string[];
  focusThemes?: string[];
  windowDays?: number;
  skAxBusinessLines?: string[];
}

export interface GlobalTrendsRepository {
  run(input: GlobalTrendsInput): Promise<GlobalTrendsResponse>;
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
}

export const globalTrendsRepository: GlobalTrendsRepository = new HttpGlobalTrendsRepository();
