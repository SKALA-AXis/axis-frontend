import type { AdminUserStatus } from '../model/adminUser';

// 관리자 화면 표시 포맷 순수 유틸 (refactoring P2/stage3). AdminView 에서 그대로 옮긴 것.

/** 마지막 로그인 시각 표시. null 은 "기록 없음", 무효는 원문. */
export function formatLastLogin(value: string | null) {
  if (!value) return '기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** 사용자 상태 → 한글 라벨. */
export function statusLabel(status: AdminUserStatus) {
  if (status === 'ACTIVE') return '활성';
  if (status === 'SUSPENDED') return '정지';
  if (status === 'WITHDRAWN') return '탈퇴';
  return '대기';
}

/** 사용자 상태 → 배지 톤. */
export function statusTone(status: AdminUserStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'warning';
  if (status === 'WITHDRAWN') return 'danger';
  return 'neutral';
}

/** 감사 로그 액션 코드 → 한글 라벨(미상은 원문). */
export function auditActionLabel(action: string) {
  if (action === 'card_news.delete') return '카드뉴스 삭제';
  if (action === 'card_news.restore') return '카드뉴스 복구';
  if (action === 'card_news.status_change') return '카드뉴스 상태 변경';
  return action;
}
