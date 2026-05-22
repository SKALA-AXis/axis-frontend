import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Box, Check, Filter, Network, Sparkles, X } from 'lucide-react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar as RadarShape, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { buildMixerCards } from '../../../../features/card-news/mappers/cardNewsPresentation';
import { getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { cardNewsItems as fallbackCardNewsItems } from '../../../../shared/mocks/cardNews';
import { mockMixerConfig } from '../../../../shared/mocks/mixer';
import { ExecutiveBadge, ExecutiveButton, ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { DonutCalloutChart, LoadingBlock, buildSelectionRatioData, normalizeMixerPeerLabel } from './AxisPlanningShared';

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
  derivedOutcome: {
    summary: string;
    items: {
      title: string;
      body: string;
    }[];
  };
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
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
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
    const contentLines = selectedCards.flatMap((item) => [
      item.card.title,
      ...getSummaryLines(item.card),
      ...(item.card.insights ?? []),
      ...(item.card.actionItems ?? []),
      ...(item.card.detailPoints ?? []),
      item.card.detailDescription,
    ]);
    const contentCorpus = contentLines.join(' ');
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
    const dominantKeyword = keywordHitStats[0]?.keyword ?? selectedKeywords[0] ?? 'AX';
    const hasExecutionSignal = /(운영|전환|확산|안정|KPI|레퍼런스|안착|구축)/.test(contentCorpus);
    const hasDealSignal = /(수주|우선협상|계약|메가딜|사업자 선정|컨소시엄)/.test(contentCorpus);
    const hasGovernanceSignal = /(보안|거버넌스|망분리|통제)/.test(contentCorpus);
    const hasInfraSignal = /(클라우드|데이터센터|GPU|인프라|쿠버네티스|하이브리드)/.test(contentCorpus);
    const competitionFrame = hasGovernanceSignal
      ? '운영 안정성과 통제 가능성'
      : hasInfraSignal
        ? '구축 이후 운영 기반과 확산 가능성'
        : '운영 성과와 적용 이후 전환 효과';
    const buyerFrame = hasDealSignal
      ? `실제 사업화 가능성과 ${competitionFrame}`
      : `새 기술 자체보다 ${competitionFrame}`;
    const skAxFrame = hasGovernanceSignal
      ? '보안·거버넌스가 포함된 운영 시나리오'
      : hasInfraSignal
        ? '인프라 운영 구조까지 포함한 확산 시나리오'
        : '운영 KPI와 전환 효과가 드러나는 실행 시나리오';
    const hiddenShift = hasDealSignal && hasExecutionSignal
      ? '수주 신호와 운영 신호가 함께 잡히면서, 이번 경쟁의 승부처가 제안 채택보다 장기 운영권 선점으로 이동하고 있습니다.'
      : hasInfraSignal && hasExecutionSignal
        ? '인프라 신호와 실행 신호가 겹치면서, AI 기능 경쟁보다 구축 이후 확산 운영을 누가 책임질 수 있는지가 더 중요해졌습니다.'
        : hasGovernanceSignal && hasExecutionSignal
          ? '보안 신호와 운영 신호가 동시에 잡히면서, 성능 경쟁보다 통제 가능한 운영 구조를 먼저 증명하는 쪽이 유리해졌습니다.'
          : '여러 카드를 겹쳐 보면 기술 소개 경쟁처럼 보이던 흐름이 실제로는 운영 책임 경쟁으로 이동하고 있습니다.';
    const opportunityLine = hasDealSignal && hasGovernanceSignal
      ? '공공·규제 산업 제안에서는 AI 기능보다 사업 수행 안정성과 통제 체계를 함께 묶는 쪽이 더 큰 차이를 만듭니다.'
      : hasInfraSignal && hasDealSignal
        ? '수주 카드와 인프라 카드가 함께 뜬 조합은 단발 구축보다 후속 운영 확장 계약으로 이어질 가능성이 더 큽니다.'
        : hasInfraSignal
          ? 'GPU·클라우드·데이터센터 신호가 같이 보이면 기능 자체보다 운영 기반을 보유한 쪽이 더 신뢰를 얻습니다.'
          : '반복 카드 조합에서는 새 기능 소개보다 운영 KPI와 안착 책임을 먼저 제시하는 쪽이 더 강하게 읽힙니다.';
    const proposalOneLiner = `${primaryIndustries} · ${primaryCustomers} 제안에서는 ${dominantKeyword} 자체보다 ${competitionFrame}을 먼저 증명하는 문장이 첫 설득 포인트가 됩니다.`;
    const implicationLines = Array.from(
      new Set(
        [
          hiddenShift,
          opportunityLine,
          hasGovernanceSignal
            ? '보안·거버넌스는 부가 항목이 아니라 초기 비교 단계에서 통과 여부를 가르는 핵심 축으로 올라왔습니다.'
            : null,
          hasInfraSignal
            ? '인프라 운영 범위가 함께 잡힌 조합에서는 구축 이후 확산 속도까지 제안 범위에 포함해야 우위가 생깁니다.'
            : null,
          hasDealSignal
            ? '수주 신호가 붙은 조합은 PoC 메시지보다 본사업 전환과 운영 체계까지 함께 말할 때 설득력이 더 커집니다.'
            : null,
        ].filter((line): line is string => Boolean(line)),
      ),
    ).slice(0, 3);
    const proposalActionLines = Array.from(
      new Set(
        [
          hasDealSignal
            ? '제안 첫 장을 기능 목록 대신 본사업 전환 시나리오와 운영 책임 구조 중심으로 다시 씁니다.'
            : '제안 첫 장을 기능 소개 대신 운영 KPI와 적용 이후 안정성 문장 중심으로 바꿉니다.',
          hasGovernanceSignal
            ? '보안·거버넌스 항목을 부록으로 두지 말고 핵심 제안 본문 안으로 끌어올립니다.'
            : null,
          hasInfraSignal
            ? '클라우드·GPU·데이터센터 운영 범위를 한 장으로 묶어 확산 가능성을 먼저 보여줍니다.'
            : null,
          hasExecutionSignal
            ? '레퍼런스 소개는 구축 사실보다 안착 속도, 운영 KPI, 확산 단계 순서로 다시 정리합니다.'
            : null,
        ].filter((line): line is string => Boolean(line)),
      ),
    ).slice(0, 3);
    const connections = Array.from(
      new Set(
        summaryLines
          .join(' ')
          .split(/\s+/)
          .filter((token) => mockMixerConfig.connectionKeywords.includes(token)),
      ),
    ).slice(0, 5);

    return {
      summary: hiddenShift,
      insightBrief: [
        {
          title: '경쟁 흐름',
          summary: `${peers.join(', ')} 카드를 함께 놓고 보면 ${dominantKeyword} 경쟁은 기능 우위보다 ${competitionFrame}을 먼저 증명하는 방향으로 이동하고 있습니다.`,
          reasoning: [
            `수집 에이전트는 ${selectedCards.length}건의 선택 카드 중 ${evidenceTitles.join(' / ')}를 1차 근거 묶음으로 올렸습니다.`,
            `비교 에이전트는 카드 본문과 요약을 다시 대조해 ${keywordHitSummary} 순으로 반복 신호를 확인했고, 단일 키워드가 아니라 여러 카드에 걸친 공통 패턴으로 판단했습니다.`,
            `요약 에이전트는 "${selectedEvidenceCards[0]?.snippet ?? '관련 실행 신호가 반복됩니다.'}" 같은 문장을 핵심 증거로 삼아, 기능 설명보다 실행 장면과 성과 맥락이 더 강한 경쟁 신호라고 압축했습니다.`,
          ],
          evidenceTags: evidenceTitles.slice(0, 2),
          evidenceCards: selectedEvidenceCards.slice(0, 2),
          skAxMeaning: 'SK AX는 개별 기능 소개보다 반복적으로 검증된 실행 장면과 성과 표현을 먼저 제시할 때 더 경쟁력 있는 제안 문장을 만들 수 있습니다.',
        },
        {
          title: '판단 기준',
          summary: `${primaryIndustries} · ${primaryCustomers} 맥락에서는 새 기술 자체보다 ${buyerFrame}을 먼저 확인하는 쪽으로 판단 기준이 이동하고 있습니다.`,
          reasoning: [
            `분류 에이전트는 입력 조건을 ${primaryIndustries} · ${primaryCustomers} 조합으로 정리했고, 근거 카드에서도 이 조합과 맞닿은 운영형 표현이 반복된다고 표시했습니다.`,
            `검토 에이전트는 "${selectedEvidenceCards[1]?.snippet ?? selectedEvidenceCards[0]?.snippet ?? '운영 안정성과 KPI 개선 표현이 반복됩니다.'}" 같은 문장을 핵심 판단 근거로 선택해, 도입 이후 효과를 먼저 설명하는 흐름이 우세하다고 봤습니다.`,
            '전략 에이전트는 그 결과를 바탕으로 고객 설득 포인트를 기술 스펙 소개보다 업무 KPI 개선, 운영 안정성, 적용 이후 전환 효과 중심으로 재정렬하는 것이 타당하다고 정리했습니다.',
          ],
          evidenceTags: [primaryIndustries, primaryCustomers, `${selectedCustomers.length}개 고객군`],
          evidenceCards: selectedEvidenceCards.slice(0, 2),
          skAxMeaning: 'SK AX는 제안 초반부터 운영 KPI 개선, 리스크 완화, 적용 이후 안정성까지 한 문장으로 묶는 방식이 더 효과적입니다.',
        },
        {
          title: '제안 포인트',
          summary: `SK AX는 ${dominantKeyword}를 단독 기능 메시지로 설명하기보다 ${skAxFrame}로 제시할 때 더 분명한 차별화 기회를 만들 수 있습니다.`,
          reasoning: [
            `우선순위 에이전트는 현재 선택 조합에 포함된 북마크 ${bookmarkedEvidenceCount}건을 별도 가중치로 반영해, 사용자가 중요하게 남긴 근거와 반복 신호가 겹치는 지점을 먼저 살폈습니다.`,
            `그래서 이 인사이트는 임의 요약이 아니라 ${selectedCards.length}건 카드 중 실제 선택 카드와 북마크 카드가 동시에 지지하는 패턴을 우선 반영한 결과입니다.`,
            `마지막으로 제안 에이전트는 "${selectedEvidenceCards[0]?.title ?? '선택 카드'}" 같은 근거를 SK AX 제안 문장으로 다시 번역해, 내부 해석을 바로 실행 문장으로 연결하는 역할을 수행했습니다.`,
          ],
          evidenceTags: [`북마크 ${bookmarkedEvidenceCount}건`, ...connections.slice(0, 2)],
          evidenceCards: selectedEvidenceCards,
          skAxMeaning: 'SK AX는 믹서 결과를 통해 경쟁사 신호를 내부 보고용 정리에서 끝내지 않고 실제 제안 문장과 브리핑 문장으로 변환하는 출발점을 얻을 수 있습니다.',
        },
      ],
      derivedOutcome: {
        summary: opportunityLine,
        items: [
          {
            title: '놓치기 쉬운 결론',
            body: hiddenShift,
          },
          {
            title: '바로 쓸 제안 문장',
            body: proposalOneLiner,
          },
        ],
      },
      implications: implicationLines,
      proposalActions: proposalActionLines,
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
    const activeResultInsight = result.insightBrief[activeResultInsightIndex] ?? result.insightBrief[0];
    return (
      <ExecutivePage className="overflow-visible">
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer output"
            title="믹서 결과"
            subtitle="여러 카드에서 겹친 신호를 한 줄 결론과 제안 포인트로 압축한 결과입니다."
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
                    <p className="axis-kicker">What this mix reveals</p>
                    <h2 className="mt-2 text-heading-3 font-display leading-tight text-[var(--axis-ink)]">
                      {result.summary}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMixerReasoningOpen(true)}
                    className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
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
                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.18)] bg-[linear-gradient(135deg,rgba(220,90,36,0.08),rgba(250,248,245,0.92))] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">What comes out of this mix</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--axis-ink)]">결과</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{result.derivedOutcome.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {result.derivedOutcome.items.map((item) => (
                      <div
                        key={`${item.title}-${item.body}`}
                        className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.16)] bg-[var(--axis-canvas)] p-3"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--axis-ink)]">{item.body}</p>
                      </div>
                    ))}
                  </div>
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
              <p className="axis-kicker">How the mix reads</p>
              <h3 className="axis-section-heading mt-1">레이더 차트</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">결론이 어떤 축에서 나왔는지 보여줍니다.</p>
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
              <p className="axis-kicker">Source cards</p>
              <h3 className="axis-section-heading mt-1">믹서 카드 뉴스</h3>
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
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">AI Agent reasoning</p>
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
                      className="relative block aspect-[3/4] w-full overflow-hidden text-left sm:aspect-[4/5]"
                    >
                      {item.card.coverImageUrl ? (
                        <img src={item.card.coverImageUrl} alt={item.card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
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
