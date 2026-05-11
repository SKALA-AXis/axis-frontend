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
  time: string;
  [key: string]: number | string;
}

export interface DashboardKeywordSeries {
  key: string;
  name: string;
  color: string;
  total: string;
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

export interface DashboardData {
  trends: DashboardTrend[];
  articles: DashboardArticle[];
  keywords: DashboardKeyword[];
  keywordSearchPoints: DashboardKeywordSearchPoint[];
  keywordSeries: DashboardKeywordSeries[];
  stockPoints: DashboardStockPoint[];
  notifications: DashboardNotification[];
  keywordNewsCount: string;
}
