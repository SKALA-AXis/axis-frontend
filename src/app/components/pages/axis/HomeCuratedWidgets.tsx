/**
 * Home 의 동적 알림 위젯.
 *
 * PositioningAlertBar — 포지셔닝 임계 돌파/주요 변화 발생 시에만 Home 상단에 1줄 strip.
 * 변화 없으면 hide. 정적 quadrant 차트를 Home 에 두지 않고 *알림형 진입점* 으로 변환.
 *
 * (이전 HomeCompetitorMoves 는 사이드바 카드 queue 와 같은 카드 풀을 다른 정렬로
 *  보여줘 중복으로 판단되어 제거. 깊은 카드 탐색은 /briefings, peer 별 분석은 /peer 로.)
 */
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { homePositioningAlerts, type PositioningAlert } from '../../../../shared/mocks/homeDashboardPresentation';

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
