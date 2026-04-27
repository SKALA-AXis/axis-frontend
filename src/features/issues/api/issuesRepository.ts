import type { Issue } from '../../../entities/issue/model';
import { httpClient } from '../../../shared/api/httpClient';
import { mockIssues } from '../../../shared/mocks/issues';

export interface IssuesRepository {
  list(): Promise<Issue[]>;
}

class MockIssuesRepository implements IssuesRepository {
  async list(): Promise<Issue[]> {
    return Promise.resolve(mockIssues);
  }
}

class HttpIssuesRepository implements IssuesRepository {
  async list(): Promise<Issue[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<Issue[]>('/issues');
  }
}

export const issuesRepository: IssuesRepository = httpClient
  ? new HttpIssuesRepository()
  : new MockIssuesRepository();
