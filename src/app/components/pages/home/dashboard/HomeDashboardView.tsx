/*
 * 작성일: 2026-06-01
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-01 안가은 — 홈 대시보드 뷰 신규 작성 및 카드뉴스 로고 폴백 추가
 *   2026-06-04 안가은 — 홈 대시보드에 실시간 키워드 스파이크 인사이트 및 지연 로딩 적용
 *   2026-06-05 박진 — 홈 투데이 인사이트 백엔드 연결
 *   2026-06-09 최종민 — 투데이 인사이트 듀얼 레인 비교 컨텍스트 및 anchor_date 연동
 *   2026-06-10 박진 — 챗봇 로직 수정 및 믹서 UX 개선
 *   2026-06-11 안가은 — 홈 키워드 트렌드 인사이트 개선 및 대시보드 구조 정리
 *   2026-06-12 안가은 — 대시보드 키워드 트렌드 UI 업데이트
 *   2026-06-14 안가은 — 대시보드/검색 인사이트 UI 및 표시 동작 개선
 *   2026-06-16 최종민 — '오늘의 요약 카드뉴스' 라벨을 카드 실제 날짜 기준으로 정정
 *   2026-06-18 안가은 — 튜토리얼과 브리핑 관리자 UI 정리
 *   2026-06-18 안가은 — Peer사 주가 가격 정보를 그래프 hover 중 차트 하단 패널로 노출
 */
/**
 * HomeDashboardView — develop 홈 레이아웃 + designing 의 RoC/Stock 토글 차트 통합.
 *
 * 레이아웃 (develop 베이스):
 *   상단: [Today insight 박스 (큰 hero 텍스트 + 메타 칩 + 변화 카드 3개)]  |  [카드뉴스 사이드바]
 *   하단: 2 차트 (RoC/Stock 토글 + 미디어 노출도)
 *
 * 변경 (designing 통합):
 *   - 좌측 Today insight 박스 안 정적 SVG 제거
 *   - 첫번째 ChartButton 을 designing 의 풍부한 keyword/Stock 차트로 (keywordSeries 동적 + spike insight 인터랙션)
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { ChevronLeft, ChevronRight, LineChart as LineChartIcon, X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { getCardLogoImageClass } from '../../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../../features/card-news/hooks/useCardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getLatestFirst,
  getPeerLabel,
} from '../../../../../features/card-news/mappers/cardNewsExecutive';
import { toDateInputValue } from '../../../../../features/briefings/utils/briefingDate';
import { useDashboard, useDashboardKeywordTrends, useTodayInsight } from '../../../../../features/dashboard/hooks/useDashboard';
import { pickLatestTimestamp } from '../../../../../shared/lib/viewFreshness';
import { ExecutiveBadge, ExecutiveContainer, ExecutivePage } from '../../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../../shared/FloatingCardNewsOverlay';
import { PageProcessLoading, PageState } from '../../../shared/PageState';
import { Skeleton } from '../../../ui/skeleton';
import {
  ChartButton,
  ChartLegend,
  type KeywordSpikeInsight,
} from '../../shared/axis';
import {
  formatKeywordAxisTick,
  formatKeywordDelta,
  formatStockPrice,
  formatStockRate,
  getSymmetricAxisRange,
  stockLegendItems,
  withResolvedKeywordSeriesColors,
} from './dashboardChartUtils';
import {
  actionHorizon,
  actionOwner,
  type HomeTodayInsightSignal,
  insightBulletLabel,
  isTruthyMeta,
  normalizeTodayInsightSection,
  normalizeTodayInsightSignal,
  sourceName,
  sourceRelatedCompanies,
  splitInsightBulletText,
  splitReadableInsightText,
} from './todayInsightUtils';

type NavigateHandler = (view: string) => void;

type ActiveKeywordPoint = {
  key: string;
  time: string;
  items: Array<{
    key: string;
    name: string;
    color: string;
    deltaLabel: string;
  }>;
  insight: KeywordSpikeInsight | null;
};

type ActiveStockPoint = {
  date: string;
  items: Array<{
    key: string;
    name: string;
    color: string;
    rateLabel: string;
    priceLabel: string;
  }>;
};

const stockDetailSeries = [
  {
    key: 'samsungSds',
    closeKey: 'samsungSdsClose',
    name: '삼성SDS',
    color: 'var(--axis-graph-company)',
  },
  {
    key: 'lgCns',
    closeKey: 'lgCnsClose',
    name: 'LG CNS',
    color: 'var(--axis-graph-infra)',
  },
  {
    key: 'hyundaiAutoever',
    closeKey: 'hyundaiAutoeverClose',
    name: '현대오토에버',
    color: 'var(--axis-graph-security)',
  },
  {
    key: 'poscoDx',
    closeKey: 'poscoDxClose',
    name: '포스코DX',
    color: 'var(--axis-graph-deal)',
  },
] as const;

export function HomeDashboardView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
  onUpdateTimeChange,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}) {
  const {
    dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    reload: reloadDashboard,
  } = useDashboard();
  const {
    keywordTrends,
    isLoading: keywordTrendsLoading,
    error: keywordTrendsError,
    reload: reloadKeywordTrends,
  } = useDashboardKeywordTrends();
  const [insightAnchorDate, setInsightAnchorDate] = useState(() => toDateInputValue());
  const {
    todayInsight,
    isLoading: todayInsightLoading,
    error: todayInsightError,
    reload: reloadTodayInsight,
  } = useTodayInsight(insightAnchorDate);
  const { cards, isLoading: cardsLoading, reload: reloadCards } = useCardNews();
  const todayDateValue = useMemo(() => toDateInputValue(), []);

  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const latestCards = useMemo(() => getLatestFirst(cards), [cards]);
  const summaryChoices = latestCards.slice(0, 5);
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [interestChartIndex, setInterestChartIndex] = useState(0);
  const [homeDetailCardId, setHomeDetailCardId] = useState<string | null>(null);
  const [homeDetailSlideIndex, setHomeDetailSlideIndex] = useState(0);
  const [activeKeywordPoint, setActiveKeywordPoint] = useState<ActiveKeywordPoint | null>(null);
  const [activeStockPoint, setActiveStockPoint] = useState<ActiveStockPoint | null>(null);
  const [isKeywordPointPinned, setIsKeywordPointPinned] = useState(false);
  const [isInsightDateSettling, setIsInsightDateSettling] = useState(false);
  const insightDateLoadingSeenRef = useRef(false);
  const homeUpdateTimestampRef = useRef<string | null>(null);
  const todayInsightProvenance = todayInsight?.provenance ?? {};
  const todayInsightMode = String(todayInsightProvenance.mode ?? '');
  const todayInsightKind = String(todayInsightProvenance.result_kind ?? todayInsightProvenance.resultKind ?? '');
  const todayInsightReportDate = String(todayInsight?.report_date ?? '').slice(0, 10);
  const isTodayInsightStale = Boolean(todayInsightReportDate && todayInsightReportDate !== insightAnchorDate)
    || isTruthyMeta(todayInsightProvenance.latest_fallback);
  const isTodayInsightFixture = isTruthyMeta(todayInsightProvenance.fixture)
    || isTruthyMeta(todayInsightProvenance.is_fixture)
    || todayInsightMode.includes('fixture')
    || todayInsightMode.includes('mock')
    || todayInsightKind.includes('fixture')
    || todayInsightKind.includes('mock');
  const isTodayInsightStatusPlaceholder = isTruthyMeta(todayInsightProvenance.is_status_placeholder)
    || todayInsightKind.includes('scheduled_pending')
    || todayInsightKind.includes('no_current_signals')
    || todayInsightMode === 'cache_only';
  const isTodayInsightNoCurrentSignals = todayInsightKind.includes('no_current_signals');
  const isTodayInsightMockLike = isTodayInsightFixture || isTodayInsightStatusPlaceholder;
  const displayTodayInsight = isTodayInsightMockLike ? null : todayInsight;
  // 홈 3상태 — quiet 면 실제 리포트 fallback 안내만 노출한다.
  const todayInsightSignals = useMemo<HomeTodayInsightSignal[]>(
    () => {
      if (isTodayInsightMockLike) {
        return [];
      }
      const liveSections = (displayTodayInsight?.insightSections ?? displayTodayInsight?.insight_sections ?? [])
        .filter((section) => section.summary || section.title)
        .map((section) => normalizeTodayInsightSection(section));
      if (liveSections.length) {
        return liveSections;
      }
      const liveSignals = displayTodayInsight?.signals?.length
        ? displayTodayInsight.signals.map((signal) => normalizeTodayInsightSignal(signal))
        : [];
      return liveSignals;
    },
    [displayTodayInsight, isTodayInsightMockLike],
  );
  const todayInsightStateLabel = null;
  const todayInsightStatusLine = isTodayInsightStatusPlaceholder
    ? isTodayInsightNoCurrentSignals
      ? '새롭게 업데이트할 주요 동향이 없습니다.'
      : '저장된 Today\'s Insight가 아직 없습니다.'
    : isTodayInsightStale
      ? '새롭게 업데이트할 주요 동향이 없어 최신 리포트를 보여줍니다.'
      : '';
  const [todayInsightNotice, setTodayInsightNotice] = useState<{
    anchorDate: string;
    label: string | null;
    line: string;
  } | null>(null);
  const visibleTodayInsightNotice = todayInsightNotice?.anchorDate === insightAnchorDate
    ? todayInsightNotice
    : null;

  useEffect(() => {
    if (!isInsightDateSettling) return;

    if (todayInsightLoading) {
      insightDateLoadingSeenRef.current = true;
      return;
    }

    if (insightDateLoadingSeenRef.current || todayInsightError) {
      insightDateLoadingSeenRef.current = false;
      setIsInsightDateSettling(false);
    }
  }, [isInsightDateSettling, todayInsightError, todayInsightLoading]);

  useLayoutEffect(() => {
    if (todayInsightLoading || isInsightDateSettling) return;

    setTodayInsightNotice({
      anchorDate: insightAnchorDate,
      label: todayInsightStateLabel,
      line: todayInsightStatusLine,
    });
  }, [insightAnchorDate, isInsightDateSettling, todayInsightLoading, todayInsightStateLabel, todayInsightStatusLine]);
  // 첫 신호 pre-selected — empty state 회피, 진입 즉시 evidence 패널 노출
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const selectedSignal = useMemo(
    () => todayInsightSignals.find((s) => s.id === selectedSignalId) ?? null,
    [selectedSignalId, todayInsightSignals],
  );

  useEffect(() => {
    if (todayInsightSignals.length === 0) {
      setSelectedSignalId(null);
      return;
    }
    setSelectedSignalId((current) => (
      current && todayInsightSignals.some((signal) => signal.id === current)
        ? current
        : todayInsightSignals[0].id
    ));
  }, [todayInsightSignals]);

  useEffect(() => {
    if (summaryChoices.length <= 1) return undefined;
    setSummaryIndex((current) => current % summaryChoices.length);
    const id = window.setInterval(() => {
      setSummaryIndex((current) => (current + 1) % summaryChoices.length);
    }, 3_000);
    return () => window.clearInterval(id);
  }, [summaryChoices.length]);

  useEffect(() => {
    if (dashboardLoading || cardsLoading || keywordTrendsLoading || todayInsightLoading) return;

    if (dashboardError || !dashboard) {
      return;
    }

    const latestUpdate = pickLatestTimestamp([
      displayTodayInsight?.data_updated_at ?? todayInsight?.data_updated_at ?? '',
      keywordTrends?.dataUpdatedAt ?? '',
      ...cards.map((card) => card.created_at ?? ''),
    ]);

    if (!latestUpdate || homeUpdateTimestampRef.current === latestUpdate) {
      return;
    }

    homeUpdateTimestampRef.current = latestUpdate;
    onUpdateTimeChange?.(latestUpdate);
  }, [
    cards,
    cardsLoading,
    dashboard,
    dashboardError,
    dashboardLoading,
    displayTodayInsight?.data_updated_at,
    keywordTrends?.dataUpdatedAt,
    keywordTrendsLoading,
    onUpdateTimeChange,
    todayInsight?.data_updated_at,
    todayInsightLoading,
  ]);

  if (dashboardLoading || cardsLoading || dashboardError || !dashboard) {
    return (
      <PageState
        loading={dashboardLoading || cardsLoading}
        error={dashboardError || (!dashboard ? '대시보드를 표시할 수 없습니다.' : null)}
        loadingLabel="홈 대시보드 데이터를 정리하는 중입니다."
        loadingFallback={(
          <PageProcessLoading
            eyebrow="Home dashboard"
            title="홈 대시보드 데이터를 정리하는 중"
            description="요약 지표와 카드뉴스를 함께 불러와 오늘의 변화, 차트, 핵심 카드를 구성합니다."
            steps={[
              { label: '요약 API 요청', detail: '/api/dashboard/summary 응답 대기' },
              { label: '카드뉴스 연결', detail: '/api/cards 목록과 최신 시각 확인' },
              { label: '화면 구성', detail: '인사이트, 차트, 카드 영역 배치' },
            ]}
          meta={['source: dashboard summary + card news', 'endpoints: /api/dashboard/summary, /api/cards']}
        />
      )}
        onRetry={async () => {
          await Promise.all([reloadDashboard(), reloadCards(), reloadTodayInsight()]);
        }}
      >
        {null}
      </PageState>
    );
  }

  const heroCard = rankedCards[0] ?? latestCards[0];
  const summaryCard = summaryChoices[summaryIndex % Math.max(summaryChoices.length, 1)] ?? heroCard;
  // "오늘의 요약 카드뉴스" 사이드바는 /api/cards(최신 카드 전체)를 쓰므로, 오늘(KST) 신규 카드가
  // 아직 없으면 최신=어제 카드가 잡힌다. 카드 실제 날짜 기준으로 제목·날짜 칩을 정직하게 표기한다.
  const summaryCardDate = summaryCard ? getDisplayDate(summaryCard) : '';
  const summaryCardIsToday =
    summaryCardDate.replace(/\D/g, '').slice(0, 8) === todayDateValue.replace(/\D/g, '');
  const summaryCardDateChip = !summaryCard
    ? 'TODAY'
    : summaryCardIsToday
      ? summaryCardDate || '오늘'
      : summaryCardDate
        ? `최신 · ${summaryCardDate}`
        : '최신';
  const summaryHeading = summaryCard && !summaryCardIsToday ? '최신 요약 카드뉴스' : '오늘의 요약 카드뉴스';
  const homeDetailCard = homeDetailCardId ? cards.find((card) => card.id === homeDetailCardId) ?? null : null;
  const selectedActions = selectedSignal?.responseDirection.length
    ? selectedSignal.responseDirection.slice(0, 2)
    : (displayTodayInsight?.response_direction ?? []).slice(0, 2);
  const selectedSourceIdSet = new Set(selectedSignal?.evidence.sourceIds ?? []);
  const selectedSources = [
    ...(selectedSignal?.sources ?? []),
    ...(displayTodayInsight?.sources ?? []).filter(
      (source) => selectedSourceIdSet.size === 0 || selectedSourceIdSet.has(source.id) || Boolean(source.url),
    ),
  ]
    .filter((source, index, sources) => {
      const key = source.url || source.id || source.title || String(index);
      return sources.findIndex((candidate) => (candidate.url || candidate.id || candidate.title) === key) === index;
    })
    .sort((a, b) => Number(Boolean(b.url)) - Number(Boolean(a.url)))
    .slice(0, 4);
  const todayInsightTitle = displayTodayInsight?.headline?.trim()
    || todayInsightSignals[0]?.value
    || (todayInsightError ? '호출에 실패했다' : '')
    || (todayInsightLoading ? "Today's insight" : '');
  const todayInsightSubtitle = displayTodayInsight?.executive_implication?.trim()
    || displayTodayInsight?.executive_summary?.trim()
    || (todayInsightError ? todayInsightError : '')
    || '';
  const todayInsightSubtitleBullets = splitInsightBulletText(todayInsightSubtitle);
  const mainInsightSignals = todayInsightSignals
    .filter((signal) => signal.value.trim() || signal.summary.trim())
    .slice(0, 3);
  const stockPointByDate = new Map(dashboard.stockPoints.map((point) => [point.date, point]));
  const rawStockRateChartPoints =
    dashboard.stockRatePoints && dashboard.stockRatePoints.length > 0
      ? dashboard.stockRatePoints
      : dashboard.stockPoints.map((point, index) => {
          const toRateOfChange = (current?: number | null, base?: number | null) => {
            if (current == null || base == null || base === 0) {
              return null;
            }

            return Number((((current - base) / base) * 100).toFixed(2));
          };

          if (index === 0) {
            return {
              date: point.date,
              samsungSds: 0,
              lgCns: 0,
              hyundaiAutoever: 0,
              poscoDx: 0,
            };
          }

          const previous = dashboard.stockPoints[index - 1];
          return {
            date: point.date,
            samsungSds: toRateOfChange(point.samsungSds, previous?.samsungSds),
            lgCns: toRateOfChange(point.lgCns, previous?.lgCns),
            hyundaiAutoever: toRateOfChange(point.hyundaiAutoever, previous?.hyundaiAutoever),
            poscoDx: toRateOfChange(point.poscoDx, previous?.poscoDx),
          };
        });
  const stockRateChartPoints = rawStockRateChartPoints.map((point) => {
    const closePoint = stockPointByDate.get(point.date);
    return {
      ...point,
      samsungSdsClose: closePoint?.samsungSds ?? null,
      lgCnsClose: closePoint?.lgCns ?? null,
      hyundaiAutoeverClose: closePoint?.hyundaiAutoever ?? null,
      poscoDxClose: closePoint?.poscoDx ?? null,
    };
  });
  const buildStockDetailPoint = (point: Record<string, number | string | null | undefined> | null | undefined): ActiveStockPoint | null => {
    const date = String(point?.date ?? '');
    if (!date) return null;

    return {
      date,
      items: stockDetailSeries.map((item) => ({
        key: item.key,
        name: item.name,
        color: item.color,
        rateLabel: formatStockRate(point?.[item.key]),
        priceLabel: formatStockPrice(point?.[item.closeKey]),
      })),
    };
  };
  const keywordSearchPoints = keywordTrends?.keywordSearchPoints ?? [];
  const keywordSeries = keywordTrends?.keywordSeries ?? [];
  const keywordSeriesForChart = withResolvedKeywordSeriesColors(keywordSeries);
  const keywordSpikeInsights = keywordTrends?.keywordInsights ?? [];
  const activeKeywordInsight = activeKeywordPoint?.insight ?? null;
  const keywordSeriesKeys = keywordSeriesForChart.map((series) => series.key);
  const keywordAxisRange = getSymmetricAxisRange(
    keywordSearchPoints as Array<Record<string, unknown>>,
    keywordSeriesKeys,
    5,
    { padding: 1, scale: 1.15, step: 5 },
  );
  const stockAxisRange = getSymmetricAxisRange(
    stockRateChartPoints as Array<Record<string, unknown>>,
    ['samsungSds', 'lgCns', 'hyundaiAutoever', 'poscoDx'],
    20,
    { padding: 2, step: 5 },
  );
  const handleStockChartMouseMove = (state: unknown) => {
    if (!state || typeof state !== 'object') return;
    const activePayload = (state as {
      activePayload?: Array<{ payload?: Record<string, number | string | null | undefined> }>;
    }).activePayload;
    const nextPoint = buildStockDetailPoint(activePayload?.[0]?.payload);
    if (nextPoint) {
      setActiveStockPoint(nextPoint);
    }
  };
  const homeDartSummary = dashboard.dartSummary;
  const homeDartRadarData = homeDartSummary?.radarMetrics?.map((item) => ({
    subject: item.axis,
    value: item.score,
    metric: item.metric,
    displayValue: item.displayValue,
  })) ?? [];
  const showStockChart = interestChartIndex % 2 === 1;
  const hasKeywordTrendChart = keywordSearchPoints.length > 0 && keywordSeriesForChart.length > 0;
  const chartSwitcher = (
    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label="이전 그래프"
        onClick={() => setInterestChartIndex((current) => (current + 1) % 2)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
      >
        <ChevronLeft size={15} />
      </button>
      <button
        type="button"
        aria-label="다음 그래프"
        onClick={() => setInterestChartIndex((current) => (current + 1) % 2)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-10 pt-3">
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          {/* 좌측 — Today's Insight 영역. 상단 요약 섹션과 하단 상세 필터를 분리. */}
          <div data-guide="home-insight" className="relative flex flex-col gap-5 p-1">
            <div className="min-w-0 xl:flex xl:min-h-[calc(100vh-340px)] xl:flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <p className="axis-kicker text-sm">Today&apos;s insight</p>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--axis-muted)]">
                  <span className="hidden sm:inline">기준일</span>
                  <input
                    type="date"
                    value={insightAnchorDate}
                    max={todayDateValue}
                    onChange={(event) => {
                      const nextDate = event.target.value > todayDateValue ? todayDateValue : event.target.value;
                      if (nextDate && nextDate !== insightAnchorDate) {
                        insightDateLoadingSeenRef.current = false;
                        setIsInsightDateSettling(true);
                      }
                      setInsightAnchorDate(nextDate);
                    }}
                    className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-base font-semibold text-[var(--axis-ink)]"
                  />
                </label>
                <span className="flex min-h-[1.625rem] min-w-0 flex-1 flex-wrap items-center gap-2">
                  {visibleTodayInsightNotice?.line ? (
                    <span className="max-w-full break-keep text-sm font-semibold leading-6 text-[var(--axis-muted)]">
                      {visibleTodayInsightNotice.line}
                    </span>
                  ) : null}
                </span>
              </div>
              {todayInsightTitle || mainInsightSignals.length > 0 ? (
                <section className="mt-6 max-w-5xl">
                  {todayInsightTitle ? (
                    <div className="max-w-4xl">
                      <h2 className="break-keep text-[clamp(2.05rem,2.65vw,3.35rem)] font-display leading-[1.12] text-ink">
                        {todayInsightTitle}
                      </h2>
                    </div>
                  ) : null}
                  {mainInsightSignals.length > 0 ? (
                    <div className={`${todayInsightTitle ? 'mt-14' : ''} border-y border-[var(--axis-hairline)]`}>
                      {mainInsightSignals.map((signal, index) => (
                        <article
                          key={signal.id}
                          className="grid gap-4 border-t border-[var(--axis-hairline)] py-5 first:border-t-0 md:grid-cols-[172px_minmax(0,1fr)] md:gap-6"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 font-mono text-xs font-bold text-[var(--axis-muted)]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <p className="text-sm font-black tracking-[0.02em] text-[var(--axis-accent-strong)]">
                              {signal.label}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {splitReadableInsightText(signal.value || signal.summary).map((line) => (
                              <p
                                key={line}
                                className="break-keep text-[clamp(1.08rem,1.22vw,1.42rem)] font-semibold leading-[1.58] text-[var(--axis-ink)]"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}
              {mainInsightSignals.length === 0 && todayInsightSubtitleBullets.length > 0 ? (
                <div className="mt-5 grid max-w-5xl gap-3">
                  {todayInsightSubtitleBullets.slice(0, 2).map((line, index) => (
                    <article
                      key={`${insightBulletLabel(index)}-${line}`}
                      className="grid gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3.5 shadow-[0_10px_30px_-28px_rgba(0,0,0,0.35)] sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-5"
                    >
                      <p className="inline-flex h-7 w-fit items-center rounded-full bg-[rgba(220,90,36,0.08)] px-3 text-xs font-bold text-[var(--axis-accent-strong)]">
                        {insightBulletLabel(index)}
                      </p>
                      <p className="break-keep text-base font-medium leading-8 text-[var(--axis-ink)]">
                        {line}
                      </p>
                    </article>
                  ))}
                </div>
              ) : mainInsightSignals.length === 0 && todayInsightSubtitle ? (
                <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--axis-body)]">
                  {todayInsightSubtitle}
                </p>
              ) : null}
            </div>

            {!isTodayInsightMockLike ? (
              <section className="mt-0 pt-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">세부 내용 선택</p>
                  {todayInsightSignals.length > 3 ? (
                    <span className="text-[11px] font-semibold text-[var(--axis-muted)]">+{todayInsightSignals.length - 3}</span>
                  ) : null}
                </div>
                {todayInsightSignals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {todayInsightSignals.slice(0, 6).map((signal, index) => {
                      const isActive = signal.id === selectedSignalId;
                      return (
                        <button
                          key={signal.id}
                          type="button"
                          onClick={() => setSelectedSignalId(signal.id)}
                          aria-pressed={isActive}
                          className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${
                            isActive
                              ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.06)]'
                              : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)]'
                          }`}
                        >
                          <span className={isActive ? 'text-[var(--axis-accent-strong)]' : 'text-[var(--axis-muted)]'}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="truncate text-[var(--axis-ink)]">{signal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--axis-muted)]">
                    실제 Today&apos;s Insight 섹션이 아직 없습니다.
                  </div>
                )}
              </section>
            ) : null}

            {/* 동적 상세 패널 — 선택한 섹션의 근거와 출처를 콘텐츠 길이만큼 자연 확장 */}
            {selectedSignal ? (
              <article className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-5 shadow-[0_14px_36px_-30px_rgba(0,0,0,0.35)]">
                <header>
                  <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--axis-accent-strong)]">
                    {selectedSignal.label}
                  </p>
                  {selectedSignal.summary && selectedSignal.summary !== selectedSignal.value ? (
                    <p className="mt-1.5 text-sm leading-6 text-[var(--axis-body)]">{selectedSignal.summary}</p>
                  ) : null}
                </header>

                {selectedSignal.reasoning.length > 0 ? (
                  <section className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.18)] bg-[rgba(220,90,36,0.05)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-accent-strong)]">판단</p>
                    <ol className="mt-2.5 space-y-2">
                      {selectedSignal.reasoning.map((step, idx) => (
                        <li key={`${step.stage}-${idx}`} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 text-sm leading-6">
                          <span className="flex h-6 w-8 items-center justify-center rounded bg-[var(--axis-canvas)] text-[11px] font-black text-[var(--axis-accent-strong)]">
                            0{idx + 1}
                          </span>
                          <span className="text-[var(--axis-body)]">
                            <span className="font-semibold text-[var(--axis-ink)]">{step.stage}</span>
                            <span className="mx-1.5 text-[var(--axis-muted)]">·</span>
                            <span>{step.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <section>
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">근거</p>
                    <ul className="mt-2 space-y-1.5">
                      {selectedSignal.evidence.grounds.map((g) => (
                        <li key={g} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2 text-sm leading-6 text-[var(--axis-body)]">
                          <span className="font-bold text-[var(--axis-accent-strong)]">·</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">변화</p>
                    <ul className="mt-2 space-y-1.5">
                      {selectedSignal.evidence.changes.map((c) => (
                        <li key={c} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2 text-sm leading-6 text-[var(--axis-body)]">
                          <span className="font-bold text-[var(--axis-success)]">↗</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {selectedSignal.evidence.relatedKeywords.length > 0 ? (
                  <section className="mt-4 border-t border-[var(--axis-hairline)] pt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">키워드</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedSignal.evidence.relatedKeywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--axis-body)]"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {selectedActions.length > 0 ? (
                  <section className="mt-4 border-t border-[var(--axis-hairline)] pt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">대응</p>
                    <div className="mt-2 grid gap-2">
                      {selectedActions.map((action) => (
                        <div key={action.action} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2.5">
                          <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{action.action}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--axis-body)]">{action.rationale}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[var(--axis-muted)]">
                            {actionOwner(action) ? <span>{actionOwner(action)}</span> : null}
                            {actionHorizon(action) ? <span>{actionHorizon(action)}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {selectedSources.length > 0 ? (
                  <section className="mt-4 border-t border-[var(--axis-hairline)] pt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">출처</p>
                    <div className="mt-2 grid gap-2">
                      {selectedSources.map((source, index) => {
                        const sourceLabel = sourceName(source);
                        const relatedCompanies = sourceRelatedCompanies(source);
                        const publishedAt = source.published_at ?? source.publishedAt ?? '';
                        const sourceTitle = source.title || sourceLabel || `출처 ${index + 1}`;
                        const sourceMeta = [
                          sourceLabel,
                          relatedCompanies.length ? `관련 기업 ${relatedCompanies.join(', ')}` : '',
                          publishedAt,
                          source.url ? '원문 링크' : '',
                        ].filter(Boolean).join(' · ');
                        const body = (
                          <>
                            <span className="block text-sm font-semibold leading-5 text-[var(--axis-ink)]">
                              {sourceTitle}
                            </span>
                            <span className="mt-1 block text-[11px] font-semibold text-[var(--axis-muted)]">
                              {sourceMeta}
                            </span>
                          </>
                        );
                        return source.url ? (
                          <a
                            key={`${sourceTitle}-${index}`}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2.5 transition hover:bg-[var(--axis-canvas)]"
                          >
                            {body}
                          </a>
                        ) : (
                          <div
                            key={`${sourceTitle}-${index}`}
                            className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2.5"
                          >
                            {body}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </article>
            ) : null}
          </div>

          {/* 우측 — 카드뉴스 사이드바 + RoC 차트 적층. flex-col 로 두 패널이 위아래로. */}
          <div className="flex flex-col gap-4">
          <aside
            data-guide="home-summary"
            className="axis-panel-flat min-h-[430px] w-full max-w-full min-w-0 overflow-hidden p-4 [contain:inline-size]"
          >
            <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="axis-kicker">Card news</p>
                <h3 className="axis-section-heading mt-1 truncate">{summaryHeading}</h3>
              </div>
              <span className="shrink-0">
                <ExecutiveBadge tone="accent">{summaryChoices.length}건</ExecutiveBadge>
              </span>
            </div>
            <button
              type="button"
              onClick={() => summaryCard && setHomeDetailCardId(summaryCard.id)}
              className="relative block aspect-[16/9] w-full max-w-full overflow-hidden rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[#091524] text-left shadow-[0_16px_38px_-24px_rgba(0,0,0,0.45)] transition hover:border-[var(--axis-accent)]"
            >
              {summaryCard?.coverImageUrl ? (
                <img
                  src={summaryCard.coverImageUrl}
                  alt={summaryCard.coverImageAlt}
                  className={getCardLogoImageClass(summaryCard.coverImageUrl, 'card') ?? 'absolute inset-0 h-full w-full object-cover opacity-60'}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#091524]/50 to-black/90" />
              <div className="relative flex h-full min-h-0 min-w-0 flex-col justify-between overflow-hidden p-4 text-white">
                <div className="flex min-w-0 items-start justify-between gap-3 text-xs font-semibold">
                  <span className="shrink-0 rounded-sm border border-white/25 bg-white/10 px-2.5 py-1 tracking-[0.06em]">
                    {summaryCardDateChip}
                  </span>
                  <span className="max-w-[44%] truncate rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">
                    {summaryCard?.category_label ?? summaryCard?.category ?? 'AX'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                    {summaryCard ? getPeerLabel(summaryCard) : 'AXIS'}
                  </p>
                  <p className="line-clamp-2 max-w-full overflow-hidden text-ellipsis break-keep text-[clamp(15px,1.2vw,19px)] font-semibold leading-tight text-white">
                    {summaryCard?.title ?? '카드뉴스 후보가 없습니다.'}
                  </p>
                </div>
              </div>
            </button>
            <div className="mt-3 max-h-[154px] max-w-full overflow-y-auto overscroll-contain rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-2">
              <div className="grid gap-2">
                {summaryChoices.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    onMouseEnter={() => setSummaryIndex(index)}
                    onFocus={() => setSummaryIndex(index)}
                    onClick={() => {
                      setSummaryIndex(index);
                      setHomeDetailCardId(card.id);
                    }}
                    className={`flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-[var(--axis-radius-sm)] px-3 py-2 text-left transition ${
                      index === summaryIndex
                        ? 'bg-[var(--axis-canvas)] text-[var(--axis-ink)] shadow-[0_10px_26px_-22px_rgba(0,0,0,0.35)]'
                        : 'text-[var(--axis-muted)] hover:bg-[var(--axis-canvas)]'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold text-[var(--axis-accent-strong)]">
                        {getPeerLabel(card)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-semibold">{card.title}</span>
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        index === summaryIndex ? 'bg-[var(--axis-accent)]' : 'bg-[var(--axis-hairline)]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 우측 하단 — RoC/Stock 토글 차트. 카드뉴스 사이드바 (min-h-[430px]) 와 같은 크기로 적층. */}
          <div data-guide="home-charts">
          <ChartButton
            title={showStockChart ? 'Peer사 주가 증감률' : '섹터별 키워드 증감폭'}
            helper={showStockChart ? 'Rate of change' : 'Daily delta'}
            icon={<LineChartIcon size={18} />}
            controls={chartSwitcher}
          >
            <div
              className="h-[260px]"
              onMouseLeave={() => {
                if (showStockChart) {
                  setActiveStockPoint(null);
                  return;
                }
                if (!isKeywordPointPinned) {
                  setActiveKeywordPoint(null);
                }
              }}
            >
              {showStockChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stockRateChartPoints}
                    margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                    onMouseMove={handleStockChartMouseMove}
                  >
                    <CartesianGrid stroke="var(--axis-graph-edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <YAxis
                      domain={[-stockAxisRange, stockAxisRange]}
                      tick={{ fontSize: 11, fill: 'var(--axis-muted)' }}
                      width={56}
                      tickFormatter={(value: number) => `${value}%`}
                    />
                    <ReferenceLine y={0} stroke="var(--axis-chart-zero-line)" strokeDasharray="3 3" />
                    <Line type="linear" dataKey="samsungSds" name="삼성SDS" stroke="var(--axis-graph-company)" strokeWidth={2.3} dot={false} />
                    <Line type="linear" dataKey="lgCns" name="LG CNS" stroke="var(--axis-graph-infra)" strokeWidth={2.3} dot={false} />
                    <Line type="linear" dataKey="hyundaiAutoever" name="현대오토에버" stroke="var(--axis-graph-security)" strokeWidth={2.2} dot={false} />
                    <Line type="linear" dataKey="poscoDx" name="포스코DX" stroke="var(--axis-graph-deal)" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : keywordTrendsLoading ? (
                <div className="flex h-full flex-col justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="axis-kicker">Search index</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">섹터 키워드 증감폭 그래프를 따로 불러오는 중입니다.</p>
                    </div>
                    <span className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] px-2.5 py-1 text-[11px] font-semibold text-[var(--axis-muted)]">
                      lazy load
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Skeleton className="h-8 w-2/3 bg-[var(--axis-surface-muted)]" />
                    <Skeleton className="h-24 w-full bg-[var(--axis-surface-muted)]" />
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-5 bg-[var(--axis-surface-muted)]" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : keywordTrendsError ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-chart-danger-border)] bg-[var(--axis-chart-danger-surface)] p-4 text-center">
                  <p className="text-sm font-semibold text-[var(--axis-danger)]">섹터 키워드 증감폭 그래프를 불러오지 못했습니다.</p>
                  <p className="mt-2 max-w-[320px] text-xs leading-5 text-[var(--axis-muted)]">{keywordTrendsError}</p>
                  <button
                    type="button"
                    onClick={() => void reloadKeywordTrends()}
                    className="mt-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-accent)]"
                  >
                    다시 시도
                  </button>
                </div>
              ) : hasKeywordTrendChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={keywordSearchPoints} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--axis-graph-edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <YAxis
                      domain={[-keywordAxisRange, keywordAxisRange]}
                      tick={{ fontSize: 11, fill: 'var(--axis-muted)' }}
                      tickFormatter={formatKeywordAxisTick}
                    />
                    <ReferenceLine y={0} stroke="var(--axis-chart-zero-line)" strokeDasharray="3 3" />
                    {keywordSeriesForChart.map((series, index) => (
                      <Line
                        key={series.key}
                        type="linear"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={index === 0 ? 2.4 : 2.2}
                        dot={({ cx, cy, payload }) => {
                          if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return <></>;
                          const point = payload as Record<string, number | string | null | undefined>;
                          const time = String(point.date ?? point.time ?? '');
                          const matchedInsight = keywordSpikeInsights.find(
                            (item) => item.key === series.key && item.time === time,
                          );
                          const hoveredPoint: ActiveKeywordPoint = {
                            key: series.key,
                            time,
                            items: keywordSeriesForChart.map((item) => ({
                              key: item.key,
                              name: item.name,
                              color: item.color,
                              deltaLabel: formatKeywordDelta(point[item.key]),
                            })),
                            insight: matchedInsight ?? null,
                          };
                          const isSelected =
                            activeKeywordPoint?.key === series.key &&
                            activeKeywordPoint?.time === time;
                          const showSpike = Boolean(matchedInsight);
                          const showActive = isSelected && showSpike;
                          const showPoint = showSpike || isSelected;
                          const handlePointEnter = () => {
                            if (!isKeywordPointPinned) {
                              setActiveKeywordPoint(hoveredPoint);
                            }
                          };
                          const handlePointBlur = () => {
                            if (!isKeywordPointPinned) {
                              setActiveKeywordPoint(null);
                            }
                          };
                          const handlePointClick = (event: MouseEvent<SVGGElement>) => {
                            event.stopPropagation();
                            setActiveKeywordPoint(hoveredPoint);
                            setIsKeywordPointPinned(true);
                          };
                          if (matchedInsight) {
                            return (
                              <g
                                className="cursor-pointer"
                                tabIndex={0}
                                onMouseEnter={handlePointEnter}
                                onFocus={handlePointEnter}
                                onBlur={handlePointBlur}
                                onClick={handlePointClick}
                              >
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={18}
                                  fill="transparent"
                                  stroke="transparent"
                                  strokeWidth={0}
                                />
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={showActive ? 11 : 9}
                                  fill="var(--axis-chart-spike-fill)"
                                  stroke="var(--axis-chart-spike-ring)"
                                  strokeWidth={2.4}
                                />
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={showActive ? 5.5 : 4.5}
                                  fill={series.color}
                                  stroke="var(--axis-chart-point-ring)"
                                  strokeWidth={2.4}
                                />
                              </g>
                            );
                          }
                          return (
                            <g
                              className="cursor-pointer"
                              tabIndex={0}
                              onMouseEnter={handlePointEnter}
                              onFocus={handlePointEnter}
                              onBlur={handlePointBlur}
                              onClick={handlePointClick}
                            >
                              <circle
                                cx={cx}
                                cy={cy}
                                r={14}
                                fill="transparent"
                                stroke="transparent"
                                strokeWidth={0}
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r={showPoint ? 4 : 2.5}
                                fill={series.color}
                                stroke={showPoint ? 'var(--axis-chart-point-ring)' : series.color}
                                strokeWidth={showPoint ? 2 : 0}
                              />
                            </g>
                          );
                        }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4 text-center">
                  <p className="text-sm font-semibold text-[var(--axis-ink)]">표시할 섹터 키워드 증감폭 데이터가 없습니다.</p>
                  <p className="mt-2 max-w-[320px] text-xs leading-5 text-[var(--axis-muted)]">
                    백엔드의 섹터 키워드 캐시가 아직 비어 있거나 검색 트렌드 데이터가 없습니다.
                  </p>
                </div>
              )}
            </div>
            <ChartLegend
              items={
                showStockChart
                  ? stockLegendItems
                  : keywordSeriesForChart.map((series) => ({
                      label: series.name,
                      color: series.color,
                  }))
              }
            />
            {showStockChart && activeStockPoint ? (
              <div className="mt-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                    Peer사 종가 · 전일 대비 증감률
                  </p>
                  <span className="text-[11px] font-semibold text-[var(--axis-muted)]">{activeStockPoint.date}</span>
                </div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {activeStockPoint.items.map((item) => {
                    const isPositive = item.rateLabel.startsWith('+');
                    const isNegative = item.rateLabel.startsWith('-');
                    return (
                      <div
                        key={item.key}
                        className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2.5 py-2 text-[11px]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-[var(--axis-body)]">
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className={`shrink-0 font-semibold ${
                            isPositive
                              ? 'text-[var(--axis-success)]'
                              : isNegative
                                ? 'text-[var(--axis-danger)]'
                                : 'text-[var(--axis-muted)]'
                          }`}
                          >
                            {item.rateLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-right text-[11px] font-semibold text-[var(--axis-ink)]">{item.priceLabel}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {!showStockChart && activeKeywordPoint ? (
              <div className="mt-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-chart-accent-border)] bg-[var(--axis-chart-accent-surface)] px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                    섹터 키워드 날짜별 증감폭
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[var(--axis-muted)]">{activeKeywordPoint.time}</span>
                    <button
                      type="button"
                      aria-label="증감폭 패널 닫기"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(220,90,36,0.24)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:text-[var(--axis-ink)]"
                      onClick={() => {
                        setActiveKeywordPoint(null);
                        setIsKeywordPointPinned(false);
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {activeKeywordPoint.items.map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-[var(--axis-radius-sm)] border px-2.5 py-2 text-[11px] ${
                        item.key === activeKeywordPoint.key
                          ? 'border-[var(--axis-chart-accent-border-strong)] bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                          : 'border-[var(--axis-chart-accent-border-soft)] bg-[var(--axis-surface)] text-[var(--axis-body)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-[var(--axis-muted)]">{item.deltaLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {activeKeywordInsight ? (
                  <>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">검색 급등 원인</p>
                    <p className="mt-1.5 text-xs font-semibold leading-4 text-[var(--axis-ink)]">{activeKeywordInsight.title}</p>
                    <p className="mt-1.5 text-[11px] leading-4 text-[var(--axis-body)]">{activeKeywordInsight.reason}</p>
                    {activeKeywordInsight.skAxPoint ? (
                      <p className="mt-1.5 text-[11px] font-semibold leading-4 text-[var(--axis-ink)]">{activeKeywordInsight.skAxPoint}</p>
                    ) : null}
                    {activeKeywordInsight.evidence?.length ? (
                      <div className="mt-2 grid gap-1.5">
                        <p className="text-[10px] font-semibold text-[var(--axis-muted)]">검증 원문</p>
                        {activeKeywordInsight.evidence.slice(0, 3).map((item, index) => {
                          const label = String(item.label ?? '출처');
                          const title = String(item.title ?? item.summary ?? '근거 제목 없음');
                          const basis = String(item.basis ?? '');
                          const source = String(item.source ?? '');
                          const publishedAt = String(item.publishedAt ?? '');
                          const url = typeof item.url === 'string' && item.url.startsWith('http') ? item.url : '';
                          return (
                            <div
                              key={`${label}-${title}-${index}`}
                              className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-chart-accent-border-soft)] bg-[var(--axis-surface)] px-2.5 py-2"
                            >
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[var(--axis-muted)]">
                                <span>{label}</span>
                                {source ? <span>· {source}</span> : null}
                                {publishedAt ? <span>· {publishedAt}</span> : null}
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--axis-ink)]">{title}</p>
                              {basis ? (
                                <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-[var(--axis-body)]">{basis}</p>
                              ) : null}
                              {url ? (
                                <a
                                  className="mt-1.5 inline-flex text-[10px] font-semibold text-[var(--axis-accent-strong)] underline-offset-2 hover:underline"
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  원문 보기
                                </a>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
            {/* 차트 안내 — heavy 박스가 아니라 1-line footer 캡션 (홈은 입구. 깊은 설명은 차트별 detail 페이지로) */}
            <p className="mt-2 text-[10px] leading-4 text-[var(--axis-muted)]">
              {showStockChart
                ? `Peer 4사 전일 대비 주가 증감률 · ${dashboard.stockSource?.label ?? '실시간 주가 데이터 대기'}`
                : `관련 키워드 묶음 기준 일별 전일 대비 증감폭 · ${keywordTrends?.sourceName ?? 'lazy keyword trend endpoint'}`}
            </p>
          </ChartButton>
          </div>
          </div>
        </section>
      </ExecutiveContainer>
      {homeDetailCard ? (
        <FloatingCardNewsOverlay
          card={homeDetailCard}
          cards={summaryChoices}
          bookmarked={bookmarkedIds.includes(homeDetailCard.id)}
          slideIndex={homeDetailSlideIndex}
          onSlideChange={setHomeDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(homeDetailCard.id)}
          onCardChange={(cardId) => {
            setHomeDetailCardId(cardId);
            setHomeDetailSlideIndex(0);
          }}
          onClose={() => {
            setHomeDetailCardId(null);
            setHomeDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
