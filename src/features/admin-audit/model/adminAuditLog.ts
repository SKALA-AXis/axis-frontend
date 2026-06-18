/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 관리자 감사로그 모델 타입 신규 정의
 */
export type AdminAuditLog = {
  id: number;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string | null;
  reason: string | null;
  createdAt: string | null;
};
