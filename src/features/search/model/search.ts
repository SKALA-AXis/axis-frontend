export type SearchScope = 'ALL' | 'BRIEFING' | 'CARD_NEWS' | 'KEYWORD_GRAPH' | 'PEER_PLUS';
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
