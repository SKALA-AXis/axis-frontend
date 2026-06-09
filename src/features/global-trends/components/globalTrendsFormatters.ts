import type { GlobalTrendItem, TrendDetection } from '../model/globalTrends';

export const MAX_TREND_KEYWORDS = 10;

export const GLOBAL_COMPANY_LABELS: Record<string, string> = {
  nvidia: '엔비디아',
  apple: '애플',
  microsoft: '마이크로소프트',
  google: '구글',
  amazon: '아마존',
  meta: '메타',
};

const CATEGORY_LABELS: Record<string, string> = {
  ai_tech: 'AI·기술',
  infra: '인프라',
  cloud: '클라우드',
  security: '보안',
  data: '데이터',
  legacy: '레거시',
  legacy_ledger: '과거 분석',
};

const INTENSITY_LABELS: Record<string, string> = {
  strong: '강함',
  moderate: '보통',
  weak: '약함',
};

export function companyLabel(companyId: string) {
  const normalized = companyId.trim().toLowerCase();
  return GLOBAL_COMPANY_LABELS[normalized] ?? companyId;
}

export function categoryLabel(category?: string | null) {
  if (!category) return 'IT 트렌드';
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ');
}

export function intensityLabel(intensity?: string | null) {
  if (!intensity) return '보통';
  return INTENSITY_LABELS[intensity] ?? intensity;
}

export function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}%`;
}

export function formatTrendDelta(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '변화율 데이터 없음';
  if (value === 0) return '이전 기간과 유사';
  const sign = value > 0 ? '+' : '';
  return `이전 기간 대비 언급 ${sign}${Math.round(value)}%`;
}

export function trendTitle(item: Pick<GlobalTrendItem, 'title' | 'keyword'>) {
  return item.title ?? item.keyword.replace(/_/g, ' ');
}

export function rankTrendItems(items: GlobalTrendItem[]) {
  return [...items]
    .sort((left, right) => {
      const leftScore = left.impact_score ?? left.mention_count ?? 0;
      const rightScore = right.impact_score ?? right.mention_count ?? 0;
      return rightScore - leftScore;
    })
    .slice(0, MAX_TREND_KEYWORDS);
}

export function rankTrendShifts(items: GlobalTrendItem[]) {
  return [...items]
    .sort((left, right) => {
      const leftDelta = Math.abs(left.frequency_delta_pct ?? 0);
      const rightDelta = Math.abs(right.frequency_delta_pct ?? 0);
      if (rightDelta !== leftDelta) return rightDelta - leftDelta;
      return (right.mention_count ?? 0) - (left.mention_count ?? 0);
    })
    .slice(0, MAX_TREND_KEYWORDS);
}

export function buildDetectionsFromItems(items: GlobalTrendItem[]): TrendDetection[] {
  return rankTrendItems(items).map((item) => ({
    theme: trendTitle(item),
    mention_count: item.mention_count,
    intensity: (item.intensity as TrendDetection['intensity']) ?? 'moderate',
    leading_companies: item.leading_companies ?? [],
    frequency_delta_pct: item.frequency_delta_pct ?? 0,
  }));
}

export function formatLeadingCompanies(companies?: string[]) {
  if (!companies || companies.length === 0) return null;
  return companies.map(companyLabel).join(' · ');
}
