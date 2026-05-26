/**
 * GlobalTrends 5-phase 분석 응답 — axis-ai `/global/trends/run` 출력 스키마.
 * spec: axis-ai/design/30-analysis/global-trends.md §5
 */

export interface GlobalSnapshot {
  company_id: string;
  card_count: number;
  top_themes: string[];
  headline_announcements: Array<{
    title: string;
    source?: string;
    source_tier?: string;
    card_id?: string;
    published_at_kst?: string | null;
  }>;
  source_marker: string;
}

export interface TrendDetection {
  theme: string;
  frequency_delta_pct: number;
  intensity: 'weak' | 'moderate' | 'strong';
  leading_companies: string[];
  evidence_card_ids: string[];
}

export interface SKAXImpactCell {
  trend_theme: string;
  sk_ax_line: string;
  direction: 'positive' | 'neutral' | 'negative';
  magnitude: 'low' | 'medium' | 'high';
  channel: string;
  quant_hint?: string | null;
  source_marker: string;
}

export interface GlobalForecast {
  horizon: '1Q' | '6M' | '1Y';
  scenario: 'optimistic' | 'baseline' | 'pessimistic';
  narrative: string;
  sk_ax_impact: string;
  drivers: string[];
  risk_level: 'low' | 'medium' | 'high';
  recommended_response: string;
}

export interface GTReasoningTrailItem {
  seq: number;
  label: string;
  one_liner: string;
  evidence_refs: string[];
  langfuse_observation_id?: string | null;
}

export interface GTCoTStep {
  step_idx: number;
  phase: 'snapshot' | 'trend_detect' | 'impact_map' | 'forecast' | 'synthesis';
  question: string;
  inputs_used: string[];
  answer: string;
  intermediate_conclusion: string;
  confidence: number;
  langfuse_observation_id?: string | null;
}

export interface GlobalTrendsResponse {
  analysis_period: Record<string, unknown>;
  snapshots: GlobalSnapshot[];
  trend_detections: TrendDetection[];
  impact_matrix: SKAXImpactCell[];
  forecasts: GlobalForecast[];
  final_one_liner: string;
  sk_ax_implication: string;
  follow_up_questions: string[];
  risk_assumptions: string[];
  reasoning_trail: GTReasoningTrailItem[];
  reasoning_steps: GTCoTStep[];
  langfuse_trace_id?: string | null;
  confidence: number;
  sources_used: string[];
  company_ids: string[];
  provenance: Record<string, unknown>;
  warning?: string | null;
}

/**
 * axis-backend `GET /api/global/trends/latest` 응답의 row 한 건.
 * `global_industry_trends` 테이블 + `payload` JSONB (snapshot/detection/impact/
 * forecast phase output) pass-through.
 *
 * spec: axis-ai/design/30-analysis/global-trends.md §7,
 *       axis-backend/dto/GlobalIndustryTrendResponse.java
 */
export interface GlobalIndustryTrendRow {
  id: string;
  trendDate: string;
  industry: string;
  region: string;
  keyword: string;
  keywordCategory?: string | null;
  title?: string | null;
  summary?: string | null;
  mentionCount: number;
  impactScore?: number | null;
  confidence?: number | null;
  relatedPeerIds: string[];
  relatedCardIds: string[];
  sourceRawArticleIds: number[];
  skAxImplication?: string | null;
  payload: Record<string, unknown>;
  sourceAnalysisId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
