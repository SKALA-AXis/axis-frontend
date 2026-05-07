export type PeriodFilter = 'yearly' | 'quarterly' | 'monthly';
export type CompanyTier = 'self' | 'domestic' | 'overseas';

export interface PeerSummary {
  id: string;
  name: string;
  tier: CompanyTier;
  keywords: string[];
  priority: 'high' | 'medium';
  stats: {
    primary: number;
    watch: number;
    archive: number;
  };
  direction: string;
  implication: string;
}

export interface PeerAnalysis {
  source: string;
  title: string;
  summary: string;
  highlightsTitle: string;
  highlights: string[];
  pillars: Array<{
    name: string;
    details: string[];
  }>;
}

export interface PeersData {
  peers: PeerSummary[];
  periodLabels: Record<PeriodFilter, string>;
  periodDescriptions: Record<PeriodFilter, string>;
  analyses: Record<string, PeerAnalysis>;
}
