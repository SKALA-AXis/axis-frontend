import { useMutation, useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/search'
import type { SearchRequest } from '../types/api'

export function useSearch() {
  return useMutation({
    mutationFn: (request: SearchRequest) => searchApi.search(request),
  })
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => searchApi.getSuggestions(query),
    enabled: query.length > 1,
    staleTime: 1000 * 60 * 10,
  })
}
