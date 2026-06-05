import type { PeersData } from '../model/peer';
import { httpClient } from '../../../shared/api/httpClient';
import { getCachedResource, prefetchCachedResource } from '../../../shared/api/resourceCache';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { mockPeersData } from '../../../shared/mocks/peers';

export interface PeersRepository {
  getPeers(): Promise<PeersData>;
  prefetch?(): Promise<void>;
}

class MockPeersRepository implements PeersRepository {
  async getPeers(): Promise<PeersData> {
    return Promise.resolve(mockPeersData);
  }
}

class HttpPeersRepository implements PeersRepository {
  async getPeers(): Promise<PeersData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<PeersData>('/api/peers');
  }
}

class HybridPeersRepository implements PeersRepository {
  constructor(
    private readonly remoteRepository: PeersRepository,
    private readonly fallbackRepository: PeersRepository,
  ) {}

  async getPeers(): Promise<PeersData> {
    return getCachedResource('peers:list', () => resolveWithFallback(
      () => this.remoteRepository.getPeers(),
      () => this.fallbackRepository.getPeers(),
    ));
  }

  prefetch(): Promise<void> {
    return prefetchCachedResource('peers:list', () => resolveWithFallback(
      () => this.remoteRepository.getPeers(),
      () => this.fallbackRepository.getPeers(),
    ));
  }
}

const fallbackPeersRepository = new MockPeersRepository();

export const peersRepository: PeersRepository = httpClient
  ? new HybridPeersRepository(new HttpPeersRepository(), fallbackPeersRepository)
  : fallbackPeersRepository;
