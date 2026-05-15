import { httpClient } from '../../../shared/api/httpClient';
import type { MixerAnalysisResponse } from '../model/mixer';

export interface MixerAnalyzeInput {
  cardIds: string[];
  ratios?: Record<string, unknown>;
  userContext?: string;
}

export interface MixerRepository {
  analyze(input: MixerAnalyzeInput): Promise<MixerAnalysisResponse>;
}

class HttpMixerRepository implements MixerRepository {
  async analyze({ cardIds, ratios, userContext }: MixerAnalyzeInput): Promise<MixerAnalysisResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const body: Record<string, unknown> = { card_ids: cardIds };
    if (ratios && Object.keys(ratios).length > 0) {
      body.ratios = ratios;
    }
    if (userContext && userContext.trim().length > 0) {
      body.user_context = userContext;
    }

    return httpClient.post<MixerAnalysisResponse>('/api/mixer', body);
  }
}

export const mixerRepository: MixerRepository = new HttpMixerRepository();
