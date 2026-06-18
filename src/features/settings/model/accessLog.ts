/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 카드뉴스 수정·알림 설정 작업 중 접근 로그 타입 추가, 이후 사용자 챗봇 관련 업데이트 반영
 */
export type AccessLogItem = {
  id: string;
  action: string;
  success: boolean;
  country: string;
  ipAddress: string;
  userAgent: string;
  occurredAt: string;
};

export type AccessLogPage = {
  items: AccessLogItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
