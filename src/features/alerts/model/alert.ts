/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재정리 과정에서 알림 모델 추가
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: string[];
  lastTriggered: string;
}

export interface AlertHistoryItem {
  id: string;
  title: string;
  message: string;
  channel: string;
  status: 'sent' | 'pending';
  triggeredAt: string;
}

export interface AlertsData {
  rules: AlertRule[];
  history: AlertHistoryItem[];
  conditionOptions: string[];
  channelOptions: string[];
}
