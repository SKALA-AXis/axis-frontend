import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { dashboardRepository } from '../api/dashboardRepository';
import { mapDashboardToViewModel, type DashboardViewModel } from '../mappers/dashboardMapper';
import type { DashboardKeywordTrendsData } from '../model/dashboard';

interface UseDashboardResult {
  dashboard: DashboardViewModel | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const load = useCallback(async () => {
    const data = await dashboardRepository.getDashboard();
    return mapDashboardToViewModel(data);
  }, []);
  const { data: dashboard, status, isLoading, error, reload } = useAsyncResource<DashboardViewModel | null>(load, null, [load], {
    errorMessage: '대시보드를 불러오지 못했습니다.',
  });

  return { dashboard, status, isLoading, error, reload };
}

interface UseDashboardKeywordTrendsResult {
  keywordTrends: DashboardKeywordTrendsData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDashboardKeywordTrends(): UseDashboardKeywordTrendsResult {
  const load = useCallback(() => dashboardRepository.getKeywordTrends(), []);
  const {
    data: keywordTrends,
    status,
    isLoading,
    error,
    reload,
  } = useAsyncResource<DashboardKeywordTrendsData | null>(load, null, [load], {
    errorMessage: '키워드 검색지수 그래프를 불러오지 못했습니다.',
  });

  return { keywordTrends, status, isLoading, error, reload };
}
