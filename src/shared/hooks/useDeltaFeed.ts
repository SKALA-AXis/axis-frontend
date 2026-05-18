/**
 * 'DELTA · 어제 이후 변화' 위젯의 데이터 레이어.
 *
 * homeDailyDeltas + homePositioningAlerts mock seed 를 읽어 우선순위순 DeltaItem 배열로 가공.
 * 변화 없는 차원은 결과에서 제외 (위젯이 변화만 표시 원칙).
 *
 * 키워드 추세 (급상승) 는 의도적으로 제외 — 하단 RoC 차트가 전담. 델타 피드는
 * '추세선에 안 보이는 변화' 만 다룸: 완전 신규 등장, 카드 풀 변동, peer 순위 이동,
 * 포지셔닝 임계 통과.
 */
import { AlertTriangle, Layers, Newspaper, Sparkles, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  homeDailyDeltas,
  homePositioningAlerts,
  type PositioningAlert,
} from '../mocks/homeDashboardPresentation';

export type DeltaSeverity = 'high' | 'mid' | 'low';

/** 클릭 시 진입할 view ID (App.tsx 의 handleViewChange 가 받는 형식). */
export type DeltaNavTarget = 'peerPlus' | 'briefings' | 'issues' | 'keywordGraph';

export type DeltaItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  message: string;
  direction?: 'up' | 'down' | 'neutral';
  severity: DeltaSeverity;
  target: DeltaNavTarget;
};

const SEVERITY_ORDER: Record<DeltaSeverity, number> = { high: 0, mid: 1, low: 2 };

function describePositioning(alert: PositioningAlert): DeltaItem {
  const label = alert.severity === 'high' ? '포지셔닝 돌파' : '포지셔닝 변화';
  return {
    id: alert.id,
    icon: AlertTriangle,
    label,
    message: alert.message,
    severity: alert.severity,
    target: 'peerPlus',
  };
}

function describeCardCount(): DeltaItem | null {
  const { today, prev } = homeDailyDeltas.cardCount;
  if (today === prev) return null;
  const diff = today - prev;
  const sign = diff > 0 ? '+' : '';
  return {
    id: 'card-count',
    icon: Newspaper,
    label: '신규 카드',
    message: `오늘 ${today}건 · 전일 ${prev}건 대비 ${sign}${diff}건`,
    direction: diff > 0 ? 'up' : 'down',
    severity: 'mid',
    target: 'briefings',
  };
}

function describeEventTypeShift(): DeltaItem | null {
  const significant = homeDailyDeltas.eventTypeDelta.filter((e) => e.today !== e.prev);
  if (significant.length === 0) return null;
  const parts = significant.map((e) => {
    const diff = e.today - e.prev;
    const sign = diff > 0 ? '+' : '';
    return `${e.label} ${sign}${diff}`;
  });
  return {
    id: 'event-type-shift',
    icon: Layers,
    label: '이벤트 타입',
    message: parts.join(' · '),
    severity: 'low',
    target: 'briefings',
  };
}

function describeNewKeyword(): DeltaItem | null {
  const first = homeDailyDeltas.newKeywords[0];
  if (!first) return null;
  return {
    id: `new-keyword-${first.keyword}`,
    icon: Sparkles,
    label: '신규 키워드',
    message: `‘${first.keyword}’ — ${first.context}`,
    severity: 'mid',
    target: 'keywordGraph',
  };
}

function describePeerRankShift(): DeltaItem | null {
  const { current, prev } = homeDailyDeltas.peerRankShiftWeekly;
  // current 의 1위 peer 가 이전에 몇 위였는지 — 가장 큰 상승을 가진 peer 를 노출.
  const prevRank = new Map(prev.map((p, idx) => [p.peer, idx + 1]));
  let biggest: { peer: string; label: string; fromRank: number; toRank: number; deltaRank: number } | null = null;
  current.forEach((p, idx) => {
    const toRank = idx + 1;
    const fromRank = prevRank.get(p.peer) ?? prev.length + 1;
    const deltaRank = fromRank - toRank;
    if (deltaRank > 0 && (!biggest || deltaRank > biggest.deltaRank)) {
      biggest = { peer: p.peer, label: p.label, fromRank, toRank, deltaRank };
    }
  });
  if (!biggest) return null;
  const b = biggest as { peer: string; label: string; fromRank: number; toRank: number; deltaRank: number };
  return {
    id: `peer-rank-${b.peer}`,
    icon: TrendingUp,
    label: 'Peer 순위 변동',
    message: `${b.label} 주간 활동 #${b.fromRank} → #${b.toRank} (+${b.deltaRank}계단)`,
    direction: 'up',
    severity: 'low',
    target: 'peerPlus',
  };
}

const MAX_ITEMS = 5;

export function useDeltaFeed(): DeltaItem[] {
  const items: DeltaItem[] = [];

  // 1. 포지셔닝 임계 (가장 priority 높음 — high/mid 섞임)
  homePositioningAlerts.forEach((alert) => items.push(describePositioning(alert)));

  // 2. 신규 카드
  const cardItem = describeCardCount();
  if (cardItem) items.push(cardItem);

  // 3. 신규 키워드 (완전 신규 등장만 — surge 는 RoC 차트 영역)
  const kwItem = describeNewKeyword();
  if (kwItem) items.push(kwItem);

  // 4. event_type shift
  const evtItem = describeEventTypeShift();
  if (evtItem) items.push(evtItem);

  // 5. peer 순위 변동
  const peerItem = describePeerRankShift();
  if (peerItem) items.push(peerItem);

  // severity 순 정렬 + 최대 5개 컷
  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, MAX_ITEMS);
}

export function getDeltaFeedAsOf(): { asOf: string; comparedTo: string } {
  return { asOf: homeDailyDeltas.asOf, comparedTo: homeDailyDeltas.comparedTo };
}
