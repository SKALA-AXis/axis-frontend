export interface PeerOverviewRow {
  id: string;
  label: string;
  revenueKrwBn: number | null;
  revenueQoqPct: number | null;
  operatingProfitKrwBn: number | null;
  operatingProfitQoqPct: number | null;
  netIncomeKrwBn: number | null;
  netIncomeQoqPct: number | null;
  operatingMarginPct: number | null;
  operatingMarginQoqDeltaPctp: number | null;
  axRevenueSharePct: number | null;
  topKeyword: string | null;
  businessKeyword: string | null;
  technologyKeyword: string | null;
  topKeywordReason: string | null;
  topKeywordBasis: string | null;
  topKeywordScore: number | null;
  topKeywordEvidence: string[];
  topKeywordEvidenceUrls: string[];
  dartRceptNo: string | null;
}

export interface PeerComparisonInsightItem {
  label: '포지셔닝' | '사업 신호' | '기술 신호' | '리스크';
  body: string;
}

export interface PeerSwotInsightItem {
  label: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat';
  body: string;
}

export interface PeerOverviewData {
  periodLabel: string | null;
  coverageLabel: string;
  financialSourceLabel: string;
  supplementalSourceLabel: string;
  comparisonInsights: Record<string, PeerComparisonInsightItem[]>;
  swotInsights: Record<string, PeerSwotInsightItem[]>;
  rows: PeerOverviewRow[];
}
