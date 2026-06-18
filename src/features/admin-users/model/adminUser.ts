/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 관리자 카드뉴스 관리·감사로그 화면용 관리자 사용자 모델 추가
 */
export type AdminUserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: AdminUserStatus;
  lastLoginAt: string | null;
}
