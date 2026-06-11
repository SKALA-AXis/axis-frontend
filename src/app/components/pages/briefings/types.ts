import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';

export type BriefingPeriod = 'daily' | 'weekly' | 'monthly';

export type BriefingRange = {
  seedKey: string;
  title: string;
  window: string;
  leadLabel: string;
  displayLabel: string;
};

export type BriefingSignalCard = {
  label: string;
  title: string;
  summary: string;
  reason: string;
  relatedCardIds: string[];
};

export type BriefingInsightItem = {
  title: string;
  reason: string;
};

export type BriefingFlowStep = {
  id: string;
  label: string;
  headline: string;
  description: string;
  details: string[];
};

export type BriefingReport = {
  label: string;
  title: string;
  window: string;
  count: number;
  selectedCards: CardNewsItem[];
  peers: string[];
  headline: string;
  briefingLead: string;
  briefingSummaryLine: string;
  whatHappenedDigest: string[];
  signalCards: BriefingSignalCard[];
  meaning: BriefingInsightItem[];
  benchmark: BriefingInsightItem[];
};
