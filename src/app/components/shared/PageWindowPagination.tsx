/*
 * 작성일: 2026-06-18
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-18 안가은 — 튜토리얼/브리핑 관리자 UI 정리 작업으로 페이지 윈도우 페이지네이션 추가
 */
export type PageWindow = {
  safePage: number;
  pageNumbers: number[];
  previousWindowPage: number | null;
  nextWindowPage: number | null;
};

export function getPageWindow(currentPage: number, totalPages: number, windowSize = 5): PageWindow {
  const safeTotalPages = Math.max(1, totalPages);
  const safeWindowSize = Math.max(1, windowSize);
  const safePage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const windowStart = Math.floor((safePage - 1) / safeWindowSize) * safeWindowSize + 1;
  const windowEnd = Math.min(safeTotalPages, windowStart + safeWindowSize - 1);
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => windowStart + index);

  return {
    safePage,
    pageNumbers,
    previousWindowPage: windowStart > 1 ? Math.max(1, windowStart - safeWindowSize) : null,
    nextWindowPage: windowEnd < safeTotalPages ? windowStart + safeWindowSize : null,
  };
}

export function PageWindowPagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel,
  windowSize = 5,
  className = '',
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel: string;
  windowSize?: number;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const { safePage, pageNumbers, previousWindowPage, nextWindowPage } = getPageWindow(currentPage, totalPages, windowSize);
  const buttonBase = 'inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';
  const inactive = 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]';
  const active = 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]';

  return (
    <nav aria-label={ariaLabel} className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={previousWindowPage === null}
          onClick={() => previousWindowPage ? onPageChange(previousWindowPage) : undefined}
          className={`${buttonBase} ${inactive}`}
          aria-label="이전 페이지 묶음"
        >
          {'<'}
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`${buttonBase} ${pageNumber === safePage ? active : inactive}`}
            aria-current={pageNumber === safePage ? 'page' : undefined}
            aria-label={`${pageNumber}페이지`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={nextWindowPage === null}
          onClick={() => nextWindowPage ? onPageChange(nextWindowPage) : undefined}
          className={`${buttonBase} ${inactive}`}
          aria-label="다음 페이지 묶음"
        >
          {'>'}
        </button>
      </div>
    </nav>
  );
}
