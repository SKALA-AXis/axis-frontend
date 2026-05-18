/**
 * Home 의 'DELTA · 어제 이후 변화' 위젯.
 *
 * 설계 원칙:
 *  - 변화만 표시 (상수성 정보는 Peer+ 페이지로)
 *  - 모든 항목 클릭 가능 (실재 페이지로 진입)
 *  - 변화 0건이면 한 줄로 축소 (위젯이 큰 빈 박스로 남지 않음)
 *  - 홈은 진입점 — 위젯 안에서 분석을 완결하지 않음
 *
 * 키워드 *추세* 는 RoC 차트가 전담. 본 위젯은 차트에 안 보이는 차원만 다룸:
 * 완전 신규 등장 키워드, 카드 풀 변동, peer 순위 이동, 포지셔닝 임계 통과.
 */
import { ArrowUpRight } from 'lucide-react';
import { useDeltaFeed, getDeltaFeedAsOf, type DeltaItem, type DeltaSeverity } from '../../../../shared/hooks/useDeltaFeed';

const SEVERITY_TONE: Record<DeltaSeverity, { border: string; bg: string; iconTone: string }> = {
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

function formatAsOf(iso: string): string {
  // 'YYYY-MM-DD' → 'M.D' (KST 표기 단순화)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[2])}.${Number(m[3])}`;
}

function DeltaItemRow({ item, onNavigate }: { item: DeltaItem; onNavigate: (view: string) => void }) {
  const tone = SEVERITY_TONE[item.severity];
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.target)}
      className={`flex w-full items-start gap-3 rounded-[var(--axis-radius-md)] border ${tone.border} ${tone.bg} px-3 py-2.5 text-left transition hover:border-[var(--axis-accent)]`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${tone.iconTone}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">{item.label}</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{item.message}</p>
      </div>
      <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[var(--axis-accent-strong)]" />
    </button>
  );
}

export function HomeDeltaFeed({ onNavigate }: { onNavigate: (view: string) => void }) {
  const items = useDeltaFeed();
  const { asOf, comparedTo } = getDeltaFeedAsOf();

  // 변화 0건 — 한 줄로 축소 (큰 빈 박스 방지)
  if (items.length === 0) {
    return (
      <div className="axis-panel-flat flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="axis-kicker">DELTA · 어제 이후 변화</p>
          <p className="mt-1 text-sm text-[var(--axis-muted)]">오늘은 특기할 변화가 감지되지 않았습니다.</p>
        </div>
        <span className="whitespace-nowrap text-[11px] text-[var(--axis-muted)]">{formatAsOf(asOf)} KST</span>
      </div>
    );
  }

  return (
    <div className="axis-panel-flat flex h-full flex-col p-4" data-guide="home-delta-feed">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="axis-kicker">DELTA · 어제 이후 변화</p>
          <h3 className="axis-section-heading mt-1">달라진 것</h3>
        </div>
        <span className="whitespace-nowrap text-[10px] text-[var(--axis-muted)]">
          {formatAsOf(asOf)} vs {formatAsOf(comparedTo)} (KST)
        </span>
      </header>
      <p className="mt-1.5 text-[11px] leading-4 text-[var(--axis-muted)]">
        포지셔닝 · 카드 · 키워드 · Peer 순위 — 차원별 변동만. 추세선은 좌측 RoC 차트가 전담.
      </p>
      <ul className="mt-3 flex-1 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <DeltaItemRow item={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}
