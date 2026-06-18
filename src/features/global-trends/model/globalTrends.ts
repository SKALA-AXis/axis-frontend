/*
 * 작성일: 2026-05-15
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-15 최종민 — GlobalTrends 뷰 모델 신설 및 프론트 개편 반영
 *   2026-06-10 박진 — 챗봇 로직 관련 수정
 *   2026-06-12 박지원 — 글로벌 트렌드 브리핑 UI 개선 및 에이전트 요약/헤드라인 반영
 */
export type PeerAlignmentType = 'aligned' | 'lagging' | 'missing' | 'diverging';

export interface PeerAlignmentRow {
  peer_id: string;
  alignment_type: PeerAlignmentType;
  alignment_score?: number;
  peer_mention_count?: number;
  global_mention_count?: number;
  recency_gap_days?: number | null;
  evidence_card_ids?: string[];
  strategic_note?: string;
}

export interface ImpactMatrixCell {
  trend_theme?: string;
  sk_ax_line?: string;
  direction?: 'positive' | 'neutral' | 'negative';
  magnitude?: 'low' | 'medium' | 'high';
  channel?: string;
  quant_hint?: string | null;
  source_marker?: string;
}

export interface GlobalForecastRow {
  horizon?: '1Q' | '6M' | '1Y';
  scenario?: 'optimistic' | 'baseline' | 'pessimistic';
  narrative?: string;
  sk_ax_impact?: string;
  drivers?: string[];
  risk_level?: 'low' | 'medium' | 'high';
  recommended_response?: string;
}

export interface GlobalTrendEvidenceLink {
  title?: string;
  url?: string;
  source_name?: string;
  published_at?: string;
}

export interface GlobalCompanyMovement {
  company_id: string;
  headline?: string;
  summary?: string;
  evidence_titles?: string[];
  top_themes?: string[];
}

export type GlobalTrendDataSource = 'live';

export interface GlobalTrendItem {
  id: string;
  source_analysis_id?: string | null;
  trend_date: string;
  industry: string;
  region: string;
  keyword: string;
  keyword_category?: string | null;
  title?: string | null;
  summary?: string | null;
  mention_count: number;
  impact_score?: number | null;
  confidence?: number | null;
  related_peer_ids?: string[];
  related_card_ids?: string[];
  sk_ax_implication?: string | null;
  peer_alignment?: PeerAlignmentRow[];
  impact_matrix?: ImpactMatrixCell[];
  forecasts?: GlobalForecastRow[];
  final_one_liner?: string;
  overall_summary?: string;
  company_movements?: GlobalCompanyMovement[];
  evidence_source_links?: GlobalTrendEvidenceLink[];
  leading_companies?: string[];
  intensity?: string | null;
  frequency_delta_pct?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalTrendListResponse {
  items: GlobalTrendItem[];
  total: number;
  limit: number;
  offset: number;
  from: string;
  to: string;
  latest_trend_date?: string | null;
  warning?: string | null;
  _source?: GlobalTrendDataSource;
}

export interface GlobalTrendSnapshot {
  company_id: string;
  card_count: number;
  top_themes?: string[];
  headline_announcements?: Array<Record<string, unknown>>;
  source_marker?: string;
}

export interface TrendDetection {
  theme: string;
  frequency_delta_pct?: number;
  intensity?: 'weak' | 'moderate' | 'strong';
  leading_companies?: string[];
  evidence_card_ids?: string[];
  mention_count?: number;
}

export interface GlobalTrendsRunRequest {
  company_ids?: string[] | null;
  focus_themes?: string[] | null;
  window_days?: number;
  sk_ax_business_lines?: string[] | null;
  include_peer_alignment?: boolean;
  global_only?: boolean;
  min_mention_count?: number;
  max_trend_count?: number;
}

export interface GlobalTrendsRunResult {
  analysis_period?: Record<string, unknown>;
  snapshots?: GlobalTrendSnapshot[];
  trend_detections?: TrendDetection[];
  peer_alignment?: Record<string, PeerAlignmentRow[]>;
  impact_matrix?: ImpactMatrixCell[];
  forecasts?: GlobalForecastRow[];
  final_one_liner?: string;
  sk_ax_implication?: string;
  reasoning_steps?: Array<Record<string, unknown>>;
  confidence?: number;
  warning?: string | null;
  generated_at?: string;
  _source?: GlobalTrendDataSource;
}

export interface GlobalTrendsViewModel {
  list: GlobalTrendListResponse;
  latestRun: GlobalTrendsRunResult | null;
}
