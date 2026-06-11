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

export type KeywordSpikeInsight = {
  key: string;
  time: string;
  title: string;
  valueLabel: string;
  reason: string;
  skAxPoint: string;
  causeFactors?: Array<{
    rank?: number;
    keyword?: string;
    title?: string;
    description?: string;
    evidenceCount?: number;
  }>;
  evidence?: Array<Record<string, unknown>>;
};

export type DonutCalloutDatum = {
  name: string;
  value: number;
  color: string;
};
