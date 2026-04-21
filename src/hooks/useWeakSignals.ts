import { useQuery } from '@tanstack/react-query'
import client from '../api/client'

export function useWeakSignals() {
  return useQuery({
    queryKey: ['weak-signals'],
    queryFn: () => client.get('/api/weak-signals'),
    staleTime: 1000 * 60 * 60,
  })
}
