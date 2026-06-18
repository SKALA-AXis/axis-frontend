/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 관리자 사용자 목록·상태변경 훅 신규 작성 후 로딩 상태 표준화 반영
 */
import { useCallback, useEffect, useState } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { adminUsersRepository } from '../api/adminUsersRepository';
import type { AdminUser, AdminUserStatus } from '../model/adminUser';

interface UseAdminUsersResult {
  users: AdminUser[];
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  updatingUserId: string | null;
  reload: () => Promise<void>;
  updateStatus: (userId: string, status: AdminUserStatus) => Promise<void>;
}

export function useAdminUsers(): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');

    try {
      const nextUsers = await adminUsersRepository.list();
      setUsers(nextUsers);
      setError(null);
      setStatus('success');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '사용자 목록을 불러오지 못했습니다.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateStatus = useCallback(async (userId: string, status: AdminUserStatus) => {
    setUpdatingUserId(userId);

    try {
      const updatedUser = await adminUsersRepository.updateStatus(userId, status);
      setUsers((currentUsers) => currentUsers
        .map((user) => (user.id === userId ? updatedUser : user))
        .sort((left, right) => {
          const leftTime = left.lastLoginAt ? Date.parse(left.lastLoginAt) : Number.NEGATIVE_INFINITY;
          const rightTime = right.lastLoginAt ? Date.parse(right.lastLoginAt) : Number.NEGATIVE_INFINITY;
          if (leftTime !== rightTime) return rightTime - leftTime;
          return left.email.localeCompare(right.email, 'ko');
        }));
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '사용자 상태를 변경하지 못했습니다.');
      throw updateError;
    } finally {
      setUpdatingUserId(null);
    }
  }, []);

  return { users, status, isLoading: status === 'loading', error, updatingUserId, reload, updateStatus };
}
