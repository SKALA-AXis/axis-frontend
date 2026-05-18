import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

/**
 * 클릭 가능한 차트 카드 — Home 대시보드의 3개 차트 (관심도/DART/수주) 공용 컨테이너.
 *
 * 차트 본체는 children 으로 받음. 우상단 아이콘 + helper/title + 컨트롤 (좌/우 등) slot.
 */
export function ChartButton({
  title,
  helper,
  icon,
  onClick,
  children,
  controls,
}: {
  title: string;
  helper: string;
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
  controls?: ReactNode;
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="axis-panel-flat min-h-[250px] cursor-pointer p-4 text-left transition hover:border-[var(--axis-accent)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
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
      <div className="h-[170px]">{children}</div>
    </div>
  );
}
