import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import type { AlertsData } from '../model/alert';
import { alertsRepository } from '../api/alertsRepository';

interface UseAlertsResult {
  alertsData: AlertsData | null;
  isLoading: boolean;
  error: string | null;
}

export function useAlerts(): UseAlertsResult {
  const load = useCallback(() => alertsRepository.getAlerts(), []);
  const { data: alertsData, isLoading, error } = useAsyncResource<AlertsData | null>(load, null, [load]);

  return { alertsData, isLoading, error };
}
