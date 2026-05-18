import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  CartesianGrid,
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
import { useCardNews } from '../../card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../card-news/model/cardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSummaryLines,
} from '../../card-news/mappers/cardNewsExecutive';
import { FloatingCardNewsOverlay } from '../../card-news/components/FloatingCardNewsOverlay';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { usePeerStrategy } from '../hooks/usePeerStrategy';
import { formatEokValue } from '../utils/formatEokValue';
import {
  mockPeerPlusIrProfiles,
  mockPeerPlusKeywordCloud,
  mockPeerPlusOptions,
  peerPlusSelectionStorageKey,
  type PeerPlusPeerId,
} from '../../../shared/mocks/peerPlus';
import { useContentViewMode } from '../../../shared/hooks/useContentViewMode';
import { getPeerLogo } from '../../../shared/utils/peerLogo';
import { LoadingBlock } from '../../../shared/ui/page-state';
import { InsightRevealBubble } from '../../../shared/ui/insight-reveal-bubble';
import { normalizeGraphTerm } from '../../../shared/utils/normalizeGraphTerm';
import {
  ExecutiveBadge,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../../app/components/executive/ExecutiveSystem';

export function PeerPlusView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
  selectedPeerId: externalSelectedPeerId,
}: {
  onNavigate: (view: string) => void;
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

