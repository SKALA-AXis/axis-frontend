import { useMemo, useState } from 'react';
import { CalendarDays, FileText, Lightbulb, Share2, TrendingUp, X } from 'lucide-react';

import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { getDisplayDate, getExecutiveRank, getPeerLabel } from '../../../../features/card-news/mappers/cardNewsExecutive';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { useContentViewMode } from '../../../../shared/hooks/useContentViewMode';
import { BriefingBlock, BriefingVisualBlock } from './BriefingBlocks';
import { buildBriefingPrintHtml, buildBriefingReportText } from './print';
import type { BriefingPeriod } from './types';
import {
  briefingFocusTitle,
  buildBriefing,
  buildBriefingRange,
  formatInsightItems,
  getWeekOptions,
  periodMeta,
  toDateInputValue,
  toMonthInputValue,
} from './utils';

export function BriefingsView() {
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

  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const weeklyOptions = useMemo(() => getWeekOptions(weeklyMonth), [weeklyMonth]);
  const briefingRange = useMemo(
    () => buildBriefingRange(period, dailyDate, weeklyMonth, weeklyIndex, monthlyMonth),
    [dailyDate, monthlyMonth, period, weeklyIndex, weeklyMonth],
  );
  const briefing = useMemo(() => buildBriefing(period, rankedCards, briefingRange), [period, rankedCards, briefingRange]);
  const reportText = useMemo(() => buildBriefingReportText(briefing), [briefing]);
  const detailCard = detailCardId ? cards.find((card) => card.id === detailCardId) ?? null : null;
  const isVisualMode = contentViewMode === 'visual';
  const evidenceCards = briefing.selectedCards
    .filter((card) => briefing.signalCards.some((signal) => signal.relatedCardIds.includes(card.id)))
    .slice(0, 6);

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
                <section className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} className="text-[var(--axis-accent)]" />
                      <h2 className="text-2xl font-display font-semibold leading-tight text-[var(--axis-ink)]">{briefingFocusTitle}</h2>
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

                <section className="space-y-5">
                  <BriefingVisualBlock icon={<Lightbulb size={18} />} title="의미와 시사점" items={briefing.meaning} />
                  <BriefingVisualBlock icon={<FileText size={18} />} title="벤치마킹 포인트" items={briefing.benchmark} />
                </section>
              </>
            ) : (
              <>
                <section className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-6 py-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={20} className="text-[var(--axis-accent)]" />
                        <h2 className="text-2xl font-display font-semibold leading-tight text-[var(--axis-ink)]">{briefingFocusTitle}</h2>
                      </div>
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

                <section className="space-y-5">
                  <BriefingBlock icon={<Lightbulb size={18} />} title="의미와 시사점" items={briefing.meaning} />
                  <BriefingBlock icon={<FileText size={18} />} title="벤치마킹 포인트" items={briefing.benchmark} />
                </section>
              </>
            )}
          </main>

          <aside data-guide="briefing-evidence" className="space-y-4">
            <section className="axis-panel-flat p-5">
              <p className="axis-kicker">Briefing queue</p>
              <h2 className="axis-section-heading mt-1">근거 카드뉴스</h2>
              <div className="mt-4 space-y-3">
                {evidenceCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setDetailCardId(card.id)}
                    className="block w-full rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:bg-[var(--axis-canvas)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</span>
                      <span className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</p>
                  </button>
                ))}
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
                {[
                  [briefingFocusTitle, briefing.whatHappenedDigest],
                  ['의미와 시사점', formatInsightItems(briefing.meaning)],
                  ['벤치마킹 포인트', formatInsightItems(briefing.benchmark)],
                ].map(([title, items]) => (
                  <section key={title as string} className="mt-6 rounded-[10px] border border-[#EDE4D8] bg-[#FFFCF7] p-4">
                    <h2 className="text-base font-bold text-[#1A1A1F]">{title as string}</h2>
                    <ol className="mt-3 space-y-2">
                      {(items as string[]).map((item, index) => (
                        <li key={item} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-sm leading-6 text-[#2D2D33]">
                          <span className="font-bold text-[#B8451A]">{index + 1}</span>
                          <span>{item}</span>
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

      {detailCard ? (
        <FloatingCardNewsOverlay
          card={detailCard}
          bookmarked={false}
          slideIndex={detailSlideIndex}
          onSlideChange={setDetailSlideIndex}
          onBookmark={() => undefined}
          onClose={() => {
            setDetailCardId(null);
            setDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
