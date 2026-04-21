import client from './client'
import type { IssueCard } from '../types/api'

export interface IssueCardFilters {
  peerId?: string
  importance?: string
  eventType?: string
}

export const issueCardsApi = {
  getList: (filters: IssueCardFilters = {}): Promise<IssueCard[]> =>
    client.get('/api/issues', { params: filters }),

  getToday: (filters: IssueCardFilters = {}): Promise<IssueCard[]> =>
    client.get('/api/issues/today', { params: filters }),

  getById: (id: string): Promise<IssueCard> =>
    client.get(`/api/issues/${id}`),
}
