import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { globalTrendsRepository } from '../api/globalTrendsRepository';
import type { GlobalTrendListResponse } from '../model/globalTrends';

export function useGlobalTrendsList(windowDays = 30) {
  const load = useCallback(async () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - windowDays);
    const format = (date: Date) => date.toISOString().slice(0, 10);
    return globalTrendsRepository.list({
      from: format(from),
      to: format(to),
      limit: 10,
    });
  }, [windowDays]);

  return useAsyncResource<GlobalTrendListResponse | null>(load, null, [load], {
    errorMessage: '글로벌 트렌드를 불러오지 못했습니다.',
  });
}
