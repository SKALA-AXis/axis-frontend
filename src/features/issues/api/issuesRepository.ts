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
