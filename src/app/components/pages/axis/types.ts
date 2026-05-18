import { homeKeywordSpikeInsights } from '../../../../shared/mocks/homeDashboardPresentation';

export type PositioningTone = 'accent' | 'company' | 'infra' | 'security' | 'deal' | 'success';

export type PositioningPoint = {
  name: string;
  shortLabel: string;
  xScore: number;
  yScore: number;
  size: number;
  tone: PositioningTone;
  caption: string;
  impactTitle: string;
  impactBody: string;
  watchTitle: string;
  watchBody: string;
  insightBody: string;
  metrics: ReadonlyArray<{ label: string; value: string }>;
  evidenceNote: string;
};

export type KeywordSpikeInsight = (typeof homeKeywordSpikeInsights)[number];

export type DonutCalloutDatum = {
  name: string;
  value: number;
  color: string;
};
