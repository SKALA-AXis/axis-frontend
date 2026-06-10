import type { RawArticle } from '../model/rawArticle';
import { httpClient } from '../../../shared/api/httpClient';

export interface RawArticlesRepository {
  list(): Promise<RawArticle[]>;
}

class HttpRawArticlesRepository implements RawArticlesRepository {
  async list(): Promise<RawArticle[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<RawArticle[]>('/raw-articles');
  }
}

export const rawArticlesRepository: RawArticlesRepository = new HttpRawArticlesRepository();
