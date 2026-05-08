import { type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bookmark,
  Box,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Filter,
  LineChart as LineChartIcon,
  Maximize2,
  Minus,
  Network,
  Plus,
  Radar,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RadarShape,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as THREE from 'three';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import { buildCardCatalog, buildMixerCards } from '../../features/card-news/mappers/cardNewsPresentation';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSummaryLines,
} from '../../features/card-news/mappers/cardNewsExecutive';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import type { DashboardKeywordSearchPoint } from '../../features/dashboard/model/dashboard';
import { mockMixerConfig } from '../../shared/mocks/mixer';
import { mockPeerPlusIrProfiles, mockPeerPlusKeywordCloud, mockPeerPlusOptions, peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../shared/mocks/peerPlus';
import { FloatingAiChat } from './FloatingAiChat';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from './executive/ExecutiveSystem';

type NavigateHandler = (view: string) => void;

const peerColors = [
  'var(--axis-graph-ax)',
  'var(--axis-graph-infra)',
  'var(--axis-graph-deal)',
  'var(--axis-graph-security)',
  'var(--axis-graph-company)',
];

function LoadingBlock({ label }: { label: string }) {
  return (
    <ExecutivePage className="flex min-h-full items-center justify-center p-6 text-sm text-[var(--axis-muted)]">
      {label}
    </ExecutivePage>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="axis-panel-flat p-8 text-center text-sm text-[var(--axis-muted)]">
      {label}
    </div>
  );
}

async function shareCardNews(card: CardNewsItem) {
  const text = `${card.title}\n${getSummaryLines(card).join('\n')}\n${card.sourceUrl}`;
  if (navigator.share) {
    await navigator.share({ title: card.title, text, url: card.sourceUrl });
    return '공유를 열었습니다.';
  }
  await navigator.clipboard.writeText(text);
  return '카드뉴스 링크를 복사했습니다.';
}

export { shareCardNews };

function FilterChip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-[rgba(90,107,87,0.28)] bg-[rgba(90,107,87,0.12)] text-[var(--axis-success)]'
          : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{value}</p>
    </div>
  );
}

function ChartButton({
  title,
  helper,
  icon,
  onClick,
  children,
  controls,
}: {
  title: string;
  helper: string;
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
  controls?: ReactNode;
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="axis-panel-flat min-h-[250px] cursor-pointer p-4 text-left transition hover:border-[var(--axis-accent)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="axis-kicker">{helper}</p>
          <h3 className="axis-section-heading mt-1">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {controls}
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-[var(--axis-accent)]">
            {icon}
          </span>
        </div>
      </div>
      <div className="h-[170px]">{children}</div>
    </div>
  );
}

type DonutCalloutDatum = {
  name: string;
  value: number;
  color: string;
};

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function donutArcPath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, endAngle);
  const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
  const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function DonutCalloutChart({ data }: { data: DonutCalloutDatum[] }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  let cursor = -Math.PI / 2;
  const cx = 180;
  const cy = 118;
  const outerRadius = 68;
  const innerRadius = 26;
  const segments = data.map((item, index) => {
    const startAngle = cursor;
    const angle = (item.value / total) * Math.PI * 2;
    cursor += angle;
    const endAngle = cursor;
    const midAngle = startAngle + angle / 2;
    const side = Math.cos(midAngle) >= 0 ? 'right' : 'left';
    const anchor = polarPoint(cx, cy, outerRadius + 2, midAngle);
    const elbow = polarPoint(cx, cy, outerRadius + 18, midAngle);
    const y = Math.min(202, Math.max(28, elbow.y + (index % 2 === 0 ? -2 : 8)));
    const labelX = side === 'right' ? 300 : 60;
    const lineEndX = side === 'right' ? labelX - 24 : labelX + 24;
    return {
      ...item,
      startAngle,
      endAngle,
      anchor,
      elbow: { ...elbow, y },
      labelX,
      lineEndX,
      side,
      percentage: Math.round((item.value / total) * 100),
    };
  });

  return (
    <svg viewBox="0 0 360 236" className="h-full w-full overflow-visible" role="img" aria-label="선택 비율 도넛 차트">
      <g>
        {segments.map((item) => (
          <path
            key={item.name}
            d={donutArcPath(cx, cy, innerRadius, outerRadius, item.startAngle, item.endAngle)}
            fill={item.color}
            opacity="0.9"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={innerRadius - 1} fill="var(--axis-canvas)" />
      {segments.map((item) => (
        <g key={`label-${item.name}`}>
          <path
            d={`M ${item.anchor.x} ${item.anchor.y} L ${item.elbow.x} ${item.elbow.y} L ${item.lineEndX} ${item.elbow.y}`}
            fill="none"
            stroke="var(--axis-muted)"
            strokeOpacity="0.72"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x={item.labelX}
            y={item.elbow.y - 4}
            textAnchor={item.side === 'right' ? 'end' : 'start'}
            className="fill-[var(--axis-ink)] text-[13px] font-bold"
          >
            {item.name}
          </text>
          <text
            x={item.labelX}
            y={item.elbow.y + 14}
            textAnchor={item.side === 'right' ? 'end' : 'start'}
            className="fill-[var(--axis-muted)] text-[12px] font-semibold"
          >
            {item.value} · {item.percentage}%
          </text>
        </g>
      ))}
    </svg>
  );
}

function GraphifyPreview({ large = false }: { large?: boolean }) {
  const nodes = [
    { id: 'today', label: 'Today', x: 160, y: 96, r: 34, color: 'var(--axis-graph-ax)' },
    { id: 'ax', label: 'AX', x: 68, y: 174, r: 24, color: 'var(--axis-graph-security)' },
    { id: 'dart', label: 'DART', x: 260, y: 172, r: 22, color: 'var(--axis-graph-infra)' },
    { id: 'deal', label: '수주', x: 190, y: 220, r: 18, color: 'var(--axis-graph-deal)' },
  ];
  const links = [
    ['today', 'ax'],
    ['today', 'dart'],
    ['today', 'deal'],
    ['ax', 'deal'],
  ];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-muted)]">Graphify ready</span>
        <ExecutiveBadge tone="accent">관계 시각화</ExecutiveBadge>
      </div>
      <svg viewBox="0 0 320 280" className={`${large ? 'h-[270px]' : 'h-[154px]'} w-full`} role="img" aria-label="오늘 인사이트 관계 그래프 미리보기">
        {links.map(([sourceId, targetId]) => {
          const source = nodeMap.get(sourceId);
          const target = nodeMap.get(targetId);
          if (!source || !target) return null;
          return (
            <line
              key={`${sourceId}-${targetId}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="var(--axis-graph-edge)"
              strokeOpacity="0.86"
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} fillOpacity="0.88" />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

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
  const peerFinancialData = [
    { name: '삼성SDS', backlog: 8.4, profit: 7.1, color: 'var(--axis-graph-company)' },
    { name: 'LG CNS', backlog: 7.6, profit: 6.8, color: 'var(--axis-graph-infra)' },
    { name: '현대오토에버', backlog: 6.9, profit: 6.1, color: 'var(--axis-graph-security)' },
    { name: '포스코DX', backlog: 6.4, profit: 5.8, color: 'var(--axis-graph-deal)' },
  ];
  const radarData = [
    { subject: '재무', sk: 72, peer: 82 },
    { subject: '사업', sk: 84, peer: 78 },
    { subject: '시장', sk: 68, peer: 74 },
    { subject: '기술', sk: 88, peer: 81 },
    { subject: '리스크', sk: 62, peer: 58 },
  ];
  const peerStockPoints = [
    { time: '09:00', samsung: 100, lg: 100, hyundai: 100, posco: 100 },
    { time: '10:00', samsung: 101.8, lg: 100.6, hyundai: 99.4, posco: 101.1 },
    { time: '11:00', samsung: 102.4, lg: 102.1, hyundai: 100.2, posco: 103.4 },
    { time: '12:00', samsung: 101.6, lg: 103.8, hyundai: 100.9, posco: 102.7 },
    { time: '13:00', samsung: 103.1, lg: 104.5, hyundai: 101.7, posco: 104.2 },
    { time: '14:00', samsung: 104.2, lg: 103.7, hyundai: 102.6, posco: 105.8 },
    { time: '15:00', samsung: 103.8, lg: 105.2, hyundai: 103.4, posco: 105.1 },
  ];
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
        <section className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <button
            type="button"
            data-guide="home-insight"
            onClick={() => onNavigate('insight')}
            className="axis-panel-flat relative min-h-[430px] overflow-hidden p-5 text-left transition hover:border-[var(--axis-accent)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at 74% 42%, rgba(220,90,36,0.13), transparent 34%), radial-gradient(circle at 18% 18%, rgba(90,107,87,0.10), transparent 32%)' }} />
            <div className="relative grid h-full gap-5 2xl:grid-cols-[minmax(320px,1fr)_minmax(300px,420px)] 2xl:items-center">
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
                      <strong className={`text-sm ${index === 1 ? 'text-[var(--axis-success)]' : 'text-[var(--axis-accent-strong)]'}`}>
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
              <div className="min-w-0">
                <GraphifyPreview large />
              </div>
            </div>
          </button>

          <aside data-guide="home-summary" className="axis-panel-flat min-h-[430px] w-full max-w-full min-w-0 overflow-hidden p-4 [contain:inline-size]">
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
          </aside>
        </section>

        <section data-guide="home-charts" className="mt-4 grid gap-4 xl:grid-cols-3">
          <ChartButton
            title={showStockChart ? 'Peer사 주가 변동' : '관심도 변화'}
            helper={showStockChart ? 'Stock compare' : 'Line graph'}
            icon={<LineChartIcon size={18} />}
            controls={chartSwitcher}
            onClick={() => onNavigate(showStockChart ? 'peerPlus' : 'keywordGraph')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {showStockChart ? (
                <LineChart data={peerStockPoints} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--axis-graph-edge)" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} domain={[98, 107]} />
                  <Tooltip />
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
                  <Tooltip />
                  <Line type="monotone" dataKey="agenticAi" name="Agentic AI" stroke="var(--axis-graph-ax)" strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="sovereignAi" name="Sovereign AI" stroke="var(--axis-graph-security)" strokeWidth={2.2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartButton>
          <ChartButton title="DART 기준 비교" helper="Radar chart" icon={<Radar size={18} />} onClick={() => onNavigate('peerPlus')}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={72}>
                <PolarGrid stroke="var(--axis-graph-edge)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <RadarShape name="SK AX" dataKey="sk" stroke="var(--axis-graph-ax)" fill="var(--axis-graph-ax)" fillOpacity={0.2} />
                <RadarShape name="Peer" dataKey="peer" stroke="var(--axis-graph-security)" fill="var(--axis-graph-security)" fillOpacity={0.14} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartButton>
          <ChartButton title="Peer사별 수주·재무" helper="DART metric" icon={<BarChart3 size={18} />} onClick={() => onNavigate('peerPlus')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peerFinancialData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--axis-graph-edge)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                <Tooltip />
                <Bar dataKey="backlog" name="수주/잔고 지표" radius={[6, 6, 0, 0]}>
                  {peerFinancialData.map((item) => (
                    <Cell key={`backlog-${item.name}`} fill={item.color} />
                  ))}
                </Bar>
                <Bar dataKey="profit" name="재무 건전성" fill="var(--axis-graph-ax)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartButton>
        </section>
      </ExecutiveContainer>
      {homeDetailCard ? (
        <FloatingCardNewsOverlay
          card={homeDetailCard}
          bookmarked={bookmarkedIds.includes(homeDetailCard.id)}
          slideIndex={homeDetailSlideIndex}
          onSlideChange={setHomeDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(homeDetailCard.id)}
          onClose={() => {
            setHomeDetailCardId(null);
            setHomeDetailSlideIndex(0);
          }}
        />
      ) : null}
      <FloatingAiChat />
    </ExecutivePage>
  );
}

type MixerResultView = {
  summary: string;
  insightBrief: string[];
  evidenceLogic: string[];
  actions: string[];
  connections: string[];
  skAxPerspective: string;
};

export function MixerView({
  bookmarkedIds,
  onToggleBookmark,
}: {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}) {
  const { cards, isLoading, error } = useCardNews();
  const [mode, setMode] = useState<'select' | 'result'>('select');
  const [selectedPeers, setSelectedPeers] = useState<string[]>(mockMixerConfig.defaults.peers);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(mockMixerConfig.defaults.customers);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(mockMixerConfig.defaults.industries);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(mockMixerConfig.defaults.keywords);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [result, setResult] = useState<MixerResultView | null>(null);
  const [mixerDetailCardId, setMixerDetailCardId] = useState<string | null>(null);
  const [mixerDetailSlideIndex, setMixerDetailSlideIndex] = useState(0);

  const mixerCards = useMemo(() => buildMixerCards(cards), [cards]);
  const visibleCards = mixerCards.filter((item) => {
    const peerMatched = selectedPeers.length === 0 || selectedPeers.includes(item.peer);
    const bookmarkMatched = !bookmarkedOnly || bookmarkedIds.includes(item.card.id);
    return peerMatched && bookmarkMatched;
  });
  const selectedCards = mixerCards.filter((item) => selectedIds.includes(item.id));
  const canGenerate = selectedCards.length >= 2;
  const ratioData = [
    { name: '카드뉴스', value: Math.max(selectedCards.length, 0), color: 'var(--axis-graph-ax)' },
    { name: 'Peer사', value: selectedPeers.length, color: 'var(--axis-graph-infra)' },
    { name: '고객사', value: selectedCustomers.length, color: 'var(--axis-graph-deal)' },
    { name: '산업', value: selectedIndustries.length, color: 'var(--axis-graph-security)' },
    { name: '키워드', value: selectedKeywords.length, color: 'var(--axis-graph-company)' },
  ].filter((item) => item.value > 0);
  const resultRadarData = mockMixerConfig.radarMetrics.map((metric) => {
    const keywordScore = metric.keyword && selectedKeywords.includes(metric.keyword) ? metric.keywordValue ?? metric.base : metric.base;
    const weightedScore =
      keywordScore +
      (metric.cardWeight ?? 0) * selectedCards.length +
      (metric.industryWeight ?? 0) * selectedIndustries.length +
      (metric.bookmarkWeight ?? 0) * selectedCards.filter((item) => bookmarkedIds.includes(item.card.id)).length +
      (metric.customerWeight ?? 0) * selectedCustomers.length;
    return {
      subject: metric.subject,
      mixed: Math.min(metric.max, weightedScore),
    };
  });
  const mixerDetailCard = mixerDetailCardId ? cards.find((card) => card.id === mixerDetailCardId) ?? null : null;

  const toggleListValue = (value: string, setter: (updater: (current: string[]) => string[]) => void) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const generateMixerResult = () => {
    if (!canGenerate) return;
    const peers = Array.from(new Set(selectedCards.map((item) => item.peer)));
    const summaryLines = selectedCards.flatMap((item) => getSummaryLines(item.card));
    const primaryIndustries = selectedIndustries.slice(0, 2).join(' · ') || '고객 산업';
    const primaryKeywords = selectedKeywords.slice(0, 3).join(' · ') || 'AX 신호';
    const connections = Array.from(
      new Set(
        summaryLines
          .join(' ')
          .split(/\s+/)
          .filter((token) => mockMixerConfig.connectionKeywords.includes(token)),
      ),
    ).slice(0, 5);

    setResult({
      summary: `${mockMixerConfig.insightTemplate.leadPrefix} ${peers.join(', ')}의 ${primaryKeywords} 신호를 ${primaryIndustries} 제안 맥락으로 재조합해 ${mockMixerConfig.insightTemplate.leadSuffix}`,
      insightBrief: [
        `${peers.join(', ')}에서 반복된 메시지는 단순 기술 발표보다 고객 운영 성과, 수주 근거, 실행 레퍼런스 쪽으로 모입니다.`,
        `${primaryIndustries} 고객에게는 “기능 도입”보다 “업무 KPI 개선과 안정적 운영 전환”을 먼저 제안하는 편이 설득력이 큽니다.`,
        `북마크와 카드뉴스를 함께 묶으면 경쟁사 공개 신호를 SK AX의 산업별 제안 문장으로 바꾸는 근거 패키지가 됩니다.`,
      ],
      evidenceLogic: [
        `선택 카드 ${selectedCards.length}건`,
        `Peer ${peers.length}개사`,
        `키워드 ${selectedKeywords.length}개`,
        `북마크 근거 ${selectedCards.filter((item) => bookmarkedIds.includes(item.card.id)).length}건`,
      ],
      actions: [
        '고객 미팅 전 카드뉴스 묶음을 3문장 브리핑으로 변환',
        '제안서 첫 장에 수주/운영/보안 근거를 함께 배치',
        'Graphify 관계도를 통해 예상 밖 연결 키워드를 후속 검토',
      ],
      connections: connections.length > 0 ? connections : [...selectedKeywords, '고객 제안'].slice(0, 5),
      skAxPerspective: selectedCards[0]?.card.actionItems?.[0] ?? '선택한 카드 묶음을 산업별 제안 근거와 실행 문장으로 재구성할 수 있습니다.',
    });
    setMode('result');
  };

  if (isLoading) return <LoadingBlock label="믹서 후보 카드를 불러오는 중입니다." />;
  if (error) return <LoadingBlock label={error} />;

  if (mode === 'result' && result) {
    return (
      <ExecutivePage>
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer output"
            title="믹서 결과"
            subtitle="선택한 뉴스, 산업, 키워드 비율을 기반으로 New 인사이트와 연결 그래프를 구성했습니다."
            actions={
              <ExecutiveButton variant="secondary" onClick={() => setMode('select')}>
                선택으로 돌아가기
              </ExecutiveButton>
            }
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <article data-guide="mixer-result" className="axis-panel-flat min-h-[360px] overflow-hidden border-[rgba(220,90,36,0.26)]">
              <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-6 py-4">
                <p className="axis-kicker">New insight</p>
                <h2 className="mt-2 text-heading-3 font-display leading-tight text-[var(--axis-ink)]">
                {result.summary}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="space-y-3">
                    {result.insightBrief.map((item, index) => (
                      <div key={item} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-bold text-[var(--axis-accent-strong)]">
                          {index + 1}
                        </span>
                        <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)] p-4">
                    <p className="text-xs font-semibold text-[var(--axis-success)]">{mockMixerConfig.insightTemplate.evidenceLabel}</p>
                    <div className="mt-3 grid gap-2">
                      {result.evidenceLogic.map((item) => (
                        <span key={item} className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm font-semibold text-[var(--axis-ink)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-4">
                    <p className="text-xs font-semibold text-[var(--axis-accent-strong)]">뉴스 내용 분석</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
                      {selectedCards[0] ? getSummaryLines(selectedCards[0].card)[0] : '선택한 뉴스의 반복 문맥을 분석합니다.'}
                    </p>
                  </div>
                  <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-4">
                    <p className="text-xs font-semibold text-[var(--axis-accent-strong)]">{mockMixerConfig.insightTemplate.actionLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{result.skAxPerspective}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {result.connections.map((connection) => (
                    <ExecutiveBadge key={connection} tone="accent">{connection}</ExecutiveBadge>
                  ))}
                </div>
              </div>
            </article>

            <aside className="axis-panel-flat p-5">
              <p className="axis-kicker">Graphify ready</p>
              <h2 className="axis-section-heading mt-1">생각하지 못한 연결 후보</h2>
              <div className="mt-4">
                <GraphifyPreview />
              </div>
            </aside>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <article data-guide="mixer-signal-map" className="axis-panel-flat min-h-[430px] p-5">
              <p className="axis-kicker">Signal map</p>
              <h3 className="axis-section-heading mt-1">믹서 결과 신호 분포</h3>
              <div className="mt-3 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
                <div className="h-[286px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={resultRadarData} outerRadius={106} margin={{ top: 22, right: 48, bottom: 8, left: 48 }}>
                    <PolarGrid stroke="var(--axis-graph-edge)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--axis-ink)' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <RadarShape name="선택 조합 신호" dataKey="mixed" stroke="var(--axis-graph-ax)" strokeWidth={2.6} fill="var(--axis-graph-ax)" fillOpacity={0.24} />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--axis-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--axis-canvas)',
                        border: '1px solid var(--axis-hairline)',
                        borderRadius: 8,
                        color: 'var(--axis-ink)',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {result.actions.map((action) => (
                  <p key={action} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-3 text-xs font-semibold leading-5 text-[var(--axis-body)]">
                    {action}
                  </p>
                ))}
              </div>
            </article>

            <article data-guide="mixer-evidence" className="axis-panel-flat min-h-[430px] p-5">
              <p className="axis-kicker">Selected evidence</p>
              <h3 className="axis-section-heading mt-1">결과에 반영된 카드뉴스</h3>
              <div className="mt-4 grid gap-3">
                {selectedCards.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMixerDetailCardId(item.card.id);
                      setMixerDetailSlideIndex(0);
                    }}
                    className="flex w-full gap-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-3 text-left transition hover:bg-[var(--axis-surface-soft)] hover:ring-1 hover:ring-[var(--axis-accent)]"
                  >
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--axis-radius-sm)] bg-[#081324]">
                      {item.card.coverImageUrl ? (
                        <img src={item.card.coverImageUrl} alt={item.card.coverImageAlt} className="h-full w-full object-cover opacity-70" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--axis-accent-strong)]">{item.peer}</p>
                      <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{item.card.title}</h4>
                    </div>
                  </button>
                ))}
              </div>
            </article>
          </section>
        </ExecutiveContainer>
        {mixerDetailCard ? (
          <FloatingCardNewsOverlay
            card={mixerDetailCard}
            bookmarked={bookmarkedIds.includes(mixerDetailCard.id)}
            slideIndex={mixerDetailSlideIndex}
            onSlideChange={setMixerDetailSlideIndex}
            onBookmark={() => onToggleBookmark(mixerDetailCard.id)}
            onClose={() => {
              setMixerDetailCardId(null);
              setMixerDetailSlideIndex(0);
            }}
          />
        ) : null}
      </ExecutivePage>
    );
  }

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Mixer workbench"
          title="믹서"
          subtitle="뉴스, Peer, 고객사, 산업, 키워드를 고른 뒤 믹서 결과를 생성합니다."
          actions={
            <>
              <ExecutiveButton
                variant={bookmarkedOnly ? 'primary' : 'secondary'}
                icon={<Bookmark size={16} fill={bookmarkedOnly ? 'currentColor' : 'none'} />}
                onClick={() => setBookmarkedOnly((current) => !current)}
              >
                북마크만
              </ExecutiveButton>
              <ExecutiveButton icon={<Sparkles size={16} />} disabled={!canGenerate} onClick={generateMixerResult}>
                믹서 실행
              </ExecutiveButton>
            </>
          }
        />

        <section data-guide="mixer-input" className="mb-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {mockMixerConfig.options.map((optionGroup) => {
            const group =
              optionGroup.title === 'Peer사'
                ? { ...optionGroup, selected: selectedPeers, setter: setSelectedPeers }
                : optionGroup.title === '고객사'
                  ? { ...optionGroup, selected: selectedCustomers, setter: setSelectedCustomers }
                  : optionGroup.title === '산업'
                    ? { ...optionGroup, selected: selectedIndustries, setter: setSelectedIndustries }
                    : { ...optionGroup, selected: selectedKeywords, setter: setSelectedKeywords };
            return (
            <div key={group.title} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="axis-kicker">{group.title}</p>
                <span className="text-[11px] font-semibold text-[var(--axis-muted)]">{group.selected.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleListValue(value, group.setter)}
                    className={`h-6 rounded-full border px-2.5 text-[11px] font-semibold transition ${
                      group.selected.includes(value)
                        ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)] dark:border-white/50 dark:bg-white/15 dark:text-white'
                        : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <main data-guide="mixer-candidates">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">Source cards</p>
                <h2 className="axis-section-heading mt-1">믹서 후보</h2>
              </div>
              <ExecutiveBadge tone={canGenerate ? 'success' : 'warning'}>{selectedCards.length}개 선택</ExecutiveBadge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCards.map((item) => {
                const selected = selectedIds.includes(item.id);
                const bookmarked = bookmarkedIds.includes(item.card.id);
                return (
                  <article
                    key={item.id}
                    className={`relative overflow-hidden rounded-[var(--axis-radius-lg)] border bg-[#081324] shadow-[0_16px_44px_-30px_rgba(0,0,0,0.58)] transition ${
                      selected ? 'border-[var(--axis-success)]' : 'border-[var(--axis-hairline)] hover:border-[var(--axis-accent)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelection(item.id)}
                      className="relative block aspect-[4/5] w-full overflow-hidden text-left"
                    >
                      {item.card.coverImageUrl ? (
                        <img src={item.card.coverImageUrl} alt={item.card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#081324]/48 to-black/92" />
                      <div className="relative flex h-full flex-col justify-between p-4 text-white">
                        <div className="flex items-start justify-between gap-2 text-xs font-semibold">
                          <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{item.peer}</span>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] border ${
                            selected ? 'border-white bg-white/20 text-white' : 'border-white/25 bg-white/10 text-white/70'
                          }`}>
                            {selected ? <Check size={16} strokeWidth={3} /> : null}
                          </span>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/72">{item.sourceType}</p>
                          <h3 className="line-clamp-4 text-lg font-semibold leading-tight text-white">{item.card.title}</h3>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={bookmarked ? '북마크 해제' : '북마크'}
                      onClick={() => onToggleBookmark(item.card.id)}
                      className={`absolute right-4 top-14 flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border backdrop-blur transition ${
                        bookmarked
                          ? 'border-white/70 bg-white text-[#081324] dark:border-white dark:bg-white dark:text-[#081324]'
                          : 'border-white/25 bg-black/20 text-white hover:bg-white/15'
                      }`}
                    >
                      <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </article>
                );
              })}
            </div>
          </main>

          <aside data-guide="mixer-ratio" className="axis-panel-flat p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--axis-accent)]" />
              <h2 className="axis-section-heading">선택 비율</h2>
            </div>
            <div className="mt-5 min-h-[228px] overflow-visible">
              {ratioData.length > 0 ? (
                <DonutCalloutChart data={ratioData} />
              ) : (
                <div className="flex h-[210px] items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-sm text-[var(--axis-muted)]">
                  선택 항목이 없습니다.
                </div>
              )}
            </div>
            <div className="mt-5 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4 text-sm leading-6 text-[var(--axis-muted)]">
              카드 2개 이상을 선택하면 선택 비율을 기반으로 믹서 결과 페이지가 생성됩니다.
            </div>
          </aside>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

export function PeerPlusView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
  selectedPeerId: externalSelectedPeerId,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  selectedPeerId?: PeerPlusPeerId;
}) {
  const { cards, isLoading, error } = useCardNews();
  const peerOptions = mockPeerPlusOptions;
  const [selectedPeerId, setSelectedPeerId] = useState<PeerPlusPeerId>(() => {
    const stored = window.localStorage.getItem(peerPlusSelectionStorageKey);
    return mockPeerPlusOptions.some((peer) => peer.id === stored) ? (stored as PeerPlusPeerId) : 'samsung_sds';
  });
  const [peerDetailCardId, setPeerDetailCardId] = useState<string | null>(null);
  const [peerDetailSlideIndex, setPeerDetailSlideIndex] = useState(0);
  const [peerKeywordMatches, setPeerKeywordMatches] = useState<{ keyword: string; cards: CardNewsItem[] } | null>(null);
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);

  useEffect(() => {
    if (externalSelectedPeerId) {
      setSelectedPeerId(externalSelectedPeerId);
    }
  }, [externalSelectedPeerId]);
  const selectedPeer = peerOptions.find((peer) => peer.id === selectedPeerId) ?? peerOptions[0];
  const peerCards = rankedCards.filter((card) => card.peer_id === selectedPeerId);
  const companyNews = (peerCards.length > 0 ? peerCards : rankedCards).slice(0, 4);
  const peerDetailCard = peerDetailCardId ? cards.find((card) => card.id === peerDetailCardId) ?? null : null;
  const selectedIr = mockPeerPlusIrProfiles[selectedPeerId];
  const peerInsightItems = [
    {
      label: '포지셔닝',
      body: `SK AX는 운영 KPI와 보안 거버넌스를 결합한 제안 메시지가 강점이고, ${selectedPeer.label}는 공개 레퍼런스와 사업 메시지가 먼저 보입니다.`,
    },
    ...selectedIr.summary.map((item, index) => ({ label: index === 0 ? '사업 신호' : '기술 신호', body: item })),
    {
      label: '영업 활용',
      body: `${selectedPeer.label}의 강한 공개 신호는 고객 제안서에서 비교 근거로 쓰고, SK AX는 운영 전환 이후의 관리 지표를 더 전면에 배치하는 편이 좋습니다.`,
    },
    {
      label: '리스크',
      body: 'IR 수치가 개선되어도 카드뉴스 노출이 특정 산업에 치우치면 실제 수주 전환까지는 추가 검증이 필요합니다.',
    },
  ];
  const irMetricCards = [
    { label: '매출', value: selectedIr.revenue, delta: selectedIr.deltas.revenue },
    { label: '영업이익', value: selectedIr.operatingProfit, delta: selectedIr.deltas.operatingProfit },
    { label: 'AX 비중', value: selectedIr.axRatio, delta: selectedIr.deltas.axRatio },
    { label: '수주잔고', value: selectedIr.orderBacklog, delta: selectedIr.deltas.orderBacklog },
    { label: '영업이익률', value: selectedIr.margin, delta: selectedIr.deltas.margin },
    { label: '투자/Capex', value: selectedIr.capex, delta: selectedIr.deltas.capex },
  ];
  const dartData = [
    { subject: '매출 성장', value: Number(selectedIr.revenue.replace(/[^0-9.]/g, '')) > 2 ? 86 : 72 },
    { subject: 'AX 투자', value: Number(selectedIr.axRatio.replace('%', '')) + 48 },
    { subject: '수주 모멘텀', value: Number(selectedIr.orderBacklog.replace(/[^0-9.]/g, '')) * 18 + 50 },
    { subject: '운영 효율', value: Number(selectedIr.margin.replace('%', '')) * 8 + 18 },
    { subject: '시장 노출', value: 82 },
  ];
  const selectedKeywordCloud = mockPeerPlusKeywordCloud[selectedPeerId];
  const wordCloudLayout = [
    { left: '50%', top: '50%', rotate: 0 },
    { left: '23%', top: '35%', rotate: -6 },
    { left: '75%', top: '35%', rotate: 5 },
    { left: '26%', top: '72%', rotate: 0 },
    { left: '74%', top: '72%', rotate: -4 },
    { left: '50%', top: '20%', rotate: 0 },
  ];
  const openKeywordCard = (keyword: string) => {
    const normalizedKeyword = normalizeGraphTerm(keyword);
    const keywordTerms = Array.from(new Set([normalizedKeyword, ...normalizedKeyword.split(/[\s/·-]+/)])).filter(Boolean);
    const matchedCards = rankedCards.filter((card) => {
      const haystack = normalizeGraphTerm([
        card.title,
        getPeerLabel(card),
        card.category,
        card.category_label,
        card.subtitle,
        card.sector,
        ...(card.summary_lines ?? card.summary),
        ...(card.insights ?? []),
        ...(card.actionItems ?? []),
      ].filter(Boolean).join(' '));
      return keywordTerms.some((term) => term.length > 1 && haystack.includes(term));
    }).slice(0, 6);
    setPeerKeywordMatches({ keyword, cards: matchedCards.length > 0 ? matchedCards : companyNews });
  };

  if (isLoading) return <LoadingBlock label="Peer+ 분석 데이터를 불러오는 중입니다." />;
  if (error) return <LoadingBlock label={error} />;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Peer+ analysis"
          title="Peer+"
          subtitle="Peer사의 IR 수치, 재무 흐름, 관련 카드뉴스를 하나의 화면에서 비교합니다."
          actions={
            <div data-guide="peer-selector" className="flex flex-wrap justify-end gap-1.5">
              {peerOptions.map((peer) => (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => {
                    window.localStorage.setItem(peerPlusSelectionStorageKey, peer.id);
                    setSelectedPeerId(peer.id);
                  }}
                  className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${
                    selectedPeerId === peer.id
                      ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                      : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                  }`}
                >
                  {peer.label}
                </button>
              ))}
            </div>
          }
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <article data-guide="peer-insight" className="axis-panel-flat min-h-[360px] p-5">
            <p className="axis-kicker">AI comparison summary</p>
            <h2 className="mt-2 text-lg font-display font-semibold leading-tight text-ink">
              경쟁 메시지 차이와 SK AX 대응 포인트
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative min-h-[230px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-4">
                <div className="absolute left-9 top-10 bottom-10 w-px bg-[var(--axis-hairline)]" />
                {[
                  ['SK AX', '운영 KPI'],
                  [selectedPeer.label, '공개 신호'],
                  ['GAP', '제안 전환'],
                ].map(([label, sub], index) => (
                  <div
                    key={label}
                    className="relative z-10 mb-5 flex items-center gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/88 p-2.5 shadow-[0_14px_36px_-32px_rgba(0,0,0,0.42)]"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                      index === 0
                        ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.16)] text-[var(--axis-accent-strong)]'
                        : index === 1
                          ? 'border-[var(--axis-success)] bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--axis-ink)]">{label}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-[var(--axis-muted)]">{sub}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {peerInsightItems.map((item, index) => (
                  <div
                    key={`${item.label}-${item.body}`}
                    className={`rounded-[var(--axis-radius-lg)] border p-4 ${
                      index === 0
                        ? 'md:col-span-2 border-[rgba(220,90,36,0.28)] bg-[rgba(220,90,36,0.08)]'
                        : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)]'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-[var(--axis-muted)]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <p className={`${index === 0 ? 'text-base leading-7' : 'text-sm leading-6'} font-semibold text-[var(--axis-ink)]`}>
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <button
            type="button"
            data-guide="peer-ir"
            onClick={() => onNavigate('keywordGraph')}
            className="axis-panel-flat min-h-[360px] p-5 text-left transition hover:border-[var(--axis-accent)]"
          >
            <p className="axis-kicker">IR numeric pack</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {irMetricCards.map((item) => (
                <div key={item.label} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-4">
                  <p className="text-sm font-semibold leading-tight text-[var(--axis-muted)]">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-[22px] font-semibold leading-none text-[var(--axis-ink)]">{item.value}</p>
                    <p className={`shrink-0 text-base font-bold leading-none ${item.delta >= 0 ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'}`}>
                      {item.delta >= 0 ? '+' : ''}{item.delta.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </button>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="axis-panel-flat p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
              <div className="min-w-0">
                <p className="axis-kicker">Quarterly trend</p>
                <h2 className="axis-section-heading mt-1">IR 기반 분기 흐름</h2>
                <div className="mt-4 h-[112px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedIr.quarterly} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(128,128,128,0.14)" />
                      <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'var(--axis-muted)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--axis-muted)' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" name="매출" stroke="var(--axis-graph-ax)" strokeWidth={2.2} dot={false} />
                      <Line type="monotone" dataKey="profit" name="영업이익" stroke="var(--axis-graph-security)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ax" name="AX 비중" stroke="var(--axis-graph-infra)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div data-guide="peer-wordcloud" className="min-w-0 rounded-[var(--axis-radius-lg)] bg-[var(--axis-surface-soft)] p-4">
                <p className="axis-kicker">AI / 사업 / MOU cloud</p>
                <h3 className="axis-section-heading mt-1">최근 도입·협력 워드클라우드</h3>
                <div className="relative mt-4 h-[210px] overflow-hidden rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
                  <div className="absolute inset-5 rounded-full border border-dashed border-[var(--axis-hairline)] opacity-55" />
                  {selectedKeywordCloud.map((item, index) => {
                    const position = wordCloudLayout[index % wordCloudLayout.length];
                    return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => openKeywordCard(item.label)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1.5 font-display font-semibold leading-none transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--axis-accent)] ${
                        item.weight === 3 ? 'text-3xl' : item.weight === 2 ? 'text-xl' : 'text-sm'
                      } ${
                        item.tone === 'accent'
                          ? 'text-[var(--axis-accent-strong)]'
                          : item.tone === 'success'
                            ? 'text-[var(--axis-success)]'
                            : 'text-[var(--axis-body)]'
                      }`}
                      style={{
                        left: position.left,
                        top: position.top,
                        transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
                      }}
                    >
                      {item.label}
                    </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          <article className="axis-panel-flat p-5">
            <p className="axis-kicker">DART balance</p>
            <h2 className="axis-section-heading mt-1">수치형 자료 요약</h2>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dartData} outerRadius={82}>
                  <PolarGrid stroke="rgba(128,128,128,0.16)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <RadarShape name="DART" dataKey="value" stroke="var(--axis-graph-ax)" fill="var(--axis-graph-ax)" fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="axis-kicker">Related card news</p>
              <h2 className="axis-section-heading mt-1">{selectedPeer.label} 관련 카드뉴스</h2>
            </div>
            <ExecutiveBadge tone="accent">{companyNews.length}건</ExecutiveBadge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {companyNews.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setPeerDetailCardId(card.id)}
                className="relative aspect-[4/5] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[#081324] text-left transition hover:border-[var(--axis-accent)]"
              >
                {card.coverImageUrl ? (
                  <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/34 via-[#081324]/48 to-black/92" />
                <div className="relative flex h-full flex-col justify-between p-4 text-white">
                  <div className="flex items-start justify-between gap-2 text-xs font-semibold">
                    <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{getDisplayDate(card)}</span>
                    <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{card.category_label ?? card.category}</span>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">{getPeerLabel(card)}</p>
                    <h3 className="line-clamp-4 text-lg font-semibold leading-tight text-white">{card.title}</h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </ExecutiveContainer>
      {peerKeywordMatches ? (
        <div
          className="fixed inset-0 z-40 bg-[rgba(250,248,244,0.62)] p-5 backdrop-blur-sm dark:bg-[rgba(17,18,22,0.70)]"
          onClick={() => setPeerKeywordMatches(null)}
        >
          <section
            className="ml-auto h-full w-full max-w-[520px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--axis-hairline)] p-5">
              <div>
                <p className="axis-kicker">Keyword card news</p>
                <h2 className="axis-section-heading mt-1">‘{peerKeywordMatches.keyword}’ 관련 카드뉴스</h2>
              </div>
              <button
                type="button"
                aria-label="관련 카드뉴스 목록 닫기"
                onClick={() => setPeerKeywordMatches(null)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
              >
                <X size={16} />
              </button>
            </header>
            <div className="h-[calc(100%-82px)] overflow-y-auto p-5">
              <div className="space-y-3">
                {peerKeywordMatches.cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setPeerDetailCardId(card.id);
                      setPeerDetailSlideIndex(0);
                    }}
                    className="grid w-full grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-canvas)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--axis-radius-sm)] bg-[#081324]">
                      {card.coverImageUrl ? (
                        <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</span>
                        <span className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                      </div>
                      <h3 className="mt-2 line-clamp-3 text-base font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--axis-muted)]">{getSummaryLines(card)[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {peerDetailCard ? (
        <FloatingCardNewsOverlay
          card={peerDetailCard}
          bookmarked={bookmarkedIds.includes(peerDetailCard.id)}
          slideIndex={peerDetailSlideIndex}
          onSlideChange={setPeerDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(peerDetailCard.id)}
          onClose={() => {
            setPeerDetailCardId(null);
            setPeerDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}

function buildCardNewsRows(cards: CardNewsItem[]) {
  const catalog = buildCardCatalog(cards);
  const rows = [...catalog];
  while (rows.length < 6 && catalog.length > 0) {
    rows.push(catalog[rows.length % catalog.length]);
  }
  return rows.slice(0, Math.max(6, rows.length)).map((card, index) => ({
    ...card,
    id: `${card.id}-${index}`,
    sourceId: card.card.id,
    originalTitle: card.card.title,
    cardNewsTitle: card.title,
    sourceType: card.sector,
    keywords: [card.peer, card.sector, card.accentLabel].filter(Boolean),
  }));
}

export function FloatingCardNewsOverlay({
  card,
  bookmarked,
  slideIndex,
  onSlideChange,
  onBookmark,
  onClose,
}: {
  card: CardNewsItem;
  bookmarked: boolean;
  slideIndex: number;
  onSlideChange: (index: number) => void;
  onBookmark: () => void;
  onClose: () => void;
}) {
  const slides = [
    {
      kicker: 'AI 요약',
      title: card.title,
      lines: getSummaryLines(card).slice(0, 3),
    },
    {
      kicker: '시사점',
      title: card.detailTitle || 'SK AX 관점',
      lines: (card.insights.length > 0 ? card.insights : card.detailPoints).slice(0, 3),
    },
    {
      kicker: '다음 행동',
      title: '대응 방향',
      lines: (card.actionItems.length > 0 ? card.actionItems : card.detailPoints).slice(0, 3),
    },
  ].filter((slide) => slide.lines.length > 0);
  const activeIndex = slideIndex % Math.max(slides.length, 1);
  const activeSlide = slides[activeIndex] ?? slides[0];
  const slideImage = card.slides?.[activeIndex]?.image_url ?? card.coverImageUrl;
  const slideImageAlt = card.slides?.[activeIndex]?.image_alt ?? card.coverImageAlt;
  const [shareFeedback, setShareFeedback] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="카드뉴스 상세 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(16,16,20,0.30)] backdrop-blur-[3px]"
      />
      <section className="absolute left-1/2 top-1/2 h-[min(620px,calc(100vh-56px))] w-[min(820px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_34px_110px_-42px_rgba(0,0,0,0.58)]">
        <div className="grid h-full md:grid-cols-[0.82fr_1fr]">
          <div className="relative min-h-[260px] bg-[#081324] md:h-full">
            {slideImage ? (
              <img src={slideImage} alt={slideImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-58 transition-opacity" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#081324]/48 to-black/92" />
            <div className="relative flex h-full flex-col justify-between p-6 text-white">
              <div className="flex items-start justify-between gap-3 text-xs font-semibold">
                <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">{getDisplayDate(card)}</span>
                <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">{card.category_label ?? card.category}</span>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/72">{getPeerLabel(card)}</p>
                <h2 className="text-[26px] font-semibold leading-tight text-white">{card.title}</h2>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="axis-kicker">{activeSlide.kicker}</p>
                <h3 className="mt-2 text-heading-4 font-display leading-tight text-[var(--axis-ink)]">{activeSlide.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {activeSlide.lines.map((line, index) => (
                <p key={`${activeSlide.kicker}-${index}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3 text-sm leading-6 text-[var(--axis-body)]">
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-4 flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.kicker}
                    type="button"
                    onClick={() => onSlideChange(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-9 bg-[var(--axis-accent)]' : 'w-2.5 bg-[var(--axis-hairline)]'}`}
                    aria-label={`${slide.kicker} 보기`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <ExecutiveButton variant="secondary" onClick={() => onSlideChange((activeIndex + slides.length - 1) % slides.length)}>
                  이전
                </ExecutiveButton>
                <ExecutiveButton variant="secondary" onClick={() => onSlideChange((activeIndex + 1) % slides.length)}>
                  다음
                </ExecutiveButton>
                <ExecutiveButton variant={bookmarked ? 'primary' : 'secondary'} onClick={onBookmark}>
                  {bookmarked ? '북마크됨' : '북마크'}
                </ExecutiveButton>
                <ExecutiveButton
                  variant="secondary"
                  icon={<Share2 size={15} />}
                  onClick={() => {
                    void shareCardNews(card).then(setShareFeedback).catch(() => setShareFeedback('공유를 처리하지 못했습니다.'));
                  }}
                >
                  공유
                </ExecutiveButton>
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
                >
                  원문 열기
                </a>
              </div>
              {shareFeedback ? <p className="mt-3 text-xs font-semibold text-[var(--axis-muted)]">{shareFeedback}</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function CardNewsWorkspaceView({
  bookmarkedIds,
  onToggleBookmark,
  initialQuery = '',
}: {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
  initialQuery?: string;
}) {
  const { cards, isLoading, error } = useCardNews();
  const [peerFilter, setPeerFilter] = useState('전체');
  const [sectorFilter, setSectorFilter] = useState('전체');
  const [dateFilter, setDateFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState(initialQuery);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [detailBookmarkId, setDetailBookmarkId] = useState<string | null>(null);
  const [detailSlideIndex, setDetailSlideIndex] = useState(0);
  const [shareFeedback, setShareFeedback] = useState('');
  const rows = useMemo(() => buildCardNewsRows(cards), [cards]);
  const peerOptions = ['전체', ...Array.from(new Set(rows.map((row) => row.peer)))];
  const sectorOptions = ['전체', ...Array.from(new Set(rows.map((row) => row.sourceType)))];
  const visibleRows = rows.filter((row) => {
    const peerMatched = peerFilter === '전체' || row.peer === peerFilter;
    const sectorMatched = sectorFilter === '전체' || row.sourceType === sectorFilter;
    const normalizedDate = (row.card.published_date ?? row.card.date ?? '').slice(0, 10);
    const dateMatched = !dateFilter || normalizedDate === dateFilter;
    const normalizedKeyword = keywordFilter.trim().toLowerCase();
    const haystack = [
      row.cardNewsTitle,
      row.originalTitle,
      row.peer,
      row.sourceType,
      row.accentLabel,
      row.card.category,
      row.card.category_label,
      row.card.subtitle,
      ...(row.card.summary_lines ?? row.card.summary),
      ...(row.card.insights ?? []),
      ...(row.card.actionItems ?? []),
    ].filter(Boolean).join(' ').toLowerCase();
    const keywordMatched = !normalizedKeyword || haystack.includes(normalizedKeyword);
    const bookmarkMatched = !bookmarkedOnly || bookmarkedIds.includes(row.id);
    return peerMatched && sectorMatched && dateMatched && keywordMatched && bookmarkMatched;
  });
  const detailCard = detailCardId ? cards.find((card) => card.id === detailCardId) ?? null : null;

  useEffect(() => {
    setDetailSlideIndex(0);
  }, [detailCardId]);

  useEffect(() => {
    setKeywordFilter(initialQuery);
  }, [initialQuery]);

  if (isLoading) return <LoadingBlock label="카드뉴스를 불러오는 중입니다." />;
  if (error) return <LoadingBlock label={error} />;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Card news workspace"
          title="카드뉴스"
          subtitle="뉴스를 카드 커버 단위로 확인하고, 클릭하면 AI 요약과 시사점 상세를 확인합니다."
        />

        <section data-guide="cardnews-filter" className="mb-5 flex flex-wrap items-center gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--axis-canvas)] px-3 text-xs font-semibold text-[var(--axis-muted)]">
            <Filter size={14} />
            필터
          </span>
          <select
            value={peerFilter}
            onChange={(event) => setPeerFilter(event.target.value)}
            className="h-9 min-w-[132px] rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
            aria-label="Peer사 필터"
          >
            {peerOptions.map((peer) => (
              <option key={peer} value={peer}>{peer}</option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(event) => setSectorFilter(event.target.value)}
            className="h-9 min-w-[132px] rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
            aria-label="섹터 필터"
          >
            {sectorOptions.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <label className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)]">
            <CalendarDays size={14} className="text-[var(--axis-accent)]" />
            <span className="sr-only">카드뉴스 날짜 선택</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-7 w-[130px] bg-transparent text-sm font-semibold text-[var(--axis-ink)] outline-none"
            />
          </label>
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">카드뉴스 키워드 검색</span>
            <input
              type="search"
              value={keywordFilter}
              onChange={(event) => setKeywordFilter(event.target.value)}
              placeholder="키워드 내용 검색..."
              className="h-9 w-full rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 text-sm font-semibold text-[var(--axis-ink)] outline-none placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)]"
            />
          </label>
          <button
            type="button"
            onClick={() => setBookmarkedOnly((current) => !current)}
            className={`ml-auto inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
              bookmarkedOnly
                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
            }`}
            aria-pressed={bookmarkedOnly}
          >
            <Bookmark size={14} fill={bookmarkedOnly ? 'currentColor' : 'none'} />
            북마크만
          </button>
          <span className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-[var(--axis-muted)]">
            {visibleRows.length}건
          </span>
        </section>

        <section>
          {visibleRows.length === 0 ? (
            <EmptyBlock label="선택한 필터에 해당하는 카드뉴스가 없습니다." />
          ) : (
            <main data-guide="cardnews-grid" className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-7">
              {visibleRows.map((row) => {
                const bookmarked = bookmarkedIds.includes(row.id);
                return (
                  <article
                    key={row.id}
                    className="relative overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[#081324] shadow-[0_18px_48px_-32px_rgba(0,0,0,0.55)] transition hover:border-[var(--axis-accent)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDetailCardId(row.sourceId);
                        setDetailBookmarkId(row.id);
                      }}
                      className="relative block aspect-[3/4] w-full overflow-hidden text-left sm:aspect-[4/5]"
                    >
                      {row.card.coverImageUrl ? (
                        <img
                          src={row.card.coverImageUrl}
                          alt={row.card.coverImageAlt}
                          className="absolute inset-0 h-full w-full object-cover opacity-55"
                        />
                      ) : (
                        <div className="absolute inset-0" style={{ background: row.coverStyle }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/38 via-[#081324]/48 to-black/92" />
                      <div className="relative flex h-full flex-col justify-between p-3 text-white sm:p-4">
                        <div className="flex items-start justify-between gap-2 text-[10px] font-semibold sm:text-xs">
                          <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-0.5 tracking-[0.06em] sm:px-2.5 sm:py-1">
                            {getDisplayDate(row.card)}
                          </span>
                          <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1">
                            {row.accentLabel}
                          </span>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 sm:text-xs">{row.peer}</p>
                          <h2 className="line-clamp-3 text-[13px] font-semibold leading-tight text-white sm:line-clamp-4 sm:text-[18px]">{row.cardNewsTitle}</h2>
                        </div>
                      </div>
                    </button>
                    <div className="absolute right-2 top-14 flex flex-col gap-2 sm:right-4 sm:top-20">
                      <button
                        type="button"
                        aria-label={bookmarked ? '북마크 해제' : '북마크'}
                        onClick={() => onToggleBookmark(row.id)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition ${
                          bookmarked
                            ? 'border-white/40 bg-white text-[#081324]'
                            : 'border-white/25 bg-black/20 text-white hover:bg-white/15'
                        }`}
                      >
                        <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        aria-label="공유"
                        onClick={() => {
                          void shareCardNews(row.card).then(setShareFeedback).catch(() => setShareFeedback('공유를 처리하지 못했습니다.'));
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-white/15"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </main>
          )}
        </section>
        {shareFeedback ? (
          <p className="mt-4 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--axis-muted)]">
            {shareFeedback}
          </p>
        ) : null}
      </ExecutiveContainer>
      {detailCard ? (
        <FloatingCardNewsOverlay
          card={detailCard}
          bookmarked={bookmarkedIds.includes(detailBookmarkId ?? detailCard.id)}
          slideIndex={detailSlideIndex}
          onSlideChange={setDetailSlideIndex}
          onBookmark={() => onToggleBookmark(detailBookmarkId ?? detailCard.id)}
          onClose={() => {
            setDetailCardId(null);
            setDetailBookmarkId(null);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}

const insightResult = {
  title: 'New 인사이트',
  summary: 'AX 시장은 PoC 검증 중심에서 운영 확산과 KPI 증빙 중심으로 이동하고 있습니다.',
  evidence: [
    'Peer사 실적 발표에서 AX 매출과 운영형 AI 메시지가 반복됩니다.',
    '카드뉴스 노출 점수 상위 항목은 제조, 금융, 보안 키워드에 집중되어 있습니다.',
    'DART 기반 지표는 투자 선행보다 고객 레퍼런스 전환 속도를 더 중요하게 보여줍니다.',
    '수주·클라우드·AI 에이전트 키워드가 같은 뉴스 묶음에서 함께 등장해 단일 기술 이슈보다 사업 전환 신호에 가깝습니다.',
    '공공/제조 산업의 발표문은 PoC 성과보다 운영 지표, 안정성, 보안 체계를 먼저 설명하는 경향이 강해졌습니다.',
  ],
  implications: [
    'SK AX 제안서에는 기술 데모보다 운영 전환 로드맵과 KPI 증빙을 먼저 배치해야 합니다.',
    '카드뉴스와 브리핑은 고객 산업별 레퍼런스 묶음으로 재구성하는 편이 유리합니다.',
    'Peer 비교 화면에서는 단순 기사량보다 IR 수치와 실제 수주 맥락을 함께 보여줘야 의사결정 근거가 선명해집니다.',
    '그래프뷰에서는 기업 노드와 섹터 키워드를 분리해 “어떤 회사가 어떤 신호를 선점하는지”가 바로 보이도록 해야 합니다.',
  ],
  flowSteps: [
    { id: 'cause', label: '원인', description: 'AI 투자와 실적 발표 신호가 동시에 증가했습니다.' },
    { id: 'change', label: '변화', description: 'PoC보다 전사 확산형 구축 수요가 커졌습니다.' },
    { id: 'impact', label: '영향', description: '제안서에서 운영 KPI와 보안 거버넌스 요구가 강화됩니다.' },
    { id: 'response', label: '대응', description: '산업별 운영 패키지와 카드뉴스 전환이 필요합니다.' },
  ],
};

export function InsightResultView({
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { cards } = useCardNews();
  const relatedAssets = getExecutiveRank(cards).slice(0, 3);
  const [insightDetailCardId, setInsightDetailCardId] = useState<string | null>(null);
  const [insightDetailSlideIndex, setInsightDetailSlideIndex] = useState(0);
  const insightDetailCard = insightDetailCardId ? cards.find((card) => card.id === insightDetailCardId) ?? null : null;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Insight result"
          title={insightResult.title}
          subtitle="원인, 변화, 영향, 대응을 한 화면에서 연결해 읽을 수 있도록 재배치했습니다."
        />

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-5">
            <section data-guide="insight-summary" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
              <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
                    <Sparkles size={18} />
                  </span>
                  <h2 className="axis-section-heading">핵심 판단</h2>
                </div>
              </div>
              <div className="p-6">
              <p className="text-2xl font-semibold leading-9 text-[var(--axis-ink)]">{insightResult.summary}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {insightResult.flowSteps.map((step, index) => (
                  <article key={step.id} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_14px_36px_-34px_rgba(0,0,0,0.32)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[rgba(220,90,36,0.10)] px-2 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">{String(index + 1).padStart(2, '0')}</span>
                      <CircleDot size={18} className="text-[var(--axis-accent)]" />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[var(--axis-ink)]">{step.label}</h3>
                    <p className="mt-2 text-base leading-7 text-[var(--axis-body)]">{step.description}</p>
                  </article>
                ))}
              </div>
              </div>
            </section>
            <section data-guide="insight-analysis" className="grid gap-5 lg:grid-cols-2">
              <div className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                  <p className="axis-kicker">Evidence</p>
                  <h2 className="axis-section-heading mt-1">판단 근거</h2>
                </div>
                <ul className="space-y-2 p-5">
                  {insightResult.evidence.map((item, index) => (
                    <li key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-base leading-7 text-[var(--axis-body)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-semibold text-[var(--axis-success)]">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.28)]">
                <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.07)] px-5 py-4">
                  <p className="axis-kicker">Implications</p>
                  <h2 className="axis-section-heading mt-1">시사점</h2>
                </div>
                <ul className="space-y-2 p-5">
                  {insightResult.implications.map((item, index) => (
                    <li key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-base leading-7 text-[var(--axis-body)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.11)] text-xs font-semibold text-[var(--axis-accent-strong)]">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </main>

          <aside data-guide="insight-sources" className="grid gap-4 sm:grid-cols-2 2xl:block 2xl:space-y-4">
            {relatedAssets.length > 0 ? (
              relatedAssets.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setInsightDetailCardId(card.id)}
                  className="block w-full overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[#081324] text-left shadow-[0_18px_48px_-34px_rgba(0,0,0,0.55)] transition hover:border-[var(--axis-accent)]"
                >
                  <div className="relative aspect-[16/9] 2xl:aspect-[4/5]">
                    {card.coverImageUrl ? (
                      <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#081324]/48 to-black/92" />
                    <div className="relative flex h-full flex-col justify-between p-4 text-white">
                      <div className="flex items-start justify-between gap-2 text-xs font-semibold">
                        <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{getDisplayDate(card)}</span>
                        <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{card.category_label ?? card.category}</span>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">{getPeerLabel(card)}</p>
                        <h3 className="line-clamp-3 text-[clamp(15px,1.3vw,18px)] font-semibold leading-tight text-white">{card.title}</h3>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <EmptyBlock label="관련 콘텐츠 카드가 없습니다." />
            )}
          </aside>
        </section>
      </ExecutiveContainer>
      {insightDetailCard ? (
        <FloatingCardNewsOverlay
          card={insightDetailCard}
          bookmarked={bookmarkedIds.includes(insightDetailCard.id)}
          slideIndex={insightDetailSlideIndex}
          onSlideChange={setInsightDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(insightDetailCard.id)}
          onClose={() => {
            setInsightDetailCardId(null);
            setInsightDetailSlideIndex(0);
          }}
        />
      ) : null}
      <FloatingAiChat />
    </ExecutivePage>
  );
}

type KeywordNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  category: '기업' | 'AX' | '보안' | '인프라' | '수주';
  score: number;
  changeRate: number;
  sourceType: string;
};

type KeywordEdge = {
  source: string;
  target: string;
  weight: number;
  relationType: string;
};

const graphNodes: KeywordNode[] = [
  { id: 'sk-axis', label: 'SK AX', x: 450, y: 280, size: 42, category: '기업', score: 96, changeRate: 18, sourceType: 'home' },
  { id: 'samsung-sds', label: '삼성SDS', x: 155, y: 118, size: 38, category: '기업', score: 91, changeRate: 13, sourceType: 'peer' },
  { id: 'lg-cns', label: 'LG CNS', x: 742, y: 124, size: 38, category: '기업', score: 89, changeRate: 16, sourceType: 'peer' },
  { id: 'hyundai-autoever', label: '현대오토에버', x: 174, y: 446, size: 38, category: '기업', score: 84, changeRate: 9, sourceType: 'peer' },
  { id: 'posco-dx', label: '포스코DX', x: 744, y: 450, size: 38, category: '기업', score: 86, changeRate: 14, sourceType: 'peer' },
  { id: 'axis', label: 'AX', x: 450, y: 196, size: 25, category: 'AX', score: 95, changeRate: 19, sourceType: 'home' },
  { id: 'ai-transformation', label: 'AI Transformation', x: 318, y: 162, size: 20, category: 'AX', score: 87, changeRate: 20, sourceType: 'cardnews' },
  { id: 'ai-shift', label: 'AI 전환', x: 600, y: 172, size: 20, category: 'AX', score: 82, changeRate: 15, sourceType: 'home' },
  { id: 'agentic-ai', label: '에이전틱 AI', x: 512, y: 112, size: 22, category: 'AX', score: 88, changeRate: 22, sourceType: 'cardnews' },
  { id: 'llm', label: 'LLM', x: 242, y: 66, size: 17, category: 'AX', score: 69, changeRate: 7, sourceType: 'insight' },
  { id: 'rag', label: 'RAG', x: 322, y: 72, size: 16, category: 'AX', score: 65, changeRate: 6, sourceType: 'insight' },
  { id: 'ai-agent', label: 'AI 에이전트', x: 656, y: 64, size: 19, category: 'AX', score: 81, changeRate: 14, sourceType: 'cardnews' },
  { id: 'generative-ai', label: '생성형 AI', x: 110, y: 218, size: 18, category: 'AX', score: 78, changeRate: 11, sourceType: 'cardnews' },
  { id: 'digital-twin', label: '디지털 트윈', x: 260, y: 382, size: 20, category: 'AX', score: 78, changeRate: 11, sourceType: 'peer' },
  { id: 'smart-factory', label: '스마트팩토리', x: 92, y: 520, size: 21, category: 'AX', score: 83, changeRate: 12, sourceType: 'peer' },
  { id: 'automation', label: '업무 자동화', x: 320, y: 505, size: 18, category: 'AX', score: 72, changeRate: 9, sourceType: 'home' },
  { id: 'security', label: '보안', x: 104, y: 302, size: 20, category: '보안', score: 79, changeRate: 12, sourceType: 'briefing' },
  { id: 'zero-trust', label: '제로트러스트', x: 230, y: 225, size: 17, category: '보안', score: 67, changeRate: 8, sourceType: 'cardnews' },
  { id: 'xdr', label: 'XDR', x: 62, y: 386, size: 16, category: '보안', score: 61, changeRate: 4, sourceType: 'cardnews' },
  { id: 'cloud-security', label: '클라우드 보안', x: 585, y: 376, size: 18, category: '보안', score: 70, changeRate: 10, sourceType: 'peer' },
  { id: 'cloud', label: '클라우드', x: 805, y: 236, size: 20, category: '인프라', score: 74, changeRate: 6, sourceType: 'peer' },
  { id: 'msp', label: 'MSP', x: 690, y: 220, size: 17, category: '인프라', score: 63, changeRate: 4, sourceType: 'news' },
  { id: 'datacenter', label: '데이터센터', x: 810, y: 345, size: 18, category: '인프라', score: 68, changeRate: 5, sourceType: 'insight' },
  { id: 'gpu', label: 'GPU 클러스터', x: 632, y: 520, size: 18, category: '인프라', score: 66, changeRate: 7, sourceType: 'cardnews' },
  { id: 'kubernetes', label: 'Kubernetes', x: 520, y: 492, size: 15, category: '인프라', score: 52, changeRate: 2, sourceType: 'news' },
  { id: 'deal', label: '수주', x: 588, y: 302, size: 22, category: '수주', score: 80, changeRate: 13, sourceType: 'news' },
  { id: 'mega-deal', label: '메가딜', x: 790, y: 65, size: 18, category: '수주', score: 71, changeRate: 10, sourceType: 'news' },
  { id: 'contract', label: '공급 계약', x: 694, y: 302, size: 16, category: '수주', score: 62, changeRate: 6, sourceType: 'peer' },
  { id: 'preferred', label: '우선협상대상자', x: 842, y: 525, size: 18, category: '수주', score: 73, changeRate: 12, sourceType: 'cardnews' },
  { id: 'public', label: '디지털플랫폼정부', x: 628, y: 38, size: 17, category: '수주', score: 64, changeRate: 9, sourceType: 'news' },
];

const graphEdges: KeywordEdge[] = [
  { source: 'sk-axis', target: 'axis', weight: 5, relationType: '핵심 축' },
  { source: 'sk-axis', target: 'agentic-ai', weight: 4, relationType: '차별화' },
  { source: 'sk-axis', target: 'cloud-security', weight: 3, relationType: '거버넌스' },
  { source: 'sk-axis', target: 'deal', weight: 3, relationType: '제안 근거' },
  { source: 'samsung-sds', target: 'generative-ai', weight: 4, relationType: 'FabriX 신호' },
  { source: 'samsung-sds', target: 'llm', weight: 3, relationType: 'AI 플랫폼' },
  { source: 'samsung-sds', target: 'rag', weight: 3, relationType: '지식 검색' },
  { source: 'samsung-sds', target: 'zero-trust', weight: 3, relationType: '보안' },
  { source: 'lg-cns', target: 'ai-shift', weight: 4, relationType: 'AX 전환' },
  { source: 'lg-cns', target: 'ai-agent', weight: 4, relationType: 'AI agent' },
  { source: 'lg-cns', target: 'cloud', weight: 3, relationType: '클라우드' },
  { source: 'lg-cns', target: 'mega-deal', weight: 3, relationType: '수주' },
  { source: 'hyundai-autoever', target: 'digital-twin', weight: 4, relationType: '제조 데이터' },
  { source: 'hyundai-autoever', target: 'smart-factory', weight: 4, relationType: '스마트팩토리' },
  { source: 'hyundai-autoever', target: 'automation', weight: 3, relationType: '업무 자동화' },
  { source: 'hyundai-autoever', target: 'security', weight: 2, relationType: '운영 보안' },
  { source: 'posco-dx', target: 'gpu', weight: 3, relationType: 'AI 인프라' },
  { source: 'posco-dx', target: 'datacenter', weight: 3, relationType: '데이터센터' },
  { source: 'posco-dx', target: 'preferred', weight: 4, relationType: '공공 수주' },
  { source: 'posco-dx', target: 'contract', weight: 3, relationType: '계약' },
  { source: 'axis', target: 'ai-transformation', weight: 5, relationType: 'AX 상위 키워드' },
  { source: 'axis', target: 'ai-shift', weight: 4, relationType: '전환' },
  { source: 'axis', target: 'agentic-ai', weight: 5, relationType: '에이전틱' },
  { source: 'axis', target: 'smart-factory', weight: 3, relationType: '제조 AX' },
  { source: 'ai-transformation', target: 'agentic-ai', weight: 4, relationType: 'AI 연결' },
  { source: 'agentic-ai', target: 'llm', weight: 3, relationType: '기술 기반' },
  { source: 'llm', target: 'rag', weight: 2, relationType: '검색 증강' },
  { source: 'security', target: 'zero-trust', weight: 3, relationType: '거버넌스' },
  { source: 'security', target: 'xdr', weight: 2, relationType: '탐지 대응' },
  { source: 'security', target: 'cloud-security', weight: 3, relationType: '클라우드 보안' },
  { source: 'cloud', target: 'msp', weight: 2, relationType: '운영 관리' },
  { source: 'cloud', target: 'cloud-security', weight: 3, relationType: '보안 내재화' },
  { source: 'datacenter', target: 'gpu', weight: 2, relationType: 'AI 인프라' },
  { source: 'gpu', target: 'kubernetes', weight: 2, relationType: '컨테이너' },
  { source: 'deal', target: 'mega-deal', weight: 3, relationType: '대형 수주' },
  { source: 'deal', target: 'contract', weight: 2, relationType: '계약' },
  { source: 'deal', target: 'preferred', weight: 3, relationType: '선정' },
  { source: 'preferred', target: 'public', weight: 2, relationType: '공공 사업' },
  { source: 'public', target: 'cloud', weight: 2, relationType: '정부 클라우드' },
];

const graphCategoryColor: Record<KeywordNode['category'], string> = {
  기업: 'var(--axis-graph-company)',
  AX: 'var(--axis-graph-ax)',
  보안: 'var(--axis-graph-security)',
  인프라: 'var(--axis-graph-infra)',
  수주: 'var(--axis-graph-deal)',
};

const graphCompanyAliases: Record<string, string[]> = {
  'sk-axis': ['SK AX', 'SKAX', 'AX', 'AI 전환', '수주'],
  'samsung-sds': ['삼성SDS', '삼성 SDS', 'Samsung SDS', 'FabriX'],
  'lg-cns': ['LG CNS', 'LGCNS', 'DAP GenAI'],
  'hyundai-autoever': ['현대오토에버', '현대 오토에버', 'AutoEver', '스마트팩토리'],
  'posco-dx': ['포스코DX', '포스코 DX', '디지털플랫폼정부', '메가딜'],
};

function normalizeGraphTerm(value: string) {
  return value.replace(/\s/g, '').toLowerCase();
}

function resolveCssColor(value: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const variableMatch = value.match(/^var\((--[^)]+)\)$/);
  if (!variableMatch) return value;
  return getComputedStyle(document.documentElement).getPropertyValue(variableMatch[1]).trim() || fallback;
}

function getGraphNodeDisplayRadius(node: KeywordNode, active = false) {
  const base = node.category === '기업'
    ? node.size / 3.2
    : node.size >= 22
      ? node.size / 3.8
      : node.size / 4.35;
  return base + (active ? 2.4 : 0);
}

function splitGraphLabel(label: string) {
  if (label.includes(' ') && label.length > 11) {
    const parts = label.split(' ');
    const midpoint = Math.ceil(parts.length / 2);
    return [parts.slice(0, midpoint).join(' '), parts.slice(midpoint).join(' ')];
  }
  if (label.length > 7) {
    const midpoint = Math.ceil(label.length / 2);
    return [label.slice(0, midpoint), label.slice(midpoint)];
  }
  return [label];
}

function getSpherePosition(node: KeywordNode, radius: number, index = 0) {
  if (node.id === 'sk-axis') {
    return new THREE.Vector3(0, 0, 0);
  }

  const companyAnchors: Record<string, [number, number, number]> = {
    'samsung-sds': [-0.66, 0.58, -0.46],
    'lg-cns': [0.72, 0.54, -0.34],
    'hyundai-autoever': [-0.58, -0.62, 0.48],
    'posco-dx': [0.62, -0.58, 0.50],
  };

  const anchor = companyAnchors[node.id];
  if (anchor) {
    return new THREE.Vector3(anchor[0], anchor[1], anchor[2]).normalize().multiplyScalar(radius * 0.98);
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const normalizedIndex = index + 1.5;
  const phi = Math.acos(1 - (2 * normalizedIndex) / (graphNodes.length + 2));
  const theta = normalizedIndex * goldenAngle;
  const layer = node.size >= 21 ? 0.94 : 0.58 + (index % 6) * 0.07;
  const layeredRadius = radius * Math.min(1, layer);
  return new THREE.Vector3(
    layeredRadius * Math.sin(phi) * Math.cos(theta),
    layeredRadius * Math.cos(phi),
    layeredRadius * Math.sin(phi) * Math.sin(theta),
  );
}

function KeywordSphereGraph({
  nodes,
  edges,
  selectedId,
  zoom = 1,
  fullscreen = false,
  onSelectNode,
  onCloseFullscreen,
}: {
  nodes: KeywordNode[];
  edges: KeywordEdge[];
  selectedId: string;
  zoom?: number;
  fullscreen?: boolean;
  onSelectNode: (nodeId: string) => void;
  onCloseFullscreen?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onSelectRef = useRef(onSelectNode);
  const groupRef = useRef<THREE.Group | null>(null);
  const rotationRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0];

  useEffect(() => {
    onSelectRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    groupRef.current?.scale.setScalar(zoom);
  }, [zoom]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1200);
    camera.position.set(0, 0, fullscreen ? 540 : 470);

    const group = new THREE.Group();
    const preservedRotation = rotationRef.current;
    group.rotation.x = preservedRotation?.x ?? (fullscreen ? 0.18 : 0.12);
    group.rotation.y = preservedRotation?.y ?? 0;
    group.rotation.z = preservedRotation?.z ?? 0;
    group.scale.setScalar(zoom);
    groupRef.current = group;
    scene.add(group);

    const radius = fullscreen ? 214 : 146;
    const nodePositions = new Map<string, THREE.Vector3>();
    nodes.forEach((node, index) => nodePositions.set(node.id, getSpherePosition(node, radius, index)));
    const isDarkMode = document.documentElement.classList.contains('dark');

    group.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.PointLight(0xffffff, 1.2);
    keyLight.position.set(120, 180, 260);
    group.add(keyLight);

    edges.forEach((edge) => {
      const source = nodePositions.get(edge.source);
      const target = nodePositions.get(edge.target);
      if (!source || !target) return;
      const active = selectedId === edge.source || selectedId === edge.target;
      const geometry = new THREE.BufferGeometry().setFromPoints([source, target]);
      const material = new THREE.LineBasicMaterial({
        color: active
          ? resolveCssColor('var(--axis-graph-active-edge)', '#DC5A24')
          : (isDarkMode ? '#F5E7D2' : resolveCssColor('var(--axis-graph-edge)', '#8D8173')),
        transparent: true,
        opacity: active ? 0.92 : (isDarkMode ? 0.62 : 0.5),
        depthTest: false,
        depthWrite: false,
      });
      group.add(new THREE.Line(geometry, material));
    });

    const nodeMeshes: THREE.Mesh[] = [];
    const labelColor = isDarkMode ? '#FFF8EC' : resolveCssColor('var(--axis-ink)', '#1A1A1F');
    const labelStroke = isDarkMode ? 'rgba(4,5,8,0.96)' : 'rgba(255,255,255,0.98)';
    const createLabelSprite = (label: string, active: boolean, category: KeywordNode['category']) => {
      const labelCanvas = document.createElement('canvas');
      const context = labelCanvas.getContext('2d');
      const labelLines = splitGraphLabel(label);
      const fontSize = category === '기업' ? (active ? 36 : 31) : active ? 29 : 23;
      const lineHeight = fontSize * 1.05;
      const longestLine = labelLines.reduce((longest, line) => Math.max(longest, line.length), 0);
      const width = Math.max(120, longestLine * fontSize * 0.82 + 28);
      const height = Math.max(48, labelLines.length * lineHeight + 18);
      labelCanvas.width = width;
      labelCanvas.height = height;
      if (context) {
        context.font = `700 ${fontSize}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = labelColor;
        context.strokeStyle = labelStroke;
        context.lineWidth = isDarkMode ? 7 : 6;
        labelLines.forEach((line, index) => {
          const y = height / 2 + (index - (labelLines.length - 1) / 2) * lineHeight;
          context.strokeText(line, width / 2, y);
          context.fillText(line, width / 2, y);
        });
      }
      const texture = new THREE.CanvasTexture(labelCanvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: active ? 0.98 : 0.82,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(width / (fullscreen ? 4.7 : 5.2), height / (fullscreen ? 4.7 : 5.2), 1);
      return sprite;
    };

    nodes.forEach((node) => {
      const position = nodePositions.get(node.id);
      if (!position) return;
      const active = node.id === selectedId;
      const color = resolveCssColor(graphCategoryColor[node.category], '#D48362');
      const visibleRadius = getGraphNodeDisplayRadius(node, active);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(4.8, visibleRadius), 24, 16),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: active ? 0.24 : 0.08,
          roughness: 0.42,
          metalness: 0.08,
        }),
      );
      mesh.position.copy(position);
      mesh.userData.nodeId = node.id;
      group.add(mesh);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(visibleRadius + 8, node.category === '기업' ? 20 : 14), 18, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hitMesh.position.copy(position);
      hitMesh.userData.nodeId = node.id;
      nodeMeshes.push(hitMesh);
      group.add(hitMesh);

      const labelSprite = createLabelSprite(node.label, active || node.category === '기업', node.category);
      labelSprite.position.copy(position);
      group.add(labelSprite);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragState = { dragging: false, lastX: 0, lastY: 0, moved: false };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (dragState.dragging) {
        const dx = event.clientX - dragState.lastX;
        const dy = event.clientY - dragState.lastY;
        group.rotation.y += dx * 0.006;
        group.rotation.x += dy * 0.004;
        rotationRef.current = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
        dragState.lastX = event.clientX;
        dragState.lastY = event.clientY;
        dragState.moved = dragState.moved || Math.abs(dx) + Math.abs(dy) > 2;
        canvas.style.cursor = 'grabbing';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      canvas.style.cursor = raycaster.intersectObjects(nodeMeshes, false).length > 0 ? 'pointer' : 'default';
    };

    const handlePointerDown = (event: PointerEvent) => {
      dragState.dragging = true;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
      dragState.moved = false;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerUp = (event: PointerEvent) => {
      dragState.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      canvas.style.cursor = 'default';
    };

    const handleClick = (event: MouseEvent) => {
      if (dragState.moved) {
        dragState.moved = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(nodeMeshes, false);
      const nodeId = hit?.object.userData.nodeId;
      if (typeof nodeId === 'string') onSelectRef.current(nodeId);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('click', handleClick);
    resize();

    let frameId = 0;
    const animate = () => {
      if (!dragState.dragging) {
        group.rotation.y += fullscreen ? 0.0014 : 0.001;
        rotationRef.current = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      canvas.removeEventListener('click', handleClick);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        }
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          object.material.dispose();
        }
      });
      rotationRef.current = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
      renderer.dispose();
      groupRef.current = null;
    };
  }, [edges, fullscreen, nodes, selectedId]);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_38%,var(--axis-surface-muted),var(--axis-surface-soft)_52%,var(--axis-canvas))] ${
        fullscreen ? 'h-full w-full' : 'h-full'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="360도 회전 키워드 구 그래프" />
      <div data-keyword-sphere-info className="pointer-events-none absolute left-5 top-5 hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/90 px-4 py-3 shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] backdrop-blur md:block">
        <p className="axis-kicker">3D keyword sphere</p>
        <h2 className="mt-1 text-base font-semibold text-[var(--axis-ink)]">{selectedNode?.label ?? '키워드 그래프'}</h2>
        <p className="mt-1 text-xs text-[var(--axis-muted)]">드래그로 회전하고, 노드를 선택하면 카드뉴스가 열립니다.</p>
      </div>
      {fullscreen && onCloseFullscreen ? (
        <button
          type="button"
          onClick={onCloseFullscreen}
          className="absolute right-5 top-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)]"
        >
          전체화면 닫기
        </button>
      ) : null}
      <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
        {(['기업', 'AX', '보안', '인프라', '수주'] as const).map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/86 px-3 py-1.5 text-xs font-semibold text-[var(--axis-body)] backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: graphCategoryColor[item] }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function KeywordGraphView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { dashboard } = useDashboard();
  const { cards } = useCardNews();
  const [selectedId, setSelectedId] = useState('sk-axis');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [category, setCategory] = useState<KeywordNode['category'] | '전체'>('전체');
  const [scale, setScale] = useState(1);
  const [graphPan, setGraphPan] = useState({ x: 0, y: 0 });
  const graphPanRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const [detailOpen, setDetailOpen] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const [keywordOverlayOpen, setKeywordOverlayOpen] = useState(false);
  const [overlayPage, setOverlayPage] = useState(0);
  const [graphMode, setGraphMode] = useState<'2d' | '3d'>('2d');
  const [graphFullscreenMode, setGraphFullscreenMode] = useState<'2d' | '3d' | null>(null);
  const [keywordDetailCardId, setKeywordDetailCardId] = useState<string | null>(null);
  const [keywordDetailSlideIndex, setKeywordDetailSlideIndex] = useState(0);

  const visibleNodes = useMemo(() => graphNodes.filter((node) => category === '전체' || node.category === category), [category]);
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    return graphEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  }, [visibleNodes]);
  const selected = graphNodes.find((node) => node.id === selectedId) ?? graphNodes[0];
  const trendData: DashboardKeywordSearchPoint[] = dashboard?.keywordSearchPoints ?? [];
  const rankedCardsForKeyword = useMemo(() => getExecutiveRank(cards), [cards]);
  const overlayCardsAll = useMemo(() => {
    const normalizedTerms = [selected.label, selected.category, selected.sourceType, ...(graphCompanyAliases[selected.id] ?? [])]
      .filter(Boolean)
      .map(normalizeGraphTerm);
    const matched = rankedCardsForKeyword.filter((card) => {
      const haystack = normalizeGraphTerm([
        card.title,
        getPeerLabel(card),
        card.category,
        card.category_label,
        card.subtitle,
        card.sector,
        ...(card.summary_lines ?? card.summary),
        ...(card.insights ?? []),
      ]
        .filter(Boolean)
        .join(' '));
      return normalizedTerms.some((term) => haystack.includes(term) || term.includes(normalizeGraphTerm(card.category_label ?? card.category)));
    });
    return matched.length > 0 ? matched : rankedCardsForKeyword;
  }, [rankedCardsForKeyword, selected.category, selected.id, selected.label, selected.sourceType]);
  const overlayPageSize = 3;
  const overlayPageCount = Math.max(1, Math.ceil(overlayCardsAll.length / overlayPageSize));
  const safeOverlayPage = overlayPage % overlayPageCount;
  const overlayCards = overlayCardsAll.slice(safeOverlayPage * overlayPageSize, safeOverlayPage * overlayPageSize + overlayPageSize);
  const keywordDetailCard = keywordDetailCardId ? cards.find((card) => card.id === keywordDetailCardId) ?? null : null;

  useEffect(() => {
    setOverlayPage(0);
  }, [selectedId]);

  const getNode = (id: string) => graphNodes.find((node) => node.id === id) ?? graphNodes[0];
  const selectGraphNode = (nodeId: string) => {
    setSelectedId(nodeId);
    if (window.matchMedia('(min-width: 1280px)').matches) {
      setDetailOpen(true);
    }
    setKeywordOverlayOpen(true);
  };
  const handleGraphPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('g[role="button"]')) return;
    graphPanRef.current = { dragging: true, lastX: event.clientX, lastY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleGraphPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!graphPanRef.current.dragging) return;
    const dx = event.clientX - graphPanRef.current.lastX;
    const dy = event.clientY - graphPanRef.current.lastY;
    graphPanRef.current.lastX = event.clientX;
    graphPanRef.current.lastY = event.clientY;
    setGraphPan((current) => ({ x: current.x + dx, y: current.y + dy }));
  };
  const handleGraphPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    graphPanRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleGraphWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    const nextDelta = event.deltaY > 0 ? -0.08 : 0.08;
    setScale((current) => Math.min(1.45, Math.max(0.75, Number((current + nextDelta).toFixed(2)))));
  };
  const renderKeywordSvg = (fullscreen = false) => (
    <svg
      viewBox="0 0 900 560"
      className={`h-full w-full cursor-grab active:cursor-grabbing ${fullscreen ? 'bg-[var(--axis-surface-soft)]' : ''}`}
      role="img"
      aria-label="키워드 관계 그래프"
      style={{ touchAction: 'none' }}
      onPointerDown={handleGraphPointerDown}
      onPointerMove={handleGraphPointerMove}
      onPointerUp={handleGraphPointerUp}
      onPointerLeave={handleGraphPointerUp}
    >
      <g transform={`translate(${graphPan.x + 450 - 450 * scale} ${graphPan.y + 280 - 280 * scale}) scale(${scale})`}>
        {visibleEdges.map((edge) => {
          const source = getNode(edge.source);
          const target = getNode(edge.target);
          const active = selectedId === edge.source || selectedId === edge.target || hoveredId === edge.source || hoveredId === edge.target;
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={active ? 'var(--axis-graph-active-edge)' : 'var(--axis-graph-edge)'}
              strokeWidth={edge.weight}
              strokeLinecap="round"
            />
          );
        })}
        {visibleNodes.map((node) => {
          const active = selectedId === node.id || hoveredId === node.id;
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              onClick={() => selectGraphNode(node.id)}
              onDoubleClick={() => onNavigate(node.sourceType === 'cardnews' ? 'issues' : 'insight')}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size + (active ? 5 : 0)}
                fill={graphCategoryColor[node.category]}
                fillOpacity={active ? 0.95 : 0.78}
                stroke={active ? 'var(--axis-ink)' : 'var(--axis-canvas)'}
                strokeWidth={active ? 3 : 2}
              />
              <text
                x={node.x}
                y={node.y + node.size + 18}
                textAnchor="middle"
                fontSize={active ? 15 : 13}
                fontWeight={active ? 700 : 600}
                fill="var(--axis-ink)"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );

  return (
    <ExecutivePage>
      <ExecutiveContainer className="max-w-none px-3 pb-3 pt-2 sm:px-4 lg:px-4">
        <section className="axis-panel-flat min-h-0 overflow-hidden">
          <header className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-end">
            <h1 className="sr-only">키워드 그래프</h1>
            <div data-guide="keyword-controls" className="flex flex-wrap gap-2">
              <div data-guide="keyword-filter" className="flex flex-wrap gap-2">
              <FilterChip active={category === '전체'} onClick={() => setCategory('전체')}>전체</FilterChip>
              {(['기업', 'AX', '보안', '인프라', '수주'] as const).map((item) => (
                <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</FilterChip>
              ))}
              </div>
              <ExecutiveButton variant="secondary" icon={<Minus size={15} />} onClick={() => setScale((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))))}>축소</ExecutiveButton>
              <span className="inline-flex min-h-10 items-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)]">
                {Math.round(scale * 100)}%
              </span>
              <ExecutiveButton variant="secondary" icon={<Plus size={15} />} onClick={() => setScale((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}>확대</ExecutiveButton>
              <ExecutiveButton
                variant={graphMode === '3d' ? 'primary' : 'secondary'}
                icon={<Box size={15} />}
                onClick={() => setGraphMode((mode) => (mode === '3d' ? '2d' : '3d'))}
              >
                3D 보기
              </ExecutiveButton>
              <ExecutiveButton
                variant="secondary"
                icon={<Maximize2 size={15} />}
                onClick={() => setGraphFullscreenMode(graphMode)}
              >
                전체화면
              </ExecutiveButton>
            </div>
          </header>

          <div className="grid h-[calc(100dvh-156px)] min-h-[620px] gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
            <main data-guide="keyword-map" className="relative min-h-0 bg-[var(--axis-surface-soft)]" onWheel={handleGraphWheel}>
              {graphMode === '3d' ? (
                <KeywordSphereGraph
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  selectedId={selectedId}
                  zoom={scale}
                  onSelectNode={selectGraphNode}
                />
              ) : (
                renderKeywordSvg()
              )}
              {hoveredId ? (
                <div className="pointer-events-none absolute left-5 top-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs text-[var(--axis-body)]">
                  {getNode(hoveredId).label}
                </div>
              ) : null}
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
                          <button
                            type="button"
                            onClick={() => setOverlayPage((page) => (page + 1) % overlayPageCount)}
                            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                          >
                            다음 카드뉴스
                          </button>
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
                    <div className="grid gap-3 md:grid-cols-3">
                      {overlayCards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setKeywordDetailCardId(card.id)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)]"
                        >
                          <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-[var(--axis-radius-md)] bg-[#081324]">
                            {card.coverImageUrl ? (
                              <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
                            <span className="absolute bottom-2 left-2 text-xs font-semibold text-white">{getPeerLabel(card)}</span>
                          </div>
                          <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
                          <h3 className="mt-1 line-clamp-3 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
                        </button>
                      ))}
                    </div>
                    {overlayCardsAll.length === 0 ? (
                      <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                        연결된 카드뉴스가 없습니다.
                      </div>
                    ) : null}
                  </section>
                </div>
              ) : null}
            </main>

            <aside className={`min-h-0 overflow-y-auto border-t border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 xl:border-l xl:border-t-0 ${detailOpen ? '' : 'xl:w-20'}`}>
              <button
                type="button"
                onClick={() => setDetailOpen((open) => !open)}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--axis-accent-strong)]"
              >
                <Network size={16} />
                {detailOpen ? '상세 접기' : '상세 열기'}
              </button>
              {detailOpen ? (
                <div className="min-w-0 space-y-4">
                  <div className="min-w-0">
                    <p className="axis-kicker">Selected keyword</p>
                    <h2 className="mt-1 break-keep text-xl font-display font-semibold leading-tight text-ink">{selected.label}</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <MiniStat label="전일 대비" value={`${selected.changeRate > 0 ? '+' : ''}${selected.changeRate}%`} />
                    <MiniStat label="분류" value={selected.category} />
                    <MiniStat label="출처" value={selected.sourceType} />
                  </div>
                  <div>
                    <p className="axis-kicker">Connected</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {graphEdges
                        .filter((edge) => edge.source === selected.id || edge.target === selected.id)
                        .map((edge) => {
                          const connectedId = edge.source === selected.id ? edge.target : edge.source;
                          return (
                            <ExecutiveBadge key={`${edge.source}-${edge.target}`} tone="accent">
                              {getNode(connectedId).label}
                            </ExecutiveBadge>
                          );
                        })}
                    </div>
                  </div>
                  <div className="h-[142px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                        <CartesianGrid stroke="var(--axis-graph-edge)" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--axis-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--axis-muted)' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="agenticAi" name="언급량" stroke="var(--axis-graph-ax)" strokeWidth={2.2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <ExecutiveButton variant="secondary" onClick={() => onNavigate('insight')}>
                    관련 인사이트 보기
                  </ExecutiveButton>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </ExecutiveContainer>
      {graphFullscreenMode ? (
        <div className="fixed inset-0 z-50 bg-[var(--axis-canvas)]" onWheel={handleGraphWheel}>
          {graphFullscreenMode === '3d' ? (
            <KeywordSphereGraph
              nodes={visibleNodes}
              edges={visibleEdges}
              selectedId={selectedId}
              zoom={scale}
              fullscreen
              onSelectNode={selectGraphNode}
            />
          ) : (
            <div className="h-full w-full bg-[var(--axis-surface-soft)]">
              {renderKeywordSvg(true)}
            </div>
          )}
          <div className="absolute left-3 right-3 top-16 z-20 flex flex-wrap justify-end gap-2 sm:left-auto sm:right-5 sm:top-20 sm:max-w-[520px]">
            {(['전체', '기업', 'AX', '보안', '인프라', '수주'] as const).map((item) => (
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
          <div className="absolute left-3 right-3 top-3 z-20 grid grid-cols-[44px_64px_44px_minmax(92px,1fr)_112px] gap-2 sm:left-auto sm:right-5 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
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
              onClick={() => {
                const nextMode = graphFullscreenMode === '3d' ? '2d' : '3d';
                setGraphFullscreenMode(nextMode);
                setGraphMode(nextMode);
              }}
              className={`h-10 min-w-0 rounded-[var(--axis-radius-md)] border px-2 text-xs font-semibold shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] transition sm:w-[104px] sm:px-4 sm:text-sm ${
                graphFullscreenMode === '3d'
                  ? 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
                  : 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
              }`}
            >
              {graphFullscreenMode === '3d' ? '키워드 보기' : '3D 보기'}
            </button>
            <button
              type="button"
              onClick={() => setGraphFullscreenMode(null)}
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
                      <button
                        type="button"
                        onClick={() => setOverlayPage((page) => (page + 1) % overlayPageCount)}
                        className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                      >
                        다음
                      </button>
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
                <div className="grid gap-3 md:grid-cols-3">
                  {overlayCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setKeywordDetailCardId(card.id)}
                      className="min-w-0 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)]"
                    >
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-[var(--axis-radius-md)] bg-[#081324]">
                        {card.coverImageUrl ? (
                          <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
                        <span className="absolute bottom-2 left-2 text-xs font-semibold text-white">{getPeerLabel(card)}</span>
                      </div>
                      <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
                      <h3 className="mt-1 line-clamp-3 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      ) : null}
      {keywordDetailCard ? (
        <FloatingCardNewsOverlay
          card={keywordDetailCard}
          bookmarked={bookmarkedIds.includes(keywordDetailCard.id)}
          slideIndex={keywordDetailSlideIndex}
          onSlideChange={setKeywordDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(keywordDetailCard.id)}
          onClose={() => {
            setKeywordDetailCardId(null);
            setKeywordDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
