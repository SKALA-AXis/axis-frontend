import type { BriefingPeriod } from '../data/periodMeta';
import type { BriefingsData } from '../model/briefing';
import { httpClient } from '../../../shared/api/httpClient';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { mockBriefingsData } from '../../../shared/mocks/briefings';

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

class MockBriefingsRepository implements BriefingsRepository {
  async getBriefings(): Promise<BriefingsData> {
    return Promise.resolve(mockBriefingsData);
  }

  async generateBriefing(): Promise<BriefingGenerateResult> {
    throw new Error('브리핑 생성 API는 백엔드 연결이 필요합니다.');
  }
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

class HybridBriefingsRepository implements BriefingsRepository {
  constructor(
    private readonly remoteRepository: BriefingsRepository,
    private readonly fallbackRepository: BriefingsRepository,
  ) {}

  async getBriefings(): Promise<BriefingsData> {
    return resolveWithFallback(
      () => this.remoteRepository.getBriefings(),
      () => this.fallbackRepository.getBriefings(),
    );
  }

  async generateBriefing(request: BriefingGenerateRequest): Promise<BriefingGenerateResult> {
    return this.remoteRepository.generateBriefing(request);
  }
}

const fallbackBriefingsRepository = new MockBriefingsRepository();

export const briefingsRepository: BriefingsRepository = httpClient
  ? new HybridBriefingsRepository(new HttpBriefingsRepository(), fallbackBriefingsRepository)
  : fallbackBriefingsRepository;
