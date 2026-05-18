/**
 * KeywordGraphView 의 작은 통계 표시 — 라벨 + 값 박스.
 */
export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{value}</p>
    </div>
  );
}
