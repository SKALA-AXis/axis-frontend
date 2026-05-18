import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import {
  getPeerLabel,
  getPotentialImpact,
  getSummaryLines,
  getWhyImportant,
} from '../../../../features/card-news/mappers/cardNewsExecutive';

import type {
  BriefingInsightItem,
  BriefingPeriod,
  BriefingRange,
  BriefingReport,
  BriefingSignalCard,
} from './types';

export const briefingFocusTitle = '오늘의 핵심 변화';

export const periodMeta: Record<BriefingPeriod, { label: string; title: string; window: string; count: number }> = {
  daily: {
    label: '일간',
    title: '오늘 브리핑',
    window: '오늘 감지된 카드뉴스 기반',
    count: 4,
  },
  weekly: {
    label: '주간',
    title: '이번 주 브리핑',
    window: '최근 7일 경쟁사 신호 종합',
    count: 6,
  },
  monthly: {
    label: '월간',
    title: '이번 달 브리핑',
    window: '월간 AX 시장 변화 요약',
    count: 8,
  },
};

export function toDateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function toMonthInputValue(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function formatKoreanDate(value: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '');
}

export function formatKoreanMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return '이번 달';
  return `${year}년 ${month}월`;
}

function getMonthNumber(value: string) {
  const month = Number(value.split('-')[1]);
  return Number.isFinite(month) && month > 0 ? month : new Date().getMonth() + 1;
}

function getWeekLabel(index: number) {
  return ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주'][index - 1] ?? `${index}주차`;
}

export function getWeekOptions(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const safeYear = year || fallback.getFullYear();
  const safeMonth = month || fallback.getMonth() + 1;
  const lastDate = new Date(safeYear, safeMonth, 0).getDate();
  const weekCount = Math.ceil(lastDate / 7);

  return Array.from({ length: weekCount }, (_, index) => {
    const week = index + 1;
    const startDay = index * 7 + 1;
    const endDay = Math.min(lastDate, startDay + 6);
    const monthLabel = `${safeMonth}월`;
    return {
      value: week,
      label: `${monthLabel} ${getWeekLabel(week)}`,
      range: `${safeYear}.${String(safeMonth).padStart(2, '0')}.${String(startDay).padStart(2, '0')} - ${String(safeMonth).padStart(2, '0')}.${String(endDay).padStart(2, '0')}`,
    };
  });
}

export function buildBriefingRange(
  period: BriefingPeriod,
  dailyDate: string,
  weeklyMonth: string,
  weekIndex: number,
  monthlyMonth: string,
): BriefingRange {
  if (period === 'daily') {
    const dateLabel = formatKoreanDate(dailyDate);
    return {
      seedKey: `daily-${dailyDate}`,
      title: `${dateLabel} 일간 브리핑`,
      window: `${dateLabel} 감지 카드뉴스 기반`,
      leadLabel: dateLabel,
      displayLabel: dateLabel,
    };
  }

  if (period === 'weekly') {
    const month = getMonthNumber(weeklyMonth);
    const weekOptions = getWeekOptions(weeklyMonth);
    const selectedWeek = weekOptions.find((item) => item.value === weekIndex) ?? weekOptions[0];
    const label = selectedWeek?.label ?? `${month}월 ${getWeekLabel(1)}`;
    const range = selectedWeek?.range ?? formatKoreanMonth(weeklyMonth);
    return {
      seedKey: `weekly-${weeklyMonth}-${selectedWeek?.value ?? 1}`,
      title: `${label} 브리핑`,
      window: `${label} 카드뉴스 종합 · ${range}`,
      leadLabel: label,
      displayLabel: label,
    };
  }

  const monthLabel = formatKoreanMonth(monthlyMonth);
  return {
    seedKey: `monthly-${monthlyMonth}`,
    title: `${monthLabel} 브리핑`,
    window: `${monthLabel} 카드뉴스 종합`,
    leadLabel: monthLabel,
    displayLabel: monthLabel,
  };
}

function rotateCardsByKey(cards: CardNewsItem[], seedKey: string) {
  if (cards.length === 0) return cards;
  const seed = Array.from(seedKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const offset = seed % cards.length;
  return [...cards.slice(offset), ...cards.slice(0, offset)];
}

function getCardLead(card?: CardNewsItem | null) {
  if (!card) return '오늘 점검할 핵심 변화가 없습니다.';
  return getSummaryLines(card)[0] ?? card.title;
}

function getCardSupport(card?: CardNewsItem | null) {
  if (!card) return '관련 카드뉴스가 수집되면 핵심 변화가 여기에 요약됩니다.';
  return getSummaryLines(card)[1] ?? card.detailDescription ?? card.title;
}

function getCardReason(card?: CardNewsItem | null) {
  if (!card) return '추가 근거가 확보되면 의미와 시사점이 함께 보강됩니다.';
  return getWhyImportant(card);
}

function uniqueCardIds(cards: Array<CardNewsItem | null | undefined>) {
  return Array.from(new Set(cards.filter(Boolean).map((card) => card!.id)));
}

function getBenchmarkTitle(card: CardNewsItem) {
  const peer = getPeerLabel(card);
  const label = card.category_label ?? card.category;

  if (label === '수주') return `${peer}의 대형 수주 레퍼런스 확대 방식`;
  if (label === '인프라') return `${peer}의 인프라 내재화 메시지 구조`;
  if (label === 'Peer') return `${peer}의 산업 패키지 제시 방식`;
  if (label === '시장' || label === 'AX') return `${peer}의 운영 전환 서사 구성 방식`;
  return `${peer}의 공개 메시지 구성 방식`;
}

export function formatInsightItems(items: BriefingInsightItem[]) {
  return items.map((item) => `${item.title} 이유: ${item.reason}`);
}

export function buildBriefing(period: BriefingPeriod, cards: CardNewsItem[], range: BriefingRange): BriefingReport {
  const meta = periodMeta[period];
  const selectedCards = rotateCardsByKey(cards, range.seedKey).slice(0, meta.count);
  const peers = Array.from(new Set(selectedCards.map((card) => getPeerLabel(card)))).filter(Boolean);
  const topCard = selectedCards[0];
  const headlinePeer = topCard ? getPeerLabel(topCard) : 'Peer사';
  const categories = Array.from(new Set(selectedCards.map((card) => card.category_label ?? card.category).filter(Boolean))).slice(0, 5);
  const peerLabel = peers.length > 1 ? `${peers.slice(0, 3).join(', ')} 등` : peers[0] ?? 'Peer사';
  const periodLabel = range.leadLabel;
  const marketLead =
    selectedCards.find((card) => ['시장', 'AX'].includes(card.category_label ?? '') || ['AI', '섹터'].includes(card.category)) ??
    topCard ??
    null;
  const competitorLead =
    selectedCards.find((card) => card.id !== marketLead?.id && ['Peer', '수주', '인프라'].includes(card.category_label ?? '')) ??
    selectedCards.find((card) => card.id !== marketLead?.id) ??
    marketLead ??
    null;
  const thirdLead =
    selectedCards.find((card) => card.id !== marketLead?.id && card.id !== competitorLead?.id) ??
    competitorLead ??
    marketLead ??
    null;

  const signalCards: BriefingSignalCard[] = [
    {
      label: '시장 신호',
      title: getCardLead(marketLead),
      summary: `${getCardSupport(marketLead)} ${marketLead ? getPotentialImpact(marketLead) : ''}`.trim(),
      reason: getCardReason(marketLead),
      relatedCardIds: uniqueCardIds([
        marketLead,
        ...selectedCards.filter((card) => card.id !== competitorLead?.id).slice(0, 2),
      ]),
    },
    {
      label: '경쟁사 움직임',
      title: getCardLead(competitorLead),
      summary: `${getCardSupport(competitorLead)} ${competitorLead ? getPotentialImpact(competitorLead) : ''}`.trim(),
      reason: getCardReason(competitorLead),
      relatedCardIds: uniqueCardIds([
        competitorLead,
        ...selectedCards.filter((card) => card.id !== marketLead?.id).slice(0, 2),
      ]),
    },
  ];

  const meaning: BriefingInsightItem[] = [
    {
      title: '고객의 비교 기준이 기술 소개보다 운영 전환 증명 쪽으로 이동하고 있습니다.',
      reason: `${getCardReason(marketLead)} ${marketLead ? getPotentialImpact(marketLead) : ''}`.trim(),
    },
    {
      title: '경쟁 구도는 단일 기능 우위보다 산업별 패키지와 실제 레퍼런스 확보 속도로 갈리고 있습니다.',
      reason: `${getCardReason(competitorLead)} ${competitorLead ? getPotentialImpact(competitorLead) : ''}`.trim(),
    },
    {
      title: '실적, 수주, 인프라 신호가 따로가 아니라 한 묶음의 신뢰 근거로 읽히기 시작했습니다.',
      reason: `${getCardLead(thirdLead)} ${thirdLead ? getWhyImportant(thirdLead) : ''}`.trim(),
    },
  ];

  const benchmarkCards = uniqueCardIds([competitorLead, thirdLead, marketLead])
    .map((id) => selectedCards.find((card) => card.id === id) ?? null)
    .filter((card): card is CardNewsItem => Boolean(card))
    .slice(0, 3);

  const benchmark: BriefingInsightItem[] = benchmarkCards.map((card) => ({
    title: getBenchmarkTitle(card),
    reason: `${getWhyImportant(card)} ${getPotentialImpact(card)} 벤치마킹이 필요한 이유는 고객이 이 요소를 비교 기준으로 직접 확인할 가능성이 크기 때문입니다.`.trim(),
  }));

  return {
    ...meta,
    title: range.title,
    window: range.window,
    selectedCards,
    peers,
    headline:
      period === 'daily'
        ? `오늘은 ${headlinePeer} 중심의 수주/AX 신호가 가장 먼저 검토됩니다.`
        : period === 'weekly'
          ? '이번 주는 AX 패키지 상품화, 공공 수주, AI 인프라 투자가 같은 방향으로 묶입니다.'
          : '이번 달은 PoC 경쟁보다 운영 확산과 고객 레퍼런스 확보 경쟁이 더 중요해졌습니다.',
    briefingLead:
      period === 'daily'
        ? `${periodLabel}에는 ${getCardLead(marketLead)} 동시에 ${getCardLead(competitorLead)} 흐름이 함께 확인됩니다.`
        : period === 'weekly'
          ? `${periodLabel}에는 ${getCardLead(marketLead)} 축과 ${getCardLead(competitorLead)} 축이 같은 경쟁 구도로 정리됩니다.`
          : `${periodLabel}에는 ${getCardLead(marketLead)} 흐름 위에 ${getCardLead(competitorLead)} 신호가 겹치며 운영 확산 중심 구도가 더 선명해지고 있습니다.`,
    briefingSummaryLine: `시장에서는 ${getCardSupport(marketLead)} 경쟁 구도에서는 ${getCardSupport(competitorLead)}`,
    whatHappenedDigest: [
      `${periodLabel}에는 ${getCardLead(marketLead)}`,
      `${periodLabel}에 함께 확인할 경쟁사 움직임은 ${getCardLead(competitorLead)}`,
      `${peerLabel}의 최근 신호를 묶어 보면 경쟁의 초점이 ${categories.slice(0, 3).join(', ') || '운영 확산, 수주, 인프라'} 중심으로 재편되고 있습니다.`,
    ],
    signalCards,
    meaning,
    benchmark,
  };
}
