import type { RawArticle } from '../model/rawArticle';
import { mockRawArticles } from '../../../shared/mocks/rawArticles';

export interface RawArticlesRepository {
  list(): Promise<RawArticle[]>;
}

class MockRawArticlesRepository implements RawArticlesRepository {
  async list(): Promise<RawArticle[]> {
    return Promise.resolve(mockRawArticles);
  }
}

export const rawArticlesRepository: RawArticlesRepository = new MockRawArticlesRepository();
