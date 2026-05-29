export type AdminUserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: AdminUserStatus;
  lastLoginAt: string | null;
}
