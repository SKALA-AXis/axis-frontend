/**
 * MixerAnalysis 3-phase 분석 응답 — axis-ai `/mixer/analyze` 출력 스키마.
 * spec: axis-ai/design/30-analysis/mixer-analysis.md §5 MixerAnalysisOutput
 */

export type MixerRadarAxisId =
  | 'peer_strategic_shift'
  | 'tech_investment'
  | 'market_position'
  | 'partnership_momentum'
  | 'regulatory_risk'
  | 'talent_movement';

export interface MixerRadarAxis {
  axis: MixerRadarAxisId;
  score: number;
  explanation: string;
}

export type MixerConnectionLabel = 'cause' | 'effect' | 'similar' | 'contrast' | 'reinforce';

export interface MixerConnection {
  source_card_id: string;
  target_card_id: string;
  label: MixerConnectionLabel;
  weight: number;
}

export interface MixerReasoningTrailItem {
  seq: number;
  label: string;
  one_liner: string;
  evidence_refs: string[];
  langfuse_observation_id?: string | null;
}

export interface MixerCoTStep {
  step_idx: number;
  phase: 'per_card' | 'cross_card' | 'synthesis';
  question: string;
  inputs_used: string[];
  answer: string;
  intermediate_conclusion: string;
  confidence: number;
  langfuse_observation_id?: string | null;
}

export interface MixerEvidenceRef {
  card_id: string;
  text: string;
}

/** axis-ai MixerInsightBlock — common_pattern / comparison_point / hidden_conclusion. */
export interface MixerInsightBlock {
  finding: string;
  rationale: string;
  evidence?: MixerEvidenceRef[];
  evidence_card_ids?: string[];
}

export type MixerCrossCardPattern =
  | 'convergent_strategy'
  | 'divergent_strategy'
  | 'gap_in_market'
  | 'acceleration_signal'
  | 'timing_mismatch'
  | 'market_baseline';

export interface MixerCrossCardFinding {
  finding: string;
  evidence_card_ids: string[];
  pattern_type: MixerCrossCardPattern;
}

export interface MixerAnalysisResponse {
  mix_id: string;
  mix_insight?: string;
  insight: string;
  final_one_liner: string;
  sk_ax_implication: string;
  bullet_signals: string[];
  radar_axes: MixerRadarAxis[];
  connections: MixerConnection[];
  // 실 LLM 추론 블록 — 카드 조합이 인사이트로 이어지는 과정.
  common_pattern?: MixerInsightBlock;
  comparison_point?: MixerInsightBlock;
  hidden_conclusion?: MixerInsightBlock;
  // 대응 방향 — SK AX 관점 실행 제언 (sk_ax_implication 의 근거 목록).
  recommended_actions?: string[];
  cross_card_findings?: MixerCrossCardFinding[];
  reasoning_trail: MixerReasoningTrailItem[];
  reasoning_steps: MixerCoTStep[];
  langfuse_trace_id?: string | null;
  follow_up_questions: string[];
  confidence: number;
  sources_used: string[];
  peer_ids: string[];
  provenance: Record<string, unknown>;
  warning?: string | null;
}

/** SSE 실행 단계 이벤트 — axis-ai MixerAnalysisAgent 실 단계 경계. */
export type MixerStageId = 'prepare' | 'analyze' | 'synthesize' | 'finalize';

export interface MixerStageEvent {
  stage: MixerStageId;
  label: string;
  index: number;
  total: number;
}

export interface MixerRadarLabel {
  id: MixerRadarAxisId;
  label: string;
}

export const MIXER_RADAR_LABELS: MixerRadarLabel[] = [
  { id: 'peer_strategic_shift', label: 'Peer 전략 전환' },
  { id: 'tech_investment', label: '기술 투자' },
  { id: 'market_position', label: '시장 포지션' },
  { id: 'partnership_momentum', label: '파트너십' },
  { id: 'regulatory_risk', label: '규제 리스크' },
  { id: 'talent_movement', label: '인재 이동' },
];
