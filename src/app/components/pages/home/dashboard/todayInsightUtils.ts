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
    label: displayTodayInsightLabel(signal.label ?? '관찰 포인트'),
    value: sanitizePublicInsightText(signal.value ?? ''),
    reasoning: (signal.reasoning ?? [])
      .filter((step) => step.detail)
      .map((step) => ({ stage: step.stage ?? '판단', detail: sanitizePublicInsightText(step.detail ?? '') })),
    evidence: normalizeEvidence(evidence),
    summary: sanitizePublicInsightText(signal.summary ?? signal.value ?? ''),
    responseDirection: [],
    sources: [],
    sourceTrace: [],
  };
}

export function normalizeTodayInsightSection(section: TodayInsightSection): HomeTodayInsightSignal {
  const evidence = (section.evidence ?? {}) as NormalizedEvidence;
  return {
    id: section.id ?? 'section',
    label: displayTodayInsightLabel(section.label ?? '관찰 포인트'),
    value: sanitizePublicInsightText(section.title ?? section.summary ?? ''),
    summary: sanitizePublicInsightText(section.summary ?? section.title ?? ''),
    reasoning: (section.reasoning ?? [])
      .filter((step) => step.detail)
      .map((step) => ({ stage: step.stage ?? '판단', detail: sanitizePublicInsightText(step.detail ?? '') })),
    evidence: normalizeEvidence(evidence),
    responseDirection: Array.from(section.responseDirection ?? section.response_direction ?? []),
    sources: Array.from(section.sources ?? []),
    sourceTrace: Array.from(section.sourceTrace ?? section.source_trace ?? []),
  };
}

function normalizeEvidence(evidence: NormalizedEvidence) {
  return {
    grounds: sanitizeInsightList(evidence.grounds ?? []),
    changes: sanitizeInsightList(evidence.changes ?? []),
    relatedKeywords: sanitizeInsightList(evidence.relatedKeywords ?? evidence.related_keywords ?? []),
    sourceIds: Array.from(evidence.sourceIds ?? evidence.source_ids ?? []),
  };
}

function sanitizeInsightList(values: ReadonlyArray<string>): string[] {
  return Array.from(values)
    .map(sanitizePublicInsightText)
    .filter(Boolean);
}

function sanitizePublicInsightText(value: string): string {
  let text = String(value ?? '').trim();
  if (!text) return '';
  if (/^(google|meta|unknown|other)\s+카드\/이슈\b/i.test(text)) return '';

  const replacements: Array<[RegExp, string]> = [
    [/\blow_visibility_definite_event\b/g, '노출은 낮지만 내용이 확인된 이벤트'],
    [/\bhigh_salience_visible\b/g, '보도 확산이 큰 이벤트'],
    [/\bgeneral_update\b/g, '일반 업데이트'],
    [/\bevent_type_mix_shift\b/g, '이벤트 유형 변화'],
    [/\bpeer_activity_delta\b/g, 'Peer 활동 변화'],
    [/\bbaseline\b/g, '최근 평균'],
    [/\btoday_pct\b/g, '오늘 비중'],
    [/\bbaseline_pct\b/g, '최근 평균 비중'],
    [/\bdelta_pp\b/g, '변화폭'],
    [/\bratio_delta\b/g, '검색 증감폭'],
    [/\blatest_ratio\b/g, '최근 검색값'],
    [/\bsource_raw_article_ids?\b/g, '원문 근거'],
    [/\bsource_integrated_issue_id\b/g, '통합 이슈 근거'],
    [/\bsource_card_id\b/g, '카드뉴스 근거'],
    [/\bsource_ids?\b/g, '근거'],
    [/\braw_ids?\b/g, '원문 근거'],
    [/\bintegrated_issues?\b/g, '통합 이슈'],
    [/\btoday_insight_reports?\b/g, '저장 리포트'],
    [/\braw_articles?\b/g, '원문 기사'],
    [/\bcard_news\b/g, '카드뉴스'],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\b(?:IC|CN|raw)-[A-Za-z0-9_.:-]+\b/g, '근거');
  text = text.replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '근거');
  text = text.replace(/\b[a-z]+_[a-z0-9_]+\b/g, '');
  text = text.replace(/\s{2,}/g, ' ').replace(/\s+([,.%)]|건|개|로|으로|입니다)/g, '$1').trim();

  return text;
}

export function actionOwner(action: TodayInsightAction): string {
  return action.decision_owner ?? action.decisionOwner ?? '';
}

export function actionHorizon(action: TodayInsightAction): string {
  return action.time_horizon ?? action.timeHorizon ?? '';
}

export function sourceName(source: TodayInsightSource): string {
  return source.source_name ?? source.sourceName ?? source.publisher ?? '출처';
}

export function sourceRelatedCompanies(source: TodayInsightSource): string[] {
  return Array.from(source.related_companies ?? source.relatedCompanies ?? []);
}

export function displayTodayInsightLabel(label: string): string {
  return label === '종합 결과' ? '관찰 포인트' : label;
}

export function splitReadableInsightText(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^.!?。]+[.!?。]?/g) ?? [cleaned];
  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
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
