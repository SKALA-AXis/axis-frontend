import { httpClient } from '../../../shared/api/httpClient';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { cardNewsItems } from '../../../shared/mocks/cardNews';
import type { CardNewsItem } from '../model/cardNews';

export interface CardNewsRepository {
  list(): Promise<CardNewsItem[]>;
}

class MockCardNewsRepository implements CardNewsRepository {
  async list(): Promise<CardNewsItem[]> {
    return Promise.resolve(cardNewsItems);
  }
}

class HttpCardNewsRepository implements CardNewsRepository {
  async list(): Promise<CardNewsItem[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<CardNewsItem[]>('/card-news');
  }
}

class HybridCardNewsRepository implements CardNewsRepository {
  constructor(
    private readonly remoteRepository: CardNewsRepository,
    private readonly fallbackRepository: CardNewsRepository,
  ) {}

  async list(): Promise<CardNewsItem[]> {
    return resolveWithFallback(
      () => this.remoteRepository.list(),
      () => this.fallbackRepository.list(),
    );
  }
}

const fallbackRepository = new MockCardNewsRepository();

export const cardNewsRepository: CardNewsRepository = httpClient
  ? new HybridCardNewsRepository(new HttpCardNewsRepository(), fallbackRepository)
  : fallbackRepository;
