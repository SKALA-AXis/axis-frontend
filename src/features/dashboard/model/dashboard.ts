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
