/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 카드뉴스 대폭 수정 및 알림 설정 작업의 일부로 검색 타입 정의
 *   2026-06-14 안가은 — 대시보드/검색 인사이트 UI 개선에 맞춘 수정
 */
export type SearchScope = 'ALL' | 'BRIEFING' | 'CARD_NEWS' | 'PEER_PLUS';
export type SearchPeriod = 'all' | '7d' | '30d' | '90d' | 'custom';

export type SearchResultItem = {
  id: string;
  type: Exclude<SearchScope, 'ALL'>;
  title: string;
  snippet: string;
  badge: string;
  target: string;
  targetId: string;
  date: string;
  score: number;
  metadata: Record<string, unknown>;
};

export type SearchResponse = {
  query: string;
  items: SearchResultItem[];
  counts: Record<string, number>;
  total: number;
  hasMore: boolean;
};

export type SearchRequest = {
  query: string;
  scope: SearchScope;
  period: SearchPeriod;
  startDate?: string;
  endDate?: string;
  limit?: number;
};
