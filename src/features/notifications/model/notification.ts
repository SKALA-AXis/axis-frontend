/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 알림 설정 기능 추가 시 알림 모델 타입 정의, 이후 챗봇 프론트엔드 연동
 */
export type NotificationSeverity = 'NORMAL' | 'IMPORTANT' | string;

export type NotificationItem = {
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  sourceType: string;
  sourceId: string;
  sourceUrl: string;
  companyName: string;
  matchedKeywords: string[];
  target: string;
  read: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  enabled: boolean;
  importantEnabled: boolean;
  keywords: string[];
};

export function formatNotificationCount(count: number) {
  return count > 99 ? '99+' : count.toLocaleString('ko-KR');
}
