/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 관리자 카드뉴스 모델·상태 타입 신규 정의 및 후속 페이지 구성 수정 반영
 */
export type AdminCardStatus = 'ACTIVE' | 'PENDING' | 'DELETED';

export type AdminCard = {
  id: string;
  title: string;
  peerId: string;
  status: AdminCardStatus;
  createdAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  deletionReason: string | null;
  restoredAt: string | null;
  restoredBy: string | null;
  restoredReason: string | null;
};
