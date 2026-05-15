/**
 * PeerComparison Phase 1/2/4 응답 — axis-ai `/peer/compare` 출력 스키마.
 * spec: axis-ai/design/30-analysis/peer-comparison.md §5 PeerComparisonOutput
 */

export type StrategyLabel =
  | 'Aggressive Expansion'
  | 'Defensive Hold'
  | 'Tech Pivot'
  | 'Customer Lock-in'
  | 'Cost Leadership'
  | string;

export type TrendBand = 'normal' | '유의' | '급변';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface PeerTrendDelta {
  metric: string;
  label?: string;
  qoq_pct?: number | null;
  yoy_pct?: number | null;
  band: TrendBand;
  direction: TrendDirection;
  source: string;
}

export interface PeerDifferentiator {
  aspect: string;
  peer_position?: string;
  skax_position?: string;
  opportunity?: string;
}

export interface PeerReasoningTrailItem {
  seq: number;
  label: string;
  one_liner: string;
  evidence_refs: string[];
  langfuse_observation_id?: string | null;
}

export interface PeerCoTStep {
  step_idx: number;
  phase: 'current' | 'trend' | 'forecast' | 'strategic';
  question: string;
  inputs_used: string[];
  answer: string;
  intermediate_conclusion: string;
  confidence: number;
  langfuse_observation_id?: string | null;
}

export interface PeerForecast {
  horizon: '1Q' | '6M' | '1Y';
  scenario: 'optimistic' | 'baseline' | 'pessimistic';
  summary: string;
  drivers: string[];
  quantitative_estimate?: string | null;
  risk_assumptions: string[];
  confidence: number;
}

export interface PeerComparisonResponse {
  peer_id: string;
  strategy_label: StrategyLabel;
  differentiators: PeerDifferentiator[];
  strengths_of_peer: string[];
  weaknesses_of_peer: string[];
  collaboration_potential: string[];
  trend_deltas: PeerTrendDelta[];
  forecasts: PeerForecast[];
  sk_ax_implication: string;
  final_one_liner: string;
  follow_up_questions: string[];
  reasoning_trail: PeerReasoningTrailItem[];
  reasoning_steps: PeerCoTStep[];
  langfuse_trace_id?: string | null;
  confidence: number;
  provenance: Record<string, unknown>;
  sources_used: string[];
  analysis_period: Record<string, unknown>;
  warning?: string | null;
}
