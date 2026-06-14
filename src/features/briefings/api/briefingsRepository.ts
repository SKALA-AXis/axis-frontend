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
  generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult>;
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

    return httpClient.get<BriefingGenerateResult>(`/api/briefings/summary?${params.toString()}`);
  }

  async generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.post<BriefingGenerateResult>('/api/briefings/generate', request);
  }
}

export const briefingsRepository: BriefingsRepository = new HttpBriefingsRepository();
