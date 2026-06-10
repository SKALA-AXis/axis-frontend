import type { BriefingPeriod } from '../data/periodMeta';
import type { BriefingsData } from '../model/briefing';
import { httpClient } from '../../../shared/api/httpClient';

export interface BriefingGenerateRequest {
  briefing_type: BriefingPeriod;
  anchor_date?: string;
  refine_display_copy?: boolean;
  save?: boolean;
  limit?: number;
  card_ids?: string[];
  peer_ids?: string[];
  sectors?: string[];
  user_context?: string;
}

export type BriefingGenerateResult = Record<string, unknown>;

export interface BriefingsRepository {
  getBriefings(): Promise<BriefingsData>;
  generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult>;
}

class HttpBriefingsRepository implements BriefingsRepository {
  async getBriefings(): Promise<BriefingsData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<BriefingsData>('/api/briefings');
  }

  async generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.post<BriefingGenerateResult>('/api/briefings/generate', request);
  }
}

export const briefingsRepository: BriefingsRepository = new HttpBriefingsRepository();
