import type { BriefingsData } from '../model/briefing';
import { httpClient } from '../../../shared/api/httpClient';
import { getCachedResource, prefetchCachedResource } from '../../../shared/api/resourceCache';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { mockBriefingsData } from '../../../shared/mocks/briefings';

export interface BriefingsRepository {
  getBriefings(): Promise<BriefingsData>;
  prefetch?(): Promise<void>;
}

class MockBriefingsRepository implements BriefingsRepository {
  async getBriefings(): Promise<BriefingsData> {
    return Promise.resolve(mockBriefingsData);
  }
}

class HttpBriefingsRepository implements BriefingsRepository {
  async getBriefings(): Promise<BriefingsData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<BriefingsData>('/api/briefings');
  }
}

class HybridBriefingsRepository implements BriefingsRepository {
  constructor(
    private readonly remoteRepository: BriefingsRepository,
    private readonly fallbackRepository: BriefingsRepository,
  ) {}

  async getBriefings(): Promise<BriefingsData> {
    return getCachedResource('briefings:summary', () => resolveWithFallback(
      () => this.remoteRepository.getBriefings(),
      () => this.fallbackRepository.getBriefings(),
    ));
  }

  prefetch(): Promise<void> {
    return prefetchCachedResource('briefings:summary', () => resolveWithFallback(
      () => this.remoteRepository.getBriefings(),
      () => this.fallbackRepository.getBriefings(),
    ));
  }
}

const fallbackBriefingsRepository = new MockBriefingsRepository();

export const briefingsRepository: BriefingsRepository = httpClient
  ? new HybridBriefingsRepository(new HttpBriefingsRepository(), fallbackBriefingsRepository)
  : fallbackBriefingsRepository;
