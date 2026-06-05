import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Box, Check, Filter, Network, Sparkles } from 'lucide-react';
import { getCardLogoImageClass } from '../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { buildMixerCards } from '../../../../features/card-news/mappers/cardNewsPresentation';
import { getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { mockMixerConfig } from '../../../../shared/mocks/mixer';
import { ExecutiveBadge, ExecutiveButton, ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { PageProcessLoading, PageState } from '../../shared/PageState';
import { DonutCalloutChart, buildSelectionRatioData, normalizeMixerPeerLabel } from '../shared/axis';

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

type MixerResultEvidence = {
  card_id: string;
  text: string;
  peer: string;
  title: string;
};

type MixerResultSection = {
  finding: string;
  rationale: string;
  evidence: MixerResultEvidence[];
  evidence_card_ids: string[];
};

type MixerResultActionDetail = {
  action: string;
  why: string;
  use_case: string;
  evidence: MixerResultEvidence[];
  evidence_card_ids: string[];
};

type MixerResultView = {
  mix_id: string;
  mix_insight: string;
  common_pattern: MixerResultSection;
  comparison_point: MixerResultSection;
  hidden_conclusion: MixerResultSection;
  recommended_action_basis: string[];
  action_details: MixerResultActionDetail[];
  recommended_actions: string[];
  sources_used: string[];
  confidence: number;
  provenance: {
    llm_model: string;
    prompt_version: string;
    source_card_ids: string[];
    ratios: {
      peer: number;
      industry: number;
      keyword: number;
    };
    analysis_basis: string;
  };
  created_at: string;
};

const clampRatio = (value: number) => Math.round(value * 100) / 100;

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
  const [mode, setMode] = useState<'select' | 'result' | 'history'>('select');
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [candidatePage, setCandidatePage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MixerResultView | null>(null);
  const [activeResultStep, setActiveResultStep] = useState(0);
  const [mixerDetailCardId, setMixerDetailCardId] = useState<string | null>(null);
  const [mixerDetailSlideIndex, setMixerDetailSlideIndex] = useState(0);
  const [historyStartDate, setHistoryStartDate] = useState('2026-05-13');
  const [historyEndDate, setHistoryEndDate] = useState('2026-05-15');
  const generationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    onUpdateTimeChange?.(result?.created_at ?? pickLatestCardTimestamp(cards));
  }, [cards, isLoading, onUpdateTimeChange, result?.created_at]);

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
    return () => {
      if (generationTimeoutRef.current !== null) {
        window.clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCandidatePage(1);
  }, [selectedPeers, bookmarkedOnly]);

  useEffect(() => {
    if (candidatePage > totalCandidatePages) {
      setCandidatePage(totalCandidatePages);
    }
  }, [candidatePage, totalCandidatePages]);

  const buildMixerResult = (): MixerResultView => {
    const peers = Array.from(new Set(selectedCards.map((item) => item.peer)));
    const primaryIndustries = selectedIndustries.slice(0, 2).join(' · ') || '고객 산업';
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
    const buildEvidence = (item: typeof selectedCards[number]): MixerResultEvidence => {
      const lines = [
        ...getSummaryLines(item.card),
        ...(item.card.insights ?? []),
        ...(item.card.actionItems ?? []),
        ...(item.card.detailPoints ?? []),
      ].filter((line): line is string => typeof line === 'string' && line.trim().length > 0);
      return {
        card_id: item.card.id,
        peer: item.peer,
        title: item.card.title,
        text: lines[0] ?? item.card.detailDescription,
      };
    };
    const selectedEvidenceCards = selectedCards.slice(0, 4).map((item) => buildEvidence(item));
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
    const dominantKeyword = keywordHitStats[0]?.keyword ?? selectedKeywords[0] ?? 'AX';
    const inferFocus = (text: string) => {
      if (/(로봇|자동화|스마트팩토리|물류|현장)/.test(text)) return '현장 자동화와 운영 장면';
      if (/(데이터|플랫폼|인프라|소프트웨어)/.test(text)) return '운영 데이터와 소프트웨어 인프라';
      if (/(보안|거버넌스|통제|감사)/.test(text)) return '보안·거버넌스와 통제 구조';
      if (/(클라우드|GPU|데이터센터|하이브리드)/.test(text)) return '도입 이후 확산 인프라';
      if (/(수주|계약|우선협상|사업)/.test(text)) return '사업화와 본사업 전환';
      return '적용 가능한 운영 시나리오';
    };
    const hasRobotSignal = /(로봇|자동화|스마트팩토리|물류|현장)/.test(contentCorpus);
    const hasExecutionSignal = /(운영|전환|확산|안정|KPI|레퍼런스|안착|구축)/.test(contentCorpus);
    const hasDealSignal = /(수주|우선협상|계약|메가딜|사업자 선정|컨소시엄)/.test(contentCorpus);
    const hasGovernanceSignal = /(보안|거버넌스|망분리|통제)/.test(contentCorpus);
    const hasInfraSignal = /(클라우드|데이터센터|GPU|인프라|쿠버네티스|하이브리드)/.test(contentCorpus);
    const firstEvidence = selectedEvidenceCards[0];
    const secondEvidence = selectedEvidenceCards[1] ?? firstEvidence;
    const signalTheme = hasRobotSignal
      ? '로봇과 AI 기술'
      : hasInfraSignal
        ? '클라우드·데이터 인프라'
        : hasGovernanceSignal
          ? '보안과 운영 통제'
          : dominantKeyword === 'AX'
            ? 'AX 실행 역량'
            : `${dominantKeyword} 중심 접근`;
    const sharedScene = hasRobotSignal
      ? '제조업의 자동화와 디지털 전환'
      : hasGovernanceSignal
        ? '엔터프라이즈 운영 안정성과 통제'
        : hasInfraSignal
          ? '도입 이후 확산 운영'
          : '고객 업무 적용과 운영 성과';
    const comparisonFrame = hasRobotSignal
      ? '적용 장면과 운영 장면'
      : hasInfraSignal
        ? '구축 이후 운영 기반'
        : hasGovernanceSignal
          ? '통제 가능성과 운영 안정성'
          : '업무 적용 시나리오';
    const skAxFrame = hasGovernanceSignal
      ? '보안·거버넌스를 포함한 운영 시나리오'
      : hasInfraSignal
        ? '도입 이후 확산 구조까지 포함한 운영 시나리오'
        : hasRobotSignal
          ? '고객 현장 전환 장면이 보이는 실행 시나리오'
          : '운영 KPI와 적용 효과가 드러나는 실행 시나리오';
    const firstFocus = inferFocus(firstEvidence?.text ?? '');
    const secondFocus = inferFocus(secondEvidence?.text ?? '');
    const mixInsight = `${peers.join('와 ')} 모두 ${signalTheme}을 활용해 ${sharedScene} 중심의 메시지를 강화하고 있습니다.`;
    const hiddenConclusion = hasDealSignal && hasExecutionSignal
      ? '이번 묶음의 핵심 신호는 기능 소개보다 본사업 전환과 장기 운영권을 누가 더 설득력 있게 설명하느냐로 경쟁 축이 이동하고 있다는 점입니다.'
      : hasInfraSignal && hasExecutionSignal
        ? '여러 카드를 함께 읽으면 AI 기능 경쟁보다 구축 이후 확산 운영을 누가 책임질 수 있는지가 더 중요한 판단 기준으로 올라오고 있습니다.'
        : hasGovernanceSignal && hasExecutionSignal
          ? '여러 이슈를 묶어 보면 성능 경쟁보다 통제 가능한 운영 구조를 먼저 증명하는 쪽이 더 강한 신뢰를 얻고 있습니다.'
          : hasRobotSignal
            ? '이번 묶음에서 더 선명해지는 결론은 자동화 경쟁이 개별 기능보다 운영 데이터와 현장 적용 장면을 얼마나 설명할 수 있는지로 확장되고 있다는 점입니다.'
            : '여러 카드를 겹쳐 보면 기술 소개 경쟁처럼 보이던 흐름이 실제로는 적용 이후 운영 책임 경쟁으로 이동하고 있습니다.';
    const actionBasis = [
      `${peers.join('와 ')}의 ${signalTheme} 활용 흐름`,
      `${primaryIndustries} · ${primaryCustomers} 맥락에서 ${comparisonFrame}이 핵심 설득 근거로 사용된 점`,
    ];
    const actionDetails: MixerResultActionDetail[] = [
      {
        action: `제안 메시지는 ${skAxFrame}이 먼저 드러나도록 구성합니다.`,
        why: `${sharedScene} 경쟁에서는 기능 목록보다 적용 이후 운영 장면과 효과를 먼저 보여줄수록 설득력이 커지기 때문입니다.`,
        use_case: '제안 전략',
        evidence: selectedEvidenceCards.slice(0, 2),
        evidence_card_ids: selectedEvidenceCards.slice(0, 2).map((item) => item.card_id),
      },
      {
        action: `${firstFocus}와 ${secondFocus} 사례를 분리해 레퍼런스를 구성합니다.`,
        why: '같은 흐름 안에서도 각 이슈가 택한 적용 장면과 강조점이 다르기 때문에, 레퍼런스를 한 묶음으로 제시하면 차별 포인트가 흐려질 수 있습니다.',
        use_case: '레퍼런스 구성',
        evidence: selectedEvidenceCards.slice(0, 2),
        evidence_card_ids: selectedEvidenceCards.slice(0, 2).map((item) => item.card_id),
      },
      {
        action: `${signalTheme}이 ${sharedScene} 메시지로 반복되는지 후속 카드에서 계속 모니터링합니다.`,
        why: '이번 조합에서 반복된 패턴이 일시적 언급인지 시장 전반의 설명 방식 변화인지 구분해야 다음 제안 메시지의 우선순위를 더 정확히 정할 수 있습니다.',
        use_case: '후속 모니터링',
        evidence: selectedEvidenceCards.slice(0, 3),
        evidence_card_ids: selectedEvidenceCards.slice(0, 3).map((item) => item.card_id),
      },
    ];
    const totalWeight = peers.length + Math.max(selectedIndustries.length, 1) + Math.max(keywordHitStats.length, selectedKeywords.length, 1);
    const confidenceBase = 0.66 + Math.min(0.18, selectedCards.length * 0.03) + Math.min(0.06, bookmarkedEvidenceCount * 0.02);
    const confidence = Math.min(0.94, Number(confidenceBase.toFixed(2)));

    return {
      mix_id: `mix-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      mix_insight: mixInsight,
      common_pattern: {
        finding: `여러 카드에서 ${signalTheme}이 ${sharedScene}을 설명하는 핵심 장치로 반복되고 있습니다.`,
        rationale: `${firstEvidence?.peer ?? peers[0]}는 "${firstEvidence?.text ?? ''}"를 통해 ${firstFocus}을 강조하고, ${secondEvidence?.peer ?? peers[1] ?? peers[0]}는 "${secondEvidence?.text ?? ''}"를 통해 ${sharedScene}을 더 넓은 성장·운영 맥락으로 연결합니다.`,
        evidence: selectedEvidenceCards.slice(0, 2),
        evidence_card_ids: selectedEvidenceCards.slice(0, 2).map((item) => item.card_id),
      },
      comparison_point: {
        finding: `${firstEvidence?.peer ?? peers[0]}는 ${firstFocus}에, ${secondEvidence?.peer ?? peers[1] ?? peers[0]}는 ${secondFocus}에 상대적으로 더 무게를 두고 있습니다.`,
        rationale: `같은 ${signalTheme} 흐름 안에서도 ${firstEvidence?.peer ?? peers[0]}는 ${firstEvidence?.title ?? '첫 번째 카드'}처럼 구체적 실행 장면을, ${secondEvidence?.peer ?? peers[1] ?? peers[0]}는 ${secondEvidence?.title ?? '두 번째 카드'}처럼 확산 또는 성장 맥락을 선택해 설명합니다.`,
        evidence: selectedEvidenceCards.slice(0, 2),
        evidence_card_ids: selectedEvidenceCards.slice(0, 2).map((item) => item.card_id),
      },
      hidden_conclusion: {
        finding: hiddenConclusion,
        rationale: `${primaryIndustries} · ${primaryCustomers} 조합에서 반복된 카드들은 새 기술 자체보다 운영 책임, 확산 구조, 적용 이후 효과를 근거로 삼고 있어 SK AX도 메시지의 중심축을 이 지점에 맞출 필요가 있습니다.`,
        evidence: selectedEvidenceCards.slice(0, 3),
        evidence_card_ids: selectedEvidenceCards.slice(0, 3).map((item) => item.card_id),
      },
      recommended_action_basis: actionBasis,
      action_details: actionDetails,
      recommended_actions: actionDetails.map((item) => item.action),
      sources_used: selectedEvidenceCards.map((item) => item.card_id),
      confidence,
      provenance: {
        llm_model: 'frontend-preview',
        prompt_version: 'mixer-insight-layout-v1',
        source_card_ids: selectedEvidenceCards.map((item) => item.card_id),
        ratios: {
          peer: clampRatio(peers.length / totalWeight),
          industry: clampRatio(Math.max(selectedIndustries.length, 1) / totalWeight),
          keyword: clampRatio(Math.max(keywordHitStats.length, selectedKeywords.length, 1) / totalWeight),
        },
        analysis_basis: 'integrated_issue+analysis+implication+frontend-preview',
      },
      created_at: new Date().toISOString(),
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
      setActiveResultStep(0);
      setResult(nextResult);
      setMode('result');
      setIsGenerating(false);
      generationTimeoutRef.current = null;
    }, 1800);
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
    const actionEvidence = Array.from(
      new Map(
        result.action_details
          .flatMap((item) => item.evidence)
          .map((evidence) => [evidence.card_id, evidence]),
      ).values(),
    );
    const resultSections = [
      {
        key: 'common_pattern' as const,
        label: '공통 패턴',
        finding: result.common_pattern.finding,
        rationale: result.common_pattern.rationale,
        evidence: result.common_pattern.evidence,
      },
      {
        key: 'comparison_point' as const,
        label: '비교 포인트',
        finding: result.comparison_point.finding,
        rationale: result.comparison_point.rationale,
        evidence: result.comparison_point.evidence,
      },
      {
        key: 'hidden_conclusion' as const,
        label: '숨은 결론',
        finding: result.hidden_conclusion.finding,
        rationale: result.hidden_conclusion.rationale,
        evidence: result.hidden_conclusion.evidence,
      },
      {
        key: 'action_direction' as const,
        label: '대응 방향',
        finding: result.recommended_actions[0] ?? '추천 액션을 먼저 검토합니다.',
        rationale: result.recommended_action_basis.join(' · '),
        evidence: actionEvidence,
      },
    ];
    const sharedEvidence = Array.from(
      new Map(
        resultSections.flatMap((section) =>
          section.evidence.map((evidence) => {
            return [
              evidence.card_id,
              {
                ...evidence,
                sections: resultSections
                  .filter((candidate) => candidate.evidence.some((item) => item.card_id === evidence.card_id))
                  .map((candidate) => candidate.label),
              },
            ] as const;
          }),
        ),
      ).values(),
    );
    const activeSection = resultSections[activeResultStep] ?? resultSections[0];
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

          <section data-guide="mixer-result" className="space-y-5">
            <article className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.18)]">
              <div className="border-l-4 border-[var(--axis-accent)] px-5 py-5 lg:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <ExecutiveBadge tone="accent">믹스 인사이트</ExecutiveBadge>
                </div>
                <h2 className="mt-4 max-w-5xl text-[1.9rem] font-display font-semibold leading-[1.2] tracking-[-0.04em] text-[var(--axis-ink)] lg:text-[2.3rem]">
                  {result.mix_insight}
                </h2>
              </div>
            </article>

            <article className="axis-panel-flat p-5">
              <div>
                <p className="axis-kicker">Step view</p>
                <h3 className="axis-section-heading mt-1">상세 해석 보기</h3>
              </div>
              <div className="mt-5 grid gap-5">
                <div className="flex flex-wrap gap-2">
                  {resultSections.map((section, sectionIndex) => (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveResultStep(sectionIndex)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        activeResultStep === sectionIndex
                          ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)] hover:border-[var(--axis-accent)]'
                      }`}
                      aria-pressed={activeResultStep === sectionIndex}
                    >
                      <span className="text-[11px] font-black">{sectionIndex + 1}</span>
                      <span>{section.label}</span>
                    </button>
                  ))}
                </div>

                <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 lg:p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-bold text-[var(--axis-accent-strong)]">
                      {activeResultStep + 1}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">해석 단계</p>
                      <h4 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activeSection.label}</h4>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div>
                      {activeSection.key !== 'action_direction' ? (
                        <>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">핵심 문장</p>
                          <p className="mt-2 text-[1.15rem] font-semibold leading-8 text-[var(--axis-ink)]">
                            {activeSection.finding}
                          </p>
                        </>
                      ) : null}
                      <div className={`${activeSection.key === 'action_direction' ? '' : 'mt-5'} rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4`}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">왜 이렇게 해석했는가</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--axis-body)]">{activeSection.rationale}</p>
                      </div>
                      {activeSection.key === 'action_direction' ? (
                        <div className="mt-5 grid gap-3">
                          {result.action_details.map((detail) => (
                            <div key={`${detail.use_case}-${detail.action}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{detail.use_case}</p>
                              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{detail.action}</p>
                              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{detail.why}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 lg:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">Shared evidence</p>
                      <h4 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">근거 카드</h4>
                    </div>
                    <p className="text-xs font-semibold text-[var(--axis-muted)]">
                      해석 4개에서 공통으로 참조한 카드만 한 번 모아 보여줍니다.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {sharedEvidence.map((evidence) => {
                      const sourceCard = mixerSourceCardById.get(evidence.card_id);

                      return (
                        <div key={`shared-${evidence.card_id}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => openMixerCard(evidence.card_id)}
                              className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[var(--axis-radius-sm)] bg-[#081324] transition hover:opacity-90"
                              aria-label={`${evidence.title} 카드 보기`}
                            >
                              {sourceCard?.coverImageUrl ? (
                                <img
                                  src={sourceCard.coverImageUrl}
                                  alt={sourceCard.coverImageAlt}
                                  className={getCardLogoImageClass(sourceCard.coverImageUrl, 'compact') ?? 'h-full w-full object-cover opacity-75'}
                                />
                              ) : null}
                              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <ExecutiveBadge tone="accent">{evidence.peer}</ExecutiveBadge>
                                {evidence.sections.map((label) => (
                                  <span
                                    key={`${evidence.card_id}-${label}`}
                                    className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-[11px] font-semibold text-[var(--axis-muted)]"
                                  >
                                    {label}
                                  </span>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => openMixerCard(evidence.card_id)}
                                  className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-body)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                                >
                                  카드 보기
                                </button>
                              </div>
                              <p className="mt-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">
                                {evidence.title}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{evidence.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
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
      {isGenerating ? <MixerAnalysisOverlay /> : null}
    </ExecutivePage>
  );
}
