import type { CardNewsItem } from '../../card-news/model/cardNews';
import { normalizeCardNewsItem } from '../../card-news/api/cardNewsRepository';
import { getDisplayDate, getPeerLabel, getSummaryLines } from '../../card-news/mappers/cardNewsExecutive';
import type { BriefingPeriod } from '../data/periodMeta';
import { periodMeta } from '../data/periodMeta';
import type { BriefingRange } from '../utils/briefingDate';

type BriefingSignalCard = {
  label: string;
  title: string;
  summary: string;
  reason: string;
  relatedCardIds: string[];
};

type BriefingInsightItem = {
  title: string;
  reason: string;
};

export type GeneratedBriefingFlowStep = {
  id: string;
  label: string;
  headline: string;
  description: string;
  details: string[];
};

type BriefingWhatHappenedItem = {
  peer: string;
  title: string;
  date: string;
  summary: string;
  context: string;
  implication: string;
  action: string;
};

export interface BriefingViewModel {
  label: string;
  count: number;
  title: string;
  window: string;
  selectedCards: CardNewsItem[];
  peers: string[];
  headline: string;
  briefingLead: string;
  briefingSummaryLine: string;
  whatHappenedDigest: string[];
  signalCards: BriefingSignalCard[];
  flowSteps: GeneratedBriefingFlowStep[];
  whatHappened: BriefingWhatHappenedItem[];
  meaning: BriefingInsightItem[];
  response: string[];
  benchmark: BriefingInsightItem[];
  ideas: string[];
  status?: string;
  errorMessage?: string;
}

type GeneratedBriefingPayload = {
  briefingReport?: Partial<BriefingViewModel> & {
    selectedCards?: Array<Record<string, unknown>>;
    signalCards?: Array<Partial<BriefingSignalCard>>;
    meaning?: Array<Partial<BriefingInsightItem>>;
    benchmark?: Array<Partial<BriefingInsightItem>>;
    flowSteps?: Array<Partial<GeneratedBriefingFlowStep>>;
  };
  status?: string;
  error_message?: string;
  title?: string;
  briefing_lead?: string;
  executive_summary?: string;
  key_summary?: string;
  evidence_summary?: string[];
  briefing_basis?: {
    comparison_point?: { finding?: string; rationale?: string; historical_signals?: string[] };
    strategy_implication?: { finding?: string; rationale?: string };
    hidden_conclusion?: { finding?: string; rationale?: string };
    historical_context?: Record<string, unknown>;
    recommended_actions?: string[];
    immediate_trends?: Array<{ title?: string; reason?: string }>;
    watch_trends?: Array<{ title?: string; reason?: string }>;
  };
  interpretation_flow?: { steps?: Array<{ seq?: number; label?: string; items?: unknown[] }> };
  immediate_trends?: Array<{ title?: string; reason?: string; headline?: string; related_card_id?: string }>;
  watch_trends?: Array<{ title?: string; reason?: string; headline?: string; related_card_id?: string }>;
  key_change_cards?: Array<{
    display_label?: string;
    title?: string;
    description?: string;
    why_important?: string;
    summary?: string;
    peer_label?: string;
    evidence_card_ids?: unknown[];
  }>;
  selected_cards?: Array<Record<string, unknown>>;
  source_card_ids?: string[];
};

function asList(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function compactString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = compactString(value);
    if (text) return text;
  }
  return '';
}

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') return compactString(value);
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  return firstString(
    record.title,
    record.display_title,
    record.headline,
    record.finding,
    record.summary,
    record.description,
    record.text,
    record.reason,
    record.action,
    record.why,
  );
}

function mapSelectedCards(fallback: CardNewsItem[], payload?: GeneratedBriefingPayload): CardNewsItem[] {
  if (!payload || !('selected_cards' in payload)) return fallback;
  if (!payload.selected_cards?.length) return [];

  const fallbackById = new Map(fallback.map((card) => [card.id, card]));
  return payload.selected_cards
    .map((card) => {
      const id = String(card.id ?? '');
      return fallbackById.get(id) ?? normalizeCardNewsItem(card as Partial<CardNewsItem>);
    })
    .filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index);
}

function mapReportSelectedCards(fallback: CardNewsItem[], cards?: Array<Record<string, unknown>>): CardNewsItem[] {
  if (!cards?.length) return [];
  const fallbackById = new Map(fallback.map((card) => [card.id, card]));
  return cards
    .map((card) => {
      const id = String(card.id ?? '');
      return fallbackById.get(id) ?? normalizeCardNewsItem(card as Partial<CardNewsItem>);
    })
    .filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index);
}

function mapReportInsightItems(items?: Array<Partial<BriefingInsightItem>>): BriefingInsightItem[] {
  return (items ?? [])
    .map((item) => ({
      title: firstString(item.title),
      reason: firstString(item.reason),
    }))
    .filter((item) => item.title || item.reason);
}

function mapReportSignalCards(items?: Array<Partial<BriefingSignalCard>>): BriefingSignalCard[] {
  return (items ?? [])
    .map((item) => ({
      label: firstString(item.label),
      title: firstString(item.title),
      summary: firstString(item.summary),
      reason: firstString(item.reason, item.summary),
      relatedCardIds: Array.isArray(item.relatedCardIds)
        ? item.relatedCardIds.map(String).filter(Boolean)
        : [],
    }))
    .filter((item) => item.label || item.title || item.summary || item.reason);
}

function mapReportFlowSteps(items?: Array<Partial<GeneratedBriefingFlowStep>>): GeneratedBriefingFlowStep[] {
  return (items ?? [])
    .map((item, index) => ({
      id: firstString(item.id, `generated-${index + 1}`),
      label: firstString(item.label, `Step ${index + 1}`),
      headline: firstString(item.headline),
      description: firstString(item.description),
      details: Array.isArray(item.details) ? item.details.map(String).filter(Boolean) : [],
    }))
    .filter((item) => item.headline || item.description || item.details.length > 0);
}

function mapSignalCards(payload: GeneratedBriefingPayload, selectedCards: CardNewsItem[]): BriefingSignalCard[] {
  const keyChangeCards = payload.key_change_cards ?? [];
  if (keyChangeCards.length > 0) {
    return keyChangeCards
      .map((item, index) => {
        const label = firstString(item.display_label, item.peer_label, `핵심 변화 ${index + 1}`);
        const title = firstString(item.title, item.description, item.summary);
        const summary = firstString(item.description, item.summary);
        const reason = firstString(item.why_important, summary);
        if (!title && !summary && !reason) return null;
        return {
          label,
          title,
          summary,
          reason,
          relatedCardIds: Array.isArray(item.evidence_card_ids)
            ? item.evidence_card_ids.map(String).filter(Boolean)
            : selectedCards.map((card) => card.id),
        };
      })
      .filter((item): item is BriefingSignalCard => Boolean(item));
  }

  return (payload.immediate_trends ?? [])
    .map((item, index) => {
      const title = firstString(item.headline, item.title, item.reason);
      const summary = firstString(item.reason);
      if (!title && !summary) return null;
      return {
        label: `핵심 신호 ${index + 1}`,
        title,
        summary,
        reason: summary,
        relatedCardIds: item.related_card_id ? [item.related_card_id] : selectedCards.map((card) => card.id),
      };
    })
    .filter((item): item is BriefingSignalCard => Boolean(item))
    .slice(0, Math.max(2, Math.min(3, selectedCards.length || 2)));
}

function mapFlowSteps(payload: GeneratedBriefingPayload): GeneratedBriefingFlowStep[] {
  return (payload.interpretation_flow?.steps ?? [])
    .map((step, index) => {
      const label = firstString(step.label, `Step ${index + 1}`);
      const items = (step.items ?? []).map(textFromUnknown).filter(Boolean);
      const headline = items[0] ?? '';
      const description = items[1] ?? '';
      const details = items.slice(description ? 2 : 1);
      if (!headline && !description && details.length === 0) return null;
      return {
        id: `generated-${step.seq ?? index + 1}`,
        label,
        headline: headline || label,
        description,
        details,
      };
    })
    .filter((item): item is GeneratedBriefingFlowStep => Boolean(item));
}

export function mapGeneratedBriefingToView(
  payload: GeneratedBriefingPayload,
  period: BriefingPeriod,
  fallbackCards: CardNewsItem[],
  range: BriefingRange,
): BriefingViewModel {
  if (payload.briefingReport) {
    const report = payload.briefingReport;
    const selectedCards = mapReportSelectedCards(fallbackCards, report.selectedCards);
    return {
      ...periodMeta[period],
      label: firstString(report.label, periodMeta[period].label),
      count: typeof report.count === 'number' ? report.count : periodMeta[period].count,
      title: firstString(report.title, range.title),
      window: firstString(report.window, range.window),
      selectedCards,
      peers: Array.isArray(report.peers) ? report.peers.map(String).filter(Boolean) : [],
      headline: firstString(report.headline),
      briefingLead: firstString(report.briefingLead),
      briefingSummaryLine: firstString(report.briefingSummaryLine),
      whatHappenedDigest: Array.isArray(report.whatHappenedDigest) ? report.whatHappenedDigest.map(String).filter(Boolean) : [],
      signalCards: mapReportSignalCards(report.signalCards),
      flowSteps: mapReportFlowSteps(report.flowSteps),
      whatHappened: [],
      meaning: mapReportInsightItems(report.meaning),
      response: [],
      benchmark: mapReportInsightItems(report.benchmark),
      ideas: [],
      status: payload.status,
      errorMessage: payload.error_message,
    };
  }

  const meta = periodMeta[period];
  const selectedCards = mapSelectedCards(fallbackCards, payload).slice(0, meta.count);
  const peers = Array.from(new Set(selectedCards.map((card) => getPeerLabel(card)))).filter(Boolean);
  const basis = payload.briefing_basis ?? {};
  const comparison = basis.comparison_point ?? {};
  const strategy = basis.strategy_implication ?? {};
  const hidden = basis.hidden_conclusion ?? {};

  const historicalSignals = asList(comparison.historical_signals, 4);
  const immediateTrends = payload.immediate_trends ?? basis.immediate_trends ?? [];
  const watchTrends = payload.watch_trends ?? basis.watch_trends ?? [];

  const whatHappenedDigest = [
    firstString(payload.briefing_lead, payload.executive_summary),
    firstString(payload.key_summary, comparison.finding),
    firstString(comparison.rationale),
    ...historicalSignals,
    ...asList(payload.evidence_summary, 3),
  ].filter(Boolean);

  const meaning = [
    { title: firstString(comparison.finding), reason: firstString(comparison.rationale) },
    { title: firstString(hidden.finding), reason: firstString(hidden.rationale) },
    ...(payload.interpretation_flow?.steps ?? [])
      .flatMap((step) => (step.items ?? []).map(textFromUnknown))
      .filter(Boolean)
      .slice(0, 4)
      .map((item) => ({ title: item, reason: '' })),
  ].filter((item) => item.title || item.reason);

  const response = [
    strategy.finding,
    strategy.rationale,
    ...asList(basis.recommended_actions, 4),
  ].filter((item): item is string => Boolean(item));

  const benchmark = asList(payload.evidence_summary, 3).map((item) => ({ title: item, reason: '' }));
  const signalCards = mapSignalCards(payload, selectedCards);
  const flowSteps = mapFlowSteps(payload);

  const whatHappened = selectedCards.slice(0, period === 'daily' ? 4 : 6).map((card) => {
    const summaryLines = getSummaryLines(card);
    return {
      peer: getPeerLabel(card),
      title: card.title,
      date: getDisplayDate(card),
      summary: summaryLines[0] ?? card.detailDescription ?? '',
      context: summaryLines[1] ?? card.detailDescription ?? '',
      implication: card.insights?.[0] ?? comparison.finding ?? '',
      action: card.actionItems?.[0] ?? card.detailPoints?.[0] ?? strategy.finding ?? '',
    };
  });

  return {
    ...meta,
    title: payload.title ?? range.title,
    window: range.window,
    selectedCards,
    peers,
    headline: firstString(payload.key_summary, signalCards[0]?.title, whatHappenedDigest[0]),
    briefingLead: firstString(payload.briefing_lead, payload.executive_summary, whatHappenedDigest[0]),
    briefingSummaryLine: firstString(payload.key_summary, whatHappenedDigest[1]),
    whatHappenedDigest,
    signalCards,
    flowSteps,
    whatHappened,
    meaning,
    response,
    benchmark,
    ideas: watchTrends.slice(0, 3).map((trend) => firstString(trend.reason, trend.title)).filter(Boolean),
    status: payload.status,
    errorMessage: payload.error_message,
  };
}
