/*
 * 작성일: 2026-06-09
 * 작성자: 최종민
 * 변경이력:
 *   2026-06-09 최종민 — 브리핑 기간 메타 정의 추가(홈 인사이트 anchor_date·브리핑 생성 클라이언트 작업)
 */
export type BriefingPeriod = 'daily' | 'weekly' | 'monthly';

export const periodMeta: Record<BriefingPeriod, { label: string; title: string; window: string; count: number }> = {
  daily: {
    label: '일간',
    title: '오늘 브리핑',
    window: '오늘 감지된 카드뉴스 기반',
    count: 4,
  },
  weekly: {
    label: '주간',
    title: '이번 주 브리핑',
    window: '최근 7일 경쟁사 신호 종합',
    count: 6,
  },
  monthly: {
    label: '월간',
    title: '이번 달 브리핑',
    window: '월간 AX 시장 변화 요약',
    count: 8,
  },
};

export const briefingFocusTitle = '오늘의 핵심 변화';
