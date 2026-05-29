import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Share2, Sparkles, TrendingUp, X } from 'lucide-react';

import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { mockInsightResult } from '../../../../shared/mocks/insight';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { useContentViewMode } from '../../../../shared/hooks/useContentViewMode';
import { buildBriefingPrintHtml, buildBriefingReportText } from './print';
import type { BriefingPeriod } from './types';
import {
  briefingFocusTitle,
  buildBriefing,
  buildBriefingRange,
  getWeekOptions,
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
};

export function BriefingsView({ bookmarkedIds = [], onToggleBookmark, onUpdateTimeChange }: BriefingsViewProps) {
  const { cards, isLoading, error } = useCardNews();
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
  const [activeBriefingReasoningId, setActiveBriefingReasoningId] = useState<'focus' | 'market' | 'skax' | null>(null);
  const activeFlowStep = mockInsightResult.flowSteps[activeInsightStep] ?? mockInsightResult.flowSteps[0];

  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const weeklyOptions = useMemo(() => getWeekOptions(weeklyMonth), [weeklyMonth]);
  const briefingRange = useMemo(
    () => buildBriefingRange(period, dailyDate, weeklyMonth, weeklyIndex, monthlyMonth),
    [dailyDate, monthlyMonth, period, weeklyIndex, weeklyMonth],
  );

  useEffect(() => {
    if (isLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, isLoading, onUpdateTimeChange]);
  const briefing = useMemo(() => buildBriefing(period, rankedCards, briefingRange), [period, rankedCards, briefingRange]);
  const reportText = useMemo(() => buildBriefingReportText(briefing), [briefing]);
  const detailCard = detailCardId ? cards.find((card) => card.id === detailCardId) ?? null : null;
  const isVisualMode = contentViewMode === 'visual';
  const evidenceCards = briefing.selectedCards
    .filter((card) => briefing.signalCards.some((signal) => signal.relatedCardIds.includes(card.id)))
    .slice(0, 6);
  const getSupportingCards = (startIndex: number, count = 3) => {
    if (briefing.selectedCards.length === 0) return [] as CardNewsItem[];
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
  const briefingReasoningSections = useMemo<Record<'focus' | 'market' | 'skax', BriefingReasoningModal>>(() => {
    const focusEvidenceCards = briefing.signalCards.flatMap((item, index) => {
      const relatedCards = briefing.selectedCards
        .filter((card) => item.relatedCardIds.includes(card.id))
        .slice(0, 3);
      return relatedCards.length ? relatedCards : getSupportingCards(index, 2);
    }).filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index).slice(0, 6);
    const analysisEvidenceCards = [0, 1, 2, 3]
      .flatMap((index) => getSupportingCards(index, 2))
      .filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index)
      .slice(0, 6);

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
            items: mockInsightResult.flowSteps.map((step, index) => ({
              label: `${String(index + 1).padStart(2, '0')} · ${step.label}`,
              body: `${step.headline} 이 단계에서 에이전트는 ${step.description}`,
            })),
          },
        ],
        evidenceTags: buildEvidenceTags(focusEvidenceCards, [briefing.label, briefingFocusTitle]),
        evidenceCards: focusEvidenceCards,
      },
      market: {
        id: 'market',
        title: '시장 해석 포인트 추론 과정',
        summary: '시장 해석 에이전트가 반복 신호를 어떤 순서로 교차 검토하고, 어떤 문장을 시장 판단으로 압축했는지 보여줍니다.',
        groups: [
          {
            title: '시장 해석 에이전트의 판단 메모',
            items: mockInsightResult.problemChain.map((item) => ({
              label: item.title,
              body: `에이전트 판단: ${item.body} 근거 연결: ${item.reason}`,
            })),
          },
        ],
        evidenceTags: buildEvidenceTags(analysisEvidenceCards, [briefing.label, '시장 해석']),
        evidenceCards: analysisEvidenceCards,
      },
      skax: {
        id: 'skax',
        title: 'SK AX 시사점 추론 과정',
        summary: '대응 전략 에이전트가 시장 신호를 SK AX 실행 문장으로 어떻게 번역했는지 보여줍니다.',
        groups: [
          {
            title: '전략 에이전트의 대응 포인트 정리',
            items: mockInsightResult.solutionChain.map((item) => ({
              label: item.title,
              body: `에이전트 제안: ${item.body} 판단 근거: ${item.reason}`,
            })),
          },
        ],
        evidenceTags: buildEvidenceTags(analysisEvidenceCards, [briefing.label, 'SK AX 시사점']),
        evidenceCards: analysisEvidenceCards,
      },
    };
  }, [briefing.label, briefing.selectedCards, briefing.signalCards]);
  const activeBriefingReasoning = activeBriefingReasoningId ? briefingReasoningSections[activeBriefingReasoningId] : null;

  const handleShareBriefing = async () => {
    setSharePreviewOpen(true);
    setShareFeedback('');
  };

  const handleCopyBriefing = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setShareFeedback('공유용 브리핑 내용을 클립보드에 복사했습니다.');
    } catch {
      setShareFeedback('브리핑 공유를 처리하지 못했습니다.');
    }
  };

  const handleNativeShareBriefing = async () => {
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
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      setShareFeedback('인쇄 창을 열지 못했습니다.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildBriefingPrintHtml(briefing));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 180);
  };

  if (isLoading) {
    return <ExecutivePage className="p-6 text-sm text-[var(--axis-muted)]">브리핑을 불러오는 중입니다.</ExecutivePage>;
  }

  if (error) {
    return <ExecutivePage className="p-6 text-sm text-[var(--axis-muted)]">{error}</ExecutivePage>;
  }

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12 pt-3">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="sr-only">브리핑</h1>
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
                      onChange={(event) => setDailyDate(event.target.value)}
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
                        onChange={(event) => {
                          setWeeklyMonth(event.target.value);
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
                          <option key={option.value} value={option.value}>{option.label}</option>
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
                      onChange={(event) => setMonthlyMonth(event.target.value)}
                      className="min-w-0 bg-transparent text-right text-sm font-semibold text-[var(--axis-ink)] outline-none"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
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
            <section className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.24)]">
              <div className="h-1.5 bg-[linear-gradient(90deg,var(--axis-accent),rgba(220,90,36,0.16))]" />
              <div className="p-5">
                <p className="axis-kicker">{briefing.window}</p>
                <h2 className="mt-2 text-2xl font-display font-semibold leading-tight text-[var(--axis-ink)]">
                  {briefing.title}
                </h2>
                <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-[var(--axis-ink)]">
                  {briefing.briefingLead}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">
                  {briefing.briefingSummaryLine}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {briefing.peers.slice(0, 4).map((peer) => (
                    <ExecutiveBadge key={peer} tone="accent">{peer}</ExecutiveBadge>
                  ))}
                </div>
              </div>
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
                    <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.30)] bg-[radial-gradient(circle_at_18%_20%,rgba(220,90,36,0.16),transparent_32%),rgba(220,90,36,0.08)] p-5 shadow-[0_18px_48px_-38px_rgba(220,90,36,0.35)]">
                      <p className="axis-kicker">Core change</p>
                      <p className="mt-3 text-xl font-semibold leading-8 text-[var(--axis-ink)]">{briefing.whatHappenedDigest[0]}</p>
                      <p className="mt-3 text-base leading-7 text-[var(--axis-body)]">{briefing.whatHappenedDigest[2]}</p>
                    </div>
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
                            <div>
                              <p className="axis-kicker">{item.label}</p>
                              <h3 className="mt-1 text-lg font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</h3>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p>
                          <div className="mt-4 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                            <p className="text-xs font-semibold text-[var(--axis-muted)]">왜 이 변화가 중요한가</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-body)]">{item.reason}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 핵심 판단 — 4단계 flow narrative (관찰→패턴→시사→핵심). 헤드라인 summary 는 lead 와 중복이라 제거. */}
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
                      {mockInsightResult.flowSteps.map((step, index) => (
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
                        <div className="rounded-[20px] border border-[rgba(220,90,36,0.18)] bg-[rgba(220,90,36,0.08)] px-4 py-5 text-center">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">Step</span>
                          <span className="mt-1.5 block text-[1.7rem] font-display font-semibold text-[var(--axis-ink)]">
                            {String(activeInsightStep + 1).padStart(2, '0')}
                          </span>
                          <span className="mt-1.5 block text-xs font-semibold text-[var(--axis-body)]">{activeFlowStep.label}</span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-5">
                        <div className="absolute inset-y-5 left-0 w-1 rounded-full bg-[linear-gradient(180deg,var(--axis-accent),rgba(220,90,36,0.18))]" />
                        <p className="axis-kicker">{activeFlowStep.label}</p>
                        <h3 className="mt-2 text-[1.1rem] font-semibold leading-8 text-[var(--axis-ink)]">{activeFlowStep.headline}</h3>
                        <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{activeFlowStep.description}</p>
                      </div>
                    </article>
                  </div>
                </section>

                <section data-guide="insight-analysis">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  {[
                    { title: '시장 해석 포인트', label: 'Market reading', items: mockInsightResult.problemChain, tone: 'success' as const },
                    { title: 'SK AX 시사점', label: 'SK AX view', items: mockInsightResult.solutionChain, tone: 'accent' as const },
                  ].map((group) => (
                    <section key={group.title} className="axis-panel-flat overflow-hidden">
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="axis-kicker">{group.label}</p>
                            <h2 className="axis-section-heading mt-1">{group.title}</h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveBriefingReasoningId(group.tone === 'success' ? 'market' : 'skax')}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                            aria-label={`${group.title} 추론 과정 보기`}
                          >
                            !
                          </button>
                        </div>
                      </div>
                      <div className="space-y-5 p-5">
                        {group.items.map((item, index) => (
                          <article
                            key={item.title}
                            className="grid gap-3 border-b border-[rgba(26,26,31,0.08)] pb-5 last:border-b-0 last:pb-0 md:grid-cols-[52px_minmax(0,1fr)]"
                          >
                            <div className="flex items-start">
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                  group.tone === 'success'
                                    ? 'bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                                    : 'bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                                }`}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-[1.02rem] font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
                              <p className="mt-3 text-[12px] leading-5 text-[var(--axis-muted)]">이렇게 읽는 이유: {item.reason}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                  </div>
                </section>
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
                    <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.30)] bg-[rgba(220,90,36,0.08)] p-5 shadow-[0_18px_48px_-38px_rgba(220,90,36,0.35)]">
                      <p className="text-xl font-semibold leading-8 text-[var(--axis-ink)]">{briefing.whatHappenedDigest[0]}</p>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {briefing.whatHappenedDigest.slice(1).map((item) => (
                          <p key={item} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/92 p-4 text-base font-medium leading-7 text-[var(--axis-body)]">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      {briefing.signalCards.map((item, index) => (
                        <article key={item.label} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_14px_36px_-34px_rgba(0,0,0,0.35)]">
                          <p className="axis-kicker">{String(index + 1).padStart(2, '0')} · {item.label}</p>
                          <p className="mt-3 text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 핵심 판단 — flowSteps 컴팩트 (텍스트 모드). summary/focusQuestion 은 lead 와 중복이라 제거. */}
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
                      {mockInsightResult.flowSteps.map((step, index) => (
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
                    </div>
                  </div>
                </section>

                <section data-guide="insight-analysis">
                  <div className="grid gap-5 lg:grid-cols-2">
                  <div className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                    <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="axis-kicker">Market reading</p>
                          <h2 className="axis-section-heading mt-1">시장 해석 포인트</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveBriefingReasoningId('market')}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                          aria-label="시장 해석 포인트 추론 과정 보기"
                        >
                          !
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-4 p-5">
                      {mockInsightResult.problemChain.map((item, index) => (
                        <li key={item.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-[rgba(26,26,31,0.08)] pb-4 last:border-b-0 last:pb-0">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-semibold text-[var(--axis-success)]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</p>
                            <p className="mt-1 text-base leading-7 text-[var(--axis-body)]">{item.body}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">이렇게 읽는 이유: {item.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.28)]">
                    <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.07)] px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="axis-kicker">SK AX view</p>
                          <h2 className="axis-section-heading mt-1">SK AX 시사점</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveBriefingReasoningId('skax')}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                          aria-label="SK AX 시사점 추론 과정 보기"
                        >
                          !
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-4 p-5">
                      {mockInsightResult.solutionChain.map((item, index) => (
                        <li key={item.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-[rgba(26,26,31,0.08)] pb-4 last:border-b-0 last:pb-0">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(220,90,36,0.11)] text-xs font-semibold text-[var(--axis-accent-strong)]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</p>
                            <p className="mt-1 text-base leading-7 text-[var(--axis-body)]">{item.body}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">이렇게 읽는 이유: {item.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  </div>
                </section>
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
            <article className="min-h-0 flex-1 overflow-y-auto bg-[var(--axis-surface)] p-6">
              <div className="rounded-[10px] border border-[#E8DED0] bg-[#FFFFFF] p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#DC5A24]">AXIS {briefing.label} briefing</p>
                <h1 className="mt-2 text-2xl font-semibold leading-tight text-[#1A1A1F]">{briefing.title}</h1>
                <p className="mt-4 text-base font-semibold leading-7 text-[#2D2D33]">{briefing.briefingLead}</p>
                <section className="mt-6 rounded-[10px] border border-[#EDE4D8] bg-[#FFFCF7] p-4">
                  <h2 className="text-base font-bold text-[#1A1A1F]">{briefingFocusTitle}</h2>
                  <ol className="mt-3 space-y-2">
                    {briefing.whatHappenedDigest.map((item, index) => (
                      <li key={item} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-sm leading-6 text-[#2D2D33]">
                        <span className="font-bold text-[#B8451A]">{index + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </section>
                {[
                  { title: '시장 해석 포인트', items: mockInsightResult.problemChain },
                  { title: 'SK AX 시사점', items: mockInsightResult.solutionChain },
                ].map((group) => (
                  <section key={group.title} className="mt-6 rounded-[10px] border border-[#EDE4D8] bg-[#FFFCF7] p-4">
                    <h2 className="text-base font-bold text-[#1A1A1F]">{group.title}</h2>
                    <ol className="mt-3 space-y-3">
                      {group.items.map((item, index) => (
                        <li key={item.title} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-sm leading-6 text-[#2D2D33]">
                          <span className="font-bold text-[#B8451A]">{index + 1}</span>
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="mt-1">{item.body}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
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
