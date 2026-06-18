/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편 시 브리핑 관련 타입 정의 추가
 *   2026-06-10 박진 — 챗봇 로직 수정에 맞춰 타입 보완
 */
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
