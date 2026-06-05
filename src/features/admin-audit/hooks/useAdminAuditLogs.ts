import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { adminAuditLogsRepository } from '../api/adminAuditLogsRepository';
import type { AdminAuditLog } from '../model/adminAuditLog';

interface UseAdminAuditLogsResult {
  logs: AdminAuditLog[];
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAdminAuditLogs(): UseAdminAuditLogsResult {
  const load = useCallback(() => adminAuditLogsRepository.list(), []);
  const {
    data: logs,
    status,
    isLoading,
    error,
    reload,
  } = useAsyncResource<AdminAuditLog[]>(load, [], [load], {
    errorMessage: '감사 로그를 불러오지 못했습니다.',
  });

  return { logs, status, isLoading, error, reload };
}
