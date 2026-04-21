import { useQuery } from '@tanstack/react-query'
import { issueCardsApi, type IssueCardFilters } from '../api/issueCards'

export function useIssueCards(filters: IssueCardFilters = {}) {
  return useQuery({
    queryKey: ['issue-cards', filters],
    queryFn: () => issueCardsApi.getList(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useTodayIssues(filters: IssueCardFilters = {}) {
  return useQuery({
    queryKey: ['issue-cards-today', filters],
    queryFn: () => issueCardsApi.getToday(filters),
    staleTime: 1000 * 60 * 5,
  })
}
