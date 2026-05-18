import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Check, Sparkles } from 'lucide-react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RadarShape,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useCardNews } from '../../card-news/hooks/useCardNews';
import { getSummaryLines } from '../../card-news/mappers/cardNewsExecutive';
import { buildMixerCards } from '../../card-news/mappers/cardNewsPresentation';
import { FloatingCardNewsOverlay } from '../../card-news/components/FloatingCardNewsOverlay';
import { useMixerAnalysis } from '../hooks/useMixerAnalysis';
import { MIXER_RADAR_LABELS, type MixerAnalysisResponse } from '../model/mixer';
import { adaptMixerToView, type MixerResultView } from '../utils/adaptMixerView';
import { MixerAnalysisOverlay } from './MixerAnalysisOverlay';
import { DonutCalloutChart } from './DonutCalloutChart';
import { cardNewsItems as fallbackCardNewsItems } from '../../../shared/mocks/cardNews';
import { mockMixerConfig } from '../../../shared/mocks/mixer';
import { getPeerLogo } from '../../../shared/utils/peerLogo';
import { LoadingBlock } from '../../../shared/ui/page-state';
import { GraphifyPreview } from '../../../shared/ui/graphify-preview';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../../shared/ui/ExecutiveSystem';

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

