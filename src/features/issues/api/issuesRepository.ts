/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 개편으로 이슈 리포지토리 정리
 *   2026-06-10 박진 — mock 비활성화 및 챗봇 로직 수정
 */
import type { Issue } from '../../../entities/issue/model';
import { httpClient } from '../../../shared/api/httpClient';

export interface IssuesRepository {
  list(): Promise<Issue[]>;
}

class HttpIssuesRepository implements IssuesRepository {
  async list(): Promise<Issue[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<Issue[]>('/issues');
  }
}

export const issuesRepository: IssuesRepository = new HttpIssuesRepository();
