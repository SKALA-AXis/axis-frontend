/*
 * 작성일: 2026-06-08
 * 작성자: 최종민
 * 변경이력:
 *   2026-06-08 최종민 — 글로벌 산업 동향 페이지를 실 API와 연동
 */
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
