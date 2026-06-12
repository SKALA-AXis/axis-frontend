import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, Box, Check, Filter, Network, Sparkles, X } from 'lucide-react';
import { getCardLogoImageClass } from '../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { buildMixerCards } from '../../../../features/card-news/mappers/cardNewsPresentation';
import { useMixerAnalysis } from '../../../../features/mixer/hooks/useMixerAnalysis';
import {
  MIXER_RADAR_LABELS,
  type MixerAnalysisMode,
  type MixerAnalysisResponse,
  type MixerCoTStep,
  type MixerFollowUpCheck,
  type MixerRadarAxisId,
  type MixerRecentResult,
  type MixerStageEvent,
} from '../../../../features/mixer/model/mixer';
import { mixerRepository } from '../../../../features/mixer/api/mixerRepository';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
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

const MIXER_EVENT_TYPE_LABELS: Record<string, string> = {
  partnership: '제휴',
  ma: 'M&A',
  personnel: '조직/인재',
  tech: '기술',
  regulation: '규제',
  new_biz: '신사업',
  contract: '수주',
};

const MIXER_COMPANY_KEYWORD_BLOCKLIST = [
  '삼성SDS',
  '삼성 SDS',
  'Samsung SDS',
  'LG CNS',
  '엘지씨엔에스',
  '현대오토에버',
  '현대 오토에버',
  'Hyundai AutoEver',
  '포스코DX',
  '포스코 DX',
  'POSCO DX',
  'SK AX',
  'SK C&C',
  'SK주식회사',
  'SK',
];

type MixerFilterOption = {
  value: string;
  label: string;
  count: number;
};

const MIXER_ANALYSIS_MODE_OPTIONS: {
  id: MixerAnalysisMode;
  title: string;
  description: string;
  meta: string;
}[] = [
  {
    id: 'quick',
    title: '빠른 실행',
    description: '결과를 먼저 보기 위해 핵심 결론과 기본 근거 연결을 빠르게 정리합니다.',
    meta: '1차 LLM 분석 중심',
  },
  {
    id: 'deep',
    title: '정확 분석',
    description: '품질 보강, 믹스 단위 시사점, 실행 조건 검증을 추가해 더 자세히 정리합니다.',
    meta: '정밀 보강 + 상세 검증',
  },
];

const RADAR_CHART_RADIUS = 86;
const RADAR_GRID_LEVELS = [0.25, 0.5, 0.75, 1];

function formatLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampRadarScore(score: number) {
  return Math.max(0, Math.min(Number.isFinite(score) ? score : 0, 1));
}

function radarPoint(index: number, total: number, score = 1) {
  const safeTotal = Math.max(total, 1);
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / safeTotal;
  const radius = RADAR_CHART_RADIUS * clampRadarScore(score);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMixerFilterValue(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeMixerKeywordForCompare(value: string) {
  return value.toLowerCase().replace(/[\s._-]/g, '');
}

function isCompanyKeyword(value: string) {
  const normalized = normalizeMixerKeywordForCompare(value);
  return MIXER_COMPANY_KEYWORD_BLOCKLIST.some((company) => {
    const companyValue = normalizeMixerKeywordForCompare(company);
    if (companyValue.length <= 2) return normalized === companyValue;
    return normalized === companyValue || normalized.includes(companyValue);
  });
}

function buildMixerFilterOptions(
  values: Array<string | null | undefined>,
  labelMap?: Record<string, string>,
  limit?: number,
): MixerFilterOption[] {
  const counts = new Map<string, number>();
  values.forEach((rawValue) => {
    const value = normalizeMixerFilterValue(rawValue);
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  const options = Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: labelMap?.[value] ?? value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
  return typeof limit === 'number' ? options.slice(0, limit) : options;
}

function mergeMixerFilterOptions(options: MixerFilterOption[], limit?: number) {
  const merged = new Map<string, MixerFilterOption>();
  options.forEach((option) => {
    const key = option.label;
    const current = merged.get(key);
    if (current) {
      merged.set(key, { ...current, count: current.count + option.count });
      return;
    }
    merged.set(key, { ...option, value: option.label });
  });
  const sorted = Array.from(merged.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'),
  );
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

function splitMixerReadableText(text: string, maxItems = 3) {
  const normalized = sanitizeMixerDisplayText(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const sentenceMatches = normalized.match(/[^.!?。]+[.!?。]?/g) ?? [normalized];
  const clauses = sentenceMatches.flatMap((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length <= 110) return [trimmed];
    return trimmed
      .split(/,\s*|;\s*| · /)
      .map((item) => item.trim())
      .filter(Boolean);
  });
  const uniqueClauses = uniqueMixerTexts(clauses);
  return maxItems > 0 ? uniqueClauses : uniqueClauses;
}

function HighlightedMixerText({ text }: { text: string }) {
  return <>{sanitizeMixerDisplayText(text)}</>;
}

function MixerReadableText({
  text,
  maxItems = 3,
  className = '',
  compact = false,
}: {
  text: string;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}) {
  const items = splitMixerReadableText(text, maxItems);
  if (items.length === 0) return null;
  return (
    <div className={`grid ${compact ? 'gap-1.5' : 'gap-2'} ${className}`}>
      {items.map((item, index) => (
        <p
          key={`${item}-${index}`}
          className={`flex gap-2 ${compact ? 'text-xs leading-5' : 'text-sm leading-6'} text-[var(--axis-body)]`}
        >
          <span className="mt-[0.48rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--axis-accent)]" />
          <span>
            <HighlightedMixerText text={item} />
          </span>
        </p>
      ))}
    </div>
  );
}

function MixerFilterGroupPanel({
  title,
  options,
  selected,
  onToggle,
  emptyMessage,
  dense = false,
  scroll = false,
}: {
  title: string;
  options: MixerFilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  emptyMessage: string;
  dense?: boolean;
  scroll?: boolean;
}) {
  return (
    <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="axis-kicker">{title}</p>
        <span className="rounded-full bg-[var(--axis-canvas)] px-2 py-0.5 text-[10px] font-semibold text-[var(--axis-muted)]">
          {selected.length}
        </span>
      </div>
      {options.length > 0 ? (
        <div className={`flex flex-wrap gap-1 ${scroll ? 'max-h-[104px] overflow-y-auto pr-1' : ''}`}>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={`${dense ? 'min-h-6 px-2 py-0.5 text-[10px]' : 'min-h-6 px-2 py-0.5 text-[10px]'} max-w-full rounded-full border font-semibold transition ${
                  isSelected
                    ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)] dark:border-white/50 dark:bg-white/15 dark:text-white'
                    : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                }`}
                title={`${option.label} · ${option.count}개`}
              >
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <span className="truncate">{option.label}</span>
                  <span className="shrink-0 text-[10px] opacity-70">{option.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[var(--axis-radius-sm)] bg-[var(--axis-canvas)] px-2 py-1.5 text-xs leading-5 text-[var(--axis-muted)]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function MixerAnalysisProgressPanel({
  stage,
  analysisMode,
}: {
  stage: MixerStageEvent | null;
  analysisMode: MixerAnalysisMode;
}) {
  const loadingSteps = MIXER_RUN_STEPS;
  // stage 미수신(요청 직후) 시 0단계 활성. 수신 시 실제 index 사용.
  const activeStep = stage ? Math.min(Math.max(stage.index, 0), loadingSteps.length - 1) : 0;
  const total = stage?.total ?? loadingSteps.length;
  const activeLabel = stage?.label ?? loadingSteps[activeStep]?.description ?? '';
  const modeLabel = analysisMode === 'deep' ? '정확 분석' : '빠른 실행';
  const modeDescription =
    analysisMode === 'deep'
      ? '정확 분석은 대응 방향을 추가로 정제하므로 시간이 더 걸릴 수 있습니다.'
      : '빠른 실행은 결과를 먼저 보여주기 위해 핵심 분석 경로만 사용합니다.';

  return (
    <article className="mb-5 axis-panel-flat mixer-analysis-shell relative overflow-hidden rounded-[var(--axis-radius-lg)] border-[rgba(220,90,36,0.22)] px-5 py-5 shadow-[0_24px_72px_-48px_rgba(26,26,31,0.38)]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,90,36,0.45),transparent)]" />
      <div className="relative grid items-center gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
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
                {modeLabel}으로 카드뉴스를 연결 가능한 인사이트로 재구성하고 있습니다.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--axis-muted)]">
                선택한 카드, Peer, 주제 사이의 반복 문맥을 정리하고 SK AX 관점의 실행 판단으로 압축하는 중입니다.
                {' '}
                {modeDescription} 분석 중에도 다른 화면으로 이동해 확인할 수 있습니다.
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
    </article>
  );
}

const MIXER_PHASE_LABELS: Record<MixerCoTStep['phase'], string> = {
  per_card: '카드별 해석',
  cross_card: '카드 간 비교',
  synthesis: '종합 추론',
};

const provenanceString = (provenance: Record<string, unknown>, key: string): string | null => {
  const value = provenance?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const sanitizeMixerActionText = (value?: string | null): string => {
  return (value ?? '')
    .replace(/^SK AX는 경영진 리뷰 안건을 정보 공유가 아니라 자원 배분 의사결정으로 격상한다\.?\s*/, '')
    .replace(/^경영진 리뷰 안건을 정보 공유가 아니라 자원 배분 의사결정으로 격상한다\.?\s*/, '')
    .trim();
};

const sanitizeMixerDisplayText = (value?: string | null): string => {
  const cleaned = (value ?? '')
    .replace(/\bevent_type\b/gi, '이벤트 유형')
    .replace(/\bexposure_score\b/gi, '노출 점수')
    .replace(/\bnew_biz\b/gi, '신사업')
    .replace(/\bma\b/g, 'M&A')
    .replace(/\b(?:source_card_id|target_card_id|card_id|input_card_ids|matched_card_ids|peer_ids|mix_id|langfuse_trace_id)\b/gi, '')
    .replace(/\b[a-z][a-z0-9]*_[a-z0-9_]*\b/gi, '')
    .replace(/\b[A-Z]{2,}-\d{2,}\b/g, '선택 카드')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?。])/g, '$1')
    .trim();
  return dedupeMixerSentences(cleaned);
};

function normalizeMixerTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\bevent_type\b/gi, '이벤트유형')
    .replace(/\bexposure_score\b/gi, '노출점수')
    .replace(/\bnew_biz\b/gi, '신사업')
    .replace(/\bma\b/g, 'm&a')
    .replace(/\b(?:source_card_id|target_card_id|card_id|input_card_ids|matched_card_ids|peer_ids|mix_id|langfuse_trace_id)\b/gi, '')
    .replace(/\b[a-z][a-z0-9]*_[a-z0-9_]*\b/gi, '')
    .replace(/\b[A-Z]{2,}-\d{2,}\b/g, '선택카드')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function areMixerTextsSimilar(left?: string | null, right?: string | null) {
  const leftKey = normalizeMixerTextKey(left ?? '');
  const rightKey = normalizeMixerTextKey(right ?? '');
  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;
  const shorter = leftKey.length <= rightKey.length ? leftKey : rightKey;
  const longer = leftKey.length > rightKey.length ? leftKey : rightKey;
  return shorter.length >= 24 && longer.includes(shorter);
}

function uniqueMixerTexts(values: string[]) {
  const seen: string[] = [];
  return values.filter((value) => {
    const cleaned = sanitizeMixerDisplayText(value);
    if (!cleaned) return false;
    if (seen.some((current) => areMixerTextsSimilar(current, cleaned))) return false;
    seen.push(cleaned);
    return true;
  });
}

function dedupeMixerSentences(value: string) {
  if (!value) return '';
  const sentences = value.match(/[^.!?。]+[.!?。]?/g) ?? [value];
  const seen: string[] = [];
  const unique = sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      if (!sentence) return false;
      if (seen.some((current) => areMixerTextsSimilar(current, sentence))) return false;
      seen.push(sentence);
      return true;
    });
  return unique.join(' ').trim();
}

const formatMixerDate = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const mixerModeLabel = (mode?: string | null): string => (mode === 'deep' ? '정확 분석' : '빠른 실행');

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
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [candidatePage, setCandidatePage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<MixerAnalysisMode>('quick');
  const [result, setResult] = useState<MixerAnalysisResponse | null>(null);
  const [recentMixerResults, setRecentMixerResults] = useState<MixerRecentResult[]>([]);
  const [activeResultStep, setActiveResultStep] = useState(0);
  const [activeDeepDiveIndex, setActiveDeepDiveIndex] = useState(0);
  const [activeRadarAxisId, setActiveRadarAxisId] = useState<MixerRadarAxisId | null>(null);
  const [showInsightReasoning, setShowInsightReasoning] = useState(false);
  const [mixerDetailCardId, setMixerDetailCardId] = useState<string | null>(null);
  const [mixerDetailSlideIndex, setMixerDetailSlideIndex] = useState(0);
  const [historyStartDate, setHistoryStartDate] = useState(() => formatLocalDateInputValue());
  const [historyEndDate, setHistoryEndDate] = useState(() => formatLocalDateInputValue());

  useEffect(() => {
    if (isLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, isLoading, onUpdateTimeChange]);

  const loadRecentMixerResults = useCallback(async () => {
    try {
      const items = await mixerRepository.recent(10);
      setRecentMixerResults(items);
    } catch {
      setRecentMixerResults([]);
    }
  }, []);

  useEffect(() => {
    void loadRecentMixerResults();
  }, [loadRecentMixerResults]);

  const mixerCards = useMemo(() => buildMixerCards(cards), [cards]);
  const peerFilterOptions = useMemo(
    () => buildMixerFilterOptions(mixerCards.map((item) => item.peer)),
    [mixerCards],
  );
  const topicFilterOptions = useMemo(() => {
    const keywordOptions = buildMixerFilterOptions(
      mixerCards
        .flatMap((item) => item.card.keywords ?? [])
        .filter((keyword) => !isCompanyKeyword(keyword)),
    );
    const eventOptions = buildMixerFilterOptions(
      mixerCards.map((item) => item.card.event_type),
      MIXER_EVENT_TYPE_LABELS,
    );
    return mergeMixerFilterOptions([...keywordOptions, ...eventOptions], 42);
  }, [mixerCards]);
  const sourceTypeFilterOptions = useMemo(
    () => buildMixerFilterOptions(mixerCards.map((item) => item.sourceType)),
    [mixerCards],
  );
  const visibleCards = mixerCards.filter((item) => {
    const peerMatched = selectedPeers.length === 0 || selectedPeers.includes(item.peer);
    const cardTopics = [
      ...(item.card.keywords ?? []).filter((keyword) => !isCompanyKeyword(keyword)),
      item.card.event_type ? MIXER_EVENT_TYPE_LABELS[item.card.event_type] ?? item.card.event_type : '',
    ].filter(Boolean);
    const topicMatched =
      selectedTopics.length === 0 || cardTopics.some((topic) => selectedTopics.includes(topic));
    const sourceMatched = selectedSourceTypes.length === 0 || selectedSourceTypes.includes(item.sourceType);
    const bookmarkMatched = !bookmarkedOnly || bookmarkedIds.includes(item.card.id);
    return peerMatched && topicMatched && sourceMatched && bookmarkMatched;
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
  const openStoredMixerResult = useCallback((payload?: MixerAnalysisResponse | null) => {
    if (!payload) return;

    setResult(payload);
    setActiveResultStep(0);
    setActiveDeepDiveIndex(0);
    setActiveRadarAxisId(null);
    setShowInsightReasoning(false);
    setMode('result');
  }, []);
  const filteredRecentMixerResults = useMemo(() => {
    return recentMixerResults.filter((item) => {
      const normalizedDate = formatMixerDate(item.created_at);
      const afterStart = !historyStartDate || !normalizedDate || normalizedDate >= historyStartDate;
      const beforeEnd = !historyEndDate || !normalizedDate || normalizedDate <= historyEndDate;
      return afterStart && beforeEnd;
    });
  }, [historyEndDate, historyStartDate, recentMixerResults]);
  const historyPreviewEntries = useMemo(() => {
    return recentMixerResults
      .map((entry) => ({
        key: entry.id,
        date: formatMixerDate(entry.created_at),
        title: entry.title || entry.payload?.insight || entry.final_one_liner || '믹서 결과',
        meta: `${mixerModeLabel(String(entry.analysis_mode || entry.payload?.provenance?.analysis_mode || 'quick'))} · 카드 ${entry.input_card_ids?.length ?? entry.payload?.sources_used?.length ?? 0}장`,
        payload: entry.payload,
      }))
      .slice(0, 3);
  }, [recentMixerResults]);
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

  const selectRadarAxis = useCallback((axisId: MixerRadarAxisId) => {
    setActiveRadarAxisId((current) => (current === axisId ? current : axisId));
  }, []);

  useEffect(() => {
    setCandidatePage(1);
  }, [bookmarkedOnly, selectedPeers, selectedSourceTypes, selectedTopics]);

  useEffect(() => {
    const validPeers = new Set(peerFilterOptions.map((option) => option.value));
    const validTopics = new Set(topicFilterOptions.map((option) => option.value));
    const validSources = new Set(sourceTypeFilterOptions.map((option) => option.value));
    setSelectedPeers((current) => current.filter((item) => validPeers.has(item)));
    setSelectedTopics((current) => current.filter((item) => validTopics.has(item)));
    setSelectedSourceTypes((current) => current.filter((item) => validSources.has(item)));
  }, [peerFilterOptions, sourceTypeFilterOptions, topicFilterOptions]);

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
    if (selectedTopics.length > 0) contextParts.push(`선택 주제: ${selectedTopics.join(', ')}`);
    if (selectedSourceTypes.length > 0) contextParts.push(`출처 유형: ${selectedSourceTypes.join(', ')}`);
    const userContext = contextParts.length > 0 ? contextParts.join(' / ') : undefined;

    setIsGenerating(true);
    resetMixer();
    try {
      const response = await analyzeMixer({ cardIds, userContext, analysisMode });
      if (response) {
        setResult(response);
        setActiveResultStep(0);
        setActiveDeepDiveIndex(0);
        setActiveRadarAxisId(null);
        setShowInsightReasoning(false);
        await loadRecentMixerResults();
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
            description="카드뉴스를 가져와 조합 가능한 후보, Peer, 주제 필터로 나눠 믹서 작업대를 준비합니다."
            steps={[
              { label: '후보 카드 요청', detail: '/api/cards 응답 대기' },
              { label: '조합 재료 정리', detail: 'Peer사와 주제 축 추출' },
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
            subtitle="저장된 실제 믹서 결과를 날짜 기준으로 조회합니다."
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
                  {filteredRecentMixerResults.map((entry) => (
                    <section key={entry.id} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[var(--axis-ink)]">
                          {entry.title || entry.payload?.insight || entry.final_one_liner || '믹서 결과'}
                        </h3>
                        <span className="shrink-0 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
                          {formatMixerDate(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-[var(--axis-body)]">
                        {entry.final_one_liner || entry.payload?.final_one_liner || entry.payload?.mix_insight || '저장된 믹서 결과입니다.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ExecutiveBadge tone="accent">
                          {mixerModeLabel(String(entry.analysis_mode || entry.payload?.provenance?.analysis_mode || 'quick'))}
                        </ExecutiveBadge>
                        <span className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
                          카드 {entry.input_card_ids?.length ?? entry.payload?.sources_used?.length ?? 0}장
                        </span>
                      </div>
                      {entry.payload ? (
                        <div className="mt-4">
                          <ExecutiveButton
                            variant="secondary"
                            onClick={() => openStoredMixerResult(entry.payload)}
                          >
                            결과 열기
                          </ExecutiveButton>
                        </div>
                      ) : null}
                    </section>
                  ))}
                  {filteredRecentMixerResults.length === 0 ? (
                    <div className="rounded-[var(--axis-radius-lg)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-6 text-sm leading-6 text-[var(--axis-muted)]">
                      표시할 실제 믹서 기록이 없습니다.
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
    const sourceCardIds =
      result.sources_used && result.sources_used.length > 0
        ? result.sources_used
        : selectedCards.map((item) => item.card.id);
    const sourceCards = sourceCardIds
      .map((cardId) => mixerSourceCardById.get(cardId))
      .filter((card): card is NonNullable<typeof card> => Boolean(card));
    const mixerCardTitle = (cardId: string) => mixerSourceCardById.get(cardId)?.title ?? '선택 카드';
    const provenance = result.provenance ?? {};
    const llmModel = provenanceString(provenance, 'llm_model');
    const analysisBasis = provenanceString(provenance, 'analysis_basis');
    const deepDiveSections = result.deep_dive_sections ?? [];
    // 카드 조합이 인사이트로 이어지는 실 LLM 추론 흐름 (공통 패턴 → 비교 포인트 → 숨은 결론).
    const insightChain = [
      { key: 'common_pattern' as const, label: '공통 패턴', block: result.common_pattern },
      { key: 'comparison_point' as const, label: '비교 포인트', block: result.comparison_point },
      { key: 'hidden_conclusion' as const, label: '숨은 결론', block: result.hidden_conclusion },
    ].filter((step) => step.block && (step.block.finding || step.block.rationale));
    const hasRealReasoning = insightChain.length > 0 || reasoningSteps.length > 0 || reasoningTrail.length > 0;
    const isNonActualResult = llmModel === 'frontend-preview' || llmModel === 'fixture';
    const headlineInsight = sanitizeMixerDisplayText(result.insight || result.mix_insight || result.final_one_liner || '믹스 인사이트');
    const rawFinalOneLiner = sanitizeMixerDisplayText(result.final_one_liner);
    const finalOneLiner = areMixerTextsSimilar(rawFinalOneLiner, headlineInsight) ? '' : rawFinalOneLiner;
    const actionDetails = result.action_details ?? [];
    const followUpChecks: MixerFollowUpCheck[] = result.follow_up_checks ?? [];
    const followUpItems: MixerFollowUpCheck[] =
      followUpChecks.length > 0
        ? followUpChecks
        : followUpQuestions.map((question) => ({ question, answer: '', evidence_refs: [] }));
    const radarChartAxes = radarAxes.map((axis) => ({
      ...axis,
      label: MIXER_RADAR_LABELS.find((item) => item.id === axis.axis)?.label ?? axis.axis,
      score: clampRadarScore(axis.score),
    }));
    const activeRadarAxis =
      radarChartAxes.find((axis) => axis.axis === activeRadarAxisId) ?? radarChartAxes[0] ?? null;
    const radarPolygonPoints = radarChartAxes
      .map((axis, index) => {
        const point = radarPoint(index, radarChartAxes.length, axis.score);
        return `${point.x},${point.y}`;
      })
      .join(' ');

    // 탭형 step-view — 공통 패턴 → 비교 포인트 → 숨은 결론 → 대응 방향.
    const blockEvidenceIds = (block?: typeof result.common_pattern): string[] =>
      block?.evidence_card_ids && block.evidence_card_ids.length > 0
        ? block.evidence_card_ids
        : (block?.evidence ?? []).map((item) => item.card_id);
    const recommendedActions = uniqueMixerTexts(
      (result.recommended_actions ?? [])
        .map((item) => sanitizeMixerDisplayText(sanitizeMixerActionText(item)))
        .filter(Boolean),
    ).filter(
      (action) =>
        !areMixerTextsSimilar(action, headlineInsight) &&
        !areMixerTextsSimilar(action, finalOneLiner),
    );
    const actionEvidenceIds = Array.from(
      new Set([
        ...blockEvidenceIds(result.common_pattern),
        ...blockEvidenceIds(result.comparison_point),
        ...blockEvidenceIds(result.hidden_conclusion),
        ...actionDetails.flatMap((item) => item.evidence_card_ids ?? []),
      ]),
    );
    const actionRationale = actionDetails
      .map((item) => item.why)
      .filter((item): item is string => Boolean(item?.trim()))
      .join(' ');
    const resultSections = [
      {
        key: 'common_pattern',
        label: '공통 패턴',
        finding: sanitizeMixerDisplayText(result.common_pattern?.finding),
        rationale: sanitizeMixerDisplayText(result.common_pattern?.rationale),
        evidenceIds: blockEvidenceIds(result.common_pattern),
        actions: [] as string[],
      },
      {
        key: 'comparison_point',
        label: '비교 포인트',
        finding: sanitizeMixerDisplayText(result.comparison_point?.finding),
        rationale: sanitizeMixerDisplayText(result.comparison_point?.rationale),
        evidenceIds: blockEvidenceIds(result.comparison_point),
        actions: [] as string[],
      },
      {
        key: 'hidden_conclusion',
        label: '숨은 결론',
        finding: sanitizeMixerDisplayText(result.hidden_conclusion?.finding),
        rationale: sanitizeMixerDisplayText(result.hidden_conclusion?.rationale),
        evidenceIds: blockEvidenceIds(result.hidden_conclusion),
        actions: [] as string[],
      },
      {
        key: 'action_direction',
        label: '대응 방향',
        finding: sanitizeMixerDisplayText(sanitizeMixerActionText(actionDetails[0]?.action) || sanitizeMixerActionText(result.sk_ax_implication) || recommendedActions[0] || ''),
        rationale: sanitizeMixerDisplayText(actionRationale || result.hidden_conclusion?.rationale || result.comparison_point?.rationale || ''),
        evidenceIds: actionEvidenceIds,
        actions: recommendedActions,
      },
    ].filter((section) => section.finding || section.rationale || section.actions.length > 0);
    const safeStep = Math.min(Math.max(activeResultStep, 0), Math.max(resultSections.length - 1, 0));
    // 근거 카드 텍스트 (블록 evidence 의 text) 매핑.
    const evidenceTextById = new Map<string, string>();
    [result.common_pattern, result.comparison_point, result.hidden_conclusion].forEach((block) => {
      (block?.evidence ?? []).forEach((item) => {
        if (item.text && !evidenceTextById.has(item.card_id)) evidenceTextById.set(item.card_id, sanitizeMixerDisplayText(item.text));
      });
    });
    actionDetails.forEach((detail) => {
      (detail.evidence ?? []).forEach((item) => {
        if (item.text && !evidenceTextById.has(item.card_id)) evidenceTextById.set(item.card_id, sanitizeMixerDisplayText(item.text));
      });
    });
    const activeResultSection = resultSections[safeStep];
    const activeSectionEvidence = activeResultSection
      ? activeResultSection.evidenceIds
          .map((cardId) => ({
            cardId,
            text: evidenceTextById.get(cardId) ?? '',
            card: mixerSourceCardById.get(cardId) ?? null,
          }))
          .filter((item) => item.text || item.card)
      : [];
    const hasStepView = resultSections.length > 0;
    const safeDeepDiveIndex = Math.min(Math.max(activeDeepDiveIndex, 0), Math.max(deepDiveSections.length - 1, 0));
    const activeDeepDiveSection = deepDiveSections[safeDeepDiveIndex];
    if (isNonActualResult || (!hasRealReasoning && !hasStepView && !headlineInsight.trim())) {
      return (
        <ExecutivePage className="overflow-visible">
          <ExecutiveContainer className="pb-12">
            <ExecutiveHeader
              eyebrow="Mixer output"
              title="믹서 결과"
              subtitle="실제 분석 결과만 표시합니다."
              actions={
                <ExecutiveButton variant="secondary" onClick={() => setMode('select')}>
                  선택으로 돌아가기
                </ExecutiveButton>
              }
            />
            <div className="axis-panel-flat p-6 text-sm leading-6 text-[var(--axis-muted)]">
              실제 믹서 분석 결과를 표시할 수 없습니다. axis-ai 생성 결과가 저장되지 않았거나 분석 본문이 비어 있습니다.
              카드를 다시 선택해 실행해 주세요.
            </div>
          </ExecutiveContainer>
        </ExecutivePage>
      );
    }
    return (
      <ExecutivePage className="overflow-visible">
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="Mixer output"
            title="믹서 결과"
            subtitle="선택한 카드들을 axis-ai 믹서 에이전트(LLM)가 겹쳐 읽어 하나의 인사이트로 압축한 결과입니다."
            actions={
              <>
                {recentMixerResults.length > 0 ? (
                  <ExecutiveButton variant="secondary" onClick={() => setMode('history')}>
                    전체 기록 보기
                  </ExecutiveButton>
                ) : null}
                <ExecutiveButton variant="secondary" onClick={() => setMode('select')}>
                  선택으로 돌아가기
                </ExecutiveButton>
              </>
            }
          />

          <section data-guide="mixer-result" className="space-y-5">
            <article data-guide="mixer-result-headline" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.18)]">
              <div className="border-l-4 border-[var(--axis-accent)] px-5 py-5 lg:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ExecutiveBadge tone="accent">믹스 인사이트</ExecutiveBadge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--axis-muted)]">
                      카드 {sourceCardIds.length}장 조합
                    </span>
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
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.18)] bg-[rgba(220,90,36,0.06)] px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">핵심 인사이트</p>
                    <h2 className="mt-2 text-[clamp(22px,2vw,32px)] font-display font-semibold leading-snug text-[var(--axis-ink)]">
                      <HighlightedMixerText text={headlineInsight} />
                    </h2>
                  </div>
                  {finalOneLiner && finalOneLiner !== headlineInsight ? (
                    <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">요약 판단</p>
                      <p className="mt-2 text-[clamp(16px,1.2vw,19px)] font-semibold leading-7 text-[var(--axis-ink)]">
                        <HighlightedMixerText text={finalOneLiner} />
                      </p>
                    </div>
                  ) : null}
                  {recommendedActions.slice(0, 2).map((action, index) => (
                    <div key={`headline-action-${index}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">대응 방향 {index + 1}</p>
                      <p className="mt-2 text-[clamp(16px,1.2vw,19px)] font-semibold leading-7 text-[var(--axis-ink)]">
                        <HighlightedMixerText text={action} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {result.warning ? (
              <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.3)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm leading-6 text-[var(--axis-accent-strong)]">
                {result.warning}
              </div>
            ) : null}

            {hasStepView ? (
              <article data-guide="mixer-result-steps" className="axis-panel-flat p-5">
                <p className="axis-kicker">Step view</p>
                <h3 className="axis-section-heading mt-1">상세 해석 보기</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">
                  카드 조합이 인사이트로 이어진 해석 흐름입니다. 항목을 선택하면 아래 내용이 해당 단계로 교체됩니다.
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

                {activeResultSection ? (
                  <section
                    key={`section-card-${activeResultSection.key}`}
                    className="mt-5 rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.32)] bg-[rgba(220,90,36,0.05)] p-4 lg:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-sm font-bold text-[var(--axis-accent-strong)]">
                        {safeStep + 1}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">해석 단계</p>
                        <h4 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activeResultSection.label}</h4>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)]">
                        {activeResultSection.finding ? (
                          <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">핵심 문장</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                              <HighlightedMixerText text={activeResultSection.finding} />
                            </p>
                          </div>
                        ) : null}

                        {activeResultSection.rationale ? (
                          <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.18)] bg-[var(--axis-surface-soft)] p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">검증 근거</p>
                            <MixerReadableText text={activeResultSection.rationale} maxItems={3} className="mt-2" />
                          </div>
                        ) : null}
                      </div>

                      {activeResultSection.actions.length > 0 ? (
                        <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">실행 방향</p>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {activeResultSection.actions.map((action, index) => (
                              <div key={`action-${activeResultSection.key}-${index}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-3">
                                <p className="text-[11px] font-bold text-[var(--axis-accent-strong)]">Action {index + 1}</p>
                                <MixerReadableText
                                  text={action}
                                  maxItems={2}
                                  compact
                                  className="mt-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {activeSectionEvidence.length > 0 ? (
                        <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">근거 카드</p>
                            <span className="text-[11px] font-semibold text-[var(--axis-muted)]">{activeSectionEvidence.length}개 참조</span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {activeSectionEvidence.slice(0, 4).map((item) => {
                              const evidenceLine = item.text || mixerCardTitle(item.cardId);
                              return (
                                <button
                                  key={`${activeResultSection.key}-${item.cardId}`}
                                  type="button"
                                  onClick={() => openMixerCard(item.cardId)}
                                  className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-3 text-left transition hover:border-[var(--axis-accent)]"
                                  title={sanitizeMixerDisplayText(evidenceLine)}
                                >
                                  <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                                    <HighlightedMixerText text={evidenceLine} />
                                  </p>
                                </button>
                              );
                            })}
                            </div>
                          </div>
                      ) : null}
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

            {deepDiveSections.length > 0 ? (
              <section data-guide="mixer-result-depth" className="grid gap-5">
                {deepDiveSections.length > 0 && activeDeepDiveSection ? (
                  <article className="axis-panel-flat p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="axis-kicker">Deep dive</p>
                        <h3 className="axis-section-heading mt-1">상세 검증</h3>
                      </div>
                      <ExecutiveBadge tone="accent">섹션별 검증</ExecutiveBadge>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="grid gap-2 self-start">
                        {deepDiveSections.map((section, sectionIndex) => {
                          const isActive = sectionIndex === safeDeepDiveIndex;
                          return (
                            <button
                              key={`deep-nav-${sectionIndex}-${section.title}`}
                              type="button"
                              onClick={() => setActiveDeepDiveIndex(sectionIndex)}
                              className={`rounded-[var(--axis-radius-md)] border px-3 py-3 text-left transition ${
                                isActive
                                  ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)]'
                                  : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] hover:border-[var(--axis-accent)]'
                              }`}
                            >
                              <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
                                isActive ? 'text-[var(--axis-accent-strong)]' : 'text-[var(--axis-muted)]'
                              }`}>
                                검증 {sectionIndex + 1}
                              </p>
                              <p className="mt-1 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{sanitizeMixerDisplayText(section.title)}</p>
                            </button>
                          );
                        })}
                      </div>

                      <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                        <h4 className="text-lg font-semibold text-[var(--axis-ink)]">{sanitizeMixerDisplayText(activeDeepDiveSection.title)}</h4>
                        {activeDeepDiveSection.summary ? (
                          <div className="mt-3 rounded-[var(--axis-radius-md)] bg-[rgba(220,90,36,0.06)] p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">요약 판단</p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                              <HighlightedMixerText text={activeDeepDiveSection.summary} />
                            </p>
                          </div>
                        ) : null}
                        {(activeDeepDiveSection.details ?? []).length > 0 ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {(activeDeepDiveSection.details ?? []).map((detail, detailIndex) => (
                              <div key={`deep-detail-${safeDeepDiveIndex}-${detailIndex}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">{sanitizeMixerDisplayText(detail.label)}</p>
                                {detail.text ? (
                                  <MixerReadableText text={detail.text} maxItems={3} compact className="mt-2" />
                                ) : null}
                                {detail.evidence_refs && detail.evidence_refs.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {detail.evidence_refs.map((cardId) => (
                                      <button
                                        key={`deep-ref-${safeDeepDiveIndex}-${detailIndex}-${cardId}`}
                                        type="button"
                                        onClick={() => openMixerCard(cardId)}
                                        className="max-w-full rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2.5 py-0.5 text-left text-[11px] font-semibold text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                                        title={mixerCardTitle(cardId)}
                                      >
                                        <span className="whitespace-normal break-words [overflow-wrap:anywhere]">{mixerCardTitle(cardId)}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </section>
                    </div>
                  </article>
                ) : null}
              </section>
            ) : null}

            {radarChartAxes.length > 0 ? (
              <article data-guide="mixer-signal-map" className="axis-panel-flat p-5">
                <p className="axis-kicker">Signal strength</p>
                <h3 className="axis-section-heading mt-1">신호 강도 레이더</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">
                  축에 마우스를 올리면 해당 신호를 본문 근거로 어떻게 읽어야 하는지 에이전트 해석이 표시됩니다.
                </p>
                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1fr)]">
                  <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                    <div className="relative mx-auto aspect-square w-full max-w-[360px]">
                      <svg
                        viewBox="-120 -120 240 240"
                        className="h-full w-full overflow-visible"
                        aria-label="믹서 신호 강도 레이더 차트"
                      >
                        {RADAR_GRID_LEVELS.map((level) => (
                          <polygon
                            key={`grid-${level}`}
                            points={radarChartAxes
                              .map((_, index) => {
                                const point = radarPoint(index, radarChartAxes.length, level);
                                return `${point.x},${point.y}`;
                              })
                              .join(' ')}
                            fill="none"
                            stroke="rgba(120,110,96,0.2)"
                            strokeWidth="1"
                          />
                        ))}
                        {radarChartAxes.map((axis, index) => {
                          const outer = radarPoint(index, radarChartAxes.length, 1);
                          const labelPoint = radarPoint(index, radarChartAxes.length, 1.16);
                          const textAnchor = Math.abs(labelPoint.x) < 8 ? 'middle' : labelPoint.x > 0 ? 'start' : 'end';
                          const isActive = activeRadarAxis?.axis === axis.axis;
                          return (
                            <g
                              key={`axis-${axis.axis}`}
                              role="button"
                              tabIndex={0}
                              aria-label={`${axis.label} 신호 강도 ${Math.round(axis.score * 100)}%`}
                              onPointerEnter={() => selectRadarAxis(axis.axis)}
                              onFocus={() => selectRadarAxis(axis.axis)}
                              onClick={() => selectRadarAxis(axis.axis)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  selectRadarAxis(axis.axis);
                                }
                              }}
                              className="cursor-pointer outline-none"
                            >
                              <line
                                x1="0"
                                y1="0"
                                x2={outer.x}
                                y2={outer.y}
                                stroke={isActive ? 'rgba(220,90,36,0.58)' : 'rgba(120,110,96,0.22)'}
                                strokeWidth={isActive ? 1.8 : 1}
                              />
                              <text
                                x={labelPoint.x}
                                y={labelPoint.y}
                                textAnchor={textAnchor}
                                dominantBaseline="middle"
                                className={isActive ? 'fill-[var(--axis-accent-strong)] text-[9px] font-bold' : 'fill-[var(--axis-muted)] text-[9px] font-semibold'}
                              >
                                {axis.label}
                              </text>
                            </g>
                          );
                        })}
                        <polygon
                          points={radarPolygonPoints}
                          fill="rgba(220,90,36,0.2)"
                          stroke="var(--axis-accent)"
                          strokeWidth="2"
                        />
                        {radarChartAxes.map((axis, index) => {
                          const point = radarPoint(index, radarChartAxes.length, axis.score);
                          const isActive = activeRadarAxis?.axis === axis.axis;
                          return (
                            <circle
                              key={`point-${axis.axis}`}
                              cx={point.x}
                              cy={point.y}
                              r={isActive ? 5.5 : 4}
                              fill={isActive ? 'var(--axis-accent-strong)' : 'var(--axis-accent)'}
                              stroke="var(--axis-canvas)"
                              strokeWidth="2"
                              className="cursor-pointer transition"
                              onPointerEnter={() => selectRadarAxis(axis.axis)}
                              onFocus={() => selectRadarAxis(axis.axis)}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="grid content-start gap-3">
                    {activeRadarAxis ? (
                      <div className="min-h-[340px] rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.28)] bg-[rgba(220,90,36,0.06)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">축별 해석</p>
                            <h4 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activeRadarAxis.label}</h4>
                          </div>
                          <span className="rounded-full bg-[var(--axis-accent)] px-3 py-1 text-xs font-bold text-white">
                            {Math.round(activeRadarAxis.score * 100)}%
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">근거 카드</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">
                              {activeRadarAxis.support_count ?? 0} / {activeRadarAxis.total_count ?? sourceCardIds.length}장
                            </p>
                          </div>
                          <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">판단 수위</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">
                              {activeRadarAxis.score >= 0.7 ? '강함' : activeRadarAxis.score >= 0.35 ? '보조' : '약함'}
                            </p>
                          </div>
                        </div>
                        {(activeRadarAxis.prompted_interpretation || activeRadarAxis.explanation) ? (
                          <div className="mt-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] px-3 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">에이전트 해석</p>
                            <MixerReadableText text={activeRadarAxis.prompted_interpretation || activeRadarAxis.explanation} maxItems={2} compact className="mt-2" />
                          </div>
                        ) : null}
                        {activeRadarAxis.meaning ? (
                          <p className="mt-2 text-xs leading-5 text-[var(--axis-muted)]">
                            <span className="font-semibold text-[var(--axis-ink)]">점수 해석:</span> {sanitizeMixerDisplayText(activeRadarAxis.meaning)}
                          </p>
                        ) : null}
                        {activeRadarAxis.matched_card_ids && activeRadarAxis.matched_card_ids.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {activeRadarAxis.matched_card_ids.slice(0, 4).map((cardId) => (
                              <button
                                key={`radar-ref-${activeRadarAxis.axis}-${cardId}`}
                                type="button"
                                onClick={() => openMixerCard(cardId)}
                                className="max-w-full rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2.5 py-0.5 text-left text-[11px] font-semibold text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                                title={mixerCardTitle(cardId)}
                              >
                                <span className="whitespace-normal break-words [overflow-wrap:anywhere]">{mixerCardTitle(cardId)}</span>
                              </button>
                            ))}
                            {activeRadarAxis.matched_card_ids.length > 4 ? (
                              <span className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--axis-muted)]">
                                +{activeRadarAxis.matched_card_ids.length - 4}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {radarChartAxes.map((axis) => {
                        const isActive = activeRadarAxis?.axis === axis.axis;
                        return (
                          <button
                            key={`radar-tile-${axis.axis}`}
                            type="button"
                            onPointerEnter={() => selectRadarAxis(axis.axis)}
                            onFocus={() => selectRadarAxis(axis.axis)}
                            onClick={() => selectRadarAxis(axis.axis)}
                            className={`rounded-[var(--axis-radius-md)] border p-3 text-left transition ${
                              isActive
                                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.1)]'
                                : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] hover:border-[var(--axis-accent)]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--axis-ink)]">{axis.label}</span>
                              <span className="text-[11px] font-bold text-[var(--axis-accent-strong)]">
                                {Math.round(axis.score * 100)}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(120,110,96,0.12)]">
                              <div
                                className="h-full rounded-full bg-[var(--axis-accent)]"
                                style={{ width: `${axis.score * 100}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            {followUpItems.length > 0 ? (
              <article data-guide="mixer-follow-up" className="axis-panel-flat p-5">
                <p className="axis-kicker">Follow-up</p>
                <h3 className="axis-section-heading mt-1">다음 확인 포인트</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">
                  현재 근거만으로 답할 수 있는 초안과, 그 답변이 기대는 카드 근거를 함께 표시합니다.
                </p>
                <div className="mt-4 grid gap-3">
                  {followUpItems.map((check, index) => (
                    <div key={`fu-${index}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3">
                      <div className="flex gap-2 text-sm leading-6 text-[var(--axis-body)]">
                        <span className="mt-0.5 font-bold text-[var(--axis-accent-strong)]">Q.</span>
                        <span className="font-semibold text-[var(--axis-ink)]"><HighlightedMixerText text={check.question} /></span>
                      </div>
                      {check.answer ? (
                        <div className="mt-3 rounded-[var(--axis-radius-md)] bg-[rgba(220,90,36,0.06)] px-3 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">A.</p>
                          <MixerReadableText text={check.answer} maxItems={2} compact className="mt-2" />
                        </div>
                      ) : null}
                      {check.evidence_refs && check.evidence_refs.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {check.evidence_refs.map((cardId) => (
                            <button
                              key={`follow-${index}-${cardId}`}
                              type="button"
                              onClick={() => openMixerCard(cardId)}
                              className="max-w-full rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-2.5 py-0.5 text-left text-[11px] font-semibold text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                              title={mixerCardTitle(cardId)}
                            >
                              <span className="whitespace-normal break-words [overflow-wrap:anywhere]">{mixerCardTitle(cardId)}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
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
                                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                                  <HighlightedMixerText text={step.block.finding} />
                                </p>
                              ) : null}
                              {step.block?.rationale ? (
                                <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">
                                  <HighlightedMixerText text={step.block.rationale} />
                                </p>
                              ) : null}
                              {step.block?.evidence_card_ids && step.block.evidence_card_ids.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {step.block.evidence_card_ids.map((cardId) => (
                                    <span
                                      key={`${step.key}-${cardId}`}
                                      className="max-w-full rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--axis-muted)]"
                                      title={mixerCardTitle(cardId)}
                                    >
                                      <span className="whitespace-normal break-words [overflow-wrap:anywhere]">{mixerCardTitle(cardId)}</span>
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
                              <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]"><HighlightedMixerText text={item.one_liner} /></p>
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
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">Q. <HighlightedMixerText text={step.question} /></p>
                            <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]"><HighlightedMixerText text={step.answer} /></p>
                            {step.intermediate_conclusion ? (
                              <p className="mt-2 rounded-[var(--axis-radius-sm)] bg-[var(--axis-canvas)] px-3 py-2 text-sm leading-6 text-[var(--axis-ink)]">
                                <span className="font-semibold">중간 결론:</span> <HighlightedMixerText text={step.intermediate_conclusion} />
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

                  <div className="mt-4 grid grid-cols-2 gap-2">
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
                    <span className="font-semibold text-[var(--axis-ink)]">분석 기준:</span> {sanitizeMixerDisplayText(analysisBasis) || '믹서 분석'}
                  </p>
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
                          <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                          <p className="mt-2 whitespace-normal break-words text-sm leading-6 text-[var(--axis-body)] [overflow-wrap:anywhere]">{card.detailDescription}</p>
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
            subtitle="카드뉴스의 Peer, 주제, 출처를 조합해 어떤 카드 묶음이 인사이트로 이어지는지 실험하는 작업 화면입니다."
          actions={
            <>
              <ExecutiveButton
                variant={bookmarkedOnly ? 'primary' : 'secondary'}
                icon={<Bookmark size={16} fill={bookmarkedOnly ? 'currentColor' : 'none'} />}
                onClick={() => setBookmarkedOnly((current) => !current)}
              >
                북마크만
              </ExecutiveButton>
              <div className="inline-flex rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-1">
                {MIXER_ANALYSIS_MODE_OPTIONS.map((option) => {
                  const isSelected = option.id === analysisMode;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setAnalysisMode(option.id)}
                      className={`h-9 rounded-[7px] px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? 'bg-[rgba(220,90,36,0.14)] text-[var(--axis-accent-strong)]'
                          : 'text-[var(--axis-muted)] hover:bg-[var(--axis-surface-soft)] hover:text-[var(--axis-body)]'
                      }`}
                      title={option.description}
                    >
                      {option.title}
                    </button>
                  );
                })}
              </div>
              <ExecutiveButton icon={<Sparkles size={16} />} disabled={!canGenerate || isGenerating} onClick={generateMixerResult}>
                {isGenerating ? '분석 중...' : analysisMode === 'deep' ? '정확 분석 실행' : '빠른 실행'}
              </ExecutiveButton>
            </>
          }
        />

        {isGenerating ? <MixerAnalysisProgressPanel stage={mixerStage} analysisMode={analysisMode} /> : null}

        <section data-guide="mixer-input" className="relative z-0 mb-4 grid gap-2 lg:grid-cols-[0.75fr_1.45fr_0.55fr]">
          <MixerFilterGroupPanel
            title="Peer사"
            options={peerFilterOptions}
            selected={selectedPeers}
            onToggle={(value) => toggleListValue(value, setSelectedPeers)}
            emptyMessage="표시할 Peer 값이 없습니다."
            dense
          />
          <MixerFilterGroupPanel
            title="주제"
            options={topicFilterOptions}
            selected={selectedTopics}
            onToggle={(value) => toggleListValue(value, setSelectedTopics)}
            emptyMessage="카드뉴스에 등록된 주제가 없습니다."
            scroll
          />
          <MixerFilterGroupPanel
            title="출처"
            options={sourceTypeFilterOptions}
            selected={selectedSourceTypes}
            onToggle={(value) => toggleListValue(value, setSelectedSourceTypes)}
            emptyMessage="출처 유형 값이 없습니다."
            dense
          />
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
                          {(item.card.keywords ?? []).filter((keyword) => !isCompanyKeyword(keyword)).length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(item.card.keywords ?? []).filter((keyword) => !isCompanyKeyword(keyword)).slice(0, 3).map((keyword) => (
                                <span key={`${item.id}-${keyword}`} className="max-w-full rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                                  <span className="line-clamp-1">{keyword}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
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
                <span className="text-xs font-semibold text-[var(--axis-muted)]">
                  {recentMixerResults.length > 0 ? `${recentMixerResults.length}개 저장` : '저장 결과 없음'}
                </span>
              </div>
              {historyPreviewEntries.length > 0 ? (
                <div className="grid gap-3">
                  {historyPreviewEntries.map((entry) => {
                    const content = (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">
                            {entry.date}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">
                          {entry.title}
                        </p>
                        <p className="mt-2 text-xs text-[var(--axis-muted)]">
                          {entry.meta}
                        </p>
                      </>
                    );

                    return entry.payload ? (
                      <button
                        key={entry.key}
                        type="button"
                        onClick={() => openStoredMixerResult(entry.payload)}
                        className="w-full rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-4 text-left transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--axis-accent)]"
                      >
                        {content}
                      </button>
                    ) : (
                      <div
                        key={entry.key}
                        className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-4"
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-4 text-sm leading-6 text-[var(--axis-muted)]">
                  실제 저장된 믹서 결과가 아직 없습니다.
                </div>
              )}
              {recentMixerResults.length > 0 ? (
                <div className="mt-4">
                  <ExecutiveButton variant="secondary" onClick={() => setMode('history')}>
                    전체 기록 보기
                  </ExecutiveButton>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}
