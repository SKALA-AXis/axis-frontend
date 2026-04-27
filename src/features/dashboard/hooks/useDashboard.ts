import { useEffect, useState } from 'react';
import { dashboardRepository } from '../api/dashboardRepository';
import { mapDashboardToViewModel, type DashboardViewModel } from '../mappers/dashboardMapper';

interface UseDashboardResult {
  dashboard: DashboardViewModel | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard(): UseDashboardResult {
  const [dashboard, setDashboard] = useState<DashboardViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await dashboardRepository.getDashboard();

        if (isMounted) {
          setDashboard(mapDashboardToViewModel(data));
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { dashboard, isLoading, error };
}
