/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 카드뉴스 수정·알림 설정 작업, 이후 챗봇 로직 수정 반영
 *   2026-06-05 최종민 — 검색 결과 카드뉴스 섹터 라벨 표기 정리(대문자·약어 처리)
 *   2026-06-14 안가은 — 대시보드·검색 인사이트 UI 개선 및 브리핑/믹서 표시 동작 정리
 */
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, LoaderCircle, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { briefingsRepository, type BriefingGenerateResult } from '../../../../features/briefings/api/briefingsRepository';
import { searchRepository } from '../../../../features/search/api/searchRepository';
import type { SearchPeriod, SearchResponse, SearchResultItem, SearchScope } from '../../../../features/search/model/search';
import { ExecutiveButton, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { PageWindowPagination } from '../../shared/PageWindowPagination';
import type { BriefingPeriod } from '../briefings/types';
import type { PeerPlusPeerId } from '../../../../shared/content/peerPlus';

const scopeOptions: Array<{ value: SearchScope; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'BRIEFING', label: '브리핑' },
  { value: 'PEER_PLUS', label: 'Peer+' },
  { value: 'CARD_NEWS', label: '카드뉴스' },
];

const periodOptions: Array<{ value: SearchPeriod; label: string }> = [
  { value: 'all', label: '전체 기간' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: 'custom', label: '직접 선택' },
];

const sectionConfig: Array<{ type: SearchResultItem['type']; label: string; empty: string }> = [
  { type: 'BRIEFING', label: '브리핑', empty: '조건에 맞는 브리핑이 없습니다.' },
  { type: 'PEER_PLUS', label: 'Peer+', empty: '조건에 맞는 Peer가 없습니다.' },
  { type: 'CARD_NEWS', label: '카드뉴스', empty: '조건에 맞는 카드뉴스가 없습니다.' },
];

const searchSectionPageSize = 5;
const defaultSectionPages: Record<SearchResultItem['type'], number> = {
  BRIEFING: 0,
  PEER_PLUS: 0,
  CARD_NEWS: 0,
};

type SearchFilters = {
  period: SearchPeriod;
  startDate: string;
  endDate: string;
};

type ActiveSearchRequest = SearchFilters & {
  query: string;
  scope: SearchScope;
};

const defaultFilters: SearchFilters = {
  period: 'all',
  startDate: '',
  endDate: '',
};

type SearchResultsViewProps = {
  initialQuery: string;
  initialScope: SearchScope;
  requestKey: number;
  onNavigate: (target: string, options?: {
    peerId?: PeerPlusPeerId;
    query?: string;
    briefingId?: string;
    briefingDate?: string;
    briefingPeriod?: BriefingPeriod;
    briefingPayload?: BriefingGenerateResult | null;
  }) => void;
};

// 섹터/카테고리 표기 약자 — 전체 대문자로 노출. 그 외 토큰은 첫 글자만 대문자.
const SECTOR_UPPERCASE_TERMS = new Set([
  'ax', 'ai', 'it', 'ict', 'bpo', 'erp', 'crm', 'scm', 'si', 'sm', 'iot',
  'rpa', 'esg', 'hr', 'cx', 'ux', 'ui', 'b2b', 'b2c', 'saas', 'paas', 'iaas',
  'llm', 'genai', 'mlops', 'devops', 'r&d',
]);

// "financial" → "Financial", "ax" → "AX", "data infra" → "Data Infra"
function formatSectorLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .split(/(\s+)/)
    .map((token) => {
      if (!token || /^\s+$/.test(token)) return token;
      const lower = token.toLowerCase();
      if (SECTOR_UPPERCASE_TERMS.has(lower)) return token.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function formatResultDate(value: string) {
  if (!value) return '날짜 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\.$/, '');
}

function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampDateInputValue(value: string, maxValue: string) {
  if (!value) return '';
  return value > maxValue ? maxValue : value;
}

function getCountLabel(response: SearchResponse | null, type: SearchResultItem['type'], fallback: number) {
  const count = response?.counts?.[type];
  return typeof count === 'number' ? count : fallback;
}

function getResultTarget(item: SearchResultItem) {
  if (item.target === 'briefings') return 'briefings';
  if (item.target === 'issues' || item.target === 'cardNews') return 'issues';
  if (item.target === 'peerPlus') return 'peerPlus';
  if (item.type === 'BRIEFING') return 'briefings';
  if (item.type === 'CARD_NEWS') return 'issues';
  if (item.type === 'PEER_PLUS') return 'peerPlus';
  return 'home';
}

function normalizeResultDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const date = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function getBriefingPeriod(value: unknown): BriefingPeriod {
  return value === 'weekly' || value === 'monthly' || value === 'daily' ? value : 'daily';
}

function SearchLoadingState({ sections }: { sections: typeof sectionConfig }) {
  return (
    <div className="space-y-4">
      <div className="axis-panel-flat flex items-center gap-3 p-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-accent-soft)] text-[var(--axis-accent-strong)]">
          <LoaderCircle size={18} className="animate-spin" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--axis-ink)]">검색 결과를 정리하는 중입니다.</p>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.type} className="axis-panel-flat overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--axis-hairline)] px-4 py-3">
            <h3 className="text-sm font-bold text-[var(--axis-ink)]">{section.label}</h3>
            <span className="h-5 w-12 animate-pulse rounded-full bg-[var(--axis-surface-soft)]" />
          </div>
          <div className="divide-y divide-[var(--axis-hairline)]">
            {[0, 1, 2].map((row) => (
              <div key={row} className="px-4 py-4">
                <div className="h-3 w-28 animate-pulse rounded bg-[var(--axis-surface-soft)]" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[var(--axis-surface-soft)]" />
                <div className="mt-2 h-3 w-full max-w-[520px] animate-pulse rounded bg-[var(--axis-surface-soft)]" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function SearchResultsView({ initialQuery, initialScope, requestKey, onNavigate }: SearchResultsViewProps) {
  const pageSearchInputRef = useRef<HTMLInputElement | null>(null);
  const todayDateValue = useMemo(() => toLocalDateInputValue(), []);
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<SearchScope>(initialScope);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [activeRequest, setActiveRequest] = useState<ActiveSearchRequest | null>(() => {
    const normalizedQuery = initialQuery.trim();
    return normalizedQuery ? { ...defaultFilters, query: normalizedQuery, scope: initialScope } : null;
  });
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [sectionPages, setSectionPages] = useState(defaultSectionPages);

  useEffect(() => {
    const normalizedQuery = initialQuery.trim();
    setQuery(normalizedQuery);
    setScope(initialScope);
    setFilters(defaultFilters);
    setActiveRequest(normalizedQuery ? { ...defaultFilters, query: normalizedQuery, scope: initialScope } : null);
  }, [initialQuery, initialScope, requestKey]);

  useEffect(() => {
    setSectionPages(defaultSectionPages);
  }, [activeRequest, scope]);

  useEffect(() => {
    const handleSearchPageShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget = target?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget) {
        return;
      }
      event.preventDefault();
      pageSearchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleSearchPageShortcut);
    return () => window.removeEventListener('keydown', handleSearchPageShortcut);
  }, []);

  const groupedResults = useMemo(() => {
    const items = response?.items ?? [];
    return {
      BRIEFING: items.filter((item) => item.type === 'BRIEFING'),
      CARD_NEWS: items.filter((item) => item.type === 'CARD_NEWS'),
      PEER_PLUS: items.filter((item) => item.type === 'PEER_PLUS'),
    };
  }, [response]);

  useEffect(() => {
    if (!activeRequest) {
      setResponse(null);
      setStatus('idle');
      setError('');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError('');
    void searchRepository.search({
      query: activeRequest.query,
      scope: activeRequest.scope,
      period: activeRequest.period,
      startDate: activeRequest.startDate || undefined,
      endDate: activeRequest.endDate || undefined,
      limit: 40,
    }).then((result) => {
      if (cancelled) return;
      setResponse(result);
      setStatus('success');
    }).catch((searchError) => {
      if (cancelled) return;
      setResponse(null);
      setStatus('error');
      setError(searchError instanceof Error ? searchError.message : '검색 결과를 불러오지 못했습니다.');
    });

    return () => {
      cancelled = true;
    };
  }, [activeRequest]);

  useEffect(() => {
    const briefingItems = (response?.items ?? []).filter((item) => item.type === 'BRIEFING' && item.id);
    briefingItems.slice(0, 12).forEach((item) => briefingsRepository.prefetchBriefingById(item.id));
  }, [response?.items]);

  const prefetchBriefingResult = (item: SearchResultItem) => {
    if (item.type === 'BRIEFING' && item.id) {
      briefingsRepository.prefetchBriefingById(item.id);
    }
  };

  const submitSearch = useCallback((nextFilters = filters) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setActiveRequest(null);
      return;
    }
    setActiveRequest({ ...nextFilters, query: normalizedQuery, scope });
  }, [filters, query, scope]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    submitSearch(defaultFilters);
  };

  const navigateToResult = (item: SearchResultItem) => {
    const target = getResultTarget(item);
    if (target === 'peerPlus') {
      const peerId = typeof item.metadata.peerId === 'string' ? item.metadata.peerId as PeerPlusPeerId : undefined;
      onNavigate('peerPlus', { peerId, query: query.trim() || item.title });
      return;
    }

    if (target === 'issues') {
      onNavigate('issues', { query: query.trim() || item.title });
      return;
    }

    if (target === 'briefings') {
      onNavigate('briefings', {
        query: query.trim() || item.title,
        briefingId: item.id,
        briefingDate: normalizeResultDate(item.date),
        briefingPeriod: getBriefingPeriod(item.metadata.briefingType),
        briefingPayload: item.id ? briefingsRepository.getCachedBriefingById(item.id) : null,
      });
      return;
    }

    onNavigate(target, { query: query.trim() || item.title });
  };

  const visibleSections = sectionConfig.filter((section) => scope === 'ALL' || scope === section.type);
  const total = response?.total ?? 0;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <div className="mb-5">
          <p className="axis-kicker">Global search</p>
          <h1 className="mt-2 font-display text-heading-2 font-semibold text-[var(--axis-ink)]">검색 결과</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--axis-muted)]">
            브리핑, 카드뉴스, Peer+ 결과를 같은 기준으로 다시 조회합니다.
          </p>
        </div>

        <form data-guide="search-query" onSubmit={handleSubmit} className="mb-5 flex flex-col gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2 md:flex-row">
          <label className="sr-only" htmlFor="axis-search-page-input">검색어</label>
          <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3">
            <Search size={16} className="mr-2 shrink-0 text-[var(--axis-accent)]" />
            <input
              id="axis-search-page-input"
              ref={pageSearchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--axis-ink)] outline-none placeholder:text-[var(--axis-muted)]"
              placeholder="검색어를 입력하세요."
            />
          </div>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as SearchScope)}
            className="h-11 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)] md:w-[168px]"
            aria-label="검색 범위"
          >
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ExecutiveButton type="submit">검색</ExecutiveButton>
        </form>

        <section className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside data-guide="search-filters" className="axis-panel-flat h-fit p-4">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[var(--axis-accent)]" />
              <h2 className="text-sm font-bold text-[var(--axis-ink)]">검색 세부 설정</h2>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">조회기간</span>
              <select
                value={filters.period}
                onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value as SearchPeriod }))}
                className="h-10 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">
                  <CalendarDays size={13} />
                  시작일
                </span>
                <input
                  type="date"
                  value={filters.startDate}
                  max={todayDateValue}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    period: 'custom',
                    startDate: clampDateInputValue(event.target.value, todayDateValue),
                  }))}
                  className="h-10 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">
                  <CalendarDays size={13} />
                  종료일
                </span>
                <input
                  type="date"
                  value={filters.endDate}
                  max={todayDateValue}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    period: 'custom',
                    endDate: clampDateInputValue(event.target.value, todayDateValue),
                  }))}
                  className="h-10 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => submitSearch()}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-accent)] px-3 text-sm font-bold text-white hover:bg-[var(--axis-accent-strong)]"
              >
                재검색
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                aria-label="검색 세부 설정 초기화"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </aside>

          <main data-guide="search-results" className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">Results</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">
                  {query.trim() ? `‘${query.trim()}’ 검색 결과` : '검색어를 입력하세요'}
                </h2>
              </div>
              <span className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-xs font-bold text-[var(--axis-muted)]">
                {status === 'success' ? `${total}건` : status === 'loading' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <LoaderCircle size={13} className="animate-spin" />
                    검색 중
                  </span>
                ) : '대기'}
              </span>
            </div>

            {status === 'idle' ? (
              <div className="axis-panel-flat p-8 text-center text-sm font-semibold text-[var(--axis-muted)]">
                상단 검색창이나 이 페이지의 검색어 입력란에서 검색어를 입력하세요.
              </div>
            ) : null}
            {status === 'loading' ? (
              <SearchLoadingState sections={visibleSections} />
            ) : null}
            {status === 'error' ? (
              <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(220,38,38,0.24)] bg-[rgba(220,38,38,0.08)] p-8 text-center text-sm font-semibold text-[var(--axis-danger)]">
                {error}
              </div>
            ) : null}
            {status === 'success' && total === 0 ? (
              <div className="axis-panel-flat p-8 text-center text-sm font-semibold text-[var(--axis-muted)]">
                검색어와 기간 조건에 맞는 결과가 없습니다.
              </div>
            ) : null}

            {status === 'success' && total > 0 ? (
              <div className="space-y-4">
                {visibleSections.map((section) => {
                  const items = groupedResults[section.type];
                  const count = getCountLabel(response, section.type, items.length);
                  const totalPages = Math.max(1, Math.ceil(items.length / searchSectionPageSize));
                  const currentPage = Math.min(sectionPages[section.type] ?? 0, totalPages - 1);
                  const visibleItems = items.slice(
                    currentPage * searchSectionPageSize,
                    currentPage * searchSectionPageSize + searchSectionPageSize,
                  );
                  return (
                    <section key={section.type} className="axis-panel-flat overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--axis-hairline)] px-4 py-3">
                        <h3 className="text-sm font-bold text-[var(--axis-ink)]">{section.label}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--axis-muted)]">
                            {items.length > searchSectionPageSize ? `${currentPage + 1}/${totalPages} · ` : ''}{count}건
                          </span>
                        </div>
                      </div>
                      {visibleItems.length > 0 ? visibleItems.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => navigateToResult(item)}
                          onMouseEnter={() => prefetchBriefingResult(item)}
                          onFocus={() => prefetchBriefingResult(item)}
                          className="block w-full border-t border-[var(--axis-hairline)] px-4 py-4 text-left first:border-t-0 transition hover:bg-[var(--axis-surface-soft)]"
                        >
                          <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">
                            {item.badge} · {formatResultDate(item.date)}
                          </span>
                          <span className="mt-1 block text-base font-bold leading-6 text-[var(--axis-ink)]">{item.title}</span>
                          <span className="mt-1 line-clamp-2 block text-sm leading-6 text-[var(--axis-muted)]">
                            {item.type === 'CARD_NEWS' && item.snippet
                              ? formatSectorLabel(item.snippet)
                              : item.snippet || '관련 결과를 확인합니다.'}
                          </span>
                        </button>
                      )) : (
                        <p className="px-4 py-6 text-sm font-semibold text-[var(--axis-muted)]">{section.empty}</p>
                      )}
                      {items.length > searchSectionPageSize ? (
                        <PageWindowPagination
                          className="border-t border-[var(--axis-hairline)] px-4 py-3"
                          currentPage={currentPage + 1}
                          totalPages={totalPages}
                          onPageChange={(page) => setSectionPages((current) => ({ ...current, [section.type]: page - 1 }))}
                          ariaLabel={`${section.label} 검색 결과 페이지 이동`}
                        />
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : null}
          </main>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}
