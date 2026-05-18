import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LineChart as LineChartIcon, X } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
} from '../../../../features/card-news/mappers/cardNewsExecutive';
import { useDashboard } from '../../../../features/dashboard/hooks/useDashboard';
import { homeKeywordSpikeInsights, homePositioningMapData } from '../../../../shared/mocks/homeDashboardPresentation';
import { ExecutiveBadge, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { ChartButton, ChartLegend, HomePositioningMap, LoadingBlock, MiniStat, type KeywordSpikeInsight } from './AxisPlanningShared';

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
  const summaryChoices = filteredCards;
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [interestChartIndex, setInterestChartIndex] = useState(0);
  const [homeDetailCardId, setHomeDetailCardId] = useState<string | null>(null);
  const [homeDetailSlideIndex, setHomeDetailSlideIndex] = useState(0);
  const [selectedPositioningName, setSelectedPositioningName] = useState<string>('SK AX');
  const [positioningPopupName, setPositioningPopupName] = useState<string | null>(null);
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
    { label: '핵심 키워드', value: dashboard.keywordSeries[0]?.name ?? 'AX(제조)' },
  ];
  const stockChartPoints = dashboard.stockPoints.map((point) => ({
    date: point.date,
    samsung: point.samsungSds,
    lg: point.lgCns,
    hyundai: point.hyundaiAutoever,
    posco: point.poscoDx,
  }));
  const showStockChart = interestChartIndex % 2 === 1;
  const positioningLead = homePositioningMapData.find((item) => item.name === 'SK AX') ?? homePositioningMapData[0];
  const selectedPositioningPoint = homePositioningMapData.find((item) => item.name === selectedPositioningName) ?? positioningLead;
  const positioningPopupPoint = positioningPopupName
    ? homePositioningMapData.find((item) => item.name === positioningPopupName) ?? null
    : null;
  const staticPositioningCards = [
    {
      label: 'Peer사 관점',
      tone: 'accent',
      title: '상단은 한 덩어리가 아니라 두 갈래로 나뉘어 있습니다.',
      body: '삼성SDS는 실행력과 영향력이 함께 높은 정통 주도군이고, LG CNS는 실행력 우위가 먼저 보이는 유형입니다. 포스코DX는 영향력은 빠르지만 실행 폭이 좁은 추격군에 가깝습니다.',
    },
    {
      label: 'SK AX 관점 포인트',
      tone: 'neutral',
      title: 'SK AX는 주도군 바로 아래가 아니라, 두 성격의 경쟁군 사이에 걸쳐 있습니다.',
      body: '삼성SDS·LG CNS처럼 시장을 길게 끄는 축과, 포스코DX처럼 이슈를 빠르게 띄우는 축 사이에서 중간 균형형 포지션을 보입니다. 강점은 균형감이지만, 약점은 한쪽을 압도적으로 선점한 인상이 약하다는 점입니다.',
    },
    {
      label: '도출 인사이트',
      tone: 'success',
      title: '그래서 SK AX의 다음 한 수는 “더 많이”보다 “더 선명하게”에 가깝습니다.',
      body: '지금 위치에서는 실행력을 더 키우는 것만으로는 삼성SDS형 주도군도, 포스코DX형 이슈 선도군도 넘기 어렵습니다. 한 가지 대표 장면을 반복적으로 각인시키는 쪽이 좌표를 더 크게 움직일 가능성이 큽니다.',
    },
  ] as const;
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
        <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <section
            data-guide="home-insight"
            className="relative min-h-[700px] overflow-visible text-left"
          >
            <div className="relative flex h-full flex-col gap-5">
              <div className="p-4">
                <div className="min-w-0">
                  <p className="axis-kicker">Today insight</p>
                  <h2 className="mt-2 max-w-2xl text-[clamp(2rem,3.1vw,3.6rem)] font-display leading-[1.04] text-ink">
                    ITS 산업 동향 및 포지셔닝
                  </h2>
                  <div className="mt-5 rounded-[var(--axis-radius-lg)] bg-[rgba(255,255,255,0.62)] p-2">
                    <HomePositioningMap
                      points={homePositioningMapData}
                      selectedName={selectedPositioningPoint.name}
                      onSelect={(pointName) => {
                        setSelectedPositioningName(pointName);
                        setPositioningPopupName(pointName);
                      }}
                    />
                  </div>
                </div>
                <section className="mt-6 border-t border-[rgba(26,26,31,0.12)] pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="axis-kicker">Positioning reading</p>
                      <h3 className="mt-1 text-lg font-display font-semibold text-[var(--axis-ink)]">포지셔닝에서 바로 읽히는 세 가지</h3>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-6 lg:grid-cols-3">
                    {staticPositioningCards.map((card, index) => (
                      <article
                        key={card.label}
                        className={`relative min-w-0 pb-5 ${
                          index < staticPositioningCards.length - 1
                            ? 'border-b border-[rgba(26,26,31,0.08)] lg:border-b-0 lg:border-r lg:border-[rgba(26,26,31,0.08)] lg:pr-6'
                            : ''
                        } ${index > 0 ? 'lg:pl-6' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[11px] font-black uppercase tracking-[0.16em] ${
                              card.tone === 'accent'
                                ? 'text-[var(--axis-accent-strong)]'
                                : card.tone === 'success'
                                  ? 'text-[var(--axis-success)]'
                                  : 'text-[var(--axis-muted)]'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                card.tone === 'accent'
                                  ? 'text-[var(--axis-accent-strong)]'
                                  : card.tone === 'success'
                                    ? 'text-[var(--axis-success)]'
                                    : 'text-[var(--axis-muted)]'
                              }`}
                            >
                              {card.label}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-[1.02rem] font-semibold leading-7 text-[var(--axis-ink)]">{card.title}</p>
                        <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{card.body}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-4 self-start">
            <div data-guide="home-summary" className="axis-panel-flat w-full max-w-full min-w-0 self-start overflow-hidden p-4 [contain:inline-size]">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="axis-kicker">Card news</p>
                  <h3 className="axis-section-heading mt-1 truncate">오늘의 요약 카드뉴스</h3>
                </div>
                <span className="shrink-0"><ExecutiveBadge tone="accent">{filteredCards.length}건</ExecutiveBadge></span>
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
                        <span className="block text-[11px] font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</span>
                        <span className="mt-0.5 block truncate text-xs font-semibold">{card.title}</span>
                      </span>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${index === summaryIndex ? 'bg-[var(--axis-accent)]' : 'bg-[var(--axis-hairline)]'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div data-guide="home-charts">
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
                            const isSelected = matchedInsight?.key === selectedKeywordInsight?.key && matchedInsight?.time === selectedKeywordInsight?.time;
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={matchedInsight ? (isSelected ? 5.5 : 4.5) : 2.5}
                                fill={series.color}
                                stroke={matchedInsight ? 'rgba(255,255,255,0.95)' : series.color}
                                strokeWidth={matchedInsight ? 2 : 0}
                                className={matchedInsight ? 'cursor-pointer' : undefined}
                                onClick={() => {
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
                <div className="mt-3 rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.18)] bg-[rgba(255,255,255,0.78)] p-3">
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
            </div>
          </aside>
        </section>
      </ExecutiveContainer>
      {positioningPopupPoint ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.42)] p-4 backdrop-blur-[2px]"
          onClick={() => setPositioningPopupName(null)}
        >
          <div
            className="w-full max-w-3xl rounded-[var(--axis-radius-xl)] border border-[rgba(26,26,31,0.12)] bg-[var(--axis-canvas)] p-5 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                  {positioningPopupPoint.caption}
                </p>
                <h3 className="mt-2 text-[22px] font-semibold text-[var(--axis-ink)]">
                  {positioningPopupPoint.name}가 이 위치인 이유
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                  {positioningPopupPoint.impactTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPositioningPopupName(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                aria-label="포지셔닝 설명 닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {positioningPopupPoint.metrics.map((metric) => (
                <MiniStat key={`${positioningPopupPoint.name}-${metric.label}`} label={metric.label} value={metric.value} />
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--axis-body)]">{positioningPopupPoint.impactBody}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{positioningPopupPoint.watchBody}</p>
            <p className="mt-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--axis-muted)]">
              {positioningPopupPoint.evidenceNote}
            </p>
          </div>
        </div>
      ) : null}
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
