import { httpClient } from '../../../shared/api/httpClient';
import type { InsightCascadeResponse } from '../model/insight';

export interface InsightGenerateInput {
  cardIds: string[];
  context?: Record<string, unknown>;
}

export interface InsightRepository {
  generate(input: InsightGenerateInput): Promise<InsightCascadeResponse>;
}

class HttpInsightRepository implements InsightRepository {
  async generate({ cardIds, context }: InsightGenerateInput): Promise<InsightCascadeResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const body: Record<string, unknown> = { card_ids: cardIds };
    if (context && Object.keys(context).length > 0) {
      body.context = context;
    }

    return httpClient.post<InsightCascadeResponse>('/api/insights/generate', body);
  }
}

export const insightRepository: InsightRepository = new HttpInsightRepository();
