import type { MixerFilterOption } from '../lib/mixerFilters';

// Mixer 필터 그룹(칩 토글) 표현 컴포넌트 (refactoring P2/stage3). MixerView 에서 그대로 옮긴 것.
export function MixerFilterGroupPanel({
  title,
  options,
  selected,
  onToggle,
  emptyMessage,
  dense = false,
  scroll = false,
}: {
  title: string;
  options: MixerFilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  emptyMessage: string;
  dense?: boolean;
  scroll?: boolean;
}) {
  return (
    <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="axis-kicker">{title}</p>
        <span className="rounded-full bg-[var(--axis-canvas)] px-2 py-0.5 text-[10px] font-semibold text-[var(--axis-muted)]">
          {selected.length}
        </span>
      </div>
      {options.length > 0 ? (
        <div className={`flex flex-wrap gap-1 ${scroll ? 'max-h-[104px] overflow-y-auto pr-1' : ''}`}>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={`${dense ? 'min-h-6 px-2 py-0.5 text-[10px]' : 'min-h-6 px-2 py-0.5 text-[10px]'} max-w-full rounded-full border font-semibold transition ${
                  isSelected
                    ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)] dark:border-white/50 dark:bg-white/15 dark:text-white'
                    : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                }`}
                title={`${option.label} · ${option.count}개`}
              >
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <span className="truncate">{option.label}</span>
                  <span className="shrink-0 text-[10px] opacity-70">{option.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[var(--axis-radius-sm)] bg-[var(--axis-canvas)] px-2 py-1.5 text-xs leading-5 text-[var(--axis-muted)]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
