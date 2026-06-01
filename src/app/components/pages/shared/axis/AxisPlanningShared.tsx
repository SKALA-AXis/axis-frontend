import type { ReactNode } from 'react';

import { ExecutivePage } from '../../../executive/ExecutiveSystem';
import { DonutCalloutChart } from './DonutCalloutChart';

export type { DonutCalloutDatum, KeywordSpikeInsight, PositioningPoint, PositioningTone } from './types';
export { DonutCalloutChart };

export function LoadingBlock({ label }: { label: string }) {
  return (
    <ExecutivePage className="flex min-h-full items-center justify-center p-6 text-sm text-[var(--axis-muted)]">
      {label}
    </ExecutivePage>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="axis-panel-flat p-8 text-center text-sm text-[var(--axis-muted)]">
      {label}
    </div>
  );
}

export function FilterChip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-[rgba(90,107,87,0.28)] bg-[rgba(90,107,87,0.12)] text-[var(--axis-success)]'
          : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
      }`}
    >
      {children}
    </button>
  );
}

export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{value}</p>
    </div>
  );
}

export function ChartButton({
  title,
  helper,
  icon,
  children,
  controls,
}: {
  title: string;
  helper: string;
  icon: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
}) {
  return (
    <div className="axis-panel-flat flex h-full flex-col p-4 text-left transition hover:border-[var(--axis-accent)]">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div>
          <p className="axis-kicker">{helper}</p>
          <h3 className="axis-section-heading mt-1">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {controls}
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-[var(--axis-accent)]">
            {icon}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: ReadonlyArray<{ label: string; color: string; value?: string }>;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-[var(--axis-body)]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
          {item.value ? <span className="text-[var(--axis-muted)]">{item.value}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function buildSelectionRatioData<T extends string>(
  values: T[],
  colorMap: Record<T, string>,
) {
  const counts = values.reduce<Map<T, number>>((acc, value) => {
    acc.set(value, (acc.get(value) ?? 0) + 1);
    return acc;
  }, new Map<T, number>());

  return Array.from(counts.entries()).map(([name, value]) => ({
    name,
    value,
    color: colorMap[name],
  }));
}

export function normalizeMixerPeerLabel(peer: string) {
  const compact = peer.replace(/\s+/g, '').toLowerCase();
  if (compact === '삼성sds') return '삼성SDS';
  if (compact === 'lgcns') return 'LG CNS';
  if (compact === '현대오토에버') return '현대 오토에버';
  if (compact === '포스코dx') return '포스코 DX';
  return peer.trim();
}
