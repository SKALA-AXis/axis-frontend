import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Share2, Sparkles, TrendingUp, X } from 'lucide-react';

import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import type { BriefingGenerateResult } from '../../../../features/briefings/api/briefingsRepository';
import { useGeneratedBriefing } from '../../../../features/briefings/hooks/useGeneratedBriefing';
import type { BriefingViewModel } from '../../../../features/briefings/mappers/briefingGenerateMapper';
import { toBriefingAnchorDate } from '../../../../features/briefings/utils/briefingDate';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { PageProcessLoading, PageState } from '../../shared/PageState';
import { useContentViewMode } from '../../../../shared/hooks/useContentViewMode';
import { buildBriefingPrintHtml, buildBriefingReportText } from './print';
import type { BriefingFlowStep, BriefingPeriod, BriefingReport } from './types';
import {
  buildBriefingRange,
  getBriefingFocusTitle,
  getWeekOptions,
  getWeekStartDateValue,
  periodMeta,
  toDateInputValue,
  toMonthInputValue,
} from './utils';

type BriefingReasoningModal = {
  id: string;
  title: string;
  summary: string;
  groups: Array<{
    title: string;
    items: Array<{
      label: string;
      body: string;
    }>;
  }>;
  evidenceTags: string[];
  evidenceCards: CardNewsItem[];
};

type BriefingsViewProps = {
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
  initialSelection?: {
    id?: string;
    period?: BriefingPeriod;
    date?: string;
    cachedResult?: BriefingGenerateResult | null;
    requestKey?: number;
  } | null;
};

function stripLeadingRangeLabel(text: string, leadLabel: string) {
  if (text.startsWith(`${leadLabel}에는 `)) {
    return text.slice(`${leadLabel}에는 `.length);
  }
  if (text.startsWith(`${leadLabel}에 `)) {
    return text.slice(`${leadLabel}에 `.length);
  }
  return text;
}

function normalizeBriefingText(text: string) {
  return text.replace(/(^|\s)\d+\.\s*/g, '$1').replace(/\s+/g, ' ').trim();
}

function clampValue(value: string, maxValue: string) {
  if (!value) return maxValue;
  return value > maxValue ? maxValue : value;
}

function isDateInputValue(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getWeekIndexFromDateValue(value: string) {
  const day = Number(value.slice(8, 10));
  return Math.max(1, Math.min(5, Math.ceil((Number.isFinite(day) && day > 0 ? day : 1) / 7)));
}

function adaptGeneratedBriefing(briefing: BriefingViewModel): BriefingReport {
  return {
    label: briefing.label,
    title: briefing.title,
    window: briefing.window,
    count: briefing.count,
    selectedCards: briefing.selectedCards,
    peers: briefing.peers,
    headline: briefing.headline,
    briefingLead: briefing.briefingLead,
    briefingSummaryLine: briefing.briefingSummaryLine,
    whatHappenedDigest: briefing.whatHappenedDigest,
    signalCards: briefing.signalCards,
    meaning: briefing.meaning,
    benchmark: [
      ...briefing.benchmark,
      ...briefing.response.map((item) => ({ title: item, reason: '' })),
    ],
  };
}

export function BriefingsView({ bookmarkedIds = [], onToggleBookmark, onUpdateTimeChange, initialSelection }: BriefingsViewProps) {
  const { cards, isLoading, error, reload } = useCardNews();
  const contentViewMode = useContentViewMode();
  const [period, setPeriod] = useState<BriefingPeriod>('daily');
  const [dailyDate, setDailyDate] = useState(() => toDateInputValue());
  const [weeklyMonth, setWeeklyMonth] = useState(() => toMonthInputValue());
  const [weeklyIndex, setWeeklyIndex] = useState(1);
  const [monthlyMonth, setMonthlyMonth] = useState(() => toMonthInputValue());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [detailSlideIndex, setDetailSlideIndex] = useState(0);
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [activeInsightStep, setActiveInsightStep] = useState(0);
  const [activeBriefingReasoningId, setActiveBriefingReasoningId] = useState<'focus' | null>(null);

  const todayDateValue = useMemo(() => toDateInputValue(), []);
  const currentMonthValue = todayDateValue.slice(0, 7);
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const weeklyOptions = useMemo(() => getWeekOptions(weeklyMonth), [weeklyMonth]);
  const latestSelectableWeek = useMemo(() => {
    const selectableWeeks = weeklyOptions.filter((option) => getWeekStartDateValue(weeklyMonth, option.value) <= todayDateValue);
    return selectableWeeks[selectableWeeks.length - 1] ?? weeklyOptions[0];
  }, [todayDateValue, weeklyMonth, weeklyOptions]);
  const briefingRange = useMemo(
    () => buildBriefingRange(period, dailyDate, weeklyMonth, weeklyIndex, monthlyMonth),
    [dailyDate, monthlyMonth, period, weeklyIndex, weeklyMonth],
  );
  const briefingAnchorDate = useMemo(
    () => toBriefingAnchorDate(period, dailyDate, weeklyMonth, weeklyIndex, monthlyMonth),
    [dailyDate, monthlyMonth, period, weeklyIndex, weeklyMonth],
  );
  const briefingPeriodSelection = useMemo(
    () => ({
      anchorDate: briefingAnchorDate,
      month: period === 'weekly' ? weeklyMonth : period === 'monthly' ? monthlyMonth : undefined,
      weekIndex: period === 'weekly' ? weeklyIndex : undefined,
      briefingId: initialSelection?.id,
    }),
    [briefingAnchorDate, initialSelection?.id, monthlyMonth, period, weeklyIndex, weeklyMonth],
  );
  const {
    briefing: generatedBriefing,
    isGenerating,
    error: generatedBriefingError,
    savedBriefingMissing,
    reload: reloadGeneratedBriefing,
  } = useGeneratedBriefing(period, briefingPeriodSelection, rankedCards, briefingRange, initialSelection?.cachedResult ?? null);

  useEffect(() => {
    if (isLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, isLoading, onUpdateTimeChange]);

  useEffect(() => {
    if (!isDateInputValue(initialSelection?.date)) return;

    const nextDate = clampValue(initialSelection?.date ?? '', todayDateValue);
    const nextPeriod = initialSelection?.period ?? 'daily';
    setPeriod(nextPeriod);
    setDatePickerOpen(false);
    if (nextPeriod === 'monthly') {
      setMonthlyMonth(nextDate.slice(0, 7));
      return;
    }
    if (nextPeriod === 'weekly') {
      setWeeklyMonth(nextDate.slice(0, 7));
      setWeeklyIndex(getWeekIndexFromDateValue(nextDate));
      return;
    }
    setDailyDate(nextDate);
  }, [initialSelection?.date, initialSelection?.period, initialSelection?.requestKey, todayDateValue]);

  useEffect(() => {
    const latestWeekValue = latestSelectableWeek?.value;
    if (latestWeekValue && getWeekStartDateValue(weeklyMonth, weeklyIndex) > todayDateValue) {
      setWeeklyIndex(latestWeekValue);
    }
  }, [latestSelectableWeek?.value, todayDateValue, weeklyIndex, weeklyMonth]);

  const briefing = useMemo(
    () => (generatedBriefing ? adaptGeneratedBriefing(generatedBriefing) : null),
    [generatedBriefing],
  );
  const briefingFocusTitle = useMemo(() => getBriefingFocusTitle(period), [period]);
  const briefingLeadText = useMemo(
    () => stripLeadingRangeLabel(briefing?.briefingLead ?? '', briefingRange.leadLabel),
    [briefing?.briefingLead, briefingRange.leadLabel],
  );
  const briefingOverviewLines = useMemo(
    () => [briefingLeadText, briefing?.briefingSummaryLine].map((line) => normalizeBriefingText(line ?? '')).filter(Boolean),
    [briefing?.briefingSummaryLine, briefingLeadText],
  );
  const briefingFlowSteps = useMemo(
    () => generatedBriefing?.flowSteps ?? [],
    [generatedBriefing?.flowSteps],
  );
  const servedDailyReportDate = generatedBriefing?.reportDate ?? generatedBriefing?.dateTo ?? '';
  const dailyBriefingNotice = period === 'daily' && servedDailyReportDate && servedDailyReportDate !== dailyDate
    ? '새 브리핑이 없어 최신 브리핑을 보여줍니다.'
    : period === 'daily' && savedBriefingMissing
      ? '새 브리핑이 없어 임시 생성 결과를 보여줍니다.'
      : '';
  const activeFlowStep = briefingFlowSteps[activeInsightStep] ?? briefingFlowSteps[0] ?? null;
  const reportText = useMemo(
    () => (briefing ? buildBriefingReportText(briefing, briefingFocusTitle, briefingFlowSteps) : ''),
    [briefing, briefingFlowSteps, briefingFocusTitle],
  );

  useEffect(() => {
    if (activeInsightStep >= briefingFlowSteps.length) {
      setActiveInsightStep(0);
    }
  }, [activeInsightStep, briefingFlowSteps.length]);

  const detailCard = detailCardId ? cards.find((card) => card.id === detailCardId) ?? null : null;
  const isVisualMode = contentViewMode === 'visual';
  const evidenceCards = briefing
    ? briefing.selectedCards
    .filter((card) => briefing.signalCards.some((signal) => signal.relatedCardIds.includes(card.id)))
    .slice(0, 6)
    : [];
  const getSupportingCards = (startIndex: number, count = 3) => {
    if (!briefing || briefing.selectedCards.length === 0) return [] as CardNewsItem[];
    return Array.from({ length: Math.min(count, briefing.selectedCards.length) }, (_, offset) => briefing.selectedCards[(startIndex + offset) % briefing.selectedCards.length])
      .filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index);
  };
  const buildEvidenceTags = (cardsForTags: CardNewsItem[], extraTags: string[]) => (
    Array.from(
      new Set([
        ...extraTags,
        ...cardsForTags.map((card) => getPeerLabel(card)),
        ...cardsForTags.map((card) => card.category_label ?? card.category).filter(Boolean),
      ].filter(Boolean)),
    ).slice(0, 6)
  );
  const briefingReasoningSections = useMemo<Partial<Record<'focus', BriefingReasoningModal>>>(() => {
    if (!briefing) return {};
    const focusEvidenceCards = briefing.signalCards.flatMap((item, index) => {
      const relatedCards = briefing.selectedCards
        .filter((card) => item.relatedCardIds.includes(card.id))
        .slice(0, 3);
      return relatedCards.length ? relatedCards : getSupportingCards(index, 2);
    }).filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index).slice(0, 6);

    return {
      focus: {
        id: 'focus',
        title: `${briefingFocusTitle} 추론 과정`,
        summary: `${briefing.label} 브리핑에서 수집 에이전트가 어떤 카드들을 우선 근거로 고르고, 해석 에이전트가 어떤 흐름으로 핵심 변화를 압축했는지 보여줍니다.`,
        groups: [
          {
            title: '수집 에이전트가 먼저 올린 핵심 카드',
            items: briefing.signalCards.map((item) => ({
              label: item.label,
              body: `에이전트는 "${item.title}" 신호를 핵심 변화 후보로 올렸고, 그 이유를 "${item.reason}"로 정리했습니다.`,
            })),
          },
          {
            title: '해석 에이전트의 판단 흐름',
            items: briefingFlowSteps.map((step, index) => ({
              label: `${String(index + 1).padStart(2, '0')} · ${step.label}`,
              body: `${step.headline} 이 단계에서 에이전트는 ${step.description}`,
            })),
          },
        ],
        evidenceTags: buildEvidenceTags(focusEvidenceCards, [briefing.label, briefingFocusTitle]),
        evidenceCards: focusEvidenceCards,
      },
    };
  }, [briefing, briefingFlowSteps, briefingFocusTitle]);
  const activeBriefingReasoning = activeBriefingReasoningId ? briefingReasoningSections[activeBriefingReasoningId] : null;

  const handleShareBriefing = async () => {
    setSharePreviewOpen(true);
    setShareFeedback('');
  };

  const handleCopyBriefing = async () => {
    if (!reportText) {
      setShareFeedback('공유할 브리핑 내용이 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(reportText);
      setShareFeedback('공유용 브리핑 내용을 클립보드에 복사했습니다.');
    } catch {
      setShareFeedback('브리핑 공유를 처리하지 못했습니다.');
    }
  };

  const handleNativeShareBriefing = async () => {
    if (!briefing || !reportText) {
      setShareFeedback('공유할 브리핑 내용이 없습니다.');
      return;
    }
    try {
      if (!navigator.share) {
        await handleCopyBriefing();
        return;
      }
      await navigator.share({ title: `AXIS ${briefing.label} 브리핑`, text: reportText });
      setShareFeedback('브리핑 공유를 열었습니다.');
    } catch {
      setShareFeedback('브리핑 공유를 처리하지 못했습니다.');
    }
  };

  const handlePrintBriefing = () => {
    if (!briefing) {
      setShareFeedback('인쇄할 브리핑 내용이 없습니다.');
      return;
    }
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      setShareFeedback('인쇄 창을 열지 못했습니다.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildBriefingPrintHtml(briefing, briefingFocusTitle, briefingFlowSteps));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 180);
  };

  const pageError = error ?? generatedBriefingError;
  const isPageLoading = isLoading || isGenerating;
  const shouldShowBlockingState = !briefing && (isPageLoading || Boolean(pageError));
  const hasBriefingContent = Boolean(
    briefing && (
      briefing.briefingLead ||
      briefing.whatHappenedDigest.length > 0 ||
      briefing.signalCards.length > 0 ||
      briefingFlowSteps.length > 0 ||
      briefing.selectedCards.length > 0
    ),
  );
  const handleReload = () => {
    void reload();
    reloadGeneratedBriefing();
  };

  if (shouldShowBlockingState || !briefing || !hasBriefingContent) {
    return (
      <PageState
        loading={shouldShowBlockingState && isPageLoading}
        error={pageError}
        empty={!isPageLoading && !pageError && (!briefing || !hasBriefingContent)}
        loadingLabel="브리핑을 생성하는 중입니다."
        emptyLabel={generatedBriefing?.errorMessage ?? '기간 조건에 맞는 브리핑 데이터가 없습니다.'}
        loadingFallback={(
          <PageProcessLoading
            eyebrow="Briefing"
            title="브리핑을 생성하는 중"
            description="선택한 기간의 카드뉴스와 분석 근거를 브리핑 생성 API로 정리합니다."
            steps={[
              { label: '카드뉴스 요청', detail: '/api/cards 응답 확인' },
              { label: '브리핑 생성', detail: '/api/briefings/generate 응답 대기' },
              { label: '본문 구성', detail: '생성 결과를 공유·출력 화면 구조로 변환' },
            ]}
            meta={['source: generated briefing', 'endpoint: /api/briefings/generate']}
          />
        )}
        onRetry={handleReload}
      >
        {null}
      </PageState>
    );
  }

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12 pt-3">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">브리핑</h1>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div data-guide="briefing-period" className="relative">
              <button
                type="button"
                onClick={() => setDatePickerOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
                aria-expanded={datePickerOpen}
              >
                <CalendarDays size={15} className="text-[var(--axis-accent)]" />
                <span>{periodMeta[period].label}</span>
                <span className="h-4 w-px bg-[var(--axis-hairline)]" aria-hidden="true" />
                <span className="tabular-nums text-[var(--axis-muted)]">{briefingRange.displayLabel}</span>
              </button>
              {datePickerOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(360px,calc(100vw-32px))] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.45)]">
                <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">브리핑 범위</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(Object.keys(periodMeta) as BriefingPeriod[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPeriod(item)}
                      className={`h-9 rounded-[var(--axis-radius-md)] border text-sm font-semibold transition ${
                        period === item
                          ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                      }`}
                    >
                      {periodMeta[item].label}
                    </button>
                  ))}
                </div>
                {period === 'daily' ? (
                  <label className="mt-3 flex items-center justify-between gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--axis-ink)]">
                    <span>기준 날짜</span>
                    <input
                      type="date"
                      value={dailyDate}
                      max={todayDateValue}
                      onChange={(event) => setDailyDate(clampValue(event.target.value, todayDateValue))}
                      className="min-w-0 bg-transparent text-right text-sm font-semibold text-[var(--axis-ink)] outline-none"
                    />
                  </label>
                ) : null}
                {period === 'weekly' ? (
                  <div className="mt-3 grid gap-2">
                    <label className="flex items-center justify-between gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--axis-ink)]">
                      <span>기준 월</span>
                      <input
                        type="month"
                        value={weeklyMonth}
                        max={currentMonthValue}
                        onChange={(event) => {
                          setWeeklyMonth(clampValue(event.target.value, currentMonthValue));
                          setWeeklyIndex(1);
                        }}
                        className="min-w-0 bg-transparent text-right text-sm font-semibold text-[var(--axis-ink)] outline-none"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--axis-ink)]">
                      <span>주차</span>
                      <select
                        value={weeklyIndex}
                        onChange={(event) => setWeeklyIndex(Number(event.target.value))}
                        className="min-w-0 bg-transparent text-right text-sm font-semibold text-[var(--axis-ink)] outline-none"
                      >
                        {weeklyOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={getWeekStartDateValue(weeklyMonth, option.value) > todayDateValue}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="px-1 text-xs font-medium text-[var(--axis-muted)]">
                      {weeklyOptions.find((option) => option.value === weeklyIndex)?.range ?? weeklyOptions[0]?.range}
                    </p>
                  </div>
                ) : null}
                {period === 'monthly' ? (
                  <label className="mt-3 flex items-center justify-between gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--axis-ink)]">
                    <span>기준 월</span>
                    <input
                      type="month"
                      value={monthlyMonth}
                      max={currentMonthValue}
                      onChange={(event) => setMonthlyMonth(clampValue(event.target.value, currentMonthValue))}
                      className="min-w-0 bg-transparent text-right text-sm font-semibold text-[var(--axis-ink)] outline-none"
                    />
                  </label>
                ) : null}
              </div>
              ) : null}
            </div>
            <span className="flex min-h-[1.625rem] min-w-0 flex-1 flex-wrap items-center gap-2">
              {dailyBriefingNotice ? (
                <span className="max-w-full break-keep text-sm font-semibold leading-6 text-[var(--axis-muted)]">
                  {dailyBriefingNotice}
                </span>
              ) : null}
            </span>
          </div>
          <div data-guide="briefing-share-print" className="flex flex-wrap gap-2">
            <ExecutiveButton variant="secondary" icon={<Share2 size={16} />} onClick={handleShareBriefing}>
              공유·인쇄
            </ExecutiveButton>
          </div>
        </header>
        {shareFeedback ? (
          <p className="mb-4 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--axis-muted)]">
            {shareFeedback}
          </p>
        ) : null}

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <main data-guide="briefing-main" className="space-y-5">
            <section className="border-b border-[var(--axis-hairline)] pb-6 sm:pb-7">
              <h2 className="max-w-5xl font-display text-[1.55rem] font-semibold leading-[1.3] text-[var(--axis-ink)] sm:text-[1.8rem] xl:text-[2rem]">
                {briefing.title}
              </h2>
              <div className="mt-6 divide-y divide-[var(--axis-hairline)] border-t border-[var(--axis-hairline)]">
                {briefingOverviewLines.map((line, index) => (
                  <article
                    key={`${briefing.title}-overview-${index}`}
                    className="flex items-start gap-4 py-5"
                  >
                    <span className="mt-0.5 w-7 shrink-0 text-base font-black text-[var(--axis-accent-strong)]">
                      {index + 1}
                    </span>
                    <p className="min-w-0 max-w-[66rem] flex-1 text-[1.05rem] font-bold leading-8 text-[var(--axis-ink)] sm:text-[1.14rem]">
                      {line}
                    </p>
                  </article>
                ))}
              </div>
              {briefing.peers.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {briefing.peers.slice(0, 4).map((peer) => (
                    <span key={peer} className="rounded-[var(--axis-radius-sm)] border border-[rgba(220,90,36,0.22)] bg-[rgba(220,90,36,0.04)] px-3 py-1.5 text-xs font-semibold text-[var(--axis-accent-strong)]">
                      {peer}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {isVisualMode ? (
              <>
                <section data-guide="briefing-focus" className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-[var(--axis-accent)]" />
                        <h2 className="text-2xl font-display font-semibold leading-tight text-[var(--axis-ink)]">{briefingFocusTitle}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveBriefingReasoningId('focus')}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                        aria-label={`${briefingFocusTitle} 추론 과정 보기`}
                      >
                        !
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="grid gap-4 xl:grid-cols-2">
                      {briefing.signalCards.map((item, index) => (
                        <article
                          key={item.label}
                          className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-5 shadow-[0_14px_36px_-34px_rgba(0,0,0,0.35)]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-black text-[var(--axis-accent-strong)]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <p className="text-base font-semibold text-[var(--axis-accent-strong)]">{item.label}</p>
                          </div>
                          <div className="mt-4 space-y-3">
                            <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">
                              {normalizeBriefingText(item.title)}
                            </p>
                            <p className="text-base font-medium leading-7 text-[var(--axis-body)]">
                              {normalizeBriefingText(item.summary)}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                {activeFlowStep ? (
                <section data-guide="insight-flow" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <p className="axis-kicker">Interpretation flow</p>
                        <h2 className="axis-section-heading mt-1">해석 흐름 — 관찰부터 시사까지</h2>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {briefingFlowSteps.map((step, index) => (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setActiveInsightStep(index)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left transition hover:border-[var(--axis-accent)] ${
                            activeInsightStep === index
                              ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                              : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] text-[var(--axis-body)]'
                          }`}
                          aria-pressed={activeInsightStep === index}
                        >
                          <span className="text-[11px] font-black">{String(index + 1).padStart(2, '0')}</span>
                          <span className="text-sm font-semibold">{step.label}</span>
                        </button>
                      ))}
                    </div>
                    <article className="mt-5 grid gap-5 xl:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="flex items-start xl:justify-center">
                        <div className="flex min-h-[176px] w-[128px] flex-col items-center justify-center rounded-[20px] border border-[rgba(220,90,36,0.18)] bg-[rgba(220,90,36,0.08)] px-4 py-5 text-center">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">Step</span>
                          <span className="mt-2 block text-[1.4rem] font-display font-semibold text-[var(--axis-accent-strong)]">
                            {String(activeInsightStep + 1).padStart(2, '0')}
                          </span>
                          <span className="mt-2 block text-sm font-semibold text-[var(--axis-accent-strong)]">{activeFlowStep.label}</span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-5">
                        <div className="absolute inset-y-5 left-0 w-1 rounded-full bg-[linear-gradient(180deg,var(--axis-accent),rgba(220,90,36,0.18))]" />
                        <p className="axis-kicker">{activeFlowStep.label}</p>
                        <h3 className="mt-2 text-[1.1rem] font-semibold leading-8 text-[var(--axis-ink)]">{activeFlowStep.headline}</h3>
                        <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{activeFlowStep.description}</p>
                        <div className="mt-4 grid gap-3">
                          {activeFlowStep.details.map((detail, detailIndex) => (
                            <div
                              key={`${activeFlowStep.id}-${detailIndex}`}
                              className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                            >
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                                {String(activeInsightStep + 1).padStart(2, '0')}-{detailIndex + 1}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  </div>
                </section>
                ) : null}
              </>
            ) : (
              <>
                <section data-guide="briefing-focus" className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-6 py-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-[var(--axis-accent)]" />
                        <h2 className="text-2xl font-display font-semibold leading-tight text-[var(--axis-ink)]">{briefingFocusTitle}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveBriefingReasoningId('focus')}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                        aria-label={`${briefingFocusTitle} 추론 과정 보기`}
                      >
                        !
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-3 lg:grid-cols-3">
                      {briefing.signalCards.map((item, index) => (
                        <article key={item.label} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_14px_36px_-34px_rgba(0,0,0,0.35)]">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-black text-[var(--axis-accent-strong)]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <p className="text-base font-semibold text-[var(--axis-accent-strong)]">{item.label}</p>
                          </div>
                          <div className="mt-3 space-y-2.5">
                            <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{normalizeBriefingText(item.title)}</p>
                            <p className="text-sm font-medium leading-6 text-[var(--axis-body)]">{normalizeBriefingText(item.summary)}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                {activeFlowStep ? (
                <section data-guide="insight-flow" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <p className="axis-kicker">Interpretation flow</p>
                        <h2 className="axis-section-heading mt-1">해석 흐름 — 관찰부터 시사까지</h2>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {briefingFlowSteps.map((step, index) => (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setActiveInsightStep(index)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition hover:border-[var(--axis-accent)] ${
                            activeInsightStep === index
                              ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                              : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                          }`}
                          aria-pressed={activeInsightStep === index}
                        >
                          <span className="text-[11px] font-black text-[var(--axis-accent-strong)]">{String(index + 1).padStart(2, '0')}</span>
                          <span className="text-sm font-semibold">{step.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-4">
                      <p className="axis-kicker">{activeFlowStep.label}</p>
                      <h3 className="mt-1.5 text-base font-semibold text-[var(--axis-ink)]">{activeFlowStep.headline}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{activeFlowStep.description}</p>
                      <div className="mt-4 grid gap-3">
                        {activeFlowStep.details.map((detail, detailIndex) => (
                          <div key={`${activeFlowStep.id}-${detailIndex}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                              {String(activeInsightStep + 1).padStart(2, '0')}-{detailIndex + 1}
                            </p>
                            <p className="mt-1.5 text-sm leading-6 text-[var(--axis-body)]">{detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                ) : null}
              </>
            )}
          </main>

          <aside data-guide="briefing-evidence" className="space-y-4">
            <section className="axis-panel-flat p-5">
              <p className="axis-kicker">Evidence &amp; Sources</p>
              <h2 className="axis-section-heading mt-1">판단 근거 · 출처</h2>
              <p className="mt-1.5 text-[11px] leading-5 text-[var(--axis-muted)]">
                이 브리핑이 참조한 카드뉴스 <span className="font-semibold text-[var(--axis-ink)]">{evidenceCards.length}건</span>.
                카드를 누르면 원문 출처와 함께 상세를 확인합니다.
              </p>
              <div className="mt-4 space-y-3">
                {evidenceCards.map((card, index) => {
                  const sourceName = card.sources?.[0]?.source_name ?? card.source;
                  const sourceUrl = card.sources?.[0]?.url ?? card.sourceUrl;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setDetailCardId(card.id)}
                      className="group block w-full rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:bg-[var(--axis-canvas)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--axis-accent-strong)]">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-[10px] font-black">
                            {index + 1}
                          </span>
                          {getPeerLabel(card)}
                        </span>
                        <span className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</p>
                      {sourceName ? (
                        <p className="mt-1.5 text-[11px] leading-5 text-[var(--axis-muted)]">
                          <span className="font-semibold text-[var(--axis-ink)]">출처:</span> {sourceName}
                          {sourceUrl ? <span className="ml-1 text-[var(--axis-accent-strong)]">↗</span> : null}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
      </ExecutiveContainer>

      {sharePreviewOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(8,10,14,0.66)] p-5 backdrop-blur-sm">
          <section className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[var(--axis-radius-lg)] border border-[rgba(255,255,255,0.16)] bg-[var(--axis-surface)] text-[var(--axis-ink)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.72)]">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">Report preview</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">브리핑 공유·인쇄 미리보기</h2>
              </div>
              <button
                type="button"
                onClick={() => setSharePreviewOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
                aria-label="공유 내용 닫기"
              >
                <X size={17} />
              </button>
            </header>
            <article className="min-h-0 flex-1 overflow-y-auto bg-[var(--axis-surface)] p-6 sm:p-8">
              <div className="rounded-[10px] border border-[#E8DED0] bg-[#FFFFFF] p-7 sm:p-9">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#DC5A24]">AXIS {briefing.label} briefing</p>
                <h1 className="mt-2 text-2xl font-semibold leading-tight text-[#1A1A1F]">{briefing.title}</h1>
                <p className="mt-4 text-base font-semibold leading-7 text-[#2D2D33]">{briefing.briefingLead}</p>
                <section className="mt-6 rounded-[10px] border border-[#EDE4D8] bg-[#FFFCF7] p-4">
                  <h2 className="text-base font-bold text-[#1A1A1F]">{briefingFocusTitle}</h2>
                  <div className="mt-3 space-y-3">
                    {briefing.signalCards.map((item, index) => (
                      <section key={item.label} className="rounded-[10px] border border-[#EDE4D8] bg-[#FFFFFF] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B8451A]">
                          {String(index + 1).padStart(2, '0')} {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#1A1A1F]">{item.title}</p>
                        <p className="mt-1.5 text-sm leading-6 text-[#2D2D33]">{item.summary}</p>
                      </section>
                    ))}
                  </div>
                </section>
                <section className="mt-6 rounded-[10px] border border-[#EDE4D8] bg-[#FFFCF7] p-4">
                  <h2 className="text-base font-bold text-[#1A1A1F]">해석 흐름</h2>
                  <div className="mt-3 space-y-4">
                    {briefingFlowSteps.map((step, index) => (
                      <section key={step.id} className="rounded-[10px] border border-[#EDE4D8] bg-[#FFFFFF] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B8451A]">
                          {String(index + 1).padStart(2, '0')} {step.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#1A1A1F]">{step.headline}</p>
                        <p className="mt-1.5 text-sm leading-6 text-[#2D2D33]">{step.description}</p>
                        <ol className="mt-3 space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={`${step.id}-${detailIndex}`} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-sm leading-6 text-[#2D2D33]">
                              <span className="font-bold text-[#B8451A]">{detailIndex + 1}</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ))}
                  </div>
                </section>
              </div>
            </article>
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
              <button
                type="button"
                onClick={handlePrintBriefing}
                className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-accent)]"
              >
                인쇄
              </button>
              <button
                type="button"
                onClick={handleCopyBriefing}
                className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-accent)]"
              >
                내용 복사
              </button>
              <button
                type="button"
                onClick={handleNativeShareBriefing}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] bg-[#DC5A24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B8451A]"
              >
                <Share2 size={15} />
                공유하기
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {activeBriefingReasoning ? (
        <div className="fixed inset-0 z-50 bg-[rgba(8,10,14,0.62)] p-5 backdrop-blur-sm">
          <section className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[var(--axis-radius-lg)] border border-[rgba(255,255,255,0.16)] bg-[var(--axis-surface)] text-[var(--axis-ink)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.72)]">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">AI Agent reasoning</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activeBriefingReasoning.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveBriefingReasoningId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
                aria-label="브리핑 추론 과정 닫기"
              >
                <X size={17} />
              </button>
            </header>
            <article className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)] p-4">
                <p className="text-sm font-semibold leading-7 text-[var(--axis-ink)]">{activeBriefingReasoning.summary}</p>
                <div className="mt-4 space-y-4">
                  {activeBriefingReasoning.groups.map((group) => (
                    <section key={`${activeBriefingReasoning.id}-${group.title}`} className="rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.18)] bg-[var(--axis-canvas)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-success)]">{group.title}</p>
                      <div className="mt-3 space-y-3">
                        {group.items.map((item, index) => (
                          <div key={`${activeBriefingReasoning.id}-${group.title}-${item.label}`} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-bold text-[var(--axis-success)]">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.label}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeBriefingReasoning.evidenceTags.map((item) => (
                    <ExecutiveBadge key={`${activeBriefingReasoning.id}-${item}`} tone="accent">{item}</ExecutiveBadge>
                  ))}
                </div>
              </div>
              {activeBriefingReasoning.evidenceCards.length ? (
                <div className="mt-4 grid gap-3">
                  {activeBriefingReasoning.evidenceCards.map((card) => {
                    const sourceName = card.sources?.[0]?.source_name ?? card.source;
                    return (
                      <button
                        key={`${activeBriefingReasoning.id}-${card.id}`}
                        type="button"
                        onClick={() => {
                          setActiveBriefingReasoningId(null);
                          setDetailCardId(card.id);
                          setDetailSlideIndex(0);
                        }}
                        className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-surface-soft)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-success)]">{getPeerLabel(card)}</p>
                          <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
                        </div>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{getSummaryLines(card)[0] ?? card.detailDescription ?? card.title}</p>
                        {sourceName ? (
                          <p className="mt-2 text-[11px] leading-5 text-[var(--axis-muted)]">
                            <span className="font-semibold text-[var(--axis-ink)]">출처:</span> {sourceName}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </article>
          </section>
        </div>
      ) : null}

      {detailCard ? (
        <FloatingCardNewsOverlay
          card={detailCard}
          cards={evidenceCards.length > 0 ? evidenceCards : briefing.selectedCards}
          bookmarked={bookmarkedIds.includes(detailCard.id)}
          slideIndex={detailSlideIndex}
          onSlideChange={setDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(detailCard.id)}
          onCardChange={(cardId) => {
            setDetailCardId(cardId);
            setDetailSlideIndex(0);
          }}
          onClose={() => {
            setDetailCardId(null);
            setDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
