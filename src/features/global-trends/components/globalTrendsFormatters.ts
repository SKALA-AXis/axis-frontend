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

export const PEER_LABELS: Record<string, string> = {
  sk_ax: 'SK AX',
  samsung_sds: '삼성SDS',
  lg_cns: 'LG CNS',
  posco_dx: '포스코DX',
  hyundai_autoever: '현대오토에버',
};

export function peerLabel(peerId: string) {
  return PEER_LABELS[peerId.trim().toLowerCase()] ?? peerId;
}

export type AlignmentTone = 'success' | 'warning' | 'neutral' | 'danger';

export const ALIGNMENT_META: Record<string, { label: string; tone: AlignmentTone }> = {
  aligned: { label: '동행', tone: 'success' },
  lagging: { label: '추격', tone: 'warning' },
  missing: { label: '미대응', tone: 'neutral' },
  diverging: { label: '다른 방향', tone: 'danger' },
};

export type DeltaTone = 'up' | 'down' | 'flat';

export function deltaTone(value?: number | null): DeltaTone {
  if (value == null || Number.isNaN(value) || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

/** SK AX 행 우선 + alignment 심각도 순으로 peer 칩 정렬 */
const ALIGNMENT_ORDER: Record<string, number> = { diverging: 0, missing: 1, lagging: 2, aligned: 3 };

export function sortPeerAlignment<T extends { peer_id: string; alignment_type: string }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (left.peer_id === 'sk_ax') return -1;
    if (right.peer_id === 'sk_ax') return 1;
    return (ALIGNMENT_ORDER[left.alignment_type] ?? 9) - (ALIGNMENT_ORDER[right.alignment_type] ?? 9);
  });
}
