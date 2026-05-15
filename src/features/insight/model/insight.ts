/**
 * InsightCascade 4-phase 분석 응답 — axis-ai `/insight/generate` 출력 스키마.
 * spec: axis-ai/design/30-analysis/insight-cascade.md §5 InsightCascadeOutput
 */

export interface InsightResponseAction {
  action: string;
  priority: number;
  rationale?: string;
}

export interface InsightReasoningTrailItem {
  seq: number;
  label: string;
  one_liner: string;
  evidence_refs: string[];
  langfuse_observation_id?: string | null;
}

export interface InsightCoTStep {
  step_idx: number;
  phase: string;
  question: string;
  inputs_used: string[];
  answer: string;
  intermediate_conclusion: string;
  confidence: number;
  langfuse_observation_id?: string | null;
}

export interface InsightCascadeResponse {
  cause: string[];
  change: string[];
  impact: string[];
  response: InsightResponseAction[];

  final_one_liner: string;
  sk_ax_implication: string;

  reasoning_trail: InsightReasoningTrailItem[];
  reasoning_steps: InsightCoTStep[];
  langfuse_trace_id?: string | null;

  follow_up_questions: string[];
  risk_assumptions: string[];
  confidence: number;

  sources_used: string[];
  peer_ids: string[];

  provenance: Record<string, unknown>;
  warning?: string | null;
}

export interface InsightFlowStep {
  id: 'cause' | 'change' | 'impact' | 'response';
  label: string;
  description: string;
}

/**
 * InsightResultView 가 직접 그리는 표시 모델.
 * 기존 mock 구조와 호환되도록 매핑하면서, raw 3-tier observability 필드를 보존한다.
 */
export interface InsightDisplayResult {
  title: string;
  summary: string;
  evidence: string[];
  implications: string[];
  flowSteps: InsightFlowStep[];
  raw: InsightCascadeResponse | null;
}
