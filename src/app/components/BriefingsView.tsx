import { type ReactNode, useMemo, useState } from 'react';
import { CalendarDays, FileText, Lightbulb, Printer, Share2, Target, TrendingUp, X } from 'lucide-react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSummaryLines,
} from '../../features/card-news/mappers/cardNewsExecutive';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutivePage,
} from './executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from './AxisPlanningViews';

type BriefingPeriod = 'daily' | 'weekly' | 'monthly';
type BriefingRange = {
  seedKey: string;
  title: string;
  window: string;
  leadLabel: string;
  displayLabel: string;
};

const periodMeta: Record<BriefingPeriod, { label: string; title: string; window: string; count: number }> = {
  daily: {
    label: '일간',
    title: '오늘 브리핑',
    window: '오늘 감지된 카드뉴스 기반',
    count: 4,
  },
  weekly: {
    label: '주간',
    title: '이번 주 브리핑',
    window: '최근 7일 경쟁사 신호 종합',
    count: 6,
  },
  monthly: {
    label: '월간',
    title: '이번 달 브리핑',
    window: '월간 AX 시장 변화 요약',
    count: 8,
  },
};

const briefingFocusTitle = '오늘의 핵심 변화';

function toDateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function toMonthInputValue(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function formatKoreanDate(value: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '');
}

function formatKoreanMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return '이번 달';
  return `${year}년 ${month}월`;
}

function getMonthNumber(value: string) {
  const month = Number(value.split('-')[1]);
  return Number.isFinite(month) && month > 0 ? month : new Date().getMonth() + 1;
}

function getWeekLabel(index: number) {
  return ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주'][index - 1] ?? `${index}주차`;
}

function getWeekOptions(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const safeYear = year || fallback.getFullYear();
  const safeMonth = month || fallback.getMonth() + 1;
  const lastDate = new Date(safeYear, safeMonth, 0).getDate();
  const weekCount = Math.ceil(lastDate / 7);

  return Array.from({ length: weekCount }, (_, index) => {
    const week = index + 1;
    const startDay = index * 7 + 1;
    const endDay = Math.min(lastDate, startDay + 6);
    const monthLabel = `${safeMonth}월`;
    return {
      value: week,
      label: `${monthLabel} ${getWeekLabel(week)}`,
      range: `${safeYear}.${String(safeMonth).padStart(2, '0')}.${String(startDay).padStart(2, '0')} - ${String(safeMonth).padStart(2, '0')}.${String(endDay).padStart(2, '0')}`,
    };
  });
}

function buildBriefingRange(period: BriefingPeriod, dailyDate: string, weeklyMonth: string, weekIndex: number, monthlyMonth: string): BriefingRange {
  if (period === 'daily') {
    const dateLabel = formatKoreanDate(dailyDate);
    return {
      seedKey: `daily-${dailyDate}`,
      title: `${dateLabel} 일간 브리핑`,
      window: `${dateLabel} 감지 카드뉴스 기반`,
      leadLabel: dateLabel,
      displayLabel: dateLabel,
    };
  }

  if (period === 'weekly') {
    const month = getMonthNumber(weeklyMonth);
    const weekOptions = getWeekOptions(weeklyMonth);
    const selectedWeek = weekOptions.find((item) => item.value === weekIndex) ?? weekOptions[0];
    const label = selectedWeek?.label ?? `${month}월 ${getWeekLabel(1)}`;
    const range = selectedWeek?.range ?? formatKoreanMonth(weeklyMonth);
    return {
      seedKey: `weekly-${weeklyMonth}-${selectedWeek?.value ?? 1}`,
      title: `${label} 브리핑`,
      window: `${label} 카드뉴스 종합 · ${range}`,
      leadLabel: label,
      displayLabel: label,
    };
  }

  const monthLabel = formatKoreanMonth(monthlyMonth);
  return {
    seedKey: `monthly-${monthlyMonth}`,
    title: `${monthLabel} 브리핑`,
    window: `${monthLabel} 카드뉴스 종합`,
    leadLabel: monthLabel,
    displayLabel: monthLabel,
  };
}

function rotateCardsByKey(cards: CardNewsItem[], seedKey: string) {
  if (cards.length === 0) return cards;
  const seed = Array.from(seedKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const offset = seed % cards.length;
  return [...cards.slice(offset), ...cards.slice(0, offset)];
}

function buildBriefing(period: BriefingPeriod, cards: CardNewsItem[], range: BriefingRange) {
  const meta = periodMeta[period];
  const selectedCards = rotateCardsByKey(cards, range.seedKey).slice(0, meta.count);
  const peers = Array.from(new Set(selectedCards.map((card) => getPeerLabel(card)))).filter(Boolean);
  const topCard = selectedCards[0];
  const headlinePeer = topCard ? getPeerLabel(topCard) : 'Peer사';
  const summaryLine = topCard
    ? getSummaryLines(topCard)[0]
    : 'Peer사의 AX 전환, 수주, 인프라 투자 신호를 하나의 브리핑 흐름으로 정리합니다.';
  const categories = Array.from(new Set(selectedCards.map((card) => card.category_label ?? card.category).filter(Boolean))).slice(0, 5);
  const peerLabel = peers.length > 1 ? `${peers.slice(0, 3).join(', ')} 등` : peers[0] ?? 'Peer사';
  const periodLabel = range.leadLabel;

  return {
    ...meta,
    title: range.title,
    window: range.window,
    selectedCards,
    peers,
    headline:
      period === 'daily'
        ? `오늘은 ${headlinePeer} 중심의 수주/AX 신호가 가장 먼저 검토됩니다.`
        : period === 'weekly'
          ? '이번 주는 AX 패키지 상품화, 공공 수주, AI 인프라 투자가 같은 방향으로 묶입니다.'
          : '이번 달은 PoC 경쟁보다 운영 확산과 고객 레퍼런스 확보 경쟁이 더 중요해졌습니다.',
    briefingLead: `${periodLabel} 감지된 카드뉴스 ${selectedCards.length}건을 종합하면, ${peerLabel}의 공개 신호는 “기술 발표”보다 “수주·운영 확산·AI 인프라 내재화” 쪽으로 묶입니다.`,
    whatHappenedDigest: [
      `${periodLabel}의 핵심 변화는 AX가 PoC 검증을 넘어 실제 운영, 수주, 인프라 투자로 이동하고 있다는 점입니다.`,
      `${peerLabel}에서 반복적으로 나타난 표현은 ${categories.join(', ') || 'AX, 수주, 인프라'}이며, 단일 뉴스보다 경쟁사의 사업 메시지 방향이 함께 움직인다는 점이 중요합니다.`,
      '따라서 SK AX 관점에서는 개별 기사 대응보다 고객 산업별 제안 문장, IR 근거, 벤치마킹 포인트를 한 묶음으로 정리하는 것이 더 유효합니다.',
    ],
    signalCards: [
      {
        label: '시장 신호',
        value: `${categories.slice(0, 3).join(' · ') || 'AX · 수주 · 인프라'} 키워드가 같은 흐름으로 반복됩니다.`,
        metric: `${selectedCards.length}건 종합`,
      },
      {
        label: '경쟁사 움직임',
        value: `${peerLabel}의 메시지가 운영형 AI, 공공/제조 수주, 클라우드 인프라 근거로 수렴합니다.`,
        metric: `${peers.length || 1}개 Peer`,
      },
      {
        label: 'SK AX 해석',
        value: '기능 소개보다 고객 KPI, 안정성, 보안 거버넌스를 먼저 보여주는 보고서형 제안이 필요합니다.',
        metric: '대응 우선',
      },
    ],
    whatHappened: selectedCards.slice(0, period === 'daily' ? 4 : 6).map((card) => {
      const summaryLines = getSummaryLines(card);
      return {
        peer: getPeerLabel(card),
        title: card.title,
        date: getDisplayDate(card),
        summary: summaryLines[0] ?? card.detailDescription,
        context: summaryLines[1] ?? card.detailDescription ?? '공개된 카드뉴스와 IR 신호를 함께 보면 단기 이슈보다 고객 제안 방향의 변화로 읽힙니다.',
        implication: card.insights?.[0] ?? 'Peer사의 메시지는 기술 발표에서 고객 업무 성과와 운영 안정성 중심으로 이동하고 있습니다.',
        action: card.actionItems?.[0] ?? card.detailPoints?.[0] ?? 'SK AX는 고객 산업별 KPI와 운영 전환 근거를 먼저 제시하는 방식으로 대응해야 합니다.',
      };
    }),
    meaning: [
      summaryLine,
      '경쟁사 메시지는 단일 기술 발표보다 “운영 지표로 증명되는 AX 전환” 쪽으로 이동하고 있습니다.',
      'IR 숫자, 카드뉴스 노출, 수주 발표가 동시에 움직일 때 실제 고객 제안의 우선순위가 바뀝니다.',
    ],
    response: [
      'SK AX 제안서는 기술 기능 설명보다 고객 업무 KPI, 안정성, 보안 거버넌스를 먼저 보여줘야 합니다.',
      '산업별 카드뉴스 묶음을 고객 미팅 전 브리핑 자료로 재조합해 빠른 제안 문장으로 전환합니다.',
      'Peer사가 공개한 강점은 벤치마킹하되, SK AX는 운영 전환 이후 관리 체계를 차별 포인트로 잡습니다.',
    ],
    benchmark: [
      `${peers[0] ?? '삼성SDS'}의 공개 레퍼런스 표현 방식`,
      `${peers[1] ?? 'LG CNS'}의 AX 패키지화 메시지`,
      '포스코DX/현대오토에버의 산업 특화 인프라·제조 데이터 강조 방식',
    ],
    ideas: [
      '고객별 “오늘의 AX 변화 3줄 브리핑”을 자동 생성해 영업 회의 전 배포합니다.',
      '카드뉴스와 키워드 그래프를 연결해 경쟁사가 선점한 키워드와 SK AX의 대응 메시지를 함께 보여줍니다.',
      period === 'monthly'
        ? '월간 리더십 보고에는 수주/IR/카드뉴스 노출을 하나의 레이더 점수로 통합합니다.'
        : '일간/주간 브리핑에는 다음 미팅에서 바로 쓸 수 있는 질문 3개를 함께 붙입니다.',
    ],
  };
}

function buildBriefingReportText(briefing: ReturnType<typeof buildBriefing>) {
  return [
    `[AXIS ${briefing.label} 브리핑] ${briefing.title}`,
    '',
    '1. Executive Summary',
    briefing.briefingLead,
    '',
    `2. ${briefingFocusTitle}`,
    ...briefing.whatHappenedDigest.map((item, index) => `${index + 1}) ${item}`),
    '',
    '3. 의미와 시사점',
    ...briefing.meaning.map((item, index) => `${index + 1}) ${item}`),
    '',
    '4. SK AX 대응 방향',
    ...briefing.response.map((item, index) => `${index + 1}) ${item}`),
    '',
    '5. 벤치마킹 포인트',
    ...briefing.benchmark.map((item, index) => `${index + 1}) ${item}`),
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPrintSection(title: string, items: string[]) {
  return `
    <section class="report-section">
      <h2>${escapeHtml(title)}</h2>
      <ol>
        ${items.map((item, index) => `<li><strong>${index + 1}</strong><span>${escapeHtml(item)}</span></li>`).join('')}
      </ol>
    </section>
  `;
}

function buildBriefingPrintHtml(briefing: ReturnType<typeof buildBriefing>) {
  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(briefing.title)}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #f7f1e8;
          color: #1a1a1f;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .page {
          min-height: 100vh;
          background: #ffffff;
          border: 1px solid #eadfce;
          padding: 32px;
        }
        .kicker {
          color: #dc5a24;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        h1 {
          margin: 10px 0 0;
          font-size: 30px;
          line-height: 1.18;
          letter-spacing: -0.04em;
        }
        .lead {
          margin: 18px 0 0;
          padding: 18px;
          border: 1px solid #eadfce;
          border-left: 5px solid #dc5a24;
          border-radius: 10px;
          background: #fff8ef;
          font-size: 16px;
          font-weight: 650;
          line-height: 1.75;
        }
        .report-section {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #eadfce;
        }
        .report-section h2 {
          margin: 0;
          font-size: 17px;
          letter-spacing: -0.02em;
        }
        ol {
          display: grid;
          gap: 9px;
          margin: 14px 0 0;
          padding: 0;
          list-style: none;
        }
        li {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 9px;
          padding: 11px 12px;
          border: 1px solid #efe5d9;
          border-radius: 9px;
          background: #fffdf9;
          font-size: 13px;
          line-height: 1.65;
        }
        li strong { color: #b8451a; }
        .footer {
          margin-top: 28px;
          color: #77706a;
          font-size: 11px;
          text-align: right;
        }
        @media print {
          body { background: #ffffff; }
          .page { border: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <p class="kicker">AXIS ${escapeHtml(briefing.label)} briefing</p>
        <h1>${escapeHtml(briefing.title)}</h1>
        <p class="lead">${escapeHtml(briefing.briefingLead)}</p>
        ${renderPrintSection(briefingFocusTitle, briefing.whatHappenedDigest)}
        ${renderPrintSection('의미와 시사점', briefing.meaning)}
        ${renderPrintSection('SK AX 대응 방향', briefing.response)}
        ${renderPrintSection('벤치마킹 포인트', briefing.benchmark)}
        <p class="footer">AXIS 브리핑 리포트 · ${escapeHtml(briefing.window)}</p>
      </main>
    </body>
  </html>`;
}

export function BriefingsView() {
  const { cards, isLoading, error } = useCardNews();
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
          <div className="relative">
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
          <div className="flex flex-wrap gap-2">
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

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-5">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  {briefing.peers.slice(0, 4).map((peer) => (
                    <ExecutiveBadge key={peer} tone="accent">{peer}</ExecutiveBadge>
                  ))}
                </div>
              </div>
            </section>

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
                    <div className="flex items-center justify-between gap-3">
                      <p className="axis-kicker">{String(index + 1).padStart(2, '0')} · {item.label}</p>
                      <ExecutiveBadge tone="accent">{item.metric}</ExecutiveBadge>
                    </div>
                    <p className="mt-3 text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.value}</p>
                  </article>
                ))}
              </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <BriefingBlock icon={<Lightbulb size={18} />} title="의미와 시사점" items={briefing.meaning} />
              <BriefingBlock icon={<Target size={18} />} title="SK AX 대응 방향" items={briefing.response} />
              <BriefingBlock icon={<FileText size={18} />} title="벤치마킹 포인트" items={briefing.benchmark} />
              <BriefingBlock icon={<Lightbulb size={18} />} title="제안 아이디어" items={briefing.ideas} highlight />
            </section>
          </main>

          <aside className="space-y-4">
            <section className="axis-panel-flat p-5">
              <p className="axis-kicker">Briefing queue</p>
              <h2 className="axis-section-heading mt-1">근거 카드뉴스</h2>
              <div className="mt-4 space-y-3">
                {briefing.selectedCards.slice(0, 6).map((card) => (
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
                  ['의미와 시사점', briefing.meaning],
                  ['SK AX 대응 방향', briefing.response],
                  ['벤치마킹 포인트', briefing.benchmark],
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

function BriefingBlock({
  icon,
  title,
  items,
  highlight = false,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  highlight?: boolean;
}) {
  return (
    <section className={`axis-panel-flat overflow-hidden ${highlight ? 'border-[rgba(220,90,36,0.32)] bg-[rgba(220,90,36,0.05)]' : 'border-[rgba(120,110,96,0.24)]'}`}>
      <div className={`flex items-center gap-2 border-b border-[var(--axis-hairline)] px-5 py-4 ${
        highlight ? 'bg-[rgba(220,90,36,0.10)]' : 'bg-[var(--axis-surface-muted)]'
      }`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
          {icon}
        </span>
        <h2 className="axis-section-heading text-[var(--axis-ink)]">{title}</h2>
      </div>
      <div className="space-y-3 p-5">
        {items.map((item, index) => (
          <div key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.11)] text-sm font-semibold text-[var(--axis-accent-strong)]">
              {index + 1}
            </span>
            <p className="text-base font-medium leading-7 text-[var(--axis-body)]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
