import type { RawArticle } from '../model/rawArticle';
import { httpClient } from '../../../shared/api/httpClient';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { mockRawArticles } from '../../../shared/mocks/rawArticles';

export interface RawArticlesRepository {
  list(): Promise<RawArticle[]>;
}

class MockRawArticlesRepository implements RawArticlesRepository {
  async list(): Promise<RawArticle[]> {
    return Promise.resolve(mockRawArticles);
  }
}

class HttpRawArticlesRepository implements RawArticlesRepository {
  async list(): Promise<RawArticle[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<RawArticle[]>('/raw-articles');
  }
}

class HybridRawArticlesRepository implements RawArticlesRepository {
  constructor(
    private readonly remoteRepository: RawArticlesRepository,
    private readonly fallbackRepository: RawArticlesRepository,
  ) {}

  async list(): Promise<RawArticle[]> {
    return resolveWithFallback(
      () => this.remoteRepository.list(),
      () => this.fallbackRepository.list(),
    );
  }
}

const fallbackRawArticlesRepository = new MockRawArticlesRepository();

export const rawArticlesRepository: RawArticlesRepository = httpClient
  ? new HybridRawArticlesRepository(new HttpRawArticlesRepository(), fallbackRawArticlesRepository)
  : fallbackRawArticlesRepository;
