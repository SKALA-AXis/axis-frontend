import { useEffect, useState } from 'react';
import type { AlertsData } from '../model/alert';
import { alertsRepository } from '../api/alertsRepository';

interface UseAlertsResult {
  alertsData: AlertsData | null;
  isLoading: boolean;
  error: string | null;
}

export function useAlerts(): UseAlertsResult {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const result = await alertsRepository.getAlerts();
        if (isMounted) {
          setAlertsData(result);
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
  return { alertsData, isLoading, error };
}
