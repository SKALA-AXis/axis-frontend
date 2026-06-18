import { type WheelEvent as ReactWheelEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Maximize2, Minus, Plus } from 'lucide-react';
import { getCardLogoImageClass } from '../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { getDisplayDate, getPeerLabel } from '../../../../features/card-news/mappers/cardNewsExecutive';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { useDashboard } from '../../../../features/dashboard/hooks/useDashboard';
import { fetchKeywordGraph, fetchKeywordGraphCards, isKeywordGraphApiConfigured } from '../../../../features/keyword-graph/api/keywordGraphRepository';
import type { KeywordGraphLoadStage, KeywordGraphPayload } from '../../../../features/keyword-graph/model/keywordGraph';
import { allGraphCategories, graphCategories, normalizeKeywordGraphEdge, normalizeKeywordGraphNode } from '../../../../features/keyword-graph/lib/graphNodes';
import { KeywordSphereGraph } from '../../../../features/keyword-graph/components/KeywordSphereGraph';
import { KeywordGraphLoading, KeywordRelatedCardButton, KeywordRelatedCardsLoading } from '../../../../features/keyword-graph/components/KeywordGraphPanels';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import type { KeywordEdge, KeywordNode } from '../../../../shared/content/keywordGraph';
import { ExecutiveButton, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { Skeleton } from '../../ui/skeleton';
import { FilterChip } from '../shared/axis';

type NavigateHandler = (view: string) => void;

const emptySelectedNode: KeywordNode = {
  id: 'sk-axis',
  label: 'SK AX',
  x: 450,
  y: 280,
  size: 46,
  category: '기업',
  score: 0,
  changeRate: 0,
  sourceType: 'raw_articles',
};

export function KeywordGraphView({
  bookmarkedIds = [],
  onToggleBookmark,
  onUpdateTimeChange,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}) {
  const { dashboard, isLoading: dashboardLoading } = useDashboard();
  const { cards, isLoading: cardsLoading } = useCardNews();
  const [graphPayload, setGraphPayload] = useState<KeywordGraphPayload | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphLoadStage, setGraphLoadStage] = useState<KeywordGraphLoadStage>('requesting');
  const [graphLoadingStartedAt, setGraphLoadingStartedAt] = useState(() => Date.now());
  const [graphLoadingElapsed, setGraphLoadingElapsed] = useState(0);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [keywordRelatedCards, setKeywordRelatedCards] = useState<CardNewsItem[]>([]);
  const [keywordCardsLoading, setKeywordCardsLoading] = useState(false);
  const [keywordCardsError, setKeywordCardsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('sk-axis');
  const [category, setCategory] = useState<KeywordNode['category'] | '전체'>('전체');
  const [scale, setScale] = useState(1);
  const [keywordOverlayOpen, setKeywordOverlayOpen] = useState(false);
  const [overlayPage, setOverlayPage] = useState(0);
  const [graphFullscreenOpen, setGraphFullscreenOpen] = useState(false);
  const [keywordDetailCardId, setKeywordDetailCardId] = useState<string | null>(null);
  const [keywordDetailSlideIndex, setKeywordDetailSlideIndex] = useState(0);
  const [themeRevision, setThemeRevision] = useState(0);
  const keywordCardsCacheRef = useRef(new Map<string, CardNewsItem[]>());
  const keywordCardsInFlightRef = useRef(new Map<string, Promise<CardNewsItem[]>>());

  const loadKeywordCardsForNode = useCallback(async (nodeId: string) => {
    const cachedCards = keywordCardsCacheRef.current.get(nodeId);
    if (cachedCards) return cachedCards;

    const inFlight = keywordCardsInFlightRef.current.get(nodeId);
    if (inFlight) return inFlight;

    const request = fetchKeywordGraphCards(nodeId)
      .then((apiCards) => {
        if (apiCards.length > 0) {
          keywordCardsCacheRef.current.set(nodeId, apiCards);
        }
        return apiCards;
      })
      .finally(() => {
        keywordCardsInFlightRef.current.delete(nodeId);
      });
    keywordCardsInFlightRef.current.set(nodeId, request);
    return request;
  }, []);

  const keywordNodes = useMemo(() => {
    const normalized = graphPayload?.nodes
      ?.map(normalizeKeywordGraphNode)
      .filter((node): node is KeywordNode => Boolean(node));
    return normalized ?? [];
  }, [graphPayload?.nodes]);
  const keywordEdges = useMemo(() => {
    const nodeIds = new Set(keywordNodes.map((node) => node.id));
    const normalized = graphPayload?.edges
      ?.map(normalizeKeywordGraphEdge)
      .filter((edge): edge is KeywordEdge => {
        if (!edge) return false;
        return nodeIds.has(edge.source) && nodeIds.has(edge.target);
      });
    return normalized ?? [];
  }, [graphPayload?.edges, keywordNodes]);
  const visibleNodes = useMemo(() => keywordNodes.filter((node) => (
    node.category === '기업' || category === '전체' || node.category === category
  )), [category, keywordNodes]);
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    return keywordEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  }, [keywordEdges, visibleNodes]);
  const selected = keywordNodes.find((node) => node.id === selectedId) ?? keywordNodes[0] ?? emptySelectedNode;
  const overlayCardsAll = keywordRelatedCards;
  const overlayPageSize = 3;
  const overlayPageCount = Math.max(1, Math.ceil(overlayCardsAll.length / overlayPageSize));
  const safeOverlayPage = ((overlayPage % overlayPageCount) + overlayPageCount) % overlayPageCount;
  const overlayCards = overlayCardsAll.slice(safeOverlayPage * overlayPageSize, safeOverlayPage * overlayPageSize + overlayPageSize);
  const keywordDetailCard = keywordDetailCardId
    ? overlayCardsAll.find((card) => card.id === keywordDetailCardId) ?? cards.find((card) => card.id === keywordDetailCardId) ?? null
    : null;

  useEffect(() => {
    let cancelled = false;

    async function loadKeywordGraph() {
      if (!isKeywordGraphApiConfigured()) {
        setGraphLoading(false);
        setGraphError('API client is not configured.');
        return;
      }
      try {
        setGraphLoadingStartedAt(Date.now());
        setGraphLoadingElapsed(0);
        setGraphLoading(true);
        setGraphLoadStage('requesting');
        setGraphError(null);
        const payload = await fetchKeywordGraph();
        if (cancelled) return;
        setGraphLoadStage('normalizing');
        setGraphPayload(payload);
        if (payload.selectedId) {
          setSelectedId(payload.selectedId);
        }
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            setGraphLoadStage('rendering');
            window.requestAnimationFrame(() => {
              if (!cancelled) {
                setGraphLoading(false);
              }
            });
          }
        });
      } catch (loadError) {
        if (!cancelled) {
          setGraphPayload(null);
          setGraphError(loadError instanceof Error ? loadError.message : '키워드 그래프 API를 불러오지 못했습니다.');
          setGraphLoading(false);
        }
      }
    }

    void loadKeywordGraph();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!graphLoading) return undefined;
    const intervalId = window.setInterval(() => {
      setGraphLoadingElapsed(Math.max(0, Math.floor((Date.now() - graphLoadingStartedAt) / 1000)));
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [graphLoading, graphLoadingStartedAt]);

  useEffect(() => {
    if (keywordNodes.length === 0) return;
    if (!keywordNodes.some((node) => node.id === selectedId)) {
      setSelectedId(keywordNodes[0]?.id ?? 'sk-axis');
    }
  }, [keywordNodes, selectedId]);

  useEffect(() => {
    if (visibleNodes.length === 0) return;
    if (!visibleNodes.some((node) => node.id === selectedId)) {
      setSelectedId('sk-axis');
    }
  }, [selectedId, visibleNodes]);

  useEffect(() => {
    if (!isKeywordGraphApiConfigured() || visibleNodes.length === 0) return undefined;
    let cancelled = false;

    async function prefetchKeywordCards() {
      const nodesToPrefetch = [
        ...visibleNodes.filter((node) => node.id === selectedId),
        ...visibleNodes.filter((node) => node.id !== selectedId),
      ];
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const concurrency = 4;
      for (let index = 0; index < nodesToPrefetch.length; index += concurrency) {
        if (cancelled) return;
        const batch = nodesToPrefetch.slice(index, index + concurrency);
        await Promise.all(batch.map(async (node) => {
          if (cancelled || keywordCardsCacheRef.current.has(node.id)) return;
          try {
            await loadKeywordCardsForNode(node.id);
          } catch {
            // Click-time loading still handles the error state.
          }
        }));
        if (cancelled) return;
      }
    }

    void prefetchKeywordCards();
    return () => {
      cancelled = true;
    };
  }, [loadKeywordCardsForNode, selectedId, visibleNodes]);

  useEffect(() => {
    let cancelled = false;
    const selectedNode = keywordNodes.find((node) => node.id === selectedId);
    if (!selectedNode) {
      setKeywordRelatedCards([]);
      setKeywordCardsError(null);
      setKeywordCardsLoading(false);
      return undefined;
    }
    const cachedCards = keywordCardsCacheRef.current.get(selectedId);
    if (cachedCards) {
      setKeywordRelatedCards(cachedCards);
      setKeywordCardsError(null);
      setKeywordCardsLoading(false);
      return undefined;
    }
    setKeywordRelatedCards([]);

    async function loadKeywordCards() {
      if (!isKeywordGraphApiConfigured()) return;
      try {
        setKeywordCardsLoading(true);
        setKeywordCardsError(null);
        const apiCards = await loadKeywordCardsForNode(selectedId);
        if (cancelled) return;
        setKeywordRelatedCards(apiCards);
      } catch (loadError) {
        if (!cancelled) {
          setKeywordRelatedCards([]);
          setKeywordCardsError(loadError instanceof Error ? loadError.message : '관련 카드뉴스를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setKeywordCardsLoading(false);
        }
      }
    }

    void loadKeywordCards();
    return () => {
      cancelled = true;
    };
  }, [keywordNodes, loadKeywordCardsForNode, selectedId]);

  useEffect(() => {
    setOverlayPage(0);
  }, [selectedId]);

  useEffect(() => {
    if (dashboardLoading || cardsLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, cardsLoading, dashboardLoading, onUpdateTimeChange]);

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return undefined;

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'class')) {
        setThemeRevision((current) => current + 1);
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const selectGraphNode = (nodeId: string) => {
    setSelectedId(nodeId);
    if (nodeId === 'sk-axis') {
      setKeywordOverlayOpen(false);
      return;
    }
    setKeywordOverlayOpen(true);
  };
  const handleGraphWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    const nextDelta = event.deltaY > 0 ? -0.08 : 0.08;
    setScale((current) => Math.min(1.45, Math.max(0.75, Number((current + nextDelta).toFixed(2)))));
  };

  return (
    <ExecutivePage className="h-full overflow-hidden">
      <ExecutiveContainer className="flex h-full max-w-none flex-col overflow-hidden px-3 pb-3 pt-2 sm:px-4 lg:px-4">
        <section className="axis-panel-flat flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-end">
            <h1 className="sr-only">키워드 그래프</h1>
            <div data-guide="keyword-controls" className="flex flex-wrap gap-2">
              <div data-guide="keyword-filter" className="flex flex-wrap gap-2">
              <FilterChip active={category === '전체'} onClick={() => setCategory('전체')}>전체</FilterChip>
              {graphCategories.map((item) => (
                <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</FilterChip>
              ))}
              </div>
              <ExecutiveButton variant="secondary" icon={<Minus size={15} />} onClick={() => setScale((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))))}>축소</ExecutiveButton>
              <span className="inline-flex min-h-10 items-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)]">
                {Math.round(scale * 100)}%
              </span>
              <ExecutiveButton variant="secondary" icon={<Plus size={15} />} onClick={() => setScale((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}>확대</ExecutiveButton>
              <ExecutiveButton
                variant="secondary"
                icon={<Maximize2 size={15} />}
                onClick={() => setGraphFullscreenOpen(true)}
              >
                전체화면
              </ExecutiveButton>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-0">
            <main data-guide="keyword-map" className="relative min-h-0 overscroll-contain bg-[var(--axis-surface-soft)]" onWheel={handleGraphWheel}>
              {graphLoading ? (
                <KeywordGraphLoading stage={graphLoadStage} elapsedSeconds={graphLoadingElapsed} />
              ) : graphError ? (
                <div className="flex h-full min-h-[420px] items-center justify-center p-6">
                  <div className="max-w-[520px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-5 py-4 text-sm text-[var(--axis-body)]">
                    <p className="font-semibold text-[var(--axis-ink)]">키워드 그래프 API 연결 실패</p>
                    <p className="mt-2 text-[var(--axis-muted)]">{graphError}</p>
                  </div>
                </div>
              ) : keywordNodes.length === 0 ? (
                <div className="flex h-full min-h-[420px] items-center justify-center p-6">
                  <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-5 py-4 text-sm font-semibold text-[var(--axis-body)]">
                    raw_articles.matched_sector_details.keyword 데이터가 없습니다.
                  </div>
                </div>
              ) : (
                <KeywordSphereGraph
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  selectedId={selectedId}
                  zoom={scale}
                  themeRevision={themeRevision}
                  onSelectNode={selectGraphNode}
                />
              )}
              {keywordOverlayOpen ? (
                <div
                  className="absolute inset-0 z-20 bg-[rgba(250,248,244,0.72)] p-5 backdrop-blur-[2px] dark:bg-[rgba(24,25,31,0.72)]"
                  onClick={() => setKeywordOverlayOpen(false)}
                >
                  <section
                    className="mx-auto mt-8 max-w-[720px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-5 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.45)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="axis-kicker">Related card news</p>
                        <h2 className="mt-1 text-heading-4 font-display text-[var(--axis-ink)]">{selected.label}</h2>
                        <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">
                          {overlayCardsAll.length}건 중 {safeOverlayPage + 1}/{overlayPageCount}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {overlayCardsAll.length > overlayPageSize ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setOverlayPage((page) => page - 1)}
                              className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                            >
                              이전
                            </button>
                            <button
                              type="button"
                              onClick={() => setOverlayPage((page) => page + 1)}
                              className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                            >
                              다음
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setKeywordOverlayOpen(false)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                    {keywordCardsLoading && overlayCardsAll.length === 0 ? (
                      <KeywordRelatedCardsLoading />
                    ) : keywordCardsError ? (
                      <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                        {keywordCardsError}
                      </div>
                    ) : (
                      <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
                        {overlayCards.map((card) => (
                          <KeywordRelatedCardButton
                            key={card.id}
                            card={card}
                            onOpen={() => setKeywordDetailCardId(card.id)}
                          />
                        ))}
                      </div>
                    )}
                    {!keywordCardsLoading && overlayCardsAll.length === 0 ? (
                      <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                        연결된 카드뉴스가 없습니다.
                      </div>
                    ) : null}
                  </section>
                </div>
              ) : null}
            </main>
          </div>
        </section>
      </ExecutiveContainer>
      {graphFullscreenOpen ? (
        <div className="fixed inset-0 z-50 bg-[var(--axis-canvas)]" onWheel={handleGraphWheel}>
          <KeywordSphereGraph
            nodes={visibleNodes}
            edges={visibleEdges}
            selectedId={selectedId}
            zoom={scale}
            themeRevision={themeRevision}
            fullscreen
            onSelectNode={selectGraphNode}
          />
          <div className="absolute left-3 right-3 top-16 z-20 flex flex-wrap justify-end gap-2 sm:left-auto sm:right-5 sm:top-20 sm:max-w-[520px]">
            {(['전체', ...graphCategories] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-[var(--axis-radius-md)] border px-3 py-2 text-sm font-semibold shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] transition ${
                  category === item
                    ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                    : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="absolute left-3 right-3 top-3 z-20 grid grid-cols-[44px_64px_44px_112px] gap-2 sm:left-auto sm:right-5 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <button
              type="button"
              aria-label="키워드 그래프 축소"
              onClick={() => setScale((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))))}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-sm font-semibold text-[var(--axis-body)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)] sm:w-[68px] sm:px-3"
            >
              <Minus size={15} />
              <span className="hidden sm:inline">축소</span>
            </button>
            <span className="inline-flex h-10 min-w-0 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-sm font-semibold tabular-nums text-[var(--axis-body)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] sm:w-[70px]">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              aria-label="키워드 그래프 확대"
              onClick={() => setScale((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-sm font-semibold text-[var(--axis-body)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)] sm:w-[68px] sm:px-3"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">확대</span>
            </button>
            <button
              type="button"
              onClick={() => setGraphFullscreenOpen(false)}
              className="h-10 min-w-0 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-xs font-semibold text-[var(--axis-ink)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)] sm:w-[126px] sm:px-4 sm:text-sm"
            >
              전체화면 닫기
            </button>
          </div>
          {keywordOverlayOpen ? (
            <>
              <button
                type="button"
                aria-label="관련 카드뉴스 팝업 닫기"
                onClick={() => setKeywordOverlayOpen(false)}
                className="absolute inset-0 z-[6] cursor-default"
              />
              <section
                className="absolute bottom-6 right-6 z-10 max-h-[min(520px,calc(100vh-120px))] w-[min(620px,calc(100vw-32px))] overflow-y-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/95 p-4 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.56)] backdrop-blur"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="axis-kicker">Related card news</p>
                    <h2 className="mt-1 truncate text-xl font-display font-semibold text-[var(--axis-ink)]">{selected.label}</h2>
                    <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">
                      {overlayCardsAll.length}건 중 {safeOverlayPage + 1}/{overlayPageCount}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {overlayCardsAll.length > overlayPageSize ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setOverlayPage((page) => page - 1)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                        >
                          이전
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverlayPage((page) => page + 1)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                        >
                          다음
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setKeywordOverlayOpen(false)}
                      className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                    >
                      닫기
                    </button>
                  </div>
                </div>
                {keywordCardsLoading && overlayCardsAll.length === 0 ? (
                  <KeywordRelatedCardsLoading />
                ) : keywordCardsError ? (
                  <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                    {keywordCardsError}
                  </div>
                ) : (
                  <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
                    {overlayCards.map((card) => (
                      <KeywordRelatedCardButton
                        key={card.id}
                        card={card}
                        onOpen={() => setKeywordDetailCardId(card.id)}
                      />
                    ))}
                  </div>
                )}
                {!keywordCardsLoading && overlayCardsAll.length === 0 ? (
                  <div className="mt-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                    연결된 카드뉴스가 없습니다.
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      ) : null}
      {keywordDetailCard ? (
        <FloatingCardNewsOverlay
          card={keywordDetailCard}
          cards={overlayCardsAll}
          bookmarked={bookmarkedIds.includes(keywordDetailCard.id)}
          slideIndex={keywordDetailSlideIndex}
          onSlideChange={setKeywordDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(keywordDetailCard.id)}
          onCardChange={(cardId) => {
            setKeywordDetailCardId(cardId);
            setKeywordDetailSlideIndex(0);
          }}
          onClose={() => {
            setKeywordDetailCardId(null);
            setKeywordDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
