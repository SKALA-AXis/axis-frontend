/**
 * HomeDashboardView — develop 홈 레이아웃 + designing 의 RoC/Stock 토글 차트 통합.
 *
 * 레이아웃 (develop 베이스):
 *   상단: [Today insight 박스 (큰 hero 텍스트 + 메타 칩 + 변화 카드 3개)]  |  [카드뉴스 사이드바]
 *   하단: 2 차트 (RoC/Stock 토글 + 미디어 노출도)
 *
 * 변경 (designing 통합):
 *   - GraphifyPreview 폐기 (좌측 Today insight 박스 안 정적 SVG 제거 — 박스가 전체 가로 차지)
 *   - 첫번째 ChartButton 을 designing 의 풍부한 RoC/Stock 차트로 (keywordSeries 동적 + spike insight 인터랙션)
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LineChart as LineChartIcon } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSummaryLines,
} from '../../../../features/card-news/mappers/cardNewsExecutive';
import { useDashboard } from '../../../../features/dashboard/hooks/useDashboard';
import { homeKeywordSpikeInsights } from '../../../../shared/mocks/homeDashboardPresentation';
import { ExecutiveBadge, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import {
  ChartButton,
  ChartLegend,
  LoadingBlock,
  MiniStat,
  type KeywordSpikeInsight,
} from './AxisPlanningShared';
import { MediaExposurePanel } from './PositioningPanels';

type NavigateHandler = (view: string) => void;

export function HomeDashboardView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboard();
  const { cards, isLoading: cardsLoading } = useCardNews();

  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const filteredCards = rankedCards;
  const summaryChoices = filteredCards.slice(0, 5);
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [interestChartIndex, setInterestChartIndex] = useState(0);
  const [homeDetailCardId, setHomeDetailCardId] = useState<string | null>(null);
  const [homeDetailSlideIndex, setHomeDetailSlideIndex] = useState(0);
  const [selectedKeywordInsight, setSelectedKeywordInsight] = useState<KeywordSpikeInsight | null>(null);

  useEffect(() => {
    if (summaryChoices.length <= 1) return undefined;
    setSummaryIndex((current) => current % summaryChoices.length);
    const id = window.setInterval(() => {
      setSummaryIndex((current) => (current + 1) % summaryChoices.length);
    }, 3_000);
    return () => window.clearInterval(id);
  }, [summaryChoices.length]);

  if (dashboardLoading || cardsLoading) {
    return <LoadingBlock label="홈 대시보드 데이터를 정리하는 중입니다." />;
  }

  if (dashboardError || !dashboard) {
    return <LoadingBlock label={dashboardError ?? '대시보드를 표시할 수 없습니다.'} />;
  }

  const heroCard = filteredCards[0] ?? rankedCards[0];
  const summaryCard = summaryChoices[summaryIndex % Math.max(summaryChoices.length, 1)] ?? heroCard;
  const homeDetailCard = homeDetailCardId ? cards.find((card) => card.id === homeDetailCardId) ?? null : null;
  const changeSummary = [
    { label: '오늘 감지된 변화', value: `${dashboard.trends.length + filteredCards.length}건` },
    { label: '전주 대비', value: '+18%' },
    { label: '핵심 키워드', value: dashboard.keywordSeries[0]?.name ?? 'Agentic AI' },
  ];
  const stockChartPoints = dashboard.stockPoints.map((point) => ({
    date: point.date,
    samsung: point.samsungSds,
    lg: point.lgCns,
    hyundai: point.hyundaiAutoever,
    posco: point.poscoDx,
  }));
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
          {/* 좌측 — Today insight 박스 (GraphifyPreview 폐기, 좌측이 한 컬럼 다 차지) */}
          <button
            type="button"
            data-guide="home-insight"
            onClick={() => onNavigate('briefings')}
            className="axis-panel-flat relative min-h-[430px] overflow-hidden p-5 text-left transition hover:border-[var(--axis-accent)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  'radial-gradient(circle at 74% 42%, rgba(220,90,36,0.13), transparent 34%), radial-gradient(circle at 18% 18%, rgba(90,107,87,0.10), transparent 32%)',
              }}
            />
            <div className="relative flex h-full flex-col gap-5">
              <div className="min-w-0">
                <p className="axis-kicker">Today insight</p>
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
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    ['주요 신호', '공공 수주와 AI agent 언급이 함께 증가'],
                    ['관찰 포인트', 'IR 수치와 카드뉴스 노출의 동시 상승'],
                    ['다음 판단', '산업별 제안 메시지로 전환 필요'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)]/82 p-3">
                      <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{label}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </button>

          {/* 우측 — 카드뉴스 사이드바 */}
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
                <ExecutiveBadge tone="accent">{filteredCards.length}건</ExecutiveBadge>
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
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
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
        </section>

        {/* 하단 2 차트 — RoC/Stock 토글 + 미디어 노출도 (자사 vs 외부) */}
        <section data-guide="home-charts" className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* 1) RoC/Stock 토글 — designing 의 풍부한 차트 */}
          <ChartButton
            title={showStockChart ? 'Peer사 주가 변동' : '키워드 검색지수 증감률'}
            helper={showStockChart ? 'Stock compare' : 'Rate of change'}
            icon={<LineChartIcon size={18} />}
            controls={chartSwitcher}
          >
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                {showStockChart ? (
                  <LineChart data={stockChartPoints} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--axis-graph-edge)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--axis-muted)' }}
                      width={72}
                      tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
                    />
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString('ko-KR')}원`, '종가']} />
                    <Line type="monotone" dataKey="samsung" name="삼성SDS" stroke="var(--axis-graph-company)" strokeWidth={2.3} dot={false} />
                    <Line type="monotone" dataKey="lg" name="LG CNS" stroke="var(--axis-graph-infra)" strokeWidth={2.3} dot={false} />
                    <Line type="monotone" dataKey="hyundai" name="현대오토에버" stroke="var(--axis-graph-security)" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="posco" name="포스코DX" stroke="var(--axis-graph-deal)" strokeWidth={2.2} dot={false} />
                  </LineChart>
                ) : (
                  <LineChart data={dashboard.keywordSearchPoints} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--axis-graph-edge)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                    <Tooltip formatter={(value: number) => [`${Number(value).toLocaleString('ko-KR')}`, '검색 지수']} />
                    {dashboard.keywordSeries.map((series, index) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={index === 0 ? 2.4 : 2.2}
                        dot={({ cx, cy, payload }) => {
                          if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return <></>;
                          const matchedInsight = homeKeywordSpikeInsights.find(
                            (item) => item.key === series.key && item.time === String(payload.time),
                          );
                          const isSelected =
                            matchedInsight?.key === selectedKeywordInsight?.key &&
                            matchedInsight?.time === selectedKeywordInsight?.time;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={matchedInsight ? (isSelected ? 5.5 : 4.5) : 2.5}
                              fill={series.color}
                              stroke={matchedInsight ? 'rgba(255,255,255,0.95)' : series.color}
                              strokeWidth={matchedInsight ? 2 : 0}
                              className={matchedInsight ? 'cursor-pointer' : undefined}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (matchedInsight) {
                                  setSelectedKeywordInsight(matchedInsight);
                                }
                              }}
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
                  ? [
                      { label: '삼성SDS', color: 'var(--axis-graph-company)' },
                      { label: 'LG CNS', color: 'var(--axis-graph-infra)' },
                      { label: '현대오토에버', color: 'var(--axis-graph-security)' },
                      { label: '포스코DX', color: 'var(--axis-graph-deal)' },
                    ]
                  : dashboard.keywordSeries.map((series) => ({
                      label: series.name,
                      color: series.color,
                    }))
              }
            />
            {!showStockChart && selectedKeywordInsight ? (
              <div
                className="mt-3 rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.18)] bg-[rgba(255,255,255,0.78)] p-3"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">튀는 값 원인</p>
                    <h4 className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">{selectedKeywordInsight.title}</h4>
                  </div>
                  <div className="grid min-w-[170px] gap-2 sm:grid-cols-2">
                    <MiniStat label="발생 시점" value={selectedKeywordInsight.time} />
                    <MiniStat label="검색 지수" value={selectedKeywordInsight.valueLabel} />
                  </div>
                </div>
                <p className="mt-2.5 text-[13px] leading-5 text-[var(--axis-body)]">{selectedKeywordInsight.reason}</p>
                <p className="mt-1.5 text-[13px] font-semibold leading-5 text-[var(--axis-ink)]">{selectedKeywordInsight.skAxPoint}</p>
              </div>
            ) : null}
          </ChartButton>

          {/* 2) 미디어 노출도 — 자사 보도자료 vs 외부 출처 (self-peer bias 격리) */}
          <MediaExposurePanel />
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
