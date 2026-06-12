import type {
  TodayInsightAction,
  TodayInsightSection,
  TodayInsightSource,
  TodayInsightSourceTrace,
} from '../../../../../features/dashboard/model/dashboard';

export type HomeTodayInsightSignal = {
  id: string;
  label: string;
  value: string;
  summary: string;
  reasoning: Array<{ stage: string; detail: string }>;
  evidence: {
    grounds: string[];
    changes: string[];
    relatedKeywords: string[];
    sourceIds: string[];
  };
  responseDirection: TodayInsightAction[];
  sources: TodayInsightSource[];
  sourceTrace: TodayInsightSourceTrace[];
};

type NormalizableTodayInsightSignal = {
  id?: string;
  label?: string;
  value?: string;
  summary?: string;
  reasoning?: ReadonlyArray<{ stage?: string; detail?: string }>;
  evidence?: {
    grounds?: ReadonlyArray<string>;
    changes?: ReadonlyArray<string>;
    related_keywords?: ReadonlyArray<string>;
    relatedKeywords?: ReadonlyArray<string>;
    source_ids?: ReadonlyArray<string>;
    sourceIds?: ReadonlyArray<string>;
  };
};

type NormalizedEvidence = {
  grounds?: ReadonlyArray<string>;
  changes?: ReadonlyArray<string>;
  related_keywords?: ReadonlyArray<string>;
  relatedKeywords?: ReadonlyArray<string>;
  source_ids?: ReadonlyArray<string>;
  sourceIds?: ReadonlyArray<string>;
};

export function normalizeTodayInsightSignal(signal: NormalizableTodayInsightSignal): HomeTodayInsightSignal {
  const evidence = (signal.evidence ?? {}) as NormalizedEvidence;
  return {
    id: signal.id ?? 'signal',
    label: signal.label ?? '주요 신호',
    value: signal.value ?? '',
    reasoning: (signal.reasoning ?? [])
      .filter((step) => step.detail)
      .map((step) => ({ stage: step.stage ?? '판단', detail: step.detail ?? '' })),
    evidence: normalizeEvidence(evidence),
    summary: signal.summary ?? signal.value ?? '',
    responseDirection: [],
    sources: [],
    sourceTrace: [],
  };
}

export function normalizeTodayInsightSection(section: TodayInsightSection): HomeTodayInsightSignal {
  const evidence = (section.evidence ?? {}) as NormalizedEvidence;
  return {
    id: section.id ?? 'section',
    label: section.label ?? '주요 신호',
    value: section.title ?? section.summary ?? '',
    summary: section.summary ?? section.title ?? '',
    reasoning: (section.reasoning ?? [])
      .filter((step) => step.detail)
      .map((step) => ({ stage: step.stage ?? '판단', detail: step.detail ?? '' })),
    evidence: normalizeEvidence(evidence),
    responseDirection: Array.from(section.responseDirection ?? section.response_direction ?? []),
    sources: Array.from(section.sources ?? []),
    sourceTrace: Array.from(section.sourceTrace ?? section.source_trace ?? []),
  };
}

function normalizeEvidence(evidence: NormalizedEvidence) {
  return {
    grounds: Array.from(evidence.grounds ?? []),
    changes: Array.from(evidence.changes ?? []),
    relatedKeywords: Array.from(evidence.relatedKeywords ?? evidence.related_keywords ?? []),
    sourceIds: Array.from(evidence.sourceIds ?? evidence.source_ids ?? []),
  };
}

export function actionOwner(action: TodayInsightAction): string {
  return action.decision_owner ?? action.decisionOwner ?? '';
}

export function actionHorizon(action: TodayInsightAction): string {
  return action.time_horizon ?? action.timeHorizon ?? '';
}

export function sourceName(source: TodayInsightSource): string {
  return source.source_name ?? source.sourceName ?? source.publisher ?? 'source';
}

export function sourceTraceIssueId(trace: TodayInsightSourceTrace): string {
  return trace.source_integrated_issue_id ?? trace.sourceIntegratedIssueId ?? '';
}

export function sourceTraceCardId(trace: TodayInsightSourceTrace): string {
  return trace.source_card_id ?? trace.sourceCardId ?? '';
}

export function isTruthyMeta(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function formatKeywordTrendDelta(delta?: number | null) {
  if (typeof delta !== 'number' || Number.isNaN(delta)) {
    return '-';
  }
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}pt`;
}

export function splitInsightBulletText(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const sentenceMatches = cleaned.match(/[^.!?。]+[.!?。]?/g) ?? [cleaned];
  return sentenceMatches
    .map((item) => item.trim().replace(/[.!?。]$/, ''))
    .filter(Boolean)
    .slice(0, 3);
}

export function insightBulletLabel(index: number): string {
  if (index === 0) return '판단 기준';
  if (index === 1) return '논의 사항';
  return '추가 확인';
}
