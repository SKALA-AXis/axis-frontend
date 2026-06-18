/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 북마크 리포지토리 추가('올라가기 버튼' 작업)
 */
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
