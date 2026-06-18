import type { MouseEvent } from 'react';

// 삭제 카드뉴스 페이지네이션 표현 컴포넌트 (refactoring P2/stage3 하드분할). AdminView 에서 그대로 옮긴 것.
export function DeletedCardsPagination({
  className = 'mb-4',
  safePage,
  visiblePageNumbers,
  previousPage,
  nextPage,
  onPageChange,
}: {
  className?: string;
  safePage: number;
  visiblePageNumbers: number[];
  previousPage: number | null;
  nextPage: number | null;
  onPageChange: (page: number) => void;
}) {
  const handleClick = (page: number) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onPageChange(page);
  };

  return (
    <nav
      aria-label="삭제된 카드뉴스 페이지 이동"
      className={`relative z-[100] flex flex-wrap items-center justify-center gap-3 pointer-events-auto ${className}`}
    >
      <div className="relative flex flex-wrap items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-2 shadow-[0_12px_32px_-24px_rgba(0,0,0,0.28)]">
        <button
          type="button"
          onClick={previousPage ? handleClick(previousPage) : undefined}
          disabled={previousPage === null}
          className="cursor-pointer pointer-events-auto rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {'<'}
        </button>
        {visiblePageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={handleClick(pageNumber)}
            className={`min-w-9 cursor-pointer pointer-events-auto rounded-[var(--axis-radius-sm)] border px-3 py-2 text-sm font-medium transition ${
              pageNumber === safePage
                ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                : 'border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]'
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={nextPage ? handleClick(nextPage) : undefined}
          disabled={nextPage === null}
          className="cursor-pointer pointer-events-auto rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {'>'}
        </button>
      </div>
    </nav>
  );
}
