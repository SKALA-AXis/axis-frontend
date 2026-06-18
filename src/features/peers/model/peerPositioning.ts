/*
 * 작성일: 2026-05-26
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-26 안가은 — Peer+ 포지셔닝 그래프 연동용 타입 정의 및 표시 동작 보완
 */
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
  dataUpdatedAt?: string | null;
  points: PeerPositioningPoint[];
}
