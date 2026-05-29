import { useCallback, useEffect, useState } from 'react';
import { adminAuditLogsRepository } from '../api/adminAuditLogsRepository';
import type { AdminAuditLog } from '../model/adminAuditLog';

interface UseAdminAuditLogsResult {
  logs: AdminAuditLog[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAdminAuditLogs(): UseAdminAuditLogsResult {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextLogs = await adminAuditLogsRepository.list();
      setLogs(nextLogs);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '감사 로그를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { logs, isLoading, error, reload };
}
