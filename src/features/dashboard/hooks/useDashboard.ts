import { useCallback, useMemo } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { dashboardRepository } from '../api/dashboardRepository';
import { mapDashboardToViewModel, type DashboardViewModel } from '../mappers/dashboardMapper';

interface UseDashboardResult {
  dashboard: DashboardViewModel | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard(): UseDashboardResult {
  const load = useCallback(async () => {
    const data = await dashboardRepository.getDashboard();
    return mapDashboardToViewModel(data);
  }, []);
  const { data: dashboard, isLoading, error } = useAsyncResource<DashboardViewModel | null>(load, null, [load]);

  return { dashboard, isLoading, error };
}
