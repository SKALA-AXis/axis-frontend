import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Box, Check, Filter, Network, Sparkles, X } from 'lucide-react';
import { getCardLogoImageClass } from '../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { buildMixerCards } from '../../../../features/card-news/mappers/cardNewsPresentation';
import { useMixerAnalysis } from '../../../../features/mixer/hooks/useMixerAnalysis';
import { MIXER_RADAR_LABELS, type MixerAnalysisResponse, type MixerCoTStep, type MixerStageEvent } from '../../../../features/mixer/model/mixer';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { mockMixerConfig } from '../../../../shared/mocks/mixer';
import { ExecutiveBadge, ExecutiveButton, ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { PageProcessLoading, PageState } from '../../shared/PageState';
import { DonutCalloutChart, buildSelectionRatioData, normalizeMixerPeerLabel } from '../shared/axis';

// axis-ai MixerAnalysisAgent 가 실제로 넘는 단계(prepare→analyze→synthesize→finalize).
// SSE stage 이벤트의 index 로 현재 단계를 결정 — 가짜 순환이 아니라 실제 진행이다.
const MIXER_RUN_STEPS: { stage: MixerStageEvent['stage']; title: string; description: string; icon: JSX.Element }[] = [
  { stage: 'prepare', title: '재료 정리', description: '선택한 카드와 연결된 통합 이슈·분석·시사점을 불러옵니다.', icon: <Box size={16} /> },
  { stage: 'analyze', title: '패턴 분석', description: '카드들의 공통 패턴·비교 포인트·숨은 결론을 LLM으로 도출합니다.', icon: <Filter size={16} /> },
  { stage: 'synthesize', title: '대응 방향', description: 'SK AX 관점의 대응 방향과 실행 제언을 만듭니다.', icon: <Network size={16} /> },
  { stage: 'finalize', title: '추론 정리', description: '추론 흐름과 근거 카드를 정리해 결과로 압축합니다.', icon: <Sparkles size={16} /> },
];

function MixerAnalysisOverlay({ stage }: { stage: MixerStageEvent | null }) {
  const loadingSteps = MIXER_RUN_STEPS;
  // stage 미수신(요청 직후) 시 0단계 활성. 수신 시 실제 index 사용.
  const activeStep = stage ? Math.min(Math.max(stage.index, 0), loadingSteps.length - 1) : 0;
  const total = stage?.total ?? loadingSteps.length;
  const activeLabel = stage?.label ?? loadingSteps[activeStep]?.description ?? '';

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
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--axis-accent),rgba(220,90,36,0.45))] transition-[width] duration-500"
                  style={{ width: `${((activeStep + 1) / total) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[var(--axis-muted)]">
                {activeStep + 1} / {total} 단계 진행 중
              </p>
              <div className="mt-5 grid gap-2">
                {loadingSteps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isComplete = index < activeStep;
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
                          {isActive ? `${activeLabel}...` : isComplete ? '완료' : '대기 중'}
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

const toPercent = (value: number) => `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;

const MIXER_PHASE_LABELS: Record<MixerCoTStep['phase'], string> = {
  per_card: '카드별 해석',
  cross_card: '카드 간 비교',
  synthesis: '종합 추론',
};

const provenanceString = (provenance: Record<string, unknown>, key: string): string | null => {
  const value = provenance?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
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
  onUpdateTimeChange,
}: {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}) {
  const { cards, isLoading, error, reload } = useCardNews();
  const { analyze: analyzeMixer, error: mixerError, reset: resetMixer, stage: mixerStage } = useMixerAnalysis();
  const [mode, setMode] = useState<'select' | 'result' | 'history'>('select');
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [candidatePage, setCandidatePage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MixerAnalysisResponse | null>(null);
  const [activeResultStep, setActiveResultStep] = useState(0);
  const [showInsightReasoning, setShowInsightReasoning] = useState(false);
  const [mixerDetailCardId, setMixerDetailCardId] = useState<string | null>(null);
  const [mixerDetailSlideIndex, setMixerDetailSlideIndex] = useState(0);
  const [historyStartDate, setHistoryStartDate] = useState('2026-05-13');
  const [historyEndDate, setHistoryEndDate] = useState('2026-05-15');

  useEffect(() => {
    if (isLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, isLoading, onUpdateTimeChange]);

  const mixerCards = useMemo(() => buildMixerCards(cards), [cards]);
  const visibleCards = mixerCards.filter((item) => {
    const peerMatched = selectedPeers.length === 0 || selectedPeers.includes(item.peer);
    const bookmarkMatched = !bookmarkedOnly || bookmarkedIds.includes(item.card.id);
    return peerMatched && bookmarkMatched;
  });
  const candidatePageSize = 20;
  const totalCandidatePages = Math.max(1, Math.ceil(visibleCards.length / candidatePageSize));
  const pagedVisibleCards = visibleCards.slice((candidatePage - 1) * candidatePageSize, candidatePage * candidatePageSize);
  const candidatePaginationWindowSize = 5;
  const candidatePageWindowStart = Math.floor((candidatePage - 1) / candidatePaginationWindowSize) * candidatePaginationWindowSize + 1;
  const candidatePageNumbers = useMemo(() => {
    const windowEnd = Math.min(totalCandidatePages, candidatePageWindowStart + candidatePaginationWindowSize - 1);
    return Array.from({ length: windowEnd - candidatePageWindowStart + 1 }, (_, index) => candidatePageWindowStart + index);
  }, [candidatePageWindowStart, totalCandidatePages]);
  const selectedCards = mixerCards.filter((item) => selectedIds.includes(item.id));
  const filteredHistoryPreviewGroups = useMemo(() => {
    return mixerHistoryPreviewGroups.filter((group) => {
      const normalizedDate = group.date.replace(/\./g, '-');
      const afterStart = !historyStartDate || normalizedDate >= historyStartDate;
      const beforeEnd = !historyEndDate || normalizedDate <= historyEndDate;
      return afterStart && beforeEnd;
    });
  }, [historyEndDate, historyStartDate]);
  const historyPreviewEntries = useMemo(() => {
    return filteredHistoryPreviewGroups
      .flatMap((group) =>
        group.entries.map((entry, index) => ({
          key: `${group.date}-${index}`,
          date: group.date,
          title: entry.title,
          meta: entry.meta,
        })),
      )
      .slice(0, 3);
  }, [filteredHistoryPreviewGroups]);
  const canGenerate = selectedCards.length >= 2;
  const selectedPeerRatioData = buildSelectionRatioData(
    selectedCards.map((item) => normalizeMixerPeerLabel(item.peer)),
    {
      '삼성SDS': '#0057FF',
      'LG CNS': '#C026D3',
      '현대 오토에버': '#00A76F',
      '포스코 DX': '#FF8A00',
    },
  );
  const selectedSourceTypeRatioData = buildSelectionRatioData(
    selectedCards.map((item) => item.sourceType),
    {
      '뉴스': '#FF3B30',
      'IR': '#2563EB',
      '증권사': '#D97706',
      '블로그': '#06B6D4',
    },
  );
  const mixerSourceCardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const mixerDetailCard = mixerDetailCardId ? cards.find((card) => card.id === mixerDetailCardId) ?? null : null;

  const toggleListValue = (value: string, setter: (updater: (current: string[]) => string[]) => void) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const openMixerCard = (cardId: string) => {
    setMixerDetailCardId(cardId);
    setMixerDetailSlideIndex(0);
  };

  useEffect(() => {
    setCandidatePage(1);
  }, [selectedPeers, bookmarkedOnly]);

  useEffect(() => {
    if (candidatePage > totalCandidatePages) {
      setCandidatePage(totalCandidatePages);
    }
  }, [candidatePage, totalCandidatePages]);

  // 믹서 실행 — axis-ai MixerAnalysisAgent 위임 (POST /api/mixer). LLM 추론 결과를 그대로 사용.
  const generateMixerResult = async () => {
    if (!canGenerate || isGenerating) return;

    const cardIds = selectedCards.map((item) => item.card.id);
    const peers = Array.from(new Set(selectedCards.map((item) => item.peer)));
    const contextParts: string[] = [];
    if (peers.length > 0) contextParts.push(`선택 Peer: ${peers.join(', ')}`);
    if (selectedIndustries.length > 0) contextParts.push(`고객 산업: ${selectedIndustries.join(', ')}`);
    if (selectedCustomers.length > 0) contextParts.push(`주요 고객: ${selectedCustomers.join(', ')}`);
    if (selectedKeywords.length > 0) contextParts.push(`키워드: ${selectedKeywords.join(', ')}`);
    const userContext = contextParts.length > 0 ? contextParts.join(' / ') : undefined;

    setIsGenerating(true);
    resetMixer();
    try {
      const response = await analyzeMixer({ cardIds, userContext });
      if (response) {
        setResult(response);
        setActiveResultStep(0);
        setShowInsightReasoning(false);
        setMode('result');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || error) {
    return (
      <PageState
        loading={isLoading}
        error={error}
        loadingLabel="믹서 후보 카드를 불러오는 중입니다."
        loadingFallback={(
          <PageProcessLoading
            eyebrow="Mixer workspace"
            title="믹서 후보 카드를 불러오는 중"
            description="카드뉴스를 가져와 조합 가능한 후보, 산업, 키워드 필터로 나눠 믹서 작업대를 준비합니다."
            steps={[
              { label: '후보 카드 요청', detail: '/api/cards 응답 대기' },
              { label: '조합 재료 정리', detail: 'Peer사, 산업, 키워드 축 추출' },
              { label: '믹서 화면 준비', detail: '선택 영역과 결과 패널 구성' },
            ]}
            meta={['source: card news', 'endpoint: /api/cards']}
          />
        )}
        onRetry={reload}
      >
        {null}
      </PageState>
    );
  }

  if (mode === 'history') {
    return (
      <ExecutivePage className="overflow-visible">
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
    const reasoningSteps = result.reasoning_steps ?? [];
    const reasoningTrail = result.reasoning_trail ?? [];
    const bulletSignals = result.bullet_signals ?? [];
    const followUpQuestions = result.follow_up_questions ?? [];
    const radarAxes = result.radar_axes ?? [];
    const peerByCardId = new Map(mixerCards.map((item) => [item.id, item.peer]));
    const sourceCardIds =
      result.sources_used && result.sources_used.length > 0
        ? result.sources_used
        : selectedCards.map((item) => item.card.id);
    const sourceCards = sourceCardIds
      .map((cardId) => mixerSourceCardById.get(cardId))
      .filter((card): card is NonNullable<typeof card> => Boolean(card));
    const provenance = result.provenance ?? {};
    const llmModel = provenanceString(provenance, 'llm_model');
    const promptVersion = provenanceString(provenance, 'prompt_version');
    const analysisBasis = provenanceString(provenance, 'analysis_basis');
    // 카드 조합이 인사이트로 이어지는 실 LLM 추론 흐름 (공통 패턴 → 비교 포인트 → 숨은 결론).
    const insightChain = [
      { key: 'common_pattern', label: '공통 패턴', block: result.common_pattern },
      { key: 'comparison_point', label: '비교 포인트', block: result.comparison_point },
      { key: 'hidden_conclusion', label: '숨은 결론', block: result.hidden_conclusion },
    ].filter((step) => step.block && (step.block.finding || step.block.rationale));
    const hasRealReasoning = insightChain.length > 0 || reasoningSteps.length > 0 || reasoningTrail.length > 0;
    // axis-ai LLM 응답이 비어 있으면(추론 블록·단계 모두 없음) 백엔드 fixture fallback 으로 간주.
    const isFixtureFallback = llmModel === 'frontend-preview' || llmModel === 'fixture' || !hasRealReasoning;
    const headlineInsight = result.insight || result.mix_insight || result.final_one_liner || '믹스 인사이트';

    // 탭형 step-view — 공통 패턴 → 비교 포인트 → 숨은 결론 → 대응 방향.
    const blockEvidenceIds = (block?: typeof result.common_pattern): string[] =>
      block?.evidence_card_ids && block.evidence_card_ids.length > 0
        ? block.evidence_card_ids
        : (block?.evidence ?? []).map((item) => item.card_id);
    const recommendedActions = result.recommended_actions ?? [];
    const actionEvidenceIds = Array.from(
      new Set([
        ...blockEvidenceIds(result.common_pattern),
        ...blockEvidenceIds(result.comparison_point),
        ...blockEvidenceIds(result.hidden_conclusion),
      ]),
    );
    const resultSections = [
      {
        key: 'common_pattern',
        label: '공통 패턴',
        finding: result.common_pattern?.finding ?? '',
        rationale: result.common_pattern?.rationale ?? '',
        evidenceIds: blockEvidenceIds(result.common_pattern),
        actions: [] as string[],
      },
      {
        key: 'comparison_point',
        label: '비교 포인트',
        finding: result.comparison_point?.finding ?? '',
        rationale: result.comparison_point?.rationale ?? '',
        evidenceIds: blockEvidenceIds(result.comparison_point),
        actions: [] as string[],
      },
      {
        key: 'hidden_conclusion',
        label: '숨은 결론',
        finding: result.hidden_conclusion?.finding ?? '',
        rationale: result.hidden_conclusion?.rationale ?? '',
        evidenceIds: blockEvidenceIds(result.hidden_conclusion),
        actions: [] as string[],
      },
      {
        key: 'action_direction',
        label: '대응 방향',
        finding: result.sk_ax_implication ?? recommendedActions[0] ?? '',
        rationale:
          recommendedActions.length > 0
            ? '공통 패턴·비교 포인트·숨은 결론을 종합해 정리한 SK AX 관점의 실행 방향입니다.'
            : result.sk_ax_implication ?? '',
        evidenceIds: actionEvidenceIds,
        actions: recommendedActions,
      },
    ].filter((section) => section.finding || section.rationale || section.actions.length > 0);
    const safeStep = Math.min(Math.max(activeResultStep, 0), Math.max(resultSections.length - 1, 0));
    const activeSection = resultSections[safeStep];
    // 근거 카드 텍스트 (블록 evidence 의 text) 매핑.
    const evidenceTextById = new Map<string, string>();
    [result.common_pattern, result.comparison_point, result.hidden_conclusion].forEach((block) => {
      (block?.evidence ?? []).forEach((item) => {
        if (item.text && !evidenceTextById.has(item.card_id)) evidenceTextById.set(item.card_id, item.text);
      });
    });
    // SHARED EVIDENCE — 4개 해석에서 참조한 카드를 한 번만 모아, 어떤 단계가 참조했는지 태그.
    const sharedEvidenceIds = Array.from(new Set(resultSections.flatMap((section) => section.evidenceIds)));
    const sharedEvidence = sharedEvidenceIds
      .map((cardId) => ({
        cardId,
        labels: resultSections.filter((section) => section.evidenceIds.includes(cardId)).map((section) => section.label),
        text: evidenceTextById.get(cardId) ?? '',
        card: mixerSourceCardById.get(cardId) ?? null,
        peer: peerByCardId.get(cardId) ?? '관련 Peer',
      }))
      .filter((item) => item.card);
    const hasStepView = resultSections.length > 0;
    return (
      <ExecutivePage className="overflow-visible">
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer output"
            title="믹서 결과"
            subtitle="선택한 카드들을 axis-ai 믹서 에이전트(LLM)가 겹쳐 읽어 하나의 인사이트로 압축한 결과입니다."
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

          <section data-guide="mixer-result" className="space-y-5">
            <article className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.18)]">
              <div className="border-l-4 border-[var(--axis-accent)] px-5 py-5 lg:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ExecutiveBadge tone="accent">믹스 인사이트</ExecutiveBadge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--axis-muted)]">카드 {sourceCardIds.length}장 조합 · 신뢰도 {toPercent(result.confidence)}</span>
                    <button
                      type="button"
                      onClick={() => setShowInsightReasoning(true)}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                      aria-label="믹스 인사이트 추론 과정 보기"
                      title="이 인사이트가 어떻게 도출됐는지 보기"
                    >
                      !
                    </button>
                  </div>
                </div>
                <h2 className="mt-4 max-w-5xl text-[1.9rem] font-display font-semibold leading-[1.2] tracking-[-0.04em] text-[var(--axis-ink)] lg:text-[2.3rem]">
                  {headlineInsight}
                </h2>
                {result.final_one_liner && result.final_one_liner !== headlineInsight ? (
                  <p className="mt-3 max-w-4xl text-base font-medium leading-7 text-[var(--axis-body)]">{result.final_one_liner}</p>
                ) : null}
              </div>
            </article>

            {result.warning ? (
              <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.3)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm leading-6 text-[var(--axis-accent-strong)]">
                {result.warning}
              </div>
            ) : null}

            {hasStepView && activeSection ? (
              <article className="axis-panel-flat p-5">
                <p className="axis-kicker">Step view</p>
                <h3 className="axis-section-heading mt-1">상세 해석 보기</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">
                  카드 조합이 인사이트로 이어진 해석 흐름 4단계입니다. 단계를 눌러 핵심 문장과 해석 근거를 확인하세요.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {resultSections.map((section, index) => {
                    const isActive = index === safeStep;
                    return (
                      <button
                        key={`tab-${section.key}`}
                        type="button"
                        onClick={() => setActiveResultStep(index)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                          isActive
                            ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                            : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
                        }`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          isActive ? 'bg-[var(--axis-accent)] text-white' : 'bg-[var(--axis-surface-soft)] text-[var(--axis-muted)]'
                        }`}>
                          {index + 1}
                        </span>
                        {section.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 lg:p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-bold text-[var(--axis-accent-strong)]">
                      {safeStep + 1}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">해석 단계</p>
                      <h4 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activeSection.label}</h4>
                    </div>
                  </div>

                  {activeSection.finding ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">핵심 문장</p>
                      <p className="mt-2 text-[1.15rem] font-semibold leading-8 text-[var(--axis-ink)]">{activeSection.finding}</p>
                    </div>
                  ) : null}

                  {activeSection.actions.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {activeSection.actions.map((action, index) => (
                        <li key={`action-${index}`} className="flex gap-2 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2 text-sm leading-6 text-[var(--axis-body)]">
                          <span className="mt-0.5 font-bold text-[var(--axis-accent-strong)]">{index + 1}.</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {activeSection.rationale ? (
                    <div className="mt-5 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">왜 이렇게 해석했는가</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--axis-body)]">{activeSection.rationale}</p>
                    </div>
                  ) : null}
                </div>

                {sharedEvidence.length > 0 ? (
                  <section className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 lg:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">Shared evidence</p>
                        <h4 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">근거 카드</h4>
                      </div>
                      <p className="text-xs font-semibold text-[var(--axis-muted)]">해석 단계가 공통으로 참조한 카드만 한 번 모아 보여줍니다.</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {sharedEvidence.map((evidence) => (
                        <div key={`shared-${evidence.cardId}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => openMixerCard(evidence.cardId)}
                              className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--axis-radius-sm)] bg-[#081324] transition hover:opacity-90"
                              aria-label={`${evidence.card?.title ?? '카드'} 보기`}
                            >
                              {evidence.card?.coverImageUrl ? (
                                <img
                                  src={evidence.card.coverImageUrl}
                                  alt={evidence.card.coverImageAlt}
                                  className={getCardLogoImageClass(evidence.card.coverImageUrl, 'compact') ?? 'h-full w-full object-cover opacity-75'}
                                />
                              ) : null}
                              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <ExecutiveBadge tone="accent">{evidence.peer}</ExecutiveBadge>
                                {evidence.labels.map((label) => (
                                  <span
                                    key={`${evidence.cardId}-${label}`}
                                    className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--axis-muted)]"
                                  >
                                    {label}
                                  </span>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => openMixerCard(evidence.cardId)}
                                  className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--axis-body)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                                >
                                  카드 보기
                                </button>
                              </div>
                              <p className="mt-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{evidence.card?.title}</p>
                              {evidence.text ? (
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--axis-body)]">{evidence.text}</p>
                              ) : (
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--axis-body)]">{evidence.card?.detailDescription}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>
            ) : bulletSignals.length > 0 ? (
              <article className="axis-panel-flat p-5">
                <p className="axis-kicker">Key signals</p>
                <h3 className="axis-section-heading mt-1">핵심 신호</h3>
                <ul className="mt-4 space-y-2">
                  {bulletSignals.map((signal, index) => (
                    <li key={`signal-${index}`} className="flex gap-2 text-sm leading-6 text-[var(--axis-body)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--axis-accent)]" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {radarAxes.length > 0 ? (
              <article className="axis-panel-flat p-5">
                <p className="axis-kicker">Signal strength</p>
                <h3 className="axis-section-heading mt-1">신호 강도</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {radarAxes.map((axis) => {
                    const label = MIXER_RADAR_LABELS.find((item) => item.id === axis.axis)?.label ?? axis.axis;
                    return (
                      <div key={axis.axis} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--axis-ink)]">{label}</p>
                          <span className="text-xs font-bold text-[var(--axis-accent-strong)]">{Math.round(axis.score * 100) / 100}</span>
                        </div>
                        {axis.explanation ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{axis.explanation}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            ) : null}

            {followUpQuestions.length > 0 ? (
              <article className="axis-panel-flat p-5">
                <p className="axis-kicker">Follow-up</p>
                <h3 className="axis-section-heading mt-1">이어서 확인할 질문</h3>
                <ul className="mt-4 space-y-2">
                  {followUpQuestions.map((question, index) => (
                    <li key={`fu-${index}`} className="flex gap-2 text-sm leading-6 text-[var(--axis-body)]">
                      <span className="mt-0.5 font-bold text-[var(--axis-accent-strong)]">Q.</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

          </section>
        </ExecutiveContainer>

        {showInsightReasoning ? (
          <div className="fixed inset-0 z-50 bg-[rgba(8,10,14,0.62)] p-5 backdrop-blur-sm">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              aria-label="추론 과정 닫기"
              onClick={() => setShowInsightReasoning(false)}
            />
            <section className="relative mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[var(--axis-radius-lg)] border border-[rgba(255,255,255,0.16)] bg-[var(--axis-surface)] text-[var(--axis-ink)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.72)]">
              <header className="flex items-center justify-between gap-3 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">Mixer agent reasoning</p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">믹스 인사이트 추론 과정</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInsightReasoning(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
                  aria-label="추론 과정 닫기"
                >
                  <X size={17} />
                </button>
              </header>
              <article className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)] p-4">
                  <p className="text-sm font-semibold leading-7 text-[var(--axis-ink)]">
                    선택한 카드 {sourceCardIds.length}장에서 공통 패턴 → 비교 포인트 → 숨은 결론을 차례로 도출해 하나의 믹스 인사이트로 압축한 과정입니다.
                  </p>
                  {isFixtureFallback ? (
                    <p className="mt-3 rounded-[var(--axis-radius-sm)] border border-[rgba(220,90,36,0.3)] bg-[rgba(220,90,36,0.08)] px-3 py-2 text-[11px] font-semibold leading-5 text-[var(--axis-accent-strong)]">
                      현재 axis-ai LLM 추론을 사용할 수 없어 기본 응답으로 대체된 결과입니다. (추론 과정 미제공)
                    </p>
                  ) : null}

                  {insightChain.length > 0 && reasoningSteps.length === 0 ? (
                    <section className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.18)] bg-[var(--axis-canvas)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">카드 조합 → 인사이트 도출 흐름</p>
                      <div className="mt-3 space-y-3">
                        {insightChain.map((step, index) => (
                          <div key={step.key} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-xs font-bold text-[var(--axis-accent-strong)]">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">{step.label}</p>
                              {step.block?.finding ? (
                                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{step.block.finding}</p>
                              ) : null}
                              {step.block?.rationale ? (
                                <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{step.block.rationale}</p>
                              ) : null}
                              {step.block?.evidence_card_ids && step.block.evidence_card_ids.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {step.block.evidence_card_ids.map((cardId) => (
                                    <span key={`${step.key}-${cardId}`} className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--axis-muted)]">
                                      {peerByCardId.get(cardId) ?? cardId}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                        <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--axis-accent)] text-xs font-bold text-white">
                            ✓
                          </span>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">최종 믹스 인사이트</p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{headlineInsight}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {reasoningTrail.length > 0 ? (
                    <section className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.18)] bg-[var(--axis-canvas)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">추론 요약 흐름</p>
                      <div className="mt-3 space-y-2">
                        {reasoningTrail.map((item) => (
                          <div key={`trail-${item.seq}`} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-xs font-bold text-[var(--axis-accent-strong)]">
                              {item.seq}
                            </span>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">{item.label}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.one_liner}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {reasoningSteps.length > 0 ? (
                    <section className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.18)] bg-[var(--axis-canvas)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">단계별 사고 과정 (Chain of Thought)</p>
                      <div className="mt-3 space-y-3">
                        {reasoningSteps.map((step) => (
                          <div key={`step-${step.step_idx}`} className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[rgba(220,90,36,0.12)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--axis-accent-strong)]">
                                {MIXER_PHASE_LABELS[step.phase] ?? step.phase}
                              </span>
                              <span className="text-[11px] font-semibold text-[var(--axis-muted)]">신뢰도 {toPercent(step.confidence)}</span>
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">Q. {step.question}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{step.answer}</p>
                            {step.intermediate_conclusion ? (
                              <p className="mt-2 rounded-[var(--axis-radius-sm)] bg-[var(--axis-canvas)] px-3 py-2 text-sm leading-6 text-[var(--axis-ink)]">
                                <span className="font-semibold">중간 결론:</span> {step.intermediate_conclusion}
                              </p>
                            ) : null}
                          </div>
                        ))}
                        <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--axis-accent)] text-xs font-bold text-white">
                            ✓
                          </span>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">최종 믹스 인사이트</p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{headlineInsight}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">신뢰도</p>
                      <p className="mt-1 text-base font-bold text-[var(--axis-ink)]">{toPercent(result.confidence)}</p>
                    </div>
                    <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">조합 카드</p>
                      <p className="mt-1 text-base font-bold text-[var(--axis-ink)]">{sourceCardIds.length}장</p>
                    </div>
                    <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">추론 단계</p>
                      <p className="mt-1 text-base font-bold text-[var(--axis-ink)]">{insightChain.length + reasoningSteps.length}개</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-[var(--axis-muted)]">
                    <span className="font-semibold text-[var(--axis-ink)]">분석 기준:</span> {analysisBasis ?? '믹서 분석'}
                    {llmModel ? ` · 모델 ${llmModel}` : ''}
                    {promptVersion ? ` · 프롬프트 ${promptVersion}` : ''}
                  </p>
                  {result.langfuse_trace_id ? (
                    <p className="mt-1 break-all text-[11px] leading-5 text-[var(--axis-muted)]">
                      <span className="font-semibold text-[var(--axis-ink)]">Langfuse trace:</span> {result.langfuse_trace_id}
                    </p>
                  ) : null}
                </div>

                {sourceCards.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">조합에 사용된 카드 {sourceCards.length}장</p>
                    <div className="grid gap-3">
                      {sourceCards.map((card) => (
                        <button
                          key={`insight-reasoning-${card.id}`}
                          type="button"
                          onClick={() => {
                            setShowInsightReasoning(false);
                            openMixerCard(card.id);
                          }}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-surface-soft)]"
                        >
                          <ExecutiveBadge tone="accent">{peerByCardId.get(card.id) ?? '관련 Peer'}</ExecutiveBadge>
                          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--axis-body)]">{card.detailDescription}</p>
                          {card.sources?.[0]?.source_name ? (
                            <p className="mt-2 text-[11px] leading-5 text-[var(--axis-muted)]">
                              <span className="font-semibold text-[var(--axis-ink)]">출처:</span> {card.sources[0].source_name}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            </section>
          </div>
        ) : null}

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
    <ExecutivePage className="relative overflow-visible">
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

        <section data-guide="mixer-input" className="relative z-0 mb-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
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

        {mixerError ? (
          <div className="mb-5 rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.35)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--axis-accent-strong)]">
            믹서 분석에 실패했습니다: {mixerError}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <main data-guide="mixer-candidates">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">Source cards</p>
                <h2 className="axis-section-heading mt-1">믹서 후보</h2>
              </div>
              <ExecutiveBadge tone={canGenerate ? 'success' : 'warning'}>{selectedCards.length}개 선택</ExecutiveBadge>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
              {pagedVisibleCards.map((item) => {
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
                      className="relative block aspect-[3/4] w-full overflow-hidden text-left sm:aspect-[4/5]"
                    >
                      {item.card.coverImageUrl ? (
                        <img
                          src={item.card.coverImageUrl}
                          alt={item.card.coverImageAlt}
                          className={getCardLogoImageClass(item.card.coverImageUrl, 'card') ?? 'absolute inset-0 h-full w-full object-cover opacity-55'}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#081324]/48 to-black/92" />
                      <div className="relative flex h-full flex-col justify-between p-3 text-white sm:p-4">
                        <div className="flex items-start justify-between gap-2 text-[10px] font-semibold sm:text-xs">
                          <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1">{item.peer}</span>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] border ${
                            selected ? 'border-white bg-white/20 text-white' : 'border-white/25 bg-white/10 text-white/70'
                          }`}>
                            {selected ? <Check size={16} strokeWidth={3} /> : null}
                          </span>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 sm:text-xs">{item.sourceType}</p>
                          <h3 className="line-clamp-3 text-[13px] font-semibold leading-tight text-white sm:line-clamp-4 sm:text-[18px]">{item.card.title}</h3>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={bookmarked ? '북마크 해제' : '북마크'}
                      onClick={() => onToggleBookmark(item.card.id)}
                      className={`absolute right-2 top-14 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition sm:right-4 sm:top-20 ${
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
            <div className="mt-5 flex items-center justify-center px-4 py-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={candidatePageWindowStart === 1}
                  onClick={() => setCandidatePage(Math.max(1, candidatePageWindowStart - candidatePaginationWindowSize))}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &lt;
                </button>
                {candidatePageNumbers.map((pageNumber) => {
                  const isActive = pageNumber === candidatePage;
                  return (
                    <button
                      key={`candidate-page-${pageNumber}`}
                      type="button"
                      onClick={() => setCandidatePage(pageNumber)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                        isActive
                          ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={candidatePageWindowStart + candidatePaginationWindowSize > totalCandidatePages}
                  onClick={() => setCandidatePage(Math.min(totalCandidatePages, candidatePageWindowStart + candidatePaginationWindowSize))}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &gt;
                </button>
              </div>
            </div>
          </main>

          <aside data-guide="mixer-ratio" className="axis-panel-flat p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--axis-accent)]" />
              <h2 className="axis-section-heading">선택 비율</h2>
            </div>
            <div className="mt-5 space-y-5">
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">선택 카드 PEER 비율</p>
                <div className="mt-3 min-h-[228px] overflow-visible">
                  {selectedPeerRatioData.length > 0 ? (
                    <DonutCalloutChart data={selectedPeerRatioData} />
                  ) : (
                    <div className="flex h-[210px] items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-sm text-[var(--axis-muted)]">
                      선택한 카드가 없습니다.
                    </div>
                  )}
                </div>
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">선택 카드 유형 비율</p>
                <div className="mt-3 min-h-[228px] overflow-visible">
                  {selectedSourceTypeRatioData.length > 0 ? (
                    <DonutCalloutChart data={selectedSourceTypeRatioData} />
                  ) : (
                    <div className="flex h-[210px] items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-sm text-[var(--axis-muted)]">
                      선택한 카드가 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="mt-5 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4 text-sm leading-6 text-[var(--axis-muted)]">
              선택한 카드가 어떤 PEER에 치우쳐 있는지와 어떤 유형의 근거로 구성됐는지를 함께 확인할 수 있습니다.
            </div>
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-ink)]">최근 생성 결과</h3>
                <span className="text-xs font-semibold text-[var(--axis-muted)]">3개만 표시</span>
              </div>
              <div className="grid gap-3">
                {historyPreviewEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                        {entry.date}
                      </span>
                      <span className="text-xs font-semibold text-[var(--axis-muted)]">최근 결과</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                      {entry.title}
                    </p>
                    <p className="mt-2 text-xs text-[var(--axis-muted)]">
                      {entry.meta}
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
      {isGenerating ? <MixerAnalysisOverlay stage={mixerStage} /> : null}
    </ExecutivePage>
  );
}
