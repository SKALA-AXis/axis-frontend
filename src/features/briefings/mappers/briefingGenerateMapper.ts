import type { CardNewsItem } from '../../card-news/model/cardNews';
import { getDisplayDate, getPeerLabel, getSummaryLines } from '../../card-news/mappers/cardNewsExecutive';
import type { BriefingPeriod } from '../data/periodMeta';
import { periodMeta } from '../data/periodMeta';
import type { BriefingRange } from '../utils/briefingDate';

type BriefingSignalCard = {
  label: string;
  value: string;
  metric: string;
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
  whatHappenedDigest: string[];
  signalCards: BriefingSignalCard[];
  whatHappened: BriefingWhatHappenedItem[];
  meaning: string[];
  response: string[];
  benchmark: string[];
  ideas: string[];
}

type GeneratedBriefingPayload = {
  title?: string;
  briefing_lead?: string;
  executive_summary?: string;
  briefing_basis?: {
    comparison_point?: { finding?: string; rationale?: string; historical_signals?: string[] };
    strategy_implication?: { finding?: string; rationale?: string };
    hidden_conclusion?: { finding?: string; rationale?: string };
    historical_context?: Record<string, unknown>;
    recommended_actions?: string[];
    immediate_trends?: Array<{ title?: string; reason?: string }>;
    watch_trends?: Array<{ title?: string; reason?: string }>;
  };
  interpretation_flow?: { steps?: Array<{ label?: string; items?: string[] }> };
  immediate_trends?: Array<{ title?: string; reason?: string; headline?: string }>;
  watch_trends?: Array<{ title?: string; reason?: string; headline?: string }>;
  key_change_cards?: Array<{ title?: string; summary?: string; peer_label?: string }>;
  selected_cards?: Array<Record<string, unknown>>;
};

function asList(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function mapSelectedCards(fallback: CardNewsItem[], payload?: GeneratedBriefingPayload): CardNewsItem[] {
  if (!payload?.selected_cards?.length) return fallback;
  const ids = new Set(payload.selected_cards.map((card) => String(card.id ?? '')));
  const matched = fallback.filter((card) => ids.has(card.id));
  return matched.length > 0 ? matched : fallback;
}

export function mapGeneratedBriefingToView(
  payload: GeneratedBriefingPayload,
  period: BriefingPeriod,
  fallbackCards: CardNewsItem[],
  range: BriefingRange,
): BriefingViewModel {
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
    payload.briefing_lead ?? payload.executive_summary ?? comparison.finding ?? '',
    comparison.rationale ?? '',
    ...historicalSignals,
  ].filter(Boolean);

  const meaning = [
    comparison.finding,
    comparison.rationale,
    hidden.finding,
    hidden.rationale,
    ...asList(
      payload.interpretation_flow?.steps?.flatMap((step) => step.items ?? []),
      4,
    ),
  ].filter((item): item is string => Boolean(item));

  const response = [
    strategy.finding,
    strategy.rationale,
    ...asList(basis.recommended_actions, 4),
  ].filter((item): item is string => Boolean(item));

  const benchmark = peers.slice(0, 3).map((peer) => `${peer}의 공개 레퍼런스·메시지 방향`);

  const signalCards: BriefingSignalCard[] = [
    {
      label: '시장 신호',
      value: immediateTrends[0]?.reason ?? immediateTrends[0]?.title ?? whatHappenedDigest[0] ?? '핵심 신호를 정리했습니다.',
      metric: `${selectedCards.length}건 종합`,
    },
    {
      label: '지난주·과거 대비',
      value: historicalSignals[0] ?? comparison.rationale ?? '저장된 주간 narrative·임원 인사이트와 비교했습니다.',
      metric: 'Context Pack',
    },
    {
      label: 'SK AX 해석',
      value: strategy.finding ?? strategy.rationale ?? '대응 우선순위를 정리했습니다.',
      metric: '대응 우선',
    },
  ];

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
    headline:
      period === 'daily'
        ? `오늘은 ${peers[0] ?? 'Peer사'} 중심 신호와 과거 판단 연속성을 함께 검토합니다.`
        : '이번 기간 카드와 저장된 주간·월간 맥락을 비교해 정리했습니다.',
    briefingLead: payload.briefing_lead ?? payload.executive_summary ?? whatHappenedDigest[0] ?? '',
    whatHappenedDigest: whatHappenedDigest.length ? whatHappenedDigest : ['브리핑 근거를 정리했습니다.'],
    signalCards,
    whatHappened,
    meaning: meaning.length ? meaning : ['의미와 시사점을 정리했습니다.'],
    response: response.length ? response : ['SK AX 대응 방향을 정리했습니다.'],
    benchmark: benchmark.length ? benchmark : ['벤치마킹 포인트를 정리했습니다.'],
    ideas: watchTrends.slice(0, 3).map((trend) => trend.reason ?? trend.title ?? '지속 관찰 항목'),
  };
}
