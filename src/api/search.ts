import client from './client'
import type { SearchRequest, SearchResponse } from '../types/api'

export const searchApi = {
  search: (request: SearchRequest): Promise<SearchResponse> =>
    client.post('/api/search', request),

  getSuggestions: (q: string): Promise<string[]> =>
    client.get('/api/search/suggestions', { params: { q } }),
}
