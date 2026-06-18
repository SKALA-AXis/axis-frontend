/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 관리자 카드뉴스 관리 Repository 신규 작성 및 후속 페이지 구성 수정 반영
 */
import { httpClient } from '../../../shared/api/httpClient';
import type { AdminCard, AdminCardStatus } from '../model/adminCard';

type RawAdminCard = {
  id?: string;
  title?: string;
  peer_id?: string;
  status?: string;
  created_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  deletion_reason?: string | null;
  restored_at?: string | null;
  restored_by?: string | null;
  restored_reason?: string | null;
};

type AdminCardsResponse = {
  items?: RawAdminCard[];
  total?: number;
};

const allowedStatuses: AdminCardStatus[] = ['ACTIVE', 'PENDING', 'DELETED'];

class AdminCardsRepository {
  async list(status?: AdminCardStatus): Promise<AdminCard[]> {
    if (!httpClient) return [];

    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await httpClient.get<AdminCardsResponse>(`/api/admin/cards${query}`);
    return (response.items ?? []).map(toAdminCard);
  }

  async updateStatus(cardId: string, status: AdminCardStatus, reason?: string): Promise<AdminCard> {
    if (!httpClient) {
      throw new Error('관리자 API에 연결할 수 없습니다.');
    }

    const response = await httpClient.patch<RawAdminCard>(`/api/admin/cards/${encodeURIComponent(cardId)}/status`, {
      status,
      reason,
    });
    return toAdminCard(response);
  }
}

export const adminCardsRepository = new AdminCardsRepository();

function toAdminCard(raw: RawAdminCard): AdminCard {
  const status = typeof raw.status === 'string' && allowedStatuses.includes(raw.status as AdminCardStatus)
    ? raw.status as AdminCardStatus
    : 'ACTIVE';

  return {
    id: typeof raw.id === 'string' ? raw.id : '',
    title: typeof raw.title === 'string' ? raw.title : '제목 없음',
    peerId: typeof raw.peer_id === 'string' ? raw.peer_id : '-',
    status,
    createdAt: typeof raw.created_at === 'string' ? raw.created_at : null,
    deletedAt: typeof raw.deleted_at === 'string' ? raw.deleted_at : null,
    deletedBy: typeof raw.deleted_by === 'string' ? raw.deleted_by : null,
    deletionReason: typeof raw.deletion_reason === 'string' ? raw.deletion_reason : null,
    restoredAt: typeof raw.restored_at === 'string' ? raw.restored_at : null,
    restoredBy: typeof raw.restored_by === 'string' ? raw.restored_by : null,
    restoredReason: typeof raw.restored_reason === 'string' ? raw.restored_reason : null,
  };
}
