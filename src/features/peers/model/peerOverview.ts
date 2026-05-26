export interface PeerOverviewRow {
  id: string;
  label: string;
  revenueKrwBn: number | null;
  revenueQoqPct: number | null;
  operatingProfitKrwBn: number | null;
  operatingProfitQoqPct: number | null;
  operatingMarginPct: number | null;
  operatingMarginQoqDeltaPctp: number | null;
  axRevenueSharePct: number | null;
  contractCount: number | null;
  topKeyword: string | null;
  dartRceptNo: string | null;
}

export interface PeerOverviewData {
  periodLabel: string | null;
  coverageLabel: string;
  financialSourceLabel: string;
  supplementalSourceLabel: string;
  rows: PeerOverviewRow[];
}
