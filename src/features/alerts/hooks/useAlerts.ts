/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재정리 과정에서 알림 조회 훅 추가, 이후 UI 개선·로딩 표준화 반영
 */
import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import type { AlertsData } from '../model/alert';
import { alertsRepository } from '../api/alertsRepository';

interface UseAlertsResult {
  alertsData: AlertsData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAlerts(): UseAlertsResult {
  const load = useCallback(() => alertsRepository.getAlerts(), []);
  const { data: alertsData, status, isLoading, error, reload } = useAsyncResource<AlertsData | null>(load, null, [load], {
    errorMessage: '알림 데이터를 불러오지 못했습니다.',
  });

  return { alertsData, status, isLoading, error, reload };
}
