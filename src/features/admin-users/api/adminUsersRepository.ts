import { httpClient } from '../../../shared/api/httpClient';
import type { AdminUser, AdminUserStatus } from '../model/adminUser';

type RawAdminUser = {
  id?: string;
  email?: string;
  name?: string;
  status?: string;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
};

type AdminUsersResponse = {
  items?: RawAdminUser[];
  total?: number;
};

const allowedStatuses: AdminUserStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN'];

class AdminUsersRepository {
  enabled() {
    return Boolean(httpClient);
  }

  async list(): Promise<AdminUser[]> {
    if (!httpClient) return [];

    const response = await httpClient.get<AdminUsersResponse>('/api/admin/users');
    return (response.items ?? [])
      .map(toAdminUser)
      .sort(compareUsersByRecentLogin);
  }

  async updateStatus(userId: string, status: AdminUserStatus): Promise<AdminUser> {
    if (!httpClient) {
      throw new Error('관리자 API에 연결할 수 없습니다.');
    }

    const response = await httpClient.patch<RawAdminUser>(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      status,
    });
    return toAdminUser(response);
  }
}

export const adminUsersRepository = new AdminUsersRepository();

function toAdminUser(raw: RawAdminUser): AdminUser {
  const status = typeof raw.status === 'string' && allowedStatuses.includes(raw.status as AdminUserStatus)
    ? raw.status as AdminUserStatus
    : 'PENDING';

  return {
    id: typeof raw.id === 'string' ? raw.id : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    name: typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name : (typeof raw.email === 'string' ? raw.email : ''),
    status,
    lastLoginAt: typeof raw.last_login_at === 'string'
      ? raw.last_login_at
      : (typeof raw.lastLoginAt === 'string' ? raw.lastLoginAt : null),
  };
}

function compareUsersByRecentLogin(left: AdminUser, right: AdminUser) {
  const leftTime = left.lastLoginAt ? Date.parse(left.lastLoginAt) : Number.NEGATIVE_INFINITY;
  const rightTime = right.lastLoginAt ? Date.parse(right.lastLoginAt) : Number.NEGATIVE_INFINITY;

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return left.email.localeCompare(right.email, 'ko');
}
