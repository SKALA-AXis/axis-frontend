import { type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  CartesianGrid,
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
  getLatestFirst,
  getPeerLabel,
  getSummaryLines,
} from '../../features/card-news/mappers/cardNewsExecutive';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import type { DashboardKeywordSearchPoint } from '../../features/dashboard/model/dashboard';
import {
  homeKeywordSpikeInsights,
  homePositioningMapData,
} from '../../shared/mocks/homeDashboardPresentation';
import { cardNewsItems as fallbackCardNewsItems } from '../../shared/mocks/cardNews';
import { mockInsightResult } from '../../shared/mocks/insight';
import {
  graphCategoryColor,
  graphCompanyAliases,
  graphEdges,
  graphNodes,
  type KeywordEdge,
  type KeywordNode,
} from '../../shared/mocks/keywordGraph';
import { mockMixerConfig } from '../../shared/mocks/mixer';
import { mockPeerPlusIrProfiles, mockPeerPlusKeywordCloud, mockPeerPlusOptions, peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../shared/mocks/peerPlus';
import { useContentViewMode } from '../../shared/hooks/useContentViewMode';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from './executive/ExecutiveSystem';

type NavigateHandler = (view: string) => void;
type PositioningTone = 'accent' | 'company' | 'infra' | 'security' | 'deal' | 'success';

type PositioningPoint = {
  name: string;
  shortLabel: string;
  similarity: number;
  influence: number;
  size: number;
  tone: PositioningTone;
  caption: string;
  impactTitle: string;
  impactBody: string;
  watchTitle: string;
  watchBody: string;
  insightBody: string;
};

type KeywordSpikeInsight = (typeof homeKeywordSpikeInsights)[number];

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

function MixerAnalysisOverlay() {
  const loadingSteps = [
    {
      title: '수집 에이전트',
      description: '선택한 카드와 필터 조건을 읽고 비교 가능한 입력 묶음으로 정리합니다.',
      detail: '카드 조합 정렬 중',
      icon: <Box size={16} />,
    },
    {
      title: '분류 에이전트',
      description: '산업, 고객, 키워드 신호를 같은 문맥 안에서 다시 분류합니다.',
      detail: '반복 신호 분석 중',
      icon: <Filter size={16} />,
    },
    {
      title: '비교 에이전트',
      description: 'Peer와 선택 근거를 교차해 겹치는 패턴과 차이를 찾습니다.',
      detail: '연결 관계 검토 중',
      icon: <Network size={16} />,
    },
    {
      title: '믹서',
      description: '앞 단계 결과를 받아 최종 인사이트 문장 형태로 압축합니다.',
      detail: '인사이트 문장 구성 중',
      icon: <Sparkles size={16} />,
    },
  ];
  const [activeStep, setActiveStep] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % loadingSteps.length);
      setPulseCount((current) => current + 1);
    }, 430);
    return () => window.clearInterval(interval);
  }, [loadingSteps.length]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[rgba(250,248,245,0.80)] backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(220,90,36,0.12),transparent_26%),radial-gradient(circle_at_82%_24%,rgba(90,107,87,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.58),rgba(245,238,228,0.72))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,110,96,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,110,96,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55" />

      <div className="absolute inset-0 flex items-center justify-center px-5">
        <div className="axis-panel-flat mixer-analysis-shell relative w-full max-w-[640px] overflow-hidden rounded-[var(--axis-radius-xl)] px-7 py-7 shadow-[0_36px_90px_-44px_rgba(26,26,31,0.38)]">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,90,36,0.45),transparent)]" />
          <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative mx-auto h-[180px] w-[180px]">
              <div className="mixer-ring mixer-ring-outer" />
              <div className="mixer-ring mixer-ring-middle" />
              <div className="mixer-ring mixer-ring-inner" />

              <div className="mixer-signal mixer-signal-one" />
              <div className="mixer-signal mixer-signal-two" />
              <div className="mixer-signal mixer-signal-three" />

              <div className="mixer-card mixer-card-left">
                <div className="mixer-card-chip" />
                <div className="mixer-card-line mixer-card-line-long" />
                <div className="mixer-card-line mixer-card-line-short" />
              </div>
              <div className="mixer-card mixer-card-center">
                <div className="mixer-card-chip" />
                <div className="mixer-card-line mixer-card-line-long" />
                <div className="mixer-card-line mixer-card-line-short" />
              </div>
              <div className="mixer-card mixer-card-right">
                <div className="mixer-card-chip" />
                <div className="mixer-card-line mixer-card-line-long" />
                <div className="mixer-card-line mixer-card-line-short" />
              </div>
            </div>

            <div>
              <p className="axis-kicker">Mixer analysis</p>
              <h3 className="mt-2 text-[1.95rem] font-display font-semibold leading-tight tracking-[-0.04em] text-[var(--axis-ink)]">
                카드뉴스를 연결 가능한 인사이트로 재구성하고 있습니다.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--axis-muted)]">
                선택한 카드, 산업, 키워드 사이의 반복 문맥을 정리하고 SK AX 관점의 제안 문장으로 압축하는 중입니다.
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgba(120,110,96,0.12)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--axis-accent),rgba(220,90,36,0.45))] transition-[width] duration-300"
                  style={{ width: `${((activeStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
              <div className="mt-5 grid gap-2">
                {loadingSteps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isComplete = index < activeStep || pulseCount > loadingSteps.length;
                  return (
                  <div
                    key={step.title}
                    className={`mixer-step-row rounded-[var(--axis-radius-md)] border px-3 py-3 transition ${
                      isActive
                        ? 'border-[rgba(220,90,36,0.34)] bg-[rgba(220,90,36,0.08)] shadow-[0_12px_32px_-28px_rgba(220,90,36,0.62)]'
                        : isComplete
                          ? 'border-[rgba(90,107,87,0.26)] bg-[rgba(90,107,87,0.07)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)]'
                    }`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? 'bg-[rgba(220,90,36,0.14)] text-[var(--axis-accent-strong)]'
                          : isComplete
                            ? 'bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                            : 'bg-[var(--axis-canvas)] text-[var(--axis-muted)]'
                      }`}>
                        {step.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--axis-ink)]">{step.title}</span>
                          {isActive ? <span className="mixer-step-dot" /> : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--axis-body)]">{step.description}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[var(--axis-muted)]">
                          {isActive ? `${step.detail}...` : isComplete ? '분석 완료' : '대기 중'}
                        </p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>
      </div>
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

function getCardSourceOptions(card: CardNewsItem) {
  const fromSources = (card.sources ?? []).map((source, index) => ({
    id: `source-${index}`,
    title: source.title || source.source_name || `원문 ${index + 1}`,
    meta: source.source_name ?? source.published_at ?? '',
    url: source.url,
  }));
  const fromEvidence = (card.evidence_chain?.source_links ?? [])
    .filter((source) => typeof source.url === 'string' && source.url.trim().length > 0)
    .map((source, index) => ({
      id: `evidence-${index}`,
      title: source.title || source.source_name || `관련 기사 ${index + 1}`,
      meta: source.source_name ?? '',
      url: source.url as string,
    }));
  const fallback = card.sourceUrl && card.sourceUrl !== '#'
    ? [{
        id: 'fallback',
        title: card.source || '대표 원문',
        meta: '',
        url: card.sourceUrl,
      }]
    : [];

  const seen = new Set<string>();
  return [...fromSources, ...fromEvidence, ...fallback].filter((item) => {
    if (!item.url || seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
}

function dedupeCardsById(cards: CardNewsItem[]) {
  const byId = new Map<string, CardNewsItem>();
  cards.forEach((card) => {
    if (!byId.has(card.id)) {
      byId.set(card.id, card);
    }
  });
  return Array.from(byId.values());
}

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

function formatEokValue(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}조`;
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)}억`;
}

function ChartButton({
  title,
  helper,
  icon,
  children,
  controls,
  action,
}: {
  title: string;
  helper: string;
  icon: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="axis-panel-flat min-h-[320px] p-4 text-left transition hover:border-[var(--axis-accent)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="axis-kicker">{helper}</p>
          <h3 className="axis-section-heading mt-1">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          {controls}
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-[var(--axis-accent)]">
            {icon}
          </span>
        </div>
      </div>
      {children}
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

function getPositioningToneStyle(tone: PositioningTone) {
  switch (tone) {
    case 'accent':
      return {
        bubble: 'rgba(220,90,36,0.24)',
        border: 'rgba(220,90,36,0.72)',
        glow: 'rgba(220,90,36,0.18)',
        text: 'var(--axis-accent-strong)',
      };
    case 'company':
      return {
        bubble: 'rgba(74,120,255,0.18)',
        border: 'rgba(74,120,255,0.58)',
        glow: 'rgba(74,120,255,0.18)',
        text: 'var(--axis-graph-company)',
      };
    case 'infra':
      return {
        bubble: 'rgba(136,94,255,0.18)',
        border: 'rgba(136,94,255,0.56)',
        glow: 'rgba(136,94,255,0.16)',
        text: 'var(--axis-graph-infra)',
      };
    case 'security':
      return {
        bubble: 'rgba(55,161,124,0.18)',
        border: 'rgba(55,161,124,0.56)',
        glow: 'rgba(55,161,124,0.16)',
        text: 'var(--axis-success)',
      };
    case 'deal':
      return {
        bubble: 'rgba(203,146,62,0.18)',
        border: 'rgba(203,146,62,0.56)',
        glow: 'rgba(203,146,62,0.16)',
        text: 'var(--axis-graph-deal)',
      };
    case 'success':
      return {
        bubble: 'rgba(59,143,160,0.18)',
        border: 'rgba(59,143,160,0.56)',
        glow: 'rgba(59,143,160,0.16)',
        text: 'var(--axis-success)',
      };
  }
}

function HomePositioningMap({
  points,
  selectedName,
  onSelect,
}: {
  points: readonly PositioningPoint[];
  selectedName: string | null;
  onSelect: (pointName: string) => void;
}) {
  const minSimilarity = 0;
  const maxSimilarity = 100;
  const minInfluence = 0;
  const maxInfluence = 100;
  const averageSimilarity = 60;
  const averageInfluence = 45.6;
  const plotLeft = 74;
  const plotTop = 30;
  const plotWidth = 620;
  const plotHeight = 270;
  const plotRight = plotLeft + plotWidth;
  const plotBottom = plotTop + plotHeight;
  const xTicks = [0, 25, 50, 75, 100];
  const yTicks = [0, 25, 50, 75, 100];
  const xScale = (value: number) => plotLeft + ((value - minSimilarity) / (maxSimilarity - minSimilarity)) * plotWidth;
  const yScale = (value: number) => plotBottom - ((value - minInfluence) / (maxInfluence - minInfluence)) * plotHeight;

  return (
    <svg viewBox="0 0 760 360" className="h-[360px] w-full overflow-visible">
        <defs>
          <linearGradient id="home-position-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffaf3" />
            <stop offset="55%" stopColor="#f7f0e5" />
            <stop offset="100%" stopColor="#f4ede3" />
          </linearGradient>
          <filter id="home-position-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} fill="rgba(255,255,255,0.58)" stroke="rgba(26,26,31,0.12)" />

        <rect x={plotLeft} y={plotTop} width={xScale(averageSimilarity) - plotLeft} height={yScale(averageInfluence) - plotTop} fill="rgba(90,107,87,0.07)" />
        <rect x={xScale(averageSimilarity)} y={plotTop} width={plotRight - xScale(averageSimilarity)} height={yScale(averageInfluence) - plotTop} fill="rgba(220,90,36,0.08)" />
        <rect x={plotLeft} y={yScale(averageInfluence)} width={xScale(averageSimilarity) - plotLeft} height={plotBottom - yScale(averageInfluence)} fill="rgba(107,107,115,0.06)" />
        <rect x={xScale(averageSimilarity)} y={yScale(averageInfluence)} width={plotRight - xScale(averageSimilarity)} height={plotBottom - yScale(averageInfluence)} fill="rgba(236,163,65,0.10)" />

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line x1={plotLeft} y1={yScale(tick)} x2={plotRight} y2={yScale(tick)} stroke="rgba(26,26,31,0.08)" />
            <text x={plotLeft - 16} y={yScale(tick) + 4} fill="var(--axis-muted)" fontSize="12" textAnchor="end">{tick}</text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line x1={xScale(tick)} y1={plotTop} x2={xScale(tick)} y2={plotBottom} stroke="rgba(26,26,31,0.08)" />
            <text x={xScale(tick)} y={plotBottom + 24} fill="var(--axis-muted)" fontSize="12" textAnchor="middle">{tick.toLocaleString('ko-KR')}</text>
          </g>
        ))}

        <line x1={xScale(averageSimilarity)} y1={plotTop} x2={xScale(averageSimilarity)} y2={plotBottom} stroke="rgba(220,90,36,0.44)" strokeDasharray="4 4" />
        <line x1={plotLeft} y1={yScale(averageInfluence)} x2={plotRight} y2={yScale(averageInfluence)} stroke="rgba(90,107,87,0.44)" strokeDasharray="4 4" />

        <text x="14" y="24" fill="var(--axis-ink)" fontSize="15" fontWeight="700">시장 반응도</text>
        <text x="18" y="58" fill="var(--axis-accent-strong)" fontSize="12" fontWeight="700">높음</text>
        <text x="18" y={plotBottom + 20} fill="var(--axis-muted)" fontSize="12" fontWeight="700">낮음</text>
        <text x={plotLeft + plotWidth / 2} y="347" fill="var(--axis-ink)" fontSize="15" fontWeight="700" textAnchor="middle">SK AX와의 유사도</text>
        <text x={plotLeft} y="338" fill="var(--axis-muted)" fontSize="12" fontWeight="700">낮음</text>
        <text x={plotRight} y="338" fill="var(--axis-accent-strong)" fontSize="12" fontWeight="700" textAnchor="end">높음</text>

        <rect x={xScale(averageSimilarity) - 48} y="10" width="126" height="28" rx="14" fill="rgba(255,255,255,0.92)" stroke="rgba(26,26,31,0.10)" />
        <text x={xScale(averageSimilarity) + 15} y="29" fill="var(--axis-ink)" fontSize="12" fontWeight="700" textAnchor="middle">기준 유사도: {averageSimilarity}</text>
        <rect x={plotRight - 102} y={yScale(averageInfluence) - 18} width="138" height="28" rx="14" fill="rgba(255,255,255,0.92)" stroke="rgba(26,26,31,0.10)" />
        <text x={plotRight - 33} y={yScale(averageInfluence) + 1} fill="var(--axis-ink)" fontSize="12" fontWeight="700" textAnchor="middle">기준 반응도: {averageInfluence}</text>

        <text x={plotLeft + 16} y={54} fill="var(--axis-success)" fontSize="13" fontWeight="800">간접 벤치마크 군</text>
        <text x={plotLeft + 16} y={71} fill="var(--axis-body)" fontSize="9.5" fontWeight="600">결은 다르지만 반응이 큼</text>
        <text x={plotRight - 16} y={54} fill="var(--axis-accent-strong)" fontSize="13" fontWeight="800" textAnchor="end">직접 경쟁 핵심군</text>
        <text x={plotRight - 16} y={71} fill="var(--axis-body)" fontSize="9.5" fontWeight="600" textAnchor="end">유사도·반응도 모두 높음</text>
        <text x={plotLeft + 16} y={plotBottom - 22} fill="var(--axis-muted)" fontSize="13" fontWeight="800">저관여 관찰군</text>
        <text x={plotLeft + 16} y={plotBottom - 8} fill="var(--axis-body)" fontSize="9.5" fontWeight="600">우선순위는 낮지만 추적 필요</text>
        <text x={plotRight - 16} y={plotBottom - 22} fill="var(--axis-warning)" fontSize="13" fontWeight="800" textAnchor="end">유사하지만 반응 약함</text>
        <text x={plotRight - 16} y={plotBottom - 8} fill="var(--axis-body)" fontSize="9.5" fontWeight="600" textAnchor="end">제안 비교는 되지만 파급은 제한적</text>

        {points.map((point) => {
          const tone = getPositioningToneStyle(point.tone);
          const r = Math.max(10, point.size / 4.2);
          const rawCx = xScale(point.similarity);
          const rawCy = yScale(point.influence);
          const cx = Math.min(Math.max(rawCx, plotLeft + r + 10), plotRight - r - 10);
          const cy = Math.min(Math.max(rawCy, plotTop + r + 10), plotBottom - r - 10);
          const isSelected = selectedName === point.name;

          return (
            <g
              key={point.name}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(point.name);
              }}
              className="cursor-pointer"
            >
              <circle cx={cx} cy={cy} r={r + 8} fill={tone.glow} opacity={isSelected ? '0.62' : '0.38'} />
              <circle cx={cx} cy={cy} r={r} fill={tone.bubble} stroke={tone.border} strokeWidth={isSelected ? '3' : '2'} filter="url(#home-position-glow)" />
              <text
                x={cx}
                y={cy + 4}
                fill="var(--axis-ink)"
                fontSize={point.shortLabel.length >= 3 ? '10' : '11'}
                fontWeight="800"
                textAnchor="middle"
              >
                {point.shortLabel}
              </text>
            </g>
          );
        })}
    </svg>
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
  const summaryChoices = filteredCards;
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [interestChartIndex, setInterestChartIndex] = useState(0);
  const [homeDetailCardId, setHomeDetailCardId] = useState<string | null>(null);
  const [homeDetailSlideIndex, setHomeDetailSlideIndex] = useState(0);
  const [selectedPositioningName, setSelectedPositioningName] = useState<string>('SK AX');
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
  const staticPositioningCards = [
    {
      label: 'Peer사 관점',
      tone: 'accent',
      title: '우상단 경쟁군은 기술 소개보다 대형 고객 적용 사례와 운영 성과를 먼저 보여주며 반응을 만들고 있습니다.',
      body: '제조·공공·금융처럼 고객이 바로 비교하는 시장에서는 구축 완료, 운영 안정화, 업무 자동화 성과를 먼저 제시할수록 같은 AX 메시지도 더 강하게 읽힙니다. Peer사는 “무엇을 갖고 있나”보다 “어디에 적용했고 어떤 변화가 있었나”를 앞세우는 흐름에 가깝습니다.',
    },
    {
      label: 'SK AX 관점 포인트',
      tone: 'neutral',
      title: 'SK AX는 경쟁 축에는 올라와 있지만, 대표 사례와 성과 문장을 더 선명하게 묶어 보여줄 필요가 있습니다.',
      body: '실제 영업 현장에서는 “어느 산업에서 무엇을 해봤는가”가 가장 먼저 비교됩니다. 따라서 SK AX도 제조 AX, 운영 자동화, 클라우드 전환 같은 축마다 대표 사례 1~2개와 KPI 개선 문장을 앞단에 세워야 지금보다 높은 반응 구간으로 올라갈 수 있습니다.',
    },
    {
      label: '도출 인사이트',
      tone: 'success',
      title: '핵심 차이는 역량 보유보다 “대표 사례를 얼마나 빨리 이해시키는가”에서 벌어질 가능성이 큽니다.',
      body: '고객은 기술 항목을 길게 비교하기보다, 검증된 산업 사례와 운영 성과가 먼저 보이는 회사를 더 쉽게 선택합니다. 따라서 SK AX는 기능 목록을 늘리기보다 산업별 대표 사례, KPI 개선 문장, 운영 전환 결과를 짧고 명확하게 묶는 방식으로 메시지를 재구성하는 것이 더 효과적입니다.',
    },
  ] as const;
  const keywordChartAction = (
    <button
      type="button"
      onClick={() => onNavigate(showStockChart ? 'peerPlus' : 'keywordGraph')}
      className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
    >
      자세히 보기
    </button>
  );
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
          <button
            type="button"
            data-guide="home-insight"
            onClick={() => onNavigate('insight')}
            className="axis-panel-flat relative min-h-[700px] overflow-hidden p-5 text-left transition hover:border-[var(--axis-accent)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at 74% 42%, rgba(220,90,36,0.13), transparent 34%), radial-gradient(circle at 18% 18%, rgba(90,107,87,0.10), transparent 32%)' }} />
            <div className="relative flex h-full flex-col gap-5">
              <div className="rounded-[var(--axis-radius-xl)] border border-[rgba(220,90,36,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,248,245,0.72))] p-4 shadow-[0_24px_60px_-42px_rgba(26,26,31,0.24)]">
                <div className="min-w-0">
                  <p className="axis-kicker">Today insight</p>
                  <h2 className="mt-2 max-w-2xl text-[clamp(2rem,3.1vw,3.6rem)] font-display leading-[1.04] text-ink">
                    ITS 산업 동향 및 포지셔닝
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--axis-body)]">
                    그래프를 통해 직접 경쟁군과 간접 영향군의 현재 위치를 먼저 나누고, 아래에서는 Peer사 관점과 SK AX 관점에서 어떤 포인트를 읽어야 하는지, 그래서 어떤 인사이트가 나오는지를 함께 정리했습니다.
                  </p>
                  <div className="mt-5 rounded-[var(--axis-radius-lg)] bg-[rgba(255,255,255,0.62)] p-2">
                    <HomePositioningMap
                      points={homePositioningMapData}
                      selectedName={selectedPositioningPoint.name}
                      onSelect={setSelectedPositioningName}
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  {staticPositioningCards.map((card) => (
                    <article
                      key={card.label}
                      className={`rounded-[var(--axis-radius-lg)] p-4 ${
                        card.tone === 'accent'
                          ? 'border border-[rgba(220,90,36,0.22)] bg-[rgba(220,90,36,0.08)]'
                          : card.tone === 'success'
                            ? 'border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)]'
                            : 'border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]'
                      }`}
                    >
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        card.tone === 'accent' ? 'text-[var(--axis-accent-strong)]' : 'text-[var(--axis-success)]'
                      }`}>
                        {card.label}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                      <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{card.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </button>

          <aside className="grid gap-4">
            <div data-guide="home-summary" className="axis-panel-flat min-h-[430px] w-full max-w-full min-w-0 overflow-hidden p-4 [contain:inline-size]">
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
              action={keywordChartAction}
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
              {!showStockChart && selectedKeywordInsight ? (
                <div className="mt-4 rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.18)] bg-[rgba(255,255,255,0.78)] p-4">
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
                  <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{selectedKeywordInsight.reason}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{selectedKeywordInsight.skAxPoint}</p>
                </div>
              ) : !showStockChart ? (
                <div className="mt-4 rounded-[var(--axis-radius-lg)] border border-dashed border-[rgba(220,90,36,0.22)] bg-[rgba(255,255,255,0.52)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--axis-ink)]">튀는 포인트를 클릭하면 원인과 SK AX 관점 해석이 표시됩니다.</p>
                </div>
              ) : null}
            </ChartButton>
            </div>
          </aside>
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

type MixerResultInsight = {
  title: string;
  summary: string;
  reasoning: string[];
  evidenceTags: string[];
  evidenceCards: {
    peer: string;
    title: string;
    snippet: string;
  }[];
  skAxMeaning: string;
};

type MixerResultView = {
  summary: string;
  insightBrief: MixerResultInsight[];
  implications: string[];
  proposalActions: string[];
  evidenceLogic: string[];
  actions: string[];
  connections: string[];
  skAxPerspective: string;
};

const mixerHistoryPreviewGroups = [
  {
    date: '2026.05.15',
    entries: [
      { title: '최근 생성 결과가 쌓이면 이 위치에 배치됩니다.', meta: 'Peer · 키워드 · 선택 카드 수' },
      { title: '같은 날짜 안에서는 생성 순서대로 아래로 누적됩니다.', meta: '믹서 결과 요약 · 생성 시각' },
    ],
  },
  {
    date: '2026.05.14',
    entries: [
      { title: '날짜 필터를 적용하면 해당 기간 결과만 남도록 연결할 수 있습니다.', meta: '기간 필터 · 검색 조건' },
      { title: '실제 저장 기능이 붙으면 이 카드에서 상세 결과로 이동하게 됩니다.', meta: '결과 상세 진입' },
    ],
  },
  {
    date: '2026.05.13',
    entries: [
      { title: '현재는 화면 구조만 미리 확인하는 프리뷰 상태입니다.', meta: '프론트 프리뷰 전용' },
    ],
  },
] as const;

export function MixerView({
  bookmarkedIds,
  onToggleBookmark,
}: {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}) {
  const { cards, isLoading, error } = useCardNews();
  const [mode, setMode] = useState<'select' | 'result' | 'history'>('select');
  const [selectedPeers, setSelectedPeers] = useState<string[]>(mockMixerConfig.defaults.peers);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(mockMixerConfig.defaults.customers);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(mockMixerConfig.defaults.industries);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(mockMixerConfig.defaults.keywords);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MixerResultView | null>(null);
  const [activeResultInsightIndex, setActiveResultInsightIndex] = useState(0);
  const [isMixerReasoningOpen, setIsMixerReasoningOpen] = useState(false);
  const [mixerDetailCardId, setMixerDetailCardId] = useState<string | null>(null);
  const [mixerDetailSlideIndex, setMixerDetailSlideIndex] = useState(0);
  const [historyStartDate, setHistoryStartDate] = useState('2026-05-13');
  const [historyEndDate, setHistoryEndDate] = useState('2026-05-15');
  const generationTimeoutRef = useRef<number | null>(null);

  const mixerSourceCards = useMemo(() => {
    if (cards.length >= 4) {
      return cards;
    }

    const existingIds = new Set(cards.map((card) => card.id));
    const supplement = fallbackCardNewsItems.filter((card) => !existingIds.has(card.id));
    return [...cards, ...supplement];
  }, [cards]);
  const mixerCards = useMemo(() => buildMixerCards(mixerSourceCards), [mixerSourceCards]);
  const visibleCards = mixerCards.filter((item) => {
    const peerMatched = selectedPeers.length === 0 || selectedPeers.includes(item.peer);
    const bookmarkMatched = !bookmarkedOnly || bookmarkedIds.includes(item.card.id);
    return peerMatched && bookmarkMatched;
  });
  const selectedCards = mixerCards.filter((item) => selectedIds.includes(item.id));
  const filteredHistoryPreviewGroups = useMemo(() => {
    return mixerHistoryPreviewGroups.filter((group) => {
      const normalizedDate = group.date.replace(/\./g, '-');
      const afterStart = !historyStartDate || normalizedDate >= historyStartDate;
      const beforeEnd = !historyEndDate || normalizedDate <= historyEndDate;
      return afterStart && beforeEnd;
    });
  }, [historyEndDate, historyStartDate]);
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
  const mixerDetailCard = mixerDetailCardId ? mixerSourceCards.find((card) => card.id === mixerDetailCardId) ?? null : null;

  const toggleListValue = (value: string, setter: (updater: (current: string[]) => string[]) => void) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current !== null) {
        window.clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  const buildMixerResult = (): MixerResultView => {
    const peers = Array.from(new Set(selectedCards.map((item) => item.peer)));
    const summaryLines = selectedCards.flatMap((item) => getSummaryLines(item.card));
    const primaryIndustries = selectedIndustries.slice(0, 2).join(' · ') || '고객 산업';
    const primaryKeywords = selectedKeywords.slice(0, 3).join(' · ') || 'AX 신호';
    const primaryCustomers = selectedCustomers.slice(0, 2).join(' · ') || '주요 고객군';
    const selectedEvidenceCards = selectedCards.slice(0, 3).map((item) => {
      const lines = [
        ...getSummaryLines(item.card),
        ...(item.card.insights ?? []),
        ...(item.card.actionItems ?? []),
        ...(item.card.detailPoints ?? []),
      ].filter((line): line is string => typeof line === 'string' && line.trim().length > 0);
      return {
        peer: item.peer,
        title: item.card.title,
        snippet: lines[0] ?? item.card.detailDescription,
      };
    });
    const evidenceTitles = selectedEvidenceCards.map((item) => item.title);
    const bookmarkedEvidenceCount = selectedCards.filter((item) => bookmarkedIds.includes(item.card.id)).length;
    const keywordHitStats = selectedKeywords
      .map((keyword) => {
        const normalizedKeyword = keyword.toLowerCase();
        const count = selectedCards.reduce((acc, item) => {
          const haystack = [
            item.card.title,
            ...getSummaryLines(item.card),
            ...(item.card.insights ?? []),
            ...(item.card.actionItems ?? []),
            ...(item.card.detailPoints ?? []),
          ]
            .join(' ')
            .toLowerCase();
          return acc + (haystack.includes(normalizedKeyword) ? 1 : 0);
        }, 0);
        return { keyword, count };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
    const keywordHitSummary = keywordHitStats.length > 0
      ? keywordHitStats.slice(0, 3).map((item) => `${item.keyword}(${item.count}건)`).join(', ')
      : primaryKeywords;
    const implicationPool = Array.from(
      new Set(
        selectedCards.flatMap((item) => item.card.insights ?? []).filter((line): line is string => typeof line === 'string' && line.trim().length > 0),
      ),
    );
    const actionPool = Array.from(
      new Set(
        selectedCards.flatMap((item) => item.card.actionItems ?? []).filter((line): line is string => typeof line === 'string' && line.trim().length > 0),
      ),
    );
    const connections = Array.from(
      new Set(
        summaryLines
          .join(' ')
          .split(/\s+/)
          .filter((token) => mockMixerConfig.connectionKeywords.includes(token)),
      ),
    ).slice(0, 5);

    return {
      summary: `${mockMixerConfig.insightTemplate.leadPrefix} ${peers.join(', ')}의 ${primaryKeywords} 신호를 ${primaryIndustries} 제안 맥락으로 재조합해 ${mockMixerConfig.insightTemplate.leadSuffix}`,
      insightBrief: [
        {
          title: '반복 신호 묶음',
          summary: `${peers.join(', ')} 카드에서는 ${primaryKeywords}가 단일 기술 소개보다 실행 신호 묶음으로 반복됩니다.`,
          reasoning: [
            `이번 인사이트는 ${selectedCards.length}건의 선택 카드 중 ${evidenceTitles.join(' / ')}를 우선 근거로 삼아 묶었습니다.`,
            `선택 키워드를 카드 본문과 요약에 다시 대조하면 ${keywordHitSummary} 순으로 반복되어, 단순 단어 매칭이 아니라 여러 카드에 걸친 공통 신호가 확인됩니다.`,
            `특히 "${selectedEvidenceCards[0]?.snippet ?? '관련 실행 신호가 반복됩니다.'}" 같은 문장이 먼저 잡혀, 기능 설명보다 실행 장면과 성과 맥락이 함께 부각되는 구조가 보입니다.`,
          ],
          evidenceTags: evidenceTitles.slice(0, 2),
          evidenceCards: selectedEvidenceCards.slice(0, 2),
          skAxMeaning: 'SK AX는 개별 기능 소개보다 반복적으로 검증된 실행 장면과 성과 표현을 먼저 제시할 때 더 경쟁력 있는 제안 문장을 만들 수 있습니다.',
        },
        {
          title: '고객 설득 포인트',
          summary: `${primaryIndustries} · ${primaryCustomers} 맥락에서는 기능 도입보다 운영 KPI와 안정적 전환을 먼저 말하는 편이 더 설득력 있습니다.`,
          reasoning: [
            `입력 조건상 고객·산업 조합은 ${primaryIndustries} · ${primaryCustomers}로 모였고, 근거 카드에서도 이 조합과 맞닿은 운영형 표현이 반복됩니다.`,
            `예를 들어 "${selectedEvidenceCards[1]?.snippet ?? selectedEvidenceCards[0]?.snippet ?? '운영 안정성과 KPI 개선 표현이 반복됩니다.'}"처럼 실제 도입 이후 효과를 먼저 설명하는 문장이 우세합니다.`,
            '따라서 고객 설득 포인트는 기술 스펙 소개보다 업무 KPI 개선, 운영 안정성, 적용 이후 전환 효과를 먼저 보여주는 쪽으로 정리하는 것이 더 타당합니다.',
          ],
          evidenceTags: [primaryIndustries, primaryCustomers, `${selectedCustomers.length}개 고객군`],
          evidenceCards: selectedEvidenceCards.slice(0, 2),
          skAxMeaning: 'SK AX는 제안 초반부터 운영 KPI 개선, 리스크 완화, 적용 이후 안정성까지 한 문장으로 묶는 방식이 더 효과적입니다.',
        },
        {
          title: 'SK AX 활용 인사이트',
          summary: '선택 카드와 북마크를 함께 묶으면 경쟁사 공개 신호를 SK AX 제안 문장으로 재구성할 수 있는 근거 패키지가 만들어집니다.',
          reasoning: [
            `현재 선택 조합에는 북마크 ${bookmarkedEvidenceCount}건이 포함되어 있어 사용자가 중요하다고 본 카드와 반복 신호가 동시에 반영되었습니다.`,
            `즉 이 인사이트는 임의 추론이 아니라 ${selectedCards.length}건 카드 중 실제 선택 카드와 북마크 카드가 겹치는 지점을 우선 반영한 결과입니다.`,
            `결론적으로 믹서는 "${selectedEvidenceCards[0]?.title ?? '선택 카드'}" 같은 근거를 SK AX 제안 문장으로 다시 압축하는 역할에 더 가깝다고 볼 수 있습니다.`,
          ],
          evidenceTags: [`북마크 ${bookmarkedEvidenceCount}건`, ...connections.slice(0, 2)],
          evidenceCards: selectedEvidenceCards,
          skAxMeaning: 'SK AX는 믹서 결과를 통해 경쟁사 신호를 내부 보고용 정리에서 끝내지 않고 실제 제안 문장과 브리핑 문장으로 변환하는 출발점을 얻을 수 있습니다.',
        },
      ],
      implications: implicationPool.length > 0
        ? implicationPool.slice(0, 3)
        : [
            `${primaryIndustries} 맥락에서는 기술 소개보다 운영 전환 효과를 먼저 말하는 쪽이 더 설득력 있게 읽힙니다.`,
            `${peers.join(', ')}의 반복 신호를 함께 보면 기능 나열보다 실행 장면과 KPI 개선 표현이 더 중심축으로 보입니다.`,
            '선택 카드가 겹쳐 보여주는 공통 문맥은 제안 메시지를 더 구체적인 고객 상황으로 옮겨 적는 근거가 됩니다.',
          ],
      proposalActions: actionPool.length > 0
        ? actionPool.slice(0, 3)
        : [
            '고객 미팅 전 선택 카드의 공통 문장을 3줄 제안 메시지로 재정리합니다.',
            '경쟁사 공개 신호 중 반복된 KPI 표현을 제안서 첫 장 핵심 문장으로 옮깁니다.',
            '북마크 카드에서 반복된 실행 사례를 SK AX 기준 레퍼런스 문장으로 다시 묶습니다.',
          ],
      evidenceLogic: [
        `선택 카드 ${selectedCards.length}건`,
        `Peer ${peers.length}개사`,
        `키워드 ${selectedKeywords.length}개`,
        `북마크 근거 ${bookmarkedEvidenceCount}건`,
      ],
      actions: [
        '고객 미팅 전 카드뉴스 묶음을 3문장 브리핑으로 변환',
        '제안서 첫 장에 수주/운영/보안 근거를 함께 배치',
        '반복 키워드와 근거 카드를 함께 검토해 제안 문장으로 재정리',
      ],
      connections: connections.length > 0 ? connections : [...selectedKeywords, '고객 제안'].slice(0, 5),
      skAxPerspective: selectedCards[0]?.card.actionItems?.[0] ?? '선택한 카드 묶음을 산업별 제안 근거와 실행 문장으로 재구성할 수 있습니다.',
    };
  };

  const generateMixerResult = () => {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    if (generationTimeoutRef.current !== null) {
      window.clearTimeout(generationTimeoutRef.current);
    }

    generationTimeoutRef.current = window.setTimeout(() => {
      const nextResult = buildMixerResult();
      setResult(nextResult);
      setActiveResultInsightIndex(0);
      setIsMixerReasoningOpen(false);
      setMode('result');
      setIsGenerating(false);
      generationTimeoutRef.current = null;
    }, 1800);
  };

  if (isLoading) return <LoadingBlock label="믹서 후보 카드를 불러오는 중입니다." />;
  if (error) return <LoadingBlock label={error} />;

  if (mode === 'history') {
    return (
      <ExecutivePage>
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer history"
            title="믹서 기록"
            subtitle="누적 결과가 많아질 때를 대비해, 메인 믹서 화면과 분리된 기록 페이지에서 날짜 기준으로 스크롤 탐색하고 필터링하는 구조를 먼저 잡아둔 화면입니다. 현재는 프론트 프리뷰만 제공하며 실제 저장은 하지 않습니다."
            actions={
              <ExecutiveButton variant="secondary" onClick={() => setMode('select')}>
                믹서로 돌아가기
              </ExecutiveButton>
            }
          />

          <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside data-guide="mixer-history-filter" className="axis-panel-flat p-5">
              <p className="axis-kicker">History filter</p>
              <h2 className="axis-section-heading mt-1">기간 직접 선택</h2>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-muted)]">시작 날짜</span>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(event) => setHistoryStartDate(event.target.value)}
                    className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-3 text-sm font-semibold text-[var(--axis-ink)] outline-none transition focus:border-[var(--axis-accent)]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-muted)]">마지막 날짜</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(event) => setHistoryEndDate(event.target.value)}
                    className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-3 text-sm font-semibold text-[var(--axis-ink)] outline-none transition focus:border-[var(--axis-accent)]"
                  />
                </label>
              </div>
            </aside>

            <article data-guide="mixer-history-archive" className="axis-panel-flat p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="axis-kicker">Scrollable archive</p>
                  <h2 className="axis-section-heading mt-1">누적 결과 확인 영역</h2>
                </div>
                <span className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--axis-muted)]">
                  {historyStartDate} - {historyEndDate}
                </span>
              </div>
              <div className="mt-4 max-h-[640px] overflow-y-auto pr-1">
                <div className="grid gap-5">
                  {filteredHistoryPreviewGroups.map((group) => (
                    <section key={group.date} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-ink)]">{group.date}</h3>
                        <span className="text-xs font-semibold text-[var(--axis-muted)]">{group.entries.length}개 슬롯</span>
                      </div>
                      <div className="grid gap-3">
                        {group.entries.map((entry, index) => (
                          <div
                            key={`${group.date}-${index}`}
                            className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-4"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-bold text-[var(--axis-accent-strong)]">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{entry.title}</p>
                                <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">{entry.meta}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                  {filteredHistoryPreviewGroups.length === 0 ? (
                    <div className="rounded-[var(--axis-radius-lg)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-6 text-sm leading-6 text-[var(--axis-muted)]">
                      선택한 기간 안에 보이도록 설정된 프리뷰 기록이 없습니다. 실제 누적이 연결되면 이 영역에 기간에 맞는 결과만 남도록 표시할 수 있습니다.
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          </section>
        </ExecutiveContainer>
      </ExecutivePage>
    );
  }

  if (mode === 'result' && result) {
    const activeResultInsight = result.insightBrief[activeResultInsightIndex] ?? result.insightBrief[0];
    return (
      <ExecutivePage>
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer output"
            title="믹서 결과"
            subtitle="선택한 카드와 조건에서 반복된 신호를 묶어, SK AX 관점에서 바로 활용할 수 있는 인사이트와 연결 구조로 정리한 결과 화면입니다."
            actions={
              <>
                <ExecutiveButton variant="secondary" onClick={() => setMode('history')}>
                  전체 기록 보기
                </ExecutiveButton>
                <ExecutiveButton variant="secondary" onClick={() => setMode('select')}>
                  선택으로 돌아가기
                </ExecutiveButton>
              </>
            }
          />

          <section>
            <article data-guide="mixer-result" className="axis-panel-flat min-h-[360px] overflow-hidden border-[rgba(220,90,36,0.26)]">
              <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="axis-kicker">New insight</p>
                    <h2 className="mt-2 text-heading-3 font-display leading-tight text-[var(--axis-ink)]">
                      {result.summary}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMixerReasoningOpen(true)}
                    className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-sm font-black text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                    aria-label="선택한 인사이트의 에이전트 추론 과정 보기"
                  >
                    !
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {result.insightBrief.map((item, index) => {
                    const isActive = index === activeResultInsightIndex;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setActiveResultInsightIndex(index)}
                        className={`block w-full rounded-[var(--axis-radius-md)] border p-4 text-left transition ${
                          isActive
                            ? 'border-[rgba(220,90,36,0.30)] bg-[rgba(220,90,36,0.08)] shadow-[0_18px_42px_-34px_rgba(220,90,36,0.55)]'
                            : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] hover:border-[var(--axis-accent)]'
                        }`}
                        aria-pressed={isActive}
                      >
                        <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-bold text-[var(--axis-accent-strong)]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[var(--axis-accent-strong)]">{item.title}</p>
                            <p className="mt-2 text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.summary}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.22)] bg-[rgba(90,107,87,0.08)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-success)]">시사점</p>
                    <div className="mt-3 grid gap-2">
                      {result.implications.map((item) => (
                        <div key={item} className="rounded-[var(--axis-radius-sm)] bg-[var(--axis-canvas)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.22)] bg-[rgba(220,90,36,0.08)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">대응 방향</p>
                    <div className="mt-3 grid gap-2">
                      {result.proposalActions.map((item) => (
                        <div key={item} className="rounded-[var(--axis-radius-sm)] bg-[var(--axis-canvas)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
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
              <div className="mt-3 flex flex-wrap gap-2">
                {result.evidenceLogic.map((item) => (
                  <span key={item} className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs font-semibold text-[var(--axis-body)]">
                    {item}
                  </span>
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
            cards={visibleCards.map((item) => item.card)}
            bookmarked={bookmarkedIds.includes(mixerDetailCard.id)}
            slideIndex={mixerDetailSlideIndex}
            onSlideChange={setMixerDetailSlideIndex}
            onBookmark={() => onToggleBookmark(mixerDetailCard.id)}
            onCardChange={(cardId) => {
              setMixerDetailCardId(cardId);
              setMixerDetailSlideIndex(0);
            }}
            onClose={() => {
              setMixerDetailCardId(null);
              setMixerDetailSlideIndex(0);
            }}
          />
        ) : null}
        {isMixerReasoningOpen ? (
          <div className="fixed inset-0 z-50 bg-[rgba(8,10,14,0.62)] p-5 backdrop-blur-sm">
            <section className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[var(--axis-radius-lg)] border border-[rgba(255,255,255,0.16)] bg-[var(--axis-surface)] text-[var(--axis-ink)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.72)]">
              <header className="flex items-center justify-between gap-3 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">Agent reasoning</p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activeResultInsight?.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMixerReasoningOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
                  aria-label="에이전트 추론 과정 닫기"
                >
                  <X size={17} />
                </button>
              </header>
              <article className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)] p-4">
                  <p className="text-sm font-semibold leading-7 text-[var(--axis-ink)]">{activeResultInsight?.summary}</p>
                  <div className="mt-4 space-y-3">
                    {activeResultInsight?.reasoning.map((item, index) => (
                      <div key={`${activeResultInsight.title}-${index}`} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.18)] bg-[var(--axis-canvas)] p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-bold text-[var(--axis-success)]">
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeResultInsight?.evidenceTags.map((item) => (
                      <ExecutiveBadge key={item} tone="accent">{item}</ExecutiveBadge>
                    ))}
                  </div>
                </div>
                {activeResultInsight?.evidenceCards.length ? (
                  <div className="mt-4 grid gap-3">
                    {activeResultInsight.evidenceCards.map((card) => (
                      <div key={`${activeResultInsight.title}-${card.title}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-success)]">{card.peer}</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{card.snippet}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
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
                  <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-4">
                    <p className="text-xs font-semibold text-[var(--axis-accent-strong)]">SK AX 활용 해석</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{activeResultInsight?.skAxMeaning ?? result.skAxPerspective}</p>
                  </div>
                </div>
              </article>
            </section>
          </div>
        ) : null}
      </ExecutivePage>
    );
  }

  return (
    <ExecutivePage className="relative">
      <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer workbench"
            title="믹서"
            subtitle="뉴스, Peer, 고객사, 산업, 키워드를 조합해 어떤 카드 묶음이 실제 인사이트로 이어지는지 실험하는 작업 화면입니다."
          actions={
            <>
              <ExecutiveButton
                variant={bookmarkedOnly ? 'primary' : 'secondary'}
                disabled={isGenerating}
                icon={<Bookmark size={16} fill={bookmarkedOnly ? 'currentColor' : 'none'} />}
                onClick={() => setBookmarkedOnly((current) => !current)}
              >
                북마크만
              </ExecutiveButton>
              <ExecutiveButton icon={<Sparkles size={16} />} disabled={!canGenerate || isGenerating} onClick={generateMixerResult}>
                {isGenerating ? '분석 중...' : '믹서 실행'}
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
              카드 2개 이상을 선택하면 선택 조합을 바탕으로 결과 화면이 생성되고, 어떤 신호가 인사이트로 이어졌는지 바로 확인할 수 있습니다.
            </div>
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-ink)]">최근 생성 결과</h3>
                <span className="text-xs font-semibold text-[var(--axis-muted)]">Preview</span>
              </div>
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`mixer-history-placeholder-${index}`}
                    className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                        Slot {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-[var(--axis-muted)]">누적 예정</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                      믹서 결과가 누적되면 이 영역에 쌓이도록 연결할 예정입니다.
                    </p>
                    <p className="mt-2 text-xs text-[var(--axis-muted)]">
                      현재는 프론트 미리보기만 제공하고, 실제 저장이나 누적은 하지 않습니다.
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <ExecutiveButton variant="secondary" onClick={() => setMode('history')}>
                  전체 기록 보기
                </ExecutiveButton>
              </div>
            </div>
          </aside>
        </section>
      </ExecutiveContainer>
      {isGenerating ? <MixerAnalysisOverlay /> : null}
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
  const { dashboard } = useDashboard();
  const { cards, isLoading, error } = useCardNews();
  const peerOptions = mockPeerPlusOptions;
  const [selectedPeerId, setSelectedPeerId] = useState<'all' | PeerPlusPeerId>(externalSelectedPeerId ?? 'all');
  const [peerDetailCardId, setPeerDetailCardId] = useState<string | null>(null);
  const [peerDetailSlideIndex, setPeerDetailSlideIndex] = useState(0);
  const [peerKeywordMatches, setPeerKeywordMatches] = useState<{ keyword: string; cards: CardNewsItem[] } | null>(null);
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);

  useEffect(() => {
    if (externalSelectedPeerId) {
      window.localStorage.setItem(peerPlusSelectionStorageKey, externalSelectedPeerId);
      setSelectedPeerId(externalSelectedPeerId);
      return;
    }
    window.localStorage.setItem(peerPlusSelectionStorageKey, 'all');
    setSelectedPeerId('all');
  }, [externalSelectedPeerId]);
  const isAllFilter = selectedPeerId === 'all';
  const selectedPeer = !isAllFilter ? peerOptions.find((peer) => peer.id === selectedPeerId) ?? peerOptions[0] : null;
  const relevantPeerIds = isAllFilter ? peerOptions.map((peer) => peer.id) : [selectedPeer!.id];
  const peerCards = rankedCards.filter((card) => isAllFilter ? relevantPeerIds.includes(card.peer_id as PeerPlusPeerId) : card.peer_id === selectedPeer!.id);
  const companyNews = (peerCards.length > 0 ? peerCards : rankedCards).slice(0, 4);
  const peerDetailCard = peerDetailCardId ? cards.find((card) => card.id === peerDetailCardId) ?? null : null;
  const peerOrderCountMap: Record<'sk_ax' | PeerPlusPeerId, { label: string; orderCount: string }> = {
    sk_ax: { label: 'SK AX', orderCount: '내부 기준' },
    samsung_sds: { label: '삼성 SDS', orderCount: '공시 미기재' },
    lg_cns: { label: 'LG CNS', orderCount: '공시 미기재' },
    hyundai_autoever: { label: '현대 오토에버', orderCount: '공시 미기재' },
    posco_dx: { label: '포스코 DX', orderCount: '공시 미기재' },
  };
  const skAxProfile = {
    id: 'sk_ax',
    label: 'SK AX',
    revenue: '1.22조',
    operatingProfit: '910억',
    margin: '7.4%',
    axRatio: '34%',
    topKeyword: '운영형 AX',
    orderCount: peerOrderCountMap.sk_ax.orderCount,
  };
  const peerInsightCatalog: Record<'all' | PeerPlusPeerId, Array<{ label: '포지셔닝' | '사업 신호' | '기술 신호' | '리스크'; body: string }>> = {
    all: [
      { label: '포지셔닝', body: '전체 비교에서는 SK AX를 기준축으로 두고, 삼성 SDS는 ITS·클라우드·AI, LG CNS는 금융·공공·클라우드, 현대 오토에버는 모빌리티·운영, 포스코 DX는 산업DX·이차전지 문맥으로 나뉘어 보입니다.' },
      { label: '사업 신호', body: '공시 수치 기준 2025Q4 매출은 삼성 SDS 3.54조, LG CNS 1.94조, 현대 오토에버 1.32조, 포스코 DX 2,608억 수준으로 읽히며, 기업별로 규모 차이가 크게 나타납니다.' },
      { label: '기술 신호', body: '키워드 기준으로는 FabriX·Brity, 금융·공공 AI/DX, 커넥티드카·OTA, 산업DX·LLM처럼 각사가 반복적으로 내세우는 기술 문맥이 분명하게 갈립니다.' },
      { label: '리스크', body: 'AX 비중과 수주 수처럼 공시에서 직접 확인되지 않는 값은 비교 해석에 한계가 있어, 현재 화면은 실수치와 키워드 중심의 1차 비교로 읽는 편이 안전합니다.' },
    ],
    samsung_sds: [
      { label: '포지셔닝', body: '삼성 SDS는 2025Q4 기준 매출 3.54조, 영업이익 2,261억원 수준으로 규모 우위가 크고, SK AX와 비교할 때 ITS·클라우드·AI가 동시에 보이는 복합 신호 축으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로는 분기 매출이 3조원대 중반을 유지하고 있어 사업 규모 자체가 비교 기준점으로 작동합니다.' },
      { label: '기술 신호', body: 'FabriX, Brity, 에이전틱 AI, ITS, 클라우드 같은 키워드가 함께 나타나 기술 메시지가 운영형 AI와 서비스 축으로 묶여 보입니다.' },
      { label: '리스크', body: 'AX 비중이나 수주 수는 공시에서 직접 확인되지 않기 때문에, 현재 단계에서는 규모와 키워드 강도 중심으로만 비교하는 편이 적절합니다.' },
    ],
    lg_cns: [
      { label: '포지셔닝', body: 'LG CNS는 2025Q4 기준 매출 1.94조, 영업이익 2,119억원 수준이며 금융·공공·클라우드/MSP·AI/DX가 함께 보이는 다축형 경쟁군으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로 영업이익률이 10%대를 보여 수익성 측면에서는 네 곳 중 상대적으로 안정적으로 읽히는 편입니다.' },
      { label: '기술 신호', body: '금융, 공공, 클라우드 MSP, AI/DX, 스마트물류 키워드가 반복돼 기술 신호가 특정 산업보다 플랫폼형 문맥으로 넓게 퍼져 있습니다.' },
      { label: '리스크', body: '실수치는 강하지만 AX 비중, 수주 수 등 직접 비교 지표는 공시 미기재라서, 현재 화면만으로는 확장 속도까지 단정하기 어렵습니다.' },
    ],
    hyundai_autoever: [
      { label: '포지셔닝', body: '현대 오토에버는 2025Q4 기준 매출 1.32조, 영업이익 764억원 수준이며 스마트모빌리티, SI, ITES/유지운영 축으로 포지셔닝이 읽힙니다.' },
      { label: '사업 신호', body: '분기별로 2025Q1 8,330억에서 2025Q4 1.32조까지 올라오는 흐름이 보여 하반기 매출 확대 신호는 비교적 분명합니다.' },
      { label: '기술 신호', body: '커넥티드카, OTA, 자율주행, 차량, ERP, 운영 키워드가 반복돼 모빌리티와 운영 유지보수 문맥이 함께 나타납니다.' },
      { label: '리스크', body: 'AI 비중과 세부 부문 매출은 공시에서 직접 확인되지 않아, 현재 해석은 모빌리티·운영 키워드와 총실적 중심 비교에 머물러야 합니다.' },
    ],
    posco_dx: [
      { label: '포지셔닝', body: '포스코 DX는 2025Q4 기준 매출 2,608억원, 영업이익 -13억원 수준이며 산업DX, 이차전지/EV, AI/지능화 키워드가 주된 구분축으로 보입니다.' },
      { label: '사업 신호', body: '2025Q4에는 영업이익이 적자로 전환되어 실적 측면에서는 다른 Peer보다 보수적으로 읽을 필요가 있습니다.' },
      { label: '기술 신호', body: '산업DX, 스마트팩토리, 이차전지, EV, AI, LLM 키워드가 반복돼 산업 현장형 기술 문맥이 강하게 남아 있습니다.' },
      { label: '리스크', body: '분기 이익 변동성이 크고 세부 부문 매출과 AX 비중이 공시 미기재라서, 현재 단계에서는 산업 키워드 강도와 총실적만 우선 비교하는 편이 적절합니다.' },
    ],
  };
  const swotCatalog: Record<'all' | PeerPlusPeerId, Array<{ label: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat'; body: string }>> = {
    all: [
      { label: 'Strength', body: 'SK AX는 운영 KPI와 실행 관리 프레임을 기준축으로 세우기 좋아 전체 비교에서 관점 중심을 잡을 수 있습니다.' },
      { label: 'Weakness', body: '전체 모드는 산업별 차이를 압축해 보여주기 때문에 SK AX의 세부 강점이 다소 넓고 추상적으로 보일 수 있습니다.' },
      { label: 'Opportunity', body: '전체 Peer를 함께 보면 어떤 시장 축에서 메시지 공백이 생기는지 빠르게 포착할 수 있습니다.' },
      { label: 'Threat', body: '강한 공개 신호를 가진 경쟁사들이 시장 기준선을 먼저 점유하면 SK AX 제안 메시지가 후행처럼 읽힐 수 있습니다.' },
    ],
    samsung_sds: [
      { label: 'Strength', body: 'SK AX는 운영 전환 이후 KPI 설계와 실행 관리 체계를 차별 포인트로 밀 수 있습니다.' },
      { label: 'Weakness', body: '삼성 SDS 대비 대형 레퍼런스와 공개 검증 근거가 약하게 보이면 직접 경쟁에서 밀릴 수 있습니다.' },
      { label: 'Opportunity', body: '삼성 SDS가 키운 시장 관심을 활용해 SK AX의 운영 중심 후속 대안을 제시할 수 있습니다.' },
      { label: 'Threat', body: '엔터프라이즈 고객군에서는 삼성 SDS의 기준점 효과가 강하게 작동할 가능성이 큽니다.' },
    ],
    lg_cns: [
      { label: 'Strength', body: 'SK AX는 실행 속도와 운영 밀착형 AX 프레임을 더 전면에 내세울 수 있습니다.' },
      { label: 'Weakness', body: 'LG CNS보다 공공·금융 신뢰 신호가 약하면 안정성 인식에서 불리할 수 있습니다.' },
      { label: 'Opportunity', body: '안정성을 중시하는 고객에게는 SK AX의 전환 관리와 운영 민첩성을 추가 가치로 제시할 수 있습니다.' },
      { label: 'Threat', body: '보안·거버넌스 축에서 LG CNS가 기준선을 선점하면 SK AX 메시지가 보조 대안처럼 보일 수 있습니다.' },
    ],
    hyundai_autoever: [
      { label: 'Strength', body: 'SK AX는 제조 외 산업까지 확장 가능한 운영형 AX 서사를 제시할 수 있습니다.' },
      { label: 'Weakness', body: '현장 밀착성과 제조 특화 이미지는 현대 오토에버 쪽이 더 강하게 읽힐 수 있습니다.' },
      { label: 'Opportunity', body: '제조 고객에게는 특화 솔루션 위에 운영 관리 프레임까지 덧붙인 대안으로 포지셔닝할 수 있습니다.' },
      { label: 'Threat', body: '디지털 트윈, 차량 데이터 같은 특화 기술 신호가 강하면 SK AX의 범용 메시지가 흐려질 수 있습니다.' },
    ],
    posco_dx: [
      { label: 'Strength', body: 'SK AX는 산업 자동화 이후 운영 관리 전반까지 연결하는 상위 프레임을 보여줄 수 있습니다.' },
      { label: 'Weakness', body: '현장 실행감과 인프라-운영 연결성은 포스코 DX 대비 약하게 보일 수 있습니다.' },
      { label: 'Opportunity', body: '산업 고객에게는 실행성 위에 확장 가능한 운영 체계까지 포함한 대안으로 접근할 수 있습니다.' },
      { label: 'Threat', body: '대형 프로젝트와 산업 자동화 실적이 부각되면 SK AX가 상대적으로 추상적인 대안으로 읽힐 위험이 있습니다.' },
    ],
  };
  const peerRadarData = [
    { subject: '수익성', sk_ax: 72, samsung_sds: 63, lg_cns: 68, hyundai_autoever: 67, posco_dx: 59 },
    { subject: '성장성', sk_ax: 70, samsung_sds: 82, lg_cns: 78, hyundai_autoever: 66, posco_dx: 71 },
    { subject: 'AX 집중도', sk_ax: 78, samsung_sds: 79, lg_cns: 85, hyundai_autoever: 72, posco_dx: 76 },
    { subject: '수주 모멘텀', sk_ax: 73, samsung_sds: 81, lg_cns: 87, hyundai_autoever: 69, posco_dx: 75 },
    { subject: '운영 효율', sk_ax: 74, samsung_sds: 67, lg_cns: 70, hyundai_autoever: 69, posco_dx: 61 },
    { subject: '시장 노출', sk_ax: 69, samsung_sds: 88, lg_cns: 80, hyundai_autoever: 65, posco_dx: 72 },
  ] as const;
  const radarLegendConfig: Record<'sk_ax' | PeerPlusPeerId, { label: string; color: string }> = {
    sk_ax: { label: 'SK AX', color: 'var(--axis-accent)' },
    samsung_sds: { label: '삼성 SDS', color: 'var(--axis-graph-company)' },
    lg_cns: { label: 'LG CNS', color: 'var(--axis-graph-infra)' },
    hyundai_autoever: { label: '현대 오토에버', color: 'var(--axis-graph-security)' },
    posco_dx: { label: '포스코 DX', color: 'var(--axis-graph-deal)' },
  };
  const radarKeys = (isAllFilter
    ? (['sk_ax', ...peerOptions.map((peer) => peer.id)] as Array<'sk_ax' | PeerPlusPeerId>)
    : (['sk_ax', selectedPeer!.id] as Array<'sk_ax' | PeerPlusPeerId>));
  const peerInsightItems = peerInsightCatalog[isAllFilter ? 'all' : selectedPeer!.id];
  const swotItems = swotCatalog[isAllFilter ? 'all' : selectedPeer!.id];
  const allKeywordCloud = Object.values(mockPeerPlusKeywordCloud)
    .flat()
    .reduce<Array<{ label: string; weight: number; tone: 'accent' | 'success' | 'neutral' }>>((acc, item) => {
      const existing = acc.find((entry) => entry.label === item.label);
      if (!existing) {
        acc.push({ ...item });
      } else {
        existing.weight = Math.max(existing.weight, item.weight);
      }
      return acc;
    }, [])
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);
  const selectedKeywordCloud = isAllFilter ? allKeywordCloud : mockPeerPlusKeywordCloud[selectedPeer!.id];
  const peerOverviewRows = peerOptions.map((peer) => {
    const profile = mockPeerPlusIrProfiles[peer.id];
    const topKeyword = mockPeerPlusKeywordCloud[peer.id][0]?.label ?? '-';
    return {
      id: peer.id,
      label: peer.label,
      revenue: profile.revenue,
      operatingProfit: profile.operatingProfit,
      margin: profile.margin,
      axRatio: profile.axRatio,
      orderCount: peerOrderCountMap[peer.id].orderCount,
      topKeyword,
    };
  });
  const wordCloudLayout = [
    { left: '50%', top: '50%', rotate: 0 },
    { left: '23%', top: '35%', rotate: -6 },
    { left: '75%', top: '35%', rotate: 5 },
    { left: '26%', top: '72%', rotate: 0 },
    { left: '74%', top: '72%', rotate: -4 },
    { left: '50%', top: '20%', rotate: 0 },
    { left: '18%', top: '55%', rotate: -8 },
    { left: '82%', top: '56%', rotate: 7 },
    { left: '38%', top: '16%', rotate: 0 },
    { left: '62%', top: '84%', rotate: -3 },
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
          subtitle="전체 모드에서는 시장 전반 비교를, 기업별 모드에서는 SK AX와 선택 기업의 신호·재무·키워드 차이를 바로 읽을 수 있도록 정리한 화면입니다."
          actions={
            <div data-guide="peer-selector" className="flex flex-wrap justify-end gap-1.5">
              {[{ id: 'all' as const, label: '전체' }, ...peerOptions].map((peer) => (
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

        <section className="mb-5">
          <article data-guide="peer-overview" className="axis-panel-flat p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="axis-kicker">Overview</p>
                <h2 className="axis-section-heading mt-1">Peer 한눈 비교</h2>
              </div>
              <ExecutiveBadge tone="accent">목업</ExecutiveBadge>
            </div>
            <div className="mt-4 overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)]">
              <div className="grid grid-cols-[1.08fr_0.98fr_0.98fr_0.88fr_0.82fr_0.88fr_1fr] gap-px bg-[var(--axis-hairline)] text-xs font-semibold text-[var(--axis-muted)]">
                {['기업', '매출', '영업이익', '영업이익률', 'AX 비중', '수주 수', '핵심 키워드'].map((label) => (
                  <div key={label} className="bg-[var(--axis-surface-soft)] px-3 py-3">{label}</div>
                ))}
                {[skAxProfile, ...peerOverviewRows].filter((row) => isAllFilter || row.id === 'sk_ax' || row.id === selectedPeer!.id).map((row) => (
                  <div key={row.id} className="contents">
                    <div
                      className={`px-3 py-3 text-left text-sm font-semibold ${
                        row.id === 'sk_ax' || row.id === selectedPeerId ? 'bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]' : 'bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                      }`}
                    >
                      {row.label}
                    </div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.revenue}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.operatingProfit}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.margin}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.axRatio}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.orderCount}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.topKeyword}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-3 text-sm text-[var(--axis-muted)]">
              비교 기준: IR 자료 및 DART 기반 목업 값. 전체 모드에서는 SK AX를 포함한 시장 비교, 기업별 모드에서는 SK AX와 선택 기업만 남겨 바로 읽을 수 있게 구성했습니다.
            </div>
          </article>
        </section>

        <section>
          <article data-guide="peer-insight" className="axis-panel-flat min-h-[360px] p-5">
            <p className="axis-kicker">Comparison summary</p>
            <h2 className="mt-2 text-lg font-display font-semibold leading-tight text-ink">
              경쟁 메시지 차이와 SK AX 대응 포인트
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
              왼쪽은 실무 비교에 바로 쓰는 핵심 신호만, 오른쪽은 포지셔닝 관점까지 포함한 SWOT 해석만 따로 분리해 읽도록 구성했습니다.
            </p>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">핵심 비교 포인트</h3>
                  <span className="text-xs font-semibold text-[var(--axis-muted)]">SK AX vs {isAllFilter ? 'Peer 전체' : selectedPeer!.label}</span>
                </div>
                <p className="mb-4 text-xs leading-5 text-[var(--axis-muted)]">
                  사업 신호, 기술 신호, 리스크만 남겨 실제 제안이나 내부 브리핑에서 바로 비교 가능한 축으로 압축했습니다.
                </p>
                <div className="grid gap-3">
                  {peerInsightItems.filter((item) => item.label !== '포지셔닝').map((item, index) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{item.label}</span>
                        <span className="text-xs font-semibold text-[var(--axis-muted)]">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <p className={`${index === 0 ? 'text-base leading-7' : 'text-sm leading-6'} font-semibold text-[var(--axis-ink)]`}>{item.body}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-success)]">SWOT 분석</h3>
                  <span className="text-xs font-semibold text-[var(--axis-muted)]">전략 해석</span>
                </div>
                <p className="mb-4 text-xs leading-5 text-[var(--axis-muted)]">
                  포지셔닝은 SWOT 안에서 해석하고, 각 항목이 SK AX의 대응 방향에 어떤 의미를 갖는지 한 번에 보이도록 정리했습니다.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {swotItems.map((item) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className={`overflow-hidden rounded-[var(--axis-radius-lg)] border p-4 shadow-[0_16px_32px_-28px_rgba(26,26,31,0.24)] ${
                        item.label === 'Strength'
                          ? 'border-[rgba(220,90,36,0.28)] bg-[linear-gradient(180deg,rgba(220,90,36,0.14),rgba(255,255,255,0.92))]'
                          : item.label === 'Weakness'
                            ? 'border-[rgba(107,107,115,0.22)] bg-[linear-gradient(180deg,rgba(107,107,115,0.10),rgba(255,255,255,0.94))]'
                            : item.label === 'Opportunity'
                              ? 'border-[rgba(90,107,87,0.28)] bg-[linear-gradient(180deg,rgba(90,107,87,0.14),rgba(255,255,255,0.92))]'
                              : 'border-[rgba(30,41,59,0.18)] bg-[linear-gradient(180deg,rgba(30,41,59,0.10),rgba(255,255,255,0.94))]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
                            item.label === 'Strength'
                              ? 'border-[rgba(220,90,36,0.28)] bg-[rgba(220,90,36,0.14)] text-[var(--axis-accent-strong)]'
                              : item.label === 'Weakness'
                                ? 'border-[rgba(107,107,115,0.22)] bg-[rgba(107,107,115,0.10)] text-[var(--axis-muted)]'
                                : item.label === 'Opportunity'
                                  ? 'border-[rgba(90,107,87,0.28)] bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                                  : 'border-[rgba(30,41,59,0.18)] bg-[rgba(30,41,59,0.08)] text-[var(--axis-ink)]'
                          }`}
                        >
                          {item.label.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                              item.label === 'Strength'
                                ? 'text-[var(--axis-accent-strong)]'
                                : item.label === 'Weakness'
                                  ? 'text-[var(--axis-muted)]'
                                  : item.label === 'Opportunity'
                                    ? 'text-[var(--axis-success)]'
                                    : 'text-[var(--axis-ink)]'
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="mt-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.body}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
          <article data-guide="peer-wordcloud" className="axis-panel-flat p-5">
            <p className="axis-kicker">Issue theme cloud</p>
            <h3 className="axis-section-heading mt-1">최근 도입·협력 핵심 키워드</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
              {isAllFilter
                ? '전체 모드에서는 모든 Peer사에서 반복되는 키워드를 한 화면에 합쳐 시장 전체의 신호를 먼저 읽게 했습니다.'
                : `${selectedPeer!.label} 기준 키워드만 남겨 해당 기업의 최근 사업·기술 문맥을 더 직접적으로 볼 수 있게 했습니다.`}
            </p>
            <div className="relative mt-4 h-[250px] overflow-hidden rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
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
            <p className="mt-3 text-xs leading-5 text-[var(--axis-muted)]">
              {isAllFilter
                ? '키워드를 클릭하면 전체 모드에서도 관련 카드뉴스를 통해 어떤 문맥에서 반복됐는지 바로 확인할 수 있습니다.'
                : '키워드를 클릭하면 해당 기업 관련 카드뉴스와 연결해 실제 이슈 맥락을 같이 볼 수 있습니다.'}
            </p>
          </article>

          <article data-guide="peer-radar" className="axis-panel-flat p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="axis-kicker">DART balance</p>
                <h2 className="axis-section-heading mt-1">
                  {isAllFilter ? 'Peer 재무 체질 레이더 비교' : `${selectedPeer!.label} vs SK AX 재무 체질 레이더`}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
                  {isAllFilter
                    ? '전체 모드에서는 SK AX와 주요 Peer를 한 번에 겹쳐 시장 평균 대비 어디가 두드러지는지 보는 용도입니다.'
                    : '기업별 모드에서는 SK AX와 선택 기업만 겹쳐 재무 체질 차이를 빠르게 읽는 비교 레이어로 사용합니다.'}
                </p>
              </div>
              <ExecutiveBadge tone="accent">Radar</ExecutiveBadge>
            </div>
            <div className="mt-4 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[rgba(255,255,255,0.88)] p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {radarKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--axis-body)]"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: radarLegendConfig[key].color }} />
                    {radarLegendConfig[key].label}
                  </span>
                ))}
              </div>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[...peerRadarData]} outerRadius={122} margin={{ top: 10, right: 34, bottom: 10, left: 34 }}>
                  <PolarGrid stroke="rgba(117,117,128,0.22)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: 'var(--axis-body)', fontWeight: 700 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  {radarKeys.map((key) => (
                    <RadarShape
                      key={key}
                      name={radarLegendConfig[key].label}
                      dataKey={key}
                      stroke={radarLegendConfig[key].color}
                      fill={radarLegendConfig[key].color}
                      fillOpacity={key === 'sk_ax' ? 0.2 : 0.1}
                      strokeWidth={key === 'sk_ax' ? 2.6 : 2}
                    />
                  ))}
                  <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--axis-muted)]">축 기준은 수익성, 성장성, AX 집중도, 수주 모멘텀, 운영 효율, 시장 노출이며, 수치 자체보다 상대적 모양과 벌어진 구간을 읽는 비교용 목업입니다.</p>
          </article>
        </section>

        {!isAllFilter ? (
        <section data-guide="peer-related-cardnews" className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="axis-kicker">Related card news</p>
              <h2 className="axis-section-heading mt-1">{selectedPeer!.label} 관련 카드뉴스</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">선택 기업의 최근 카드뉴스를 함께 보며 위 비교 결과가 어떤 공개 신호에서 나왔는지 바로 연결해 확인할 수 있습니다.</p>
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
        ) : null}
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
          cards={companyNews}
          bookmarked={bookmarkedIds.includes(peerDetailCard.id)}
          slideIndex={peerDetailSlideIndex}
          onSlideChange={setPeerDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(peerDetailCard.id)}
          onCardChange={(cardId) => {
            setPeerDetailCardId(cardId);
            setPeerDetailSlideIndex(0);
          }}
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
  const catalog = buildCardCatalog(getLatestFirst(cards));
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
  cards = [],
  onCardChange,
}: {
  card: CardNewsItem;
  bookmarked: boolean;
  slideIndex: number;
  onSlideChange: (index: number) => void;
  onBookmark: () => void;
  onClose: () => void;
  cards?: CardNewsItem[];
  onCardChange?: (cardId: string) => void;
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
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const sourceOptions = getCardSourceOptions(card);
  const orderedCards = dedupeCardsById(cards.length > 0 ? cards : [card]);
  const currentCardIndex = orderedCards.findIndex((item) => item.id === card.id);
  const previousCard = currentCardIndex > 0 ? orderedCards[currentCardIndex - 1] : null;
  const nextCard = currentCardIndex >= 0 && currentCardIndex < orderedCards.length - 1 ? orderedCards[currentCardIndex + 1] : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft' && previousCard && onCardChange) {
        onCardChange(previousCard.id);
        return;
      }
      if (event.key === 'ArrowRight' && nextCard && onCardChange) {
        onCardChange(nextCard.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, onCardChange, onClose, previousCard]);

  const openSourceLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setSourcePickerOpen(false);
  };

  const navigateCard = (targetCard: CardNewsItem | null) => {
    if (!targetCard || !onCardChange) return;
    setSourcePickerOpen(false);
    setShareFeedback('');
    onCardChange(targetCard.id);
  };

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
            <div className="flex min-h-0 flex-1 flex-col">
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
                <div>
                  <ExecutiveButton variant={bookmarked ? 'primary' : 'secondary'} onClick={onBookmark}>
                    {bookmarked ? '북마크됨' : '북마크'}
                  </ExecutiveButton>
                </div>
                <div>
                  <ExecutiveButton
                    variant="secondary"
                    icon={<Share2 size={15} />}
                    onClick={() => {
                      void shareCardNews(card).then(setShareFeedback).catch(() => setShareFeedback('공유를 처리하지 못했습니다.'));
                    }}
                  >
                    공유
                  </ExecutiveButton>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (sourceOptions.length <= 1) {
                        const singleSource = sourceOptions[0];
                        if (singleSource) {
                          openSourceLink(singleSource.url);
                        }
                        return;
                      }
                      setSourcePickerOpen((current) => !current);
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
                  >
                    {sourceOptions.length > 1 ? '원문 열기' : '원문 열기'}
                  </button>
                  {sourcePickerOpen && sourceOptions.length > 1 ? (
                    <div className="absolute bottom-[calc(100%+10px)] right-0 z-10 w-[320px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)]">
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-4 py-3">
                        <p className="axis-kicker">Source links</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">열어볼 원문 기사를 선택하세요.</p>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto p-2">
                        {sourceOptions.map((source) => (
                          <button
                            key={source.id}
                            type="button"
                            onClick={() => openSourceLink(source.url)}
                            className="block w-full rounded-[var(--axis-radius-md)] p-3 text-left transition hover:bg-[var(--axis-surface-soft)]"
                          >
                            <span className="block text-sm font-semibold text-[var(--axis-ink)]">{source.title}</span>
                            {source.meta ? (
                              <span className="mt-1 block text-xs text-[var(--axis-muted)]">{source.meta}</span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {shareFeedback ? <p className="mt-3 text-xs font-semibold text-[var(--axis-muted)]">{shareFeedback}</p> : null}
            </div>
          </div>
        </div>
      </section>
      {previousCard ? (
        <button
          type="button"
          onClick={() => navigateCard(previousCard)}
          className="absolute left-[max(16px,calc(50%-584px))] top-1/2 hidden w-[156px] -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-lg)] border border-white/20 bg-[rgba(16,16,20,0.28)] text-left shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur md:block"
        >
          <div className="relative h-[128px]">
            {previousCard.coverImageUrl ? (
              <img src={previousCard.coverImageUrl} alt={previousCard.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
            <span className="absolute left-3 top-3 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/80">이전 카드</span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[11px] font-semibold text-white/70">{getPeerLabel(previousCard)}</p>
              <p className="mt-1 line-clamp-3 text-xs font-semibold leading-4 text-white">{previousCard.title}</p>
            </div>
          </div>
        </button>
      ) : null}
      {nextCard ? (
        <button
          type="button"
          onClick={() => navigateCard(nextCard)}
          className="absolute right-[max(16px,calc(50%-584px))] top-1/2 hidden w-[156px] -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-lg)] border border-white/20 bg-[rgba(16,16,20,0.28)] text-left shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur md:block"
        >
          <div className="relative h-[128px]">
            {nextCard.coverImageUrl ? (
              <img src={nextCard.coverImageUrl} alt={nextCard.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
            <span className="absolute right-3 top-3 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/80">다음 카드</span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[11px] font-semibold text-white/70">{getPeerLabel(nextCard)}</p>
              <p className="mt-1 line-clamp-3 text-xs font-semibold leading-4 text-white">{nextCard.title}</p>
            </div>
          </div>
        </button>
      ) : null}
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
          subtitle="카드 커버 단위로 전체 흐름을 빠르게 훑고, 필요한 카드만 열어 AI 요약, 시사점, 원문 링크까지 이어서 확인할 수 있는 화면입니다."
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
            <main data-guide="cardnews-grid" className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
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
          cards={visibleRows.map((row) => row.card)}
          bookmarked={bookmarkedIds.includes(detailCard.id)}
          slideIndex={detailSlideIndex}
          onSlideChange={setDetailSlideIndex}
          onBookmark={() => onToggleBookmark(detailCard.id)}
          onCardChange={(cardId) => {
            setDetailCardId(cardId);
            setDetailSlideIndex(0);
          }}
          onClose={() => {
            setDetailCardId(null);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}

const insightResult = mockInsightResult;

export function InsightResultView({
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { cards } = useCardNews();
  const contentViewMode = useContentViewMode();
  const insightEvidenceCards = getExecutiveRank(cards).slice(0, 6);
  const [insightDetailCardId, setInsightDetailCardId] = useState<string | null>(null);
  const [insightDetailSlideIndex, setInsightDetailSlideIndex] = useState(0);
  const [activeInsightStep, setActiveInsightStep] = useState(0);
  const insightDetailCard = insightDetailCardId ? cards.find((card) => card.id === insightDetailCardId) ?? null : null;
  const isVisualMode = contentViewMode === 'visual';
  const activeFlowStep = insightResult.flowSteps[activeInsightStep] ?? insightResult.flowSteps[0];

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Insight result"
          title={insightResult.title}
          subtitle="원인, 변화, 영향, 대응을 한 흐름으로 묶어 오늘 바로 판단해야 할 신호와 근거를 한 화면에서 읽을 수 있도록 정리한 화면입니다."
        />

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-5">
            {isVisualMode ? (
              <>
                <section data-guide="insight-summary" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
                        <Sparkles size={18} />
                      </span>
                      <h2 className="axis-section-heading">핵심 판단</h2>
                    </div>
                  </div>
                  <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="flex min-h-[300px] flex-col justify-center rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.28)] bg-[radial-gradient(circle_at_12%_20%,rgba(220,90,36,0.12),transparent_34%),var(--axis-canvas)] p-6">
                      <p className="text-2xl font-semibold leading-9 text-[var(--axis-ink)]">{insightResult.summary}</p>
                      <p className="mt-4 text-sm font-semibold text-[var(--axis-muted)]">단계 카드를 누르면 오른쪽 도형 보드의 상세 해석이 바뀝니다.</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {insightResult.flowSteps.map((step, index) => (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => setActiveInsightStep(index)}
                            className={`group relative min-h-24 overflow-hidden rounded-[var(--axis-radius-md)] border p-3 text-left transition hover:border-[var(--axis-accent)] ${
                              activeInsightStep === index
                                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.11)]'
                                : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)]'
                            }`}
                            aria-pressed={activeInsightStep === index}
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--axis-canvas)] text-xs font-black text-[var(--axis-accent-strong)]">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <span className="text-sm font-bold text-[var(--axis-ink)]">{step.label}</span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[var(--axis-body)]">{step.description}</p>
                            <InsightRevealBubble text={step.description} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-h-[300px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-5">
                      <div className="absolute left-1/2 top-10 h-[calc(100%-80px)] w-px -translate-x-1/2 bg-[var(--axis-hairline)]" aria-hidden="true" />
                      <div className="absolute left-10 right-10 top-1/2 h-px -translate-y-1/2 bg-[var(--axis-hairline)]" aria-hidden="true" />
                      <div className="relative z-10 flex h-full min-h-[260px] items-center justify-center">
                        <div className="max-w-sm rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.32)] bg-[var(--axis-canvas)] p-5 text-center shadow-[0_18px_48px_-34px_rgba(0,0,0,0.38)]">
                          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--axis-accent)] text-lg font-black text-white">
                            {String(activeInsightStep + 1).padStart(2, '0')}
                          </span>
                          <p className="mt-4 axis-kicker">{activeFlowStep?.label}</p>
                          <p className="mt-2 text-lg font-semibold leading-7 text-[var(--axis-ink)]">{activeFlowStep?.description}</p>
                        </div>
                        {insightResult.flowSteps.map((step, index) => {
                          const positions = [
                            'left-[8%] top-[10%]',
                            'right-[8%] top-[12%]',
                            'left-[9%] bottom-[10%]',
                            'right-[9%] bottom-[12%]',
                          ];
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => setActiveInsightStep(index)}
                              className={`absolute ${positions[index] ?? 'left-4 top-4'} flex h-20 w-20 items-center justify-center rounded-full border text-xs font-black transition hover:scale-105 ${
                                activeInsightStep === index
                                  ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                                  : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                              }`}
                              aria-label={`${step.label} 상세 보기`}
                              aria-pressed={activeInsightStep === index}
                            >
                              {step.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
                <section data-guide="insight-analysis" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  {[
                    { title: '판단 근거', label: 'Evidence', items: insightResult.evidence, tone: 'success' },
                    { title: '시사점', label: 'Implications', items: insightResult.implications, tone: 'accent' },
                  ].map((group) => (
                    <section key={group.title} className="axis-panel-flat overflow-hidden">
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                        <p className="axis-kicker">{group.label}</p>
                        <h2 className="axis-section-heading mt-1">{group.title}</h2>
                      </div>
                      <div className="grid gap-3 p-5 sm:grid-cols-2">
                        {group.items.map((item, index) => (
                          <article
                            key={item}
                            tabIndex={0}
                            className={`group relative min-h-32 overflow-hidden rounded-[var(--axis-radius-lg)] border p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--axis-accent)] focus-visible:border-[var(--axis-accent)] focus-visible:outline-none ${
                              group.tone === 'success'
                                ? 'border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)]'
                                : 'border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.07)]'
                            }`}
                          >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--axis-canvas)] text-xs font-bold text-[var(--axis-muted)]">{index + 1}</span>
                            <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item}</p>
                            <InsightRevealBubble text={item} />
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </section>
              </>
            ) : (
              <>
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
              </>
            )}
          </main>

          <aside data-guide="insight-sources" className="2xl:sticky 2xl:top-4 2xl:self-start">
            {insightEvidenceCards.length > 0 ? (
              <section className="axis-panel-flat p-5">
                <p className="axis-kicker">Evidence queue</p>
                <h2 className="axis-section-heading mt-1">근거 카드뉴스</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
                  브리핑에서 쓰는 근거 카드뉴스 형식으로, 인사이트 판단 근거를 바로 확인합니다.
                </p>
                <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {insightEvidenceCards.map((card, index) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setInsightDetailCardId(card.id)}
                      className="group relative block w-full overflow-hidden rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-canvas)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(220,90,36,0.10)] text-xs font-black text-[var(--axis-accent-strong)]">
                          {index + 1}
                        </span>
                        <span className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
                      <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-[var(--axis-muted)]">{getSummaryLines(card)[0]}</p>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <EmptyBlock label="관련 콘텐츠 카드가 없습니다." />
            )}
          </aside>
        </section>
      </ExecutiveContainer>
      {insightDetailCard ? (
        <FloatingCardNewsOverlay
          card={insightDetailCard}
          cards={insightEvidenceCards}
          bookmarked={bookmarkedIds.includes(insightDetailCard.id)}
          slideIndex={insightDetailSlideIndex}
          onSlideChange={setInsightDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(insightDetailCard.id)}
          onCardChange={(cardId) => {
            setInsightDetailCardId(cardId);
            setInsightDetailSlideIndex(0);
          }}
          onClose={() => {
            setInsightDetailCardId(null);
            setInsightDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}

function InsightRevealBubble({ text }: { text: string }) {
  return (
    <span
      data-hover-reveal
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 max-h-24 translate-y-2 overflow-y-auto rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--axis-ink)] opacity-0 shadow-[0_18px_48px_-30px_rgba(0,0,0,0.45)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      {text}
    </span>
  );
}

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
  const [graphMode, setGraphMode] = useState<'2d' | '3d'>('3d');
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
