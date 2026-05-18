import type { ReactNode } from 'react';

import type { BriefingInsightItem } from './types';

export function BriefingVisualBlock({ icon, title, items }: { icon: ReactNode; title: string; items: BriefingInsightItem[] }) {
  return (
    <section className="axis-panel-flat overflow-hidden border-[rgba(120,110,96,0.24)]">
      <div className="flex items-center gap-2 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
          {icon}
        </span>
        <h2 className="axis-section-heading text-[var(--axis-ink)]">{title}</h2>
      </div>
      <div className="space-y-3 p-5">
        {items.map((item, index) => (
          <article
            key={item.title}
            tabIndex={0}
            className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--axis-surface-muted)] text-sm font-black text-[var(--axis-accent-strong)]">
              {index + 1}
            </span>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.title}</p>
              <p className="text-xs leading-5 text-[var(--axis-body)]">{item.reason}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BriefingBlock({ icon, title, items }: { icon: ReactNode; title: string; items: BriefingInsightItem[] }) {
  return (
    <section className="axis-panel-flat overflow-hidden border-[rgba(120,110,96,0.24)]">
      <div className="flex items-center gap-2 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
          {icon}
        </span>
        <h2 className="axis-section-heading text-[var(--axis-ink)]">{title}</h2>
      </div>
      <div className="space-y-3 p-5">
        {items.map((item, index) => (
          <div key={item.title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.11)] text-sm font-semibold text-[var(--axis-accent-strong)]">
              {index + 1}
            </span>
            <div className="space-y-1.5">
              <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</p>
              <p className="text-sm leading-6 text-[var(--axis-body)]">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
