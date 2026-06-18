/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 폴더 구조 재정리 시 원문 기사 리포지토리 구성
 *   2026-06-10 박진 — mock 비활성화 및 챗봇/믹서 UX 작업에 맞춘 수정
 */
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
