/**
 * Home 화면의 동적 위젯 2종.
 *
 * - PositioningAlertBar: 포지셔닝 임계 돌파/주요 변화 발생 시에만 Home 상단에 1줄 strip.
 *   변화 없으면 hide. quadrant 차트 자체를 Home 에 두지 않고 *알림형 진입점* 으로 변환.
 * - HomeCompetitorMoves: 오늘 주목해야 할 Peer 경쟁 움직임 (event_type 으로 큐레이션).
 *   사이드바의 시간순 queue 와 차원이 다른 — *경쟁 액션 중심* 의 focused feed.
 */
import { AlertTriangle, ArrowUpRight, Handshake, Layers, Megaphone, TrendingUp } from 'lucide-react';
import type { CardNewsItem, EventType } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getPeerLabel } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { homePositioningAlerts, type PositioningAlert } from '../../../../shared/mocks/homeDashboardPresentation';

// event_type 중 *경쟁 액션* 으로 분류되는 것들. 인사/규제/기술 일반은 제외 — 사이드바 queue 에 맡김.
const COMPETITIVE_EVENT_TYPES: ReadonlyArray<EventType> = ['partnership', 'ma', 'new_biz', 'contract'];

const EVENT_TYPE_META: Record<EventType, { label: string; icon: typeof Handshake; tone: string }> = {
  partnership: { label: '파트너십', icon: Handshake, tone: 'text-[var(--axis-accent-strong)]' },
  ma: { label: 'M&A', icon: Layers, tone: 'text-[var(--axis-accent-strong)]' },
  new_biz: { label: '신사업', icon: TrendingUp, tone: 'text-[var(--axis-success)]' },
  contract: { label: '수주', icon: Megaphone, tone: 'text-[var(--axis-accent-strong)]' },
  tech: { label: '기술', icon: Layers, tone: 'text-[var(--axis-muted)]' },
  personnel: { label: '인사', icon: Layers, tone: 'text-[var(--axis-muted)]' },
  regulation: { label: '규제', icon: Layers, tone: 'text-[var(--axis-muted)]' },
};

function pickCompetitiveCards(cards: CardNewsItem[], limit = 4): CardNewsItem[] {
  return [...cards]
    .filter((c) => c.event_type && COMPETITIVE_EVENT_TYPES.includes(c.event_type))
    .sort((a, b) => (b.trust_score ?? 0) - (a.trust_score ?? 0))
    .slice(0, limit);
}

export function HomeCompetitorMoves({
  cards,
  onCardClick,
}: {
  cards: CardNewsItem[];
  onCardClick: (cardId: string) => void;
}) {
  const focused = pickCompetitiveCards(cards);

  if (focused.length === 0) {
    return (
      <div className="axis-panel-flat flex h-full flex-col p-4">
        <header>
          <p className="axis-kicker">Competitor moves · 오늘</p>
          <h3 className="axis-section-heading mt-1">주목 Peer 움직임</h3>
        </header>
        <p className="mt-4 flex-1 text-sm text-[var(--axis-muted)]">
          오늘 분류된 경쟁 액션이 없습니다 (파트너십 · M&amp;A · 신사업 · 수주).
        </p>
      </div>
    );
  }

  return (
    <div className="axis-panel-flat flex h-full flex-col p-4" data-guide="home-competitor-moves">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="axis-kicker">Competitor moves · 오늘</p>
          <h3 className="axis-section-heading mt-1">주목 Peer 움직임</h3>
        </div>
        <span className="rounded-full bg-[var(--axis-surface-muted)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--axis-muted)]">
          {focused.length}건
        </span>
      </header>
      <p className="mt-1.5 text-[11px] leading-4 text-[var(--axis-muted)]">
        파트너십 · M&amp;A · 신사업 · 수주 — credibility 정렬
      </p>
      <ul className="mt-3 flex-1 space-y-2">
        {focused.map((card) => {
          const evt = card.event_type ? EVENT_TYPE_META[card.event_type] : null;
          const EvtIcon = evt?.icon ?? Layers;
          const evidence = card.summary_lines?.[0] ?? card.summary?.[0];
          return (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => onCardClick(card.id)}
                className="block w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-canvas)]"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</span>
                  {evt ? (
                    <span className={`inline-flex items-center gap-1 rounded-full bg-[var(--axis-canvas)] px-2 py-0.5 font-semibold ${evt.tone}`}>
                      <EvtIcon size={11} />
                      {evt.label}
                    </span>
                  ) : null}
                  <span className="ml-auto text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</p>
                {evidence ? (
                  <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[var(--axis-muted)]">{evidence}</p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SEVERITY_TONE: Record<PositioningAlert['severity'], { border: string; bg: string; iconTone: string }> = {
  high: {
    border: 'border-[rgba(220,90,36,0.32)]',
    bg: 'bg-[rgba(220,90,36,0.06)]',
    iconTone: 'text-[var(--axis-accent-strong)]',
  },
  mid: {
    border: 'border-[rgba(220,90,36,0.18)]',
    bg: 'bg-[rgba(220,90,36,0.04)]',
    iconTone: 'text-[var(--axis-accent)]',
  },
  low: {
    border: 'border-[var(--axis-hairline)]',
    bg: 'bg-[var(--axis-surface-soft)]',
    iconTone: 'text-[var(--axis-muted)]',
  },
};

export function PositioningAlertBar({ onNavigate }: { onNavigate: (view: string) => void }) {
  const alerts = homePositioningAlerts;
  if (alerts.length === 0) return null;

  return (
    <aside data-guide="home-positioning-alerts" className="mt-3 flex flex-col gap-1.5">
      {alerts.map((alert) => {
        const tone = SEVERITY_TONE[alert.severity];
        return (
          <button
            key={alert.id}
            type="button"
            onClick={() => onNavigate('peerPlus')}
            className={`flex items-center gap-2.5 rounded-[var(--axis-radius-md)] border ${tone.border} ${tone.bg} px-3 py-2 text-left transition hover:border-[var(--axis-accent)]`}
          >
            <AlertTriangle size={14} className={`shrink-0 ${tone.iconTone}`} />
            <span className="flex-1 truncate text-sm font-semibold text-[var(--axis-ink)]">{alert.message}</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[var(--axis-accent-strong)]">
              Peer+ 보기 <ArrowUpRight size={12} />
            </span>
          </button>
        );
      })}
    </aside>
  );
}
