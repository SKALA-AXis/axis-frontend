export interface DashboardTrend {
  peer: string;
  title: string;
  reason: string;
  reviewLevel: 'primary' | 'watch';
  status: string;
}

export interface DashboardArticle {
  peer: string;
  title: string;
  source: string;
  publishedAt: string;
  note: string;
}

export interface DashboardKeyword {
  text: string;
  type: 'tech' | 'org' | 'place';
  size: string;
  x: string;
  y: string;
}

export interface DashboardKeywordSearchPoint {
  date: string;
  [key: string]: number | string;
}

export interface DashboardKeywordSeries {
  key: string;
  name: string;
  color: string;
  total: string;
}

export interface DashboardKeywordInsight {
  key: string;
  time: string;
  title: string;
  valueLabel: string;
  reason: string;
  skAxPoint: string;
  evidence?: Array<Record<string, unknown>>;
}

export interface DashboardNotification {
  title: string;
  detail: string;
  time: string;
  tone: 'urgent' | 'info';
}

export interface DashboardStockPoint {
  date: string;
  samsungSds: number;
  lgCns: number;
  hyundaiAutoever: number;
  poscoDx: number;
}

export interface DashboardStockRatePoint {
  date: string;
  samsungSds: number | null;
  lgCns: number | null;
  hyundaiAutoever: number | null;
  poscoDx: number | null;
}

export interface DashboardStockSource {
  basis: 'day_over_day_pct';
  windowDays: number;
  sourceName: string | null;
  exchange: string | null;
  currency: string | null;
  isMock: boolean;
  label: string;
}

export interface DashboardDartChartPoint {
  label: string;
  value: number;
  unit: string;
  color: string;
}

export interface DashboardDartRadarMetric {
  axis: string;
  metric: string;
  actualValuePct: number;
  displayValue: string;
  score: number;
}

export interface DashboardDartSummary {
  peerId: string;
  corpName: string;
  period: string;
  periodType: string;
  reportName: string;
  publishedAt: string;
  revenueTotalKrwBn: number;
  operatingProfitKrwBn: number;
  operatingMarginPct: number;
  netMarginPct?: number;
  debtRatioPct?: number;
  cashRatioPct?: number;
  intangibleAssetRatioPct?: number;
  capexRatioPct?: number;
  documentTableCount: number;
  documentImageCount: number;
  chartPoints: DashboardDartChartPoint[];
  radarMetrics?: DashboardDartRadarMetric[];
}

export interface DashboardData {
  trends: DashboardTrend[];
  articles: DashboardArticle[];
  keywords: DashboardKeyword[];
  keywordSearchPoints: DashboardKeywordSearchPoint[];
  keywordSeries: DashboardKeywordSeries[];
  keywordInsights?: DashboardKeywordInsight[];
  stockPoints: DashboardStockPoint[];
  stockRatePoints?: DashboardStockRatePoint[];
  stockSource?: DashboardStockSource | null;
  notifications: DashboardNotification[];
  keywordNewsCount: string;
  dartSummary?: DashboardDartSummary | null;
}

export interface DashboardKeywordTrendsData {
  keywordSearchPoints: DashboardKeywordSearchPoint[];
  keywordSeries: DashboardKeywordSeries[];
  keywordInsights?: DashboardKeywordInsight[];
  sourceName?: string | null;
  cachedAt?: string | null;
  stale?: boolean;
}

export interface TodayInsightReasoningStep {
  stage: string;
  detail: string;
}

export interface TodayInsightEvidence {
  grounds: string[];
  changes: string[];
  related_keywords?: string[];
  relatedKeywords?: string[];
  source_ids?: string[];
  sourceIds?: string[];
}

export interface TodayInsightSignal {
  id: string;
  label: string;
  value: string;
  reasoning: TodayInsightReasoningStep[];
  evidence: TodayInsightEvidence;
}

export interface TodayInsightAction {
  action: string;
  decision_owner?: string;
  decisionOwner?: string;
  time_horizon?: string;
  timeHorizon?: string;
  rationale: string;
  evidence_refs?: string[];
  evidenceRefs?: string[];
}

export interface TodayInsightSource {
  id: string;
  title: string;
  source_name?: string;
  sourceName?: string;
  publisher?: string;
  url?: string;
  published_at?: string | null;
  publishedAt?: string | null;
}

export interface TodayInsightSourceTrace {
  source_integrated_issue_id?: string;
  sourceIntegratedIssueId?: string;
  source_card_id?: string;
  sourceCardId?: string;
  source_raw_article_ids?: string[];
  sourceRawArticleIds?: string[];
  title?: string;
  url?: string;
}

export interface TodayInsightChangeSummary {
  label: string;
  value: string;
}

export interface TodayInsightKeywordTrend {
  metric: string;
  group_name: string;
  latest_period?: string;
  latest_ratio?: number | null;
  prev_ratio?: number | null;
  ratio_delta?: number | null;
  source?: string;
  note?: string;
}

export interface TodayInsightSalienceItem {
  id?: string;
  kind?: string;
  title?: string;
  label?: string;
  salience_score?: number;
  exposure_score?: number;
  narrative_hint?: string;
}

export interface TodayInsightComparisonFacts {
  coverage?: {
    hidden_gem_count?: number;
    keyword_trends?: number;
    mode?: string;
  };
  keyword_trends?: TodayInsightKeywordTrend[];
  visibility_gaps?: TodayInsightSalienceItem[];
  primary_selection?: {
    must_include_hidden_gem?: boolean;
    items?: TodayInsightSalienceItem[];
  };
  structural?: Array<Record<string, unknown>>;
}

export interface TodayInsightSection {
  id: string;
  label: string;
  title?: string;
  summary?: string;
  reasoning?: TodayInsightReasoningStep[];
  evidence?: TodayInsightEvidence;
  response_direction?: TodayInsightAction[];
  responseDirection?: TodayInsightAction[];
  sources?: TodayInsightSource[];
  source_trace?: TodayInsightSourceTrace[];
  sourceTrace?: TodayInsightSourceTrace[];
}

export interface TodayInsightData {
  report_date: string;
  generated_at: string;
  headline: string;
  executive_summary: string;
  executive_implication?: string;
  change_summary?: TodayInsightChangeSummary[];
  comparison_facts?: TodayInsightComparisonFacts;
  insight_sections?: TodayInsightSection[];
  insightSections?: TodayInsightSection[];
  signals: TodayInsightSignal[];
  response_direction?: TodayInsightAction[];
  sources?: TodayInsightSource[];
  source_trace?: TodayInsightSourceTrace[];
  sourceTrace?: TodayInsightSourceTrace[];
  source_integrated_issue_ids?: string[];
  source_card_ids?: string[];
  peer_ids?: string[];
  sectors?: string[];
  confidence?: number;
  provenance?: Record<string, unknown>;
  warning?: string | null;
}

export interface TodayInsightWarmupResult {
  status: string;
  anchor_date: string;
  refresh_policy: string;
}
