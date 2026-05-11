import { httpClient } from '../../../shared/api/httpClient';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { cardNewsItems } from '../../../shared/mocks/cardNews';
import type { CardNewsItem } from '../model/cardNews';

export interface CardNewsRepository {
  list(): Promise<CardNewsItem[]>;
  today(): Promise<CardNewsItem[]>;
}

class MockCardNewsRepository implements CardNewsRepository {
  async list(): Promise<CardNewsItem[]> {
    return Promise.resolve(cardNewsItems);
  }

  async today(): Promise<CardNewsItem[]> {
    return Promise.resolve(cardNewsItems);
  }
}

class HttpCardNewsRepository implements CardNewsRepository {
  async list(): Promise<CardNewsItem[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const response = await httpClient.get<{ items: CardNewsItem[] }>('/api/cards?sort=exposure_desc&limit=30');
    return response.items;
  }

  async today(): Promise<CardNewsItem[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const response = await httpClient.get<{ items: CardNewsItem[] }>('/api/cards/today?limit=10');
    return response.items;
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

  async today(): Promise<CardNewsItem[]> {
    return resolveWithFallback(
      () => this.remoteRepository.today(),
      () => this.fallbackRepository.today(),
    );
  }
}

const fallbackRepository = new MockCardNewsRepository();

export const cardNewsRepository: CardNewsRepository = httpClient
  ? new HybridCardNewsRepository(new HttpCardNewsRepository(), fallbackRepository)
  : fallbackRepository;
