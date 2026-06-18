/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 관리자 감사로그 조회 Repository 신규 작성
 */
import { httpClient } from '../../../shared/api/httpClient';
import type { AdminAuditLog } from '../model/adminAuditLog';

type RawAdminAuditLog = {
  id?: number;
  actor_email?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  reason?: string | null;
  created_at?: string | null;
  payload?: {
    title?: string;
  } | null;
};

type AdminAuditLogsResponse = {
  items?: RawAdminAuditLog[];
  total?: number;
};

class AdminAuditLogsRepository {
  async list(): Promise<AdminAuditLog[]> {
    if (!httpClient) return [];

    const response = await httpClient.get<AdminAuditLogsResponse>('/api/admin/audit-logs');
    return (response.items ?? []).map(toAdminAuditLog);
  }
}

export const adminAuditLogsRepository = new AdminAuditLogsRepository();

function toAdminAuditLog(raw: RawAdminAuditLog): AdminAuditLog {
  return {
    id: typeof raw.id === 'number' ? raw.id : 0,
    actorEmail: typeof raw.actor_email === 'string' ? raw.actor_email : 'admin',
    action: typeof raw.action === 'string' ? raw.action : 'unknown',
    resourceType: typeof raw.resource_type === 'string' ? raw.resource_type : '-',
    resourceId: typeof raw.resource_id === 'string' ? raw.resource_id : '-',
    resourceTitle: typeof raw.payload?.title === 'string' ? raw.payload.title : null,
    reason: typeof raw.reason === 'string' ? raw.reason : null,
    createdAt: typeof raw.created_at === 'string' ? raw.created_at : null,
  };
}
