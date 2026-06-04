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
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, LineChart as LineChartIcon, Sparkles } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
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
  getSummaryLines,
} from '../../../../../features/card-news/mappers/cardNewsExecutive';
import { useDashboard } from '../../../../../features/dashboard/hooks/useDashboard';
import { pickLatestCardTimestamp, pickLatestTimestamp } from '../../../../../shared/lib/viewFreshness';
import { homeTodayInsightSignals } from '../../../../../shared/mocks/homeDashboardPresentation';
import { ExecutiveBadge, ExecutiveContainer, ExecutivePage } from '../../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../../shared/FloatingCardNewsOverlay';
import {
  ChartButton,
  ChartLegend,
  LoadingBlock,
  type KeywordSpikeInsight,
} from '../../shared/axis';

type NavigateHandler = (view: string) => void;

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
  const { dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboard();
  const { cards, isLoading: cardsLoading } = useCardNews();

  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const latestCards = useMemo(() => getLatestFirst(cards), [cards]);
  const summaryChoices = latestCards.slice(0, 5);
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [interestChartIndex, setInterestChartIndex] = useState(0);
  const [homeDetailCardId, setHomeDetailCardId] = useState<string | null>(null);
  const [homeDetailSlideIndex, setHomeDetailSlideIndex] = useState(0);
  const [selectedKeywordInsight, setSelectedKeywordInsight] = useState<KeywordSpikeInsight | null>(null);
  // 첫 신호 pre-selected — empty state 회피, 진입 즉시 evidence 패널 노출
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(
    homeTodayInsightSignals[0]?.id ?? null,
  );
  const selectedSignal = useMemo(
    () => homeTodayInsightSignals.find((s) => s.id === selectedSignalId) ?? null,
    [selectedSignalId],
  );

  useEffect(() => {
    if (summaryChoices.length <= 1) return undefined;
    setSummaryIndex((current) => current % summaryChoices.length);
    const id = window.setInterval(() => {
      setSummaryIndex((current) => (current + 1) % summaryChoices.length);
    }, 3_000);
    return () => window.clearInterval(id);
  }, [summaryChoices.length]);

  useEffect(() => {
    if (dashboardLoading || cardsLoading) return;

    if (dashboardError || !dashboard) {
      onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
      return;
    }

    onUpdateTimeChange?.(pickLatestTimestamp([
      ...cards.flatMap((card) => [card.created_at, card.published_date, card.date]),
      ...dashboard.articles.map((article) => article.publishedAt),
      dashboard.dartSummary?.publishedAt ?? null,
    ]));
  }, [cards, cardsLoading, dashboard, dashboardError, dashboardLoading, onUpdateTimeChange]);

  if (dashboardLoading || cardsLoading) {
    return <LoadingBlock label="홈 대시보드 데이터를 정리하는 중입니다." />;
  }

  if (dashboardError || !dashboard) {
    return <LoadingBlock label={dashboardError ?? '대시보드를 표시할 수 없습니다.'} />;
  }

  const heroCard = rankedCards[0] ?? latestCards[0];
  const summaryCard = summaryChoices[summaryIndex % Math.max(summaryChoices.length, 1)] ?? heroCard;
  const homeDetailCard = homeDetailCardId ? cards.find((card) => card.id === homeDetailCardId) ?? null : null;
  const changeSummary = [
    { label: '오늘 감지된 변화', value: `${dashboard.trends.length + cards.length}건` },
    { label: '전주 대비', value: '+18%' },
    { label: '핵심 키워드', value: dashboard.keywordSeries[0]?.name ?? '-' },
  ];
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
  const keywordSeriesKeys = dashboard.keywordSeries.map((series) => series.key);
  const keywordSpikeInsights = dashboard.keywordInsights ?? [];
  const keywordAxisAbsMax = dashboard.keywordSearchPoints.reduce((max, point) => {
    const pointMax = keywordSeriesKeys.reduce((innerMax, key) => {
      const value = point[key];
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return innerMax;
      }
      return Math.max(innerMax, Math.abs(value));
    }, 0);
    return Math.max(max, pointMax);
  }, 0);
  const keywordAxisRange = Math.max(5, Math.ceil(((keywordAxisAbsMax * 1.15) + 1) / 5) * 5);
  const formatStockPrice = (value?: number | string | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }
    return `${value.toLocaleString('ko-KR')}원`;
  };
  const formatStockRate = (value?: number | string | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  const formatKeywordRatio = (value?: number | string | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }
    return value.toFixed(2);
  };
  const formatKeywordDelta = (value?: number | string | null, fractionDigits = 2) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(fractionDigits)}pt`;
  };
  const formatKeywordAxisTick = (value: number) => {
    if (Number.isInteger(value)) {
      return `${value}pt`;
    }
    return `${value.toFixed(1)}pt`;
  };
  const stockAxisAbsMax = stockRateChartPoints.reduce((max, point) => {
    const values = [point.samsungSds, point.lgCns, point.hyundaiAutoever, point.poscoDx];
    const pointMax = values.reduce<number>((innerMax, value) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return innerMax;
      }
      return Math.max(innerMax, Math.abs(value));
    }, 0);
    return Math.max(max, pointMax);
  }, 0);
  const stockAxisRange = Math.max(20, Math.ceil((stockAxisAbsMax + 2) / 5) * 5);
  const stockLegendItems = [
    {
      label: '삼성SDS',
      color: 'var(--axis-graph-company)',
    },
    {
      label: 'LG CNS',
      color: 'var(--axis-graph-infra)',
    },
    {
      label: '현대오토에버',
      color: 'var(--axis-graph-security)',
    },
    {
      label: '포스코DX',
      color: 'var(--axis-graph-deal)',
    },
  ];
  const renderStockTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ color?: string; dataKey?: string | number; name?: string; value?: number | string | null }>;
    label?: string;
  }): ReactNode => {
    if (!active || !payload?.length || !label) {
      return null;
    }

    const chartPoint = (payload[0] as { payload?: Record<string, number | string | null | undefined> })?.payload;
    const closeByKey = {
      samsungSds: chartPoint?.samsungSdsClose,
      lgCns: chartPoint?.lgCnsClose,
      hyundaiAutoever: chartPoint?.hyundaiAutoeverClose,
      poscoDx: chartPoint?.poscoDxClose,
    } as const;

    return (
      <div className="min-w-[220px] rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur">
        <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{label}</p>
        <div className="mt-2 space-y-1.5">
          {payload.map((item) => {
            const dataKey = typeof item.dataKey === 'string' ? item.dataKey : '';
            const closeValue = closeByKey[dataKey as keyof typeof closeByKey] ?? null;
            return (
              <div key={dataKey || item.name} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[var(--axis-body)]">
                  <span className="mt-0.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? 'currentColor' }} />
                  <span className="font-semibold">{item.name}</span>
                </div>
                <div className="text-right text-[var(--axis-ink)]">
                  <p className="font-semibold">{formatStockRate(item.value)}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--axis-muted)]">{formatStockPrice(closeValue)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const renderKeywordTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ color?: string; dataKey?: string | number; name?: string; value?: number | string | null }>;
    label?: string;
  }): ReactNode => {
    if (!active || !payload?.length || !label) {
      return null;
    }

    const chartPoint = (payload[0] as { payload?: Record<string, number | string | null | undefined> })?.payload;
    const matchedInsight = payload
      .map((item) => {
        const dataKey = typeof item.dataKey === 'string' ? item.dataKey : '';
        return keywordSpikeInsights.find((insight) => insight.key === dataKey && insight.time === label) ?? null;
      })
      .find((insight): insight is KeywordSpikeInsight => insight !== null);

    return (
      <div className="relative min-w-[240px] max-w-[340px] rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur">
        <span className="absolute -bottom-1.5 left-8 h-3 w-3 rotate-45 border-b border-r border-[var(--axis-hairline)] bg-white/95" />
        <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{label}</p>
        <div className="mt-2 space-y-1.5">
          {payload.map((item) => {
            const dataKey = typeof item.dataKey === 'string' ? item.dataKey : '';
            const ratioValue = chartPoint?.[`${dataKey}Ratio`];
            return (
              <div key={dataKey || item.name} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[var(--axis-body)]">
                  <span className="mt-0.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? 'currentColor' }} />
                  <span className="font-semibold">{item.name}</span>
                </div>
                <div className="text-right text-[var(--axis-ink)]">
                  <p className="font-semibold">{formatKeywordDelta(item.value)}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--axis-muted)]">상대지수 {formatKeywordRatio(ratioValue)}</p>
                </div>
              </div>
            );
          })}
        </div>
        {matchedInsight ? (
          <div className="mt-3 border-t border-[var(--axis-hairline)] pt-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">급등 원인 후보</p>
            <p className="mt-1.5 text-xs font-semibold leading-4 text-[var(--axis-ink)]">{matchedInsight.title}</p>
            <p className="mt-1.5 text-[11px] leading-4 text-[var(--axis-body)]">{matchedInsight.reason}</p>
            <p className="mt-1.5 text-[11px] font-semibold leading-4 text-[var(--axis-ink)]">{matchedInsight.skAxPoint}</p>
          </div>
        ) : null}
      </div>
    );
  };
  const homeDartSummary = dashboard.dartSummary;
  const homeDartRadarData = homeDartSummary?.radarMetrics?.map((item) => ({
    subject: item.axis,
    value: item.score,
    metric: item.metric,
    displayValue: item.displayValue,
  })) ?? [];
  const showStockChart = interestChartIndex % 2 === 1;
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
          {/* 좌측 — Today's Insight 영역. 박스 styling 제거하고 페이지 배경과 융합.
              주요 신호 카드 click → 하단 evidence 패널 toggle (동적 크기). 외부 nav 연결 없음. */}
          <div data-guide="home-insight" className="relative flex flex-col gap-5 p-1">
            <div className="min-w-0">
              <p className="axis-kicker">Today&apos;s insight</p>
              <h2 className="mt-2 max-w-3xl text-[clamp(2rem,3.1vw,3.7rem)] font-display leading-[1.08] text-ink">
                과거와의 변화를 기반으로 오늘의 동향
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--axis-body)]">
                {heroCard
                  ? getSummaryLines(heroCard)[0]
                  : 'Peer사의 실적, AX 투자, 카드뉴스 노출 신호를 과거 흐름과 비교해 우선순위를 정리합니다.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {changeSummary.map((item, index) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-xs text-[var(--axis-muted)]"
                  >
                    <span>{item.label}</span>
                    <strong
                      className={`text-sm ${
                        index === 1 ? 'text-[var(--axis-success)]' : 'text-[var(--axis-accent-strong)]'
                      }`}
                    >
                      {item.value}
                    </strong>
                  </span>
                ))}
              </div>

              {/* 주요 신호 카드 — 각각 button. click 시 selectedSignalId 갱신 (active 카드 재클릭 = no-op, 다른 카드 클릭 = 즉시 교체). */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {homeTodayInsightSignals.map((signal) => {
                  const isActive = signal.id === selectedSignalId;
                  return (
                    <button
                    key={signal.id}
                    type="button"
                    onClick={() => setSelectedSignalId(signal.id)}
                      aria-pressed={isActive}
                      className={`rounded-[var(--axis-radius-md)] p-3 text-left transition ${
                        isActive
                          ? 'bg-[var(--axis-canvas)] ring-2 ring-[var(--axis-accent)] shadow-[0_10px_28px_-22px_rgba(220,90,36,0.45)]'
                          : 'bg-[var(--axis-canvas)]/82 hover:bg-[var(--axis-canvas)] hover:ring-1 hover:ring-[var(--axis-hairline)]'
                      }`}
                    >
                      <p className={`text-[11px] font-semibold ${isActive ? 'text-[var(--axis-accent-strong)]' : 'text-[var(--axis-muted)]'}`}>
                        {signal.label}
                      </p>
                      <p className="mt-1 text-base font-semibold leading-6 text-[var(--axis-ink)]">{signal.value}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 동적 evidence 패널 — 신호 선택 시에만 등장, 콘텐츠 길이만큼 자연 확장 */}
            {selectedSignal ? (
              <article className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-5 shadow-[0_14px_36px_-30px_rgba(0,0,0,0.35)]">
                <header>
                  <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--axis-accent-strong)]">
                    {selectedSignal.label}
                  </p>
                  <h3 className="mt-1.5 text-[1.08rem] font-semibold leading-7 text-[var(--axis-ink)]">{selectedSignal.value}</h3>
                </header>

                {/* AI 추론 과정 — 근거 위쪽. agent 가 어떤 데이터 → 어떤 추론 → 결론에 도달했는지 chain 으로 노출. */}
                <section className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.18)] bg-[rgba(220,90,36,0.05)] p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--axis-accent-strong)]" />
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-accent-strong)]">AI 추론 과정</p>
                  </div>
                  <ol className="mt-2.5 space-y-2">
                    {selectedSignal.reasoning.map((step, idx) => (
                      <li key={step.stage} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 text-sm leading-6">
                        <span className="flex h-6 w-8 items-center justify-center rounded bg-[var(--axis-canvas)] text-[11px] font-black text-[var(--axis-accent-strong)]">
                          0{idx + 1}
                        </span>
                        <span className="text-[var(--axis-body)]">
                          <span className="font-semibold text-[var(--axis-ink)]">{step.stage}</span>
                          <span className="mx-1.5 text-[var(--axis-muted)]">—</span>
                          <span>{step.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {/* 근거 */}
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

                  {/* 달라진 점 */}
                  <section>
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">달라진 점</p>
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

                {/* 관련 키워드 */}
                {selectedSignal.evidence.relatedKeywords.length > 0 ? (
                  <section className="mt-4 border-t border-[var(--axis-hairline)] pt-3">
                    <p className="text-xs font-bold uppercase tracking-[0.10em] text-[var(--axis-muted)]">관련 키워드</p>
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
                <h3 className="axis-section-heading mt-1 truncate">오늘의 요약 카드뉴스</h3>
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
                    {summaryCard ? getDisplayDate(summaryCard) : 'TODAY'}
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
            title={showStockChart ? 'Peer사 주가 증감률' : '키워드 검색지수 변화'}
            helper={showStockChart ? 'Rate of change' : 'Index delta'}
            icon={<LineChartIcon size={18} />}
            controls={chartSwitcher}
          >
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {showStockChart ? (
                  <LineChart data={stockRateChartPoints} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--axis-graph-edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <YAxis
                      domain={[-stockAxisRange, stockAxisRange]}
                      tick={{ fontSize: 11, fill: 'var(--axis-muted)' }}
                      width={56}
                      tickFormatter={(value: number) => `${value}%`}
                    />
                    <ReferenceLine y={0} stroke="rgba(26,26,31,0.22)" strokeDasharray="3 3" />
                    <Tooltip
                      content={(props) =>
                        renderStockTooltip(props as {
                          active?: boolean;
                          payload?: Array<{ color?: string; dataKey?: string | number; name?: string; value?: number | string | null }>;
                          label?: string;
                        })
                      }
                    />
                    <Line type="linear" dataKey="samsungSds" name="삼성SDS" stroke="var(--axis-graph-company)" strokeWidth={2.3} dot={false} />
                    <Line type="linear" dataKey="lgCns" name="LG CNS" stroke="var(--axis-graph-infra)" strokeWidth={2.3} dot={false} />
                    <Line type="linear" dataKey="hyundaiAutoever" name="현대오토에버" stroke="var(--axis-graph-security)" strokeWidth={2.2} dot={false} />
                    <Line type="linear" dataKey="poscoDx" name="포스코DX" stroke="var(--axis-graph-deal)" strokeWidth={2.2} dot={false} />
                  </LineChart>
                ) : (
                  <LineChart data={dashboard.keywordSearchPoints} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--axis-graph-edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <YAxis
                      domain={[-keywordAxisRange, keywordAxisRange]}
                      tick={{ fontSize: 11, fill: 'var(--axis-muted)' }}
                      tickFormatter={formatKeywordAxisTick}
                    />
                    <ReferenceLine y={0} stroke="rgba(26,26,31,0.22)" strokeDasharray="3 3" />
                    <Tooltip
                      content={(props) =>
                        renderKeywordTooltip(props as {
                          active?: boolean;
                          payload?: Array<{ color?: string; dataKey?: string | number; name?: string; value?: number | string | null }>;
                          label?: string;
                        })
                      }
                    />
                    {dashboard.keywordSeries.map((series, index) => (
                      <Line
                        key={series.key}
                        type="linear"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={index === 0 ? 2.4 : 2.2}
                        dot={({ cx, cy, payload }) => {
                          if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return <></>;
                          const matchedInsight = keywordSpikeInsights.find(
                            (item) => item.key === series.key && item.time === String(payload.date ?? payload.time),
                          );
                          const isSelected =
                            matchedInsight?.key === selectedKeywordInsight?.key &&
                            matchedInsight?.time === selectedKeywordInsight?.time;
                          if (matchedInsight) {
                            return (
                              <g
                                className="cursor-pointer"
                                tabIndex={0}
                                onMouseEnter={() => setSelectedKeywordInsight(matchedInsight)}
                                onFocus={() => setSelectedKeywordInsight(matchedInsight)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedKeywordInsight(matchedInsight);
                                }}
                              >
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isSelected ? 11 : 9}
                                  fill="rgba(190,255,0,0.18)"
                                  stroke="#beff00"
                                  strokeWidth={2.4}
                                />
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isSelected ? 5.5 : 4.5}
                                  fill={series.color}
                                  stroke="rgba(255,255,255,0.98)"
                                  strokeWidth={2.4}
                                />
                              </g>
                            );
                          }
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={2.5}
                              fill={series.color}
                              stroke={series.color}
                              strokeWidth={0}
                            />
                          );
                        }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            <ChartLegend
              items={
                showStockChart
                  ? stockLegendItems
                  : dashboard.keywordSeries.map((series) => ({
                      label: series.name,
                      color: series.color,
                    }))
              }
            />
            {/* 차트 안내 — heavy 박스가 아니라 1-line footer 캡션 (홈은 입구. 깊은 설명은 차트별 detail 페이지로) */}
            <p className="mt-2 text-[10px] leading-4 text-[var(--axis-muted)]">
              {showStockChart
                ? `Peer 4사 전일 대비 주가 증감률 · ${dashboard.stockSource?.label ?? 'mock stockPoints fallback'}`
                : '키워드 검색지수 일별 전일 대비 지수 차이 (네이버 데이터랩 상대지수)'}
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
