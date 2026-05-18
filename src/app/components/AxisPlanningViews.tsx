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
import {
  homePeerFinancialData,
  homePeerRadarData,
} from '../../shared/mocks/homeDashboardPresentation';
import { cardNewsItems as fallbackCardNewsItems } from '../../shared/mocks/cardNews';
import { mockInsightResult } from '../../shared/mocks/insight';
import { useInsightGeneration } from '../../features/insight/hooks/useInsightGeneration';
import { useMixerAnalysis } from '../../features/mixer/hooks/useMixerAnalysis';
import { MIXER_RADAR_LABELS, type MixerAnalysisResponse } from '../../features/mixer/model/mixer';
import { usePeerStrategy } from '../../features/peer-strategy/hooks/usePeerStrategy';
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
import { getPeerLogo } from '../../shared/utils/peerLogo';
import { LoadingBlock, EmptyBlock } from '../../shared/ui/page-state';
import { GraphifyPreview } from '../../shared/ui/graphify-preview';
import { getCardSourceOptions, dedupeCardsById } from '../../features/card-news/utils/cardSources';
import { shareCardNews } from '../../features/card-news/utils/cardSharing';
import { FloatingCardNewsOverlay } from '../../features/card-news/components/FloatingCardNewsOverlay';
import { ChartButton } from '../../features/home/components/ChartButton';
import { adaptMixerToView, type MixerResultView } from '../../features/mixer/utils/adaptMixerView';
import { MixerAnalysisOverlay } from '../../features/mixer/components/MixerAnalysisOverlay';
import { DonutCalloutChart } from '../../features/mixer/components/DonutCalloutChart';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from './executive/ExecutiveSystem';

type NavigateHandler = (view: string) => void;

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
  const [mixerRaw, setMixerRaw] = useState<MixerAnalysisResponse | null>(null);
  const [mixerErrorMessage, setMixerErrorMessage] = useState<string | null>(null);
  const [showMixerSteps, setShowMixerSteps] = useState(false);
  const [mixerDetailCardId, setMixerDetailCardId] = useState<string | null>(null);
  const [mixerDetailSlideIndex, setMixerDetailSlideIndex] = useState(0);
  const generationTimeoutRef = useRef<number | null>(null);
  const { analyze: analyzeMixer, isLoading: isGenerating } = useMixerAnalysis();

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
    };
  };

  const generateMixerResult = async () => {
    if (!canGenerate || isGenerating) return;
    if (generationTimeoutRef.current !== null) {
      window.clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = null;
    }

    setMixerErrorMessage(null);
    const mockResult = buildMixerResult();

    const raw = await analyzeMixer({
      cardIds: selectedCards.map((item) => item.card.id),
      ratios: {
        peer: selectedPeers,
        industry: selectedIndustries,
        keyword: selectedKeywords,
        customer: selectedCustomers,
      },
    });

    if (raw) {
      setMixerRaw(raw);
      setResult(adaptMixerToView(raw, mockResult));
    } else {
      setMixerRaw(null);
      setResult(mockResult);
      setMixerErrorMessage('axis-ai 호출 실패 — 샘플 결과 표시');
    }

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
                      <img
                        src={item.card.coverImageUrl ?? getPeerLogo(item.card.peer_id)}
                        alt={item.card.coverImageAlt ?? item.peer}
                        className="h-full w-full object-cover opacity-70"
                      />
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {mixerRaw ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.10)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
                <Sparkles size={14} />
                AI 초안
                <span className="ml-1 text-[var(--axis-muted)]">신뢰도 {Math.round((mixerRaw.confidence ?? 0) * 100)}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
                샘플 데이터
              </span>
            )}
            {mixerRaw && (mixerRaw.confidence ?? 0) < 0.6 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                ⚠️ 근거 불충분 — 결과는 참고용
              </span>
            ) : null}
            {mixerRaw?.warning ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                ⚠️ {mixerRaw.warning}
              </span>
            ) : null}
            {mixerErrorMessage ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                {mixerErrorMessage}
              </span>
            ) : null}
            {mixerRaw?.mix_id ? (
              <span className="ml-auto text-[10px] font-mono text-[var(--axis-muted)]">
                mix: {mixerRaw.mix_id}
              </span>
            ) : null}
          </div>

          {mixerRaw && mixerRaw.radar_axes.length > 0 ? (
            <section className="axis-panel-flat mt-5 p-5">
              <p className="axis-kicker">6-axis radar (AI)</p>
              <h3 className="axis-section-heading mt-1">결정적 산식 기반 6축 점수</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mixerRaw.radar_axes.map((axis) => {
                  const label = MIXER_RADAR_LABELS.find((l) => l.id === axis.axis)?.label ?? axis.axis;
                  const percent = Math.round(axis.score * 100);
                  return (
                    <div
                      key={axis.axis}
                      className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--axis-ink)]">{label}</p>
                        <span className="text-xs font-bold text-[var(--axis-accent-strong)]">{percent}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--axis-surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--axis-accent)]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[var(--axis-muted)]">{axis.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {mixerRaw && mixerRaw.reasoning_trail.length > 0 ? (
            <section className="axis-panel-flat mt-5 overflow-hidden">
              <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                <p className="axis-kicker">Reasoning trail</p>
                <h3 className="axis-section-heading mt-1">AI 분석 흐름</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
                  3-phase per_card / cross_card / synthesis 흐름을 사용자 관점 한 줄로 요약합니다.
                </p>
              </div>
              <ol className="space-y-2 p-5">
                {mixerRaw.reasoning_trail.map((item) => (
                  <li
                    key={item.seq}
                    className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.10)] text-xs font-black text-[var(--axis-accent-strong)]">
                      {item.seq}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--axis-ink)]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.one_liner}</p>
                      {item.evidence_refs.length > 0 ? (
                        <p className="mt-2 text-xs text-[var(--axis-muted)]">
                          근거: {item.evidence_refs.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              {mixerRaw.reasoning_steps.length > 0 ? (
                <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setShowMixerSteps((prev) => !prev)}
                    className="text-xs font-semibold text-[var(--axis-accent-strong)] underline-offset-2 hover:underline"
                    aria-expanded={showMixerSteps}
                  >
                    {showMixerSteps ? '상세 단계 닫기 ▲' : '상세 단계 더 보기 ▼'}
                  </button>
                  {showMixerSteps ? (
                    <ol className="mt-3 space-y-3">
                      {mixerRaw.reasoning_steps.map((step) => (
                        <li
                          key={step.step_idx}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[var(--axis-accent-strong)]">
                              Step {step.step_idx} · {step.phase}
                            </p>
                            <span className="text-xs text-[var(--axis-muted)]">
                              conf {step.confidence.toFixed(2)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">Q. {step.question}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">A. {step.answer}</p>
                          <p className="mt-2 text-xs italic leading-5 text-[var(--axis-muted)]">
                            중간 결론: {step.intermediate_conclusion}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ) : null}
              {mixerRaw.langfuse_trace_id ? (
                <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-2 text-right">
                  <span className="text-[10px] font-mono text-[var(--axis-muted)]">
                    trace: {mixerRaw.langfuse_trace_id}
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          {mixerRaw && mixerRaw.connections.length > 0 ? (
            <section className="axis-panel-flat mt-5 p-5">
              <p className="axis-kicker">Cross-card connections</p>
              <h3 className="axis-section-heading mt-1">카드 간 연결 (cause / similar / contrast / reinforce)</h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {mixerRaw.connections.map((conn, index) => (
                  <li
                    key={`${conn.source_card_id}-${conn.target_card_id}-${index}`}
                    className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3 text-xs leading-5 text-[var(--axis-body)]"
                  >
                    <span className="inline-block rounded-full bg-[rgba(220,90,36,0.10)] px-2 py-0.5 text-[10px] font-bold text-[var(--axis-accent-strong)]">
                      {conn.label}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-[var(--axis-muted)]">
                      {conn.source_card_id} → {conn.target_card_id}
                    </span>
                    <span className="ml-2 text-[10px] text-[var(--axis-muted)]">w={conn.weight.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {mixerRaw && mixerRaw.follow_up_questions.length > 0 ? (
            <section className="axis-panel-flat mt-5 overflow-hidden">
              <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                <p className="axis-kicker">Follow up</p>
                <h3 className="axis-section-heading mt-1">후속 질문</h3>
              </div>
              <ul className="space-y-2 p-5">
                {mixerRaw.follow_up_questions.map((question, index) => (
                  <li
                    key={`${index}-${question}`}
                    className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3 text-sm leading-6 text-[var(--axis-body)]"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
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
      </ExecutivePage>
    );
  }

  return (
    <ExecutivePage className="relative">
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Mixer workbench"
          title="믹서"
          subtitle="뉴스, Peer, 고객사, 산업, 키워드를 고른 뒤 믹서 결과를 생성합니다."
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
                      <img
                        src={item.card.coverImageUrl ?? getPeerLogo(item.card.peer_id)}
                        alt={item.card.coverImageAlt ?? item.peer}
                        className="absolute inset-0 h-full w-full object-cover opacity-55"
                      />
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
  const contentViewMode = useContentViewMode();
  const peerOptions = mockPeerPlusOptions;
  const [selectedPeerId, setSelectedPeerId] = useState<PeerPlusPeerId>(() => {
    const stored = window.localStorage.getItem(peerPlusSelectionStorageKey);
    return mockPeerPlusOptions.some((peer) => peer.id === stored) ? (stored as PeerPlusPeerId) : 'samsung_sds';
  });
  const [peerDetailCardId, setPeerDetailCardId] = useState<string | null>(null);
  const [peerDetailSlideIndex, setPeerDetailSlideIndex] = useState(0);
  const [peerKeywordMatches, setPeerKeywordMatches] = useState<{ keyword: string; cards: CardNewsItem[] } | null>(null);
  const [showPeerStrategySteps, setShowPeerStrategySteps] = useState(false);
  const {
    data: peerStrategyData,
    isLoading: isStrategyLoading,
    error: peerStrategyError,
    refetch: refetchPeerStrategy,
  } = usePeerStrategy({ peerId: selectedPeerId });
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
  const selectedDartSummary = selectedPeerId === 'samsung_sds' ? dashboard?.dartSummary ?? null : null;
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
  const irMetricCards = selectedDartSummary
    ? [
        { label: '매출', value: formatEokValue(selectedDartSummary.revenueTotalKrwBn), delta: 0 },
        { label: '영업이익', value: formatEokValue(selectedDartSummary.operatingProfitKrwBn), delta: 0 },
        { label: '영업이익률', value: `${selectedDartSummary.operatingMarginPct.toFixed(2)}%`, delta: 0 },
        { label: '순이익률', value: `${(selectedDartSummary.netMarginPct ?? 0).toFixed(2)}%`, delta: 0 },
        { label: '부채비율', value: `${(selectedDartSummary.debtRatioPct ?? 0).toFixed(2)}%`, delta: 0 },
        { label: 'CAPEX 비율', value: `${(selectedDartSummary.capexRatioPct ?? 0).toFixed(2)}%`, delta: 0 },
      ]
    : [
        { label: '매출', value: selectedIr.revenue, delta: selectedIr.deltas.revenue },
        { label: '영업이익', value: selectedIr.operatingProfit, delta: selectedIr.deltas.operatingProfit },
        { label: 'AX 비중', value: selectedIr.axRatio, delta: selectedIr.deltas.axRatio },
        { label: '수주잔고', value: selectedIr.orderBacklog, delta: selectedIr.deltas.orderBacklog },
        { label: '영업이익률', value: selectedIr.margin, delta: selectedIr.deltas.margin },
        { label: '투자/Capex', value: selectedIr.capex, delta: selectedIr.deltas.capex },
      ];
  const dartData = selectedDartSummary?.radarMetrics?.length
    ? selectedDartSummary.radarMetrics.map((item) => ({
        subject: item.axis,
        value: item.score,
        metric: item.metric,
        displayValue: item.displayValue,
      }))
    : [
        { subject: '매출 성장', value: Number(selectedIr.revenue.replace(/[^0-9.]/g, '')) > 2 ? 86 : 72, metric: '목업 지표', displayValue: selectedIr.revenue },
        { subject: 'AX 투자', value: Number(selectedIr.axRatio.replace('%', '')) + 48, metric: '목업 지표', displayValue: selectedIr.axRatio },
        { subject: '수주 모멘텀', value: Number(selectedIr.orderBacklog.replace(/[^0-9.]/g, '')) * 18 + 50, metric: '목업 지표', displayValue: selectedIr.orderBacklog },
        { subject: '운영 효율', value: Number(selectedIr.margin.replace('%', '')) * 8 + 18, metric: '목업 지표', displayValue: selectedIr.margin },
        { subject: '시장 노출', value: 82, metric: '목업 지표', displayValue: '82' },
      ];
  const selectedKeywordCloud = mockPeerPlusKeywordCloud[selectedPeerId];
  const isVisualMode = contentViewMode === 'visual';
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

        <section className="axis-panel-flat mb-5 overflow-hidden border-[rgba(220,90,36,0.26)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
                <Sparkles size={14} />
                AI 초안
              </span>
              {peerStrategyData ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-ink)]">
                  전략 라벨: {peerStrategyData.strategy_label || '미분류'}
                </span>
              ) : null}
              {peerStrategyData ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
                  신뢰도 {Math.round((peerStrategyData.confidence ?? 0) * 100)}%
                </span>
              ) : null}
              {peerStrategyData && (peerStrategyData.confidence ?? 0) < 0.6 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                  ⚠️ 근거 불충분 — 참고용
                </span>
              ) : null}
              {peerStrategyData?.warning ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                  ⚠️ {peerStrategyData.warning}
                </span>
              ) : null}
              {isStrategyLoading ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
                  분석 중…
                </span>
              ) : null}
              {peerStrategyError ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  분석 실패: {peerStrategyError}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={refetchPeerStrategy}
              disabled={isStrategyLoading}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              다시 분석
            </button>
          </div>

          {peerStrategyData ? (
            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                {peerStrategyData.final_one_liner ? (
                  <p className="text-xl font-semibold leading-9 text-[var(--axis-ink)]">{peerStrategyData.final_one_liner}</p>
                ) : null}
                {peerStrategyData.sk_ax_implication ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{peerStrategyData.sk_ax_implication}</p>
                ) : null}
                {peerStrategyData.differentiators.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {peerStrategyData.differentiators.map((diff, index) => (
                      <li
                        key={`${index}-${diff.aspect}`}
                        className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
                      >
                        <p className="text-sm font-semibold text-[var(--axis-ink)]">{diff.aspect}</p>
                        {diff.peer_position || diff.skax_position ? (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs leading-5 text-[var(--axis-body)]">
                            {diff.peer_position ? (
                              <div>
                                <span className="font-bold text-[var(--axis-muted)]">Peer:</span> {diff.peer_position}
                              </div>
                            ) : null}
                            {diff.skax_position ? (
                              <div>
                                <span className="font-bold text-[var(--axis-muted)]">SK AX:</span> {diff.skax_position}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {diff.opportunity ? (
                          <p className="mt-2 text-xs italic leading-5 text-[var(--axis-accent-strong)]">기회: {diff.opportunity}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="space-y-3">
                {peerStrategyData.trend_deltas.length > 0 ? (
                  <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-4">
                    <p className="axis-kicker">Trend deltas (산식)</p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--axis-body)]">
                      {peerStrategyData.trend_deltas.map((delta) => (
                        <li key={delta.metric} className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-[var(--axis-ink)]">{delta.label ?? delta.metric}</span>
                          <span className="font-mono">
                            QoQ {delta.qoq_pct !== null && delta.qoq_pct !== undefined ? `${delta.qoq_pct.toFixed(1)}%` : 'N/A'} · YoY{' '}
                            {delta.yoy_pct !== null && delta.yoy_pct !== undefined ? `${delta.yoy_pct.toFixed(1)}%` : 'N/A'}
                          </span>
                          <span className="rounded-full bg-[var(--axis-canvas)] px-2 py-0.5 text-[10px] font-bold text-[var(--axis-accent-strong)]">
                            {delta.band}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-3 text-xs text-[var(--axis-muted)]">
                    peer_financials 부재 — 정량 추세 산출 불가
                  </div>
                )}
                {peerStrategyData.strengths_of_peer.length > 0 ? (
                  <div className="rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.06)] p-3">
                    <p className="axis-kicker">Peer 강점</p>
                    <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[var(--axis-body)]">
                      {peerStrategyData.strengths_of_peer.map((s, idx) => (
                        <li key={`s-${idx}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {peerStrategyData.weaknesses_of_peer.length > 0 ? (
                  <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.06)] p-3">
                    <p className="axis-kicker">Peer 약점</p>
                    <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[var(--axis-body)]">
                      {peerStrategyData.weaknesses_of_peer.map((s, idx) => (
                        <li key={`w-${idx}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-[var(--axis-muted)]">분석 결과를 불러오는 중이거나 데이터가 없습니다.</div>
          )}

          {peerStrategyData && peerStrategyData.reasoning_trail.length > 0 ? (
            <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-4">
              <p className="axis-kicker">Reasoning trail</p>
              <h3 className="axis-section-heading mt-1">AI 분석 흐름</h3>
              <ol className="mt-3 space-y-2">
                {peerStrategyData.reasoning_trail.map((item) => (
                  <li
                    key={item.seq}
                    className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.10)] text-xs font-black text-[var(--axis-accent-strong)]">
                      {item.seq}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--axis-ink)]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.one_liner}</p>
                      {item.evidence_refs.length > 0 ? (
                        <p className="mt-1 text-xs text-[var(--axis-muted)]">근거: {item.evidence_refs.join(', ')}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              {peerStrategyData.reasoning_steps.length > 0 ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPeerStrategySteps((prev) => !prev)}
                    className="text-xs font-semibold text-[var(--axis-accent-strong)] underline-offset-2 hover:underline"
                    aria-expanded={showPeerStrategySteps}
                  >
                    {showPeerStrategySteps ? '상세 단계 닫기 ▲' : '상세 단계 더 보기 ▼'}
                  </button>
                  {showPeerStrategySteps ? (
                    <ol className="mt-3 space-y-2">
                      {peerStrategyData.reasoning_steps.map((step) => (
                        <li
                          key={step.step_idx}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[var(--axis-accent-strong)]">
                              Step {step.step_idx} · {step.phase}
                            </p>
                            <span className="text-xs text-[var(--axis-muted)]">conf {step.confidence.toFixed(2)}</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">Q. {step.question}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">A. {step.answer}</p>
                          <p className="mt-2 text-xs italic leading-5 text-[var(--axis-muted)]">중간 결론: {step.intermediate_conclusion}</p>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ) : null}
              {peerStrategyData.langfuse_trace_id ? (
                <p className="mt-2 text-right text-[10px] font-mono text-[var(--axis-muted)]">trace: {peerStrategyData.langfuse_trace_id}</p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <article data-guide="peer-insight" className="axis-panel-flat min-h-[360px] p-5">
            <p className="axis-kicker">AI comparison summary</p>
            <h2 className="mt-2 text-lg font-display font-semibold leading-tight text-ink">
              경쟁 메시지 차이와 SK AX 대응 포인트
            </h2>
            {isVisualMode ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="relative min-h-[300px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[radial-gradient(circle_at_50%_48%,rgba(220,90,36,0.10),transparent_46%),var(--axis-surface-muted)] p-5">
                  <div className="absolute left-[18%] right-[18%] top-1/2 h-px bg-[var(--axis-hairline)]" />
                  {[
                    { label: 'SK AX', sub: '운영 KPI', left: '16%', top: '52%', tone: 'accent', text: peerInsightItems[0].body },
                    { label: selectedPeer.label, sub: '공개 신호', left: '84%', top: '52%', tone: 'success', text: peerInsightItems[2]?.body ?? peerInsightItems[0].body },
                    { label: 'GAP', sub: '제안 전환', left: '50%', top: '26%', tone: 'neutral', text: peerInsightItems[peerInsightItems.length - 2]?.body ?? peerInsightItems[0].body },
                    { label: 'Risk', sub: '수주 검증', left: '50%', top: '78%', tone: 'muted', text: peerInsightItems[peerInsightItems.length - 1]?.body ?? peerInsightItems[0].body },
                  ].map((node) => (
                    <button
                      key={`${node.label}-${node.sub}`}
                      type="button"
                      className={`group absolute flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border p-3 text-center transition hover:scale-105 ${
                        node.tone === 'accent'
                          ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.16)] text-[var(--axis-accent-strong)]'
                          : node.tone === 'success'
                            ? 'border-[var(--axis-success)] bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                            : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                      }`}
                      style={{ left: node.left, top: node.top }}
                    >
                      <span className="text-base font-black leading-tight">{node.label}</span>
                      <span className="mt-1 text-[11px] font-semibold text-[var(--axis-muted)]">{node.sub}</span>
                      <InsightRevealBubble text={node.text} />
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {peerInsightItems.map((item, index) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      tabIndex={0}
                      className={`group relative min-h-28 overflow-hidden rounded-[var(--axis-radius-lg)] border p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--axis-accent)] focus-visible:border-[var(--axis-accent)] focus-visible:outline-none ${
                        index === 0
                          ? 'sm:col-span-2 border-[rgba(220,90,36,0.28)] bg-[rgba(220,90,36,0.08)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{item.label}</span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--axis-canvas)] text-xs font-bold text-[var(--axis-muted)]">{index + 1}</span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.body}</p>
                      <InsightRevealBubble text={item.body} />
                    </article>
                  ))}
                </div>
              </div>
            ) : (
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
            )}
          </article>

          <button
            type="button"
            data-guide="peer-ir"
            onClick={() => onNavigate('keywordGraph')}
            className="axis-panel-flat min-h-[360px] p-5 text-left transition hover:border-[var(--axis-accent)]"
          >
            <p className="axis-kicker">IR numeric pack</p>
            {selectedDartSummary ? (
              <p className="mt-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
                {selectedDartSummary.reportName} · {selectedDartSummary.period}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {irMetricCards.map((item) => (
                <div key={item.label} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-4">
                  <p className="text-sm font-semibold leading-tight text-[var(--axis-muted)]">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-[22px] font-semibold leading-none text-[var(--axis-ink)]">{item.value}</p>
                    <p className={`shrink-0 text-base font-bold leading-none ${item.delta >= 0 ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'}`}>
                      {item.delta === 0 ? 'DART' : `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(2)}%`}
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
            <h2 className="axis-section-heading mt-1">
              {selectedDartSummary ? '삼성SDS 재무 체질 레이더' : '수치형 자료 요약'}
            </h2>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dartData} outerRadius={58} margin={{ top: 32, right: 28, bottom: 18, left: 28 }}>
                  <PolarGrid stroke="rgba(128,128,128,0.16)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--axis-muted)' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <RadarShape name="DART" dataKey="value" stroke="var(--axis-graph-ax)" fill="var(--axis-graph-ax)" fillOpacity={0.2} />
                  <Tooltip formatter={(value: number, _name, item) => [`${value}`, `${item.payload.metric} · ${item.payload.displayValue}`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {selectedDartSummary?.radarMetrics?.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedDartSummary.radarMetrics.map((item) => (
                  <div key={`${item.axis}-${item.metric}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-[var(--axis-muted)]">{item.axis}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{item.metric}</p>
                    <p className="mt-1 text-sm text-[var(--axis-accent-strong)]">{item.displayValue}</p>
                  </div>
                ))}
              </div>
            ) : null}
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
                <img
                  src={card.coverImageUrl ?? getPeerLogo(card.peer_id)}
                  alt={card.coverImageAlt ?? card.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-55"
                />
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
                      <img
                        src={card.coverImageUrl ?? getPeerLogo(card.peer_id)}
                        alt={card.coverImageAlt ?? card.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
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
  const insightEvidenceCards = useMemo(() => getExecutiveRank(cards).slice(0, 6), [cards]);
  const insightCardIds = useMemo(
    () => insightEvidenceCards.map((card) => card.id),
    [insightEvidenceCards],
  );
  const { result: generated, raw, isLoading: isGenerating, error: generateError, regenerate } =
    useInsightGeneration({ cardIds: insightCardIds });
  const insightResult = generated ?? mockInsightResult;
  const isAiGenerated = generated !== null;
  const confidence = raw?.confidence ?? null;
  const lowConfidence = confidence !== null && confidence < 0.6;
  const [showReasoningSteps, setShowReasoningSteps] = useState(false);
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
          subtitle="원인, 변화, 영향, 대응을 한 화면에서 연결해 읽을 수 있도록 재배치했습니다."
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {isAiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.10)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
              <Sparkles size={14} />
              AI 초안
              {confidence !== null ? (
                <span className="ml-1 text-[var(--axis-muted)]">신뢰도 {Math.round(confidence * 100)}%</span>
              ) : null}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
              샘플 데이터
            </span>
          )}
          {isGenerating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.06)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
              분석 생성 중…
            </span>
          ) : null}
          {lowConfidence ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
              ⚠️ 근거 불충분 — 결과를 참고용으로만 사용
            </span>
          ) : null}
          {raw?.warning ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
              ⚠️ {raw.warning}
            </span>
          ) : null}
          {generateError ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              생성 실패: {generateError}
            </span>
          ) : null}
          <button
            type="button"
            onClick={regenerate}
            disabled={isGenerating || insightCardIds.length === 0}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            다시 분석
          </button>
        </div>

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

            {raw && raw.reasoning_trail.length > 0 ? (
              <section data-guide="insight-reasoning-trail" className="axis-panel-flat overflow-hidden">
                <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                  <p className="axis-kicker">Reasoning trail</p>
                  <h2 className="axis-section-heading mt-1">AI 판단 흐름</h2>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
                    InsightCascade 4-phase 가 어떤 순서로 결론을 도출했는지 한 줄씩 보여줍니다.
                  </p>
                </div>
                <ol className="space-y-2 p-5">
                  {raw.reasoning_trail.map((item) => (
                    <li
                      key={item.seq}
                      className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.10)] text-xs font-black text-[var(--axis-accent-strong)]">
                        {item.seq}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--axis-ink)]">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.one_liner}</p>
                        {item.evidence_refs.length > 0 ? (
                          <p className="mt-2 text-xs text-[var(--axis-muted)]">
                            근거: {item.evidence_refs.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                {raw.reasoning_steps.length > 0 ? (
                  <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setShowReasoningSteps((prev) => !prev)}
                      className="text-xs font-semibold text-[var(--axis-accent-strong)] underline-offset-2 hover:underline"
                      aria-expanded={showReasoningSteps}
                    >
                      {showReasoningSteps ? '상세 단계 닫기 ▲' : '상세 단계 더 보기 ▼'}
                    </button>
                    {showReasoningSteps ? (
                      <ol className="mt-3 space-y-3">
                        {raw.reasoning_steps.map((step) => (
                          <li
                            key={step.step_idx}
                            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[var(--axis-accent-strong)]">
                                Step {step.step_idx} · {step.phase}
                              </p>
                              <span className="text-xs text-[var(--axis-muted)]">
                                conf {step.confidence.toFixed(2)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">Q. {step.question}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">A. {step.answer}</p>
                            <p className="mt-2 text-xs italic leading-5 text-[var(--axis-muted)]">
                              중간 결론: {step.intermediate_conclusion}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ) : null}
                {raw.langfuse_trace_id ? (
                  <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-2 text-right">
                    <span className="text-[10px] font-mono text-[var(--axis-muted)]">
                      trace: {raw.langfuse_trace_id}
                    </span>
                  </div>
                ) : null}
              </section>
            ) : null}

            {raw && raw.follow_up_questions.length > 0 ? (
              <section className="axis-panel-flat overflow-hidden">
                <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                  <p className="axis-kicker">Follow up</p>
                  <h2 className="axis-section-heading mt-1">후속 질문</h2>
                </div>
                <ul className="space-y-2 p-5">
                  {raw.follow_up_questions.map((question, index) => (
                    <li
                      key={`${index}-${question}`}
                      className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3 text-sm leading-6 text-[var(--axis-body)]"
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
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
                            <img
                              src={card.coverImageUrl ?? getPeerLogo(card.peer_id)}
                              alt={card.coverImageAlt ?? card.title}
                              className="absolute inset-0 h-full w-full object-cover opacity-55"
                            />
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
                        <img
                          src={card.coverImageUrl ?? getPeerLogo(card.peer_id)}
                          alt={card.coverImageAlt ?? card.title}
                          className="absolute inset-0 h-full w-full object-cover opacity-55"
                        />
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
