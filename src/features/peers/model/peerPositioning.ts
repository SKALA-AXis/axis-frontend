export interface PeerPositioningPoint {
  id: string;
  label: string;
  periodLabel: string | null;
  x: number | null;
  y: number | null;
  revenueKrwBn: number | null;
  revenueYoyPct: number | null;
  revenueSourceType: string | null;
  revenueYoySourceType: string | null;
  revenueConfidence: number | null;
  revenueYoyConfidence: number | null;
  revenueArticleId: number | null;
  revenueYoyArticleId: number | null;
  isSelf: boolean;
}

export interface PeerPositioningData {
  periodLabel: string | null;
  coverageLabel: string;
  financialSourceLabel: string;
  xAxisLabel: string;
  yAxisLabel: string;
  referenceRevenueKrwBn: number;
  referenceGrowthPct: number;
  points: PeerPositioningPoint[];
}
