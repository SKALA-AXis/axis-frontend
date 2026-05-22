import { httpClient } from '../../../shared/api/httpClient';

type BookmarkListResponse = {
  items?: Array<{ id?: string | null }>;
};

class BookmarksRepository {
  enabled() {
    return Boolean(httpClient);
  }

  async listIds(): Promise<string[]> {
    if (!httpClient) return [];
    const response = await httpClient.get<BookmarkListResponse>('/api/bookmarks');
    return (response.items ?? [])
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  }

  async add(cardId: string): Promise<void> {
    if (!httpClient) return;
    await httpClient.post('/api/bookmarks', { card_id: cardId });
  }

  async remove(cardId: string): Promise<void> {
    if (!httpClient) return;
    await httpClient.delete(`/api/bookmarks/${encodeURIComponent(cardId)}`);
  }
}

export const bookmarksRepository = new BookmarksRepository();
