import type { DashboardKeywordSeries } from '../../../../../features/dashboard/model/dashboard';

const keywordSeriesFallbackColors = [
  'var(--axis-graph-ax)',
  'var(--axis-graph-security)',
  'var(--axis-graph-infra)',
  'var(--axis-graph-deal)',
] as const;

const backendKeywordColorMap = new Map([
  ['#ee7501', 'var(--axis-graph-ax)'],
  ['#1a3a91', 'var(--axis-graph-security)'],
  ['#e1002a', 'var(--axis-graph-infra)'],
  ['#111111', 'var(--axis-graph-deal)'],
]);

export const stockLegendItems = [
  {
    label: '삼성SDS',
    color: 'var(--axis-graph-company)',
  },
  {
    label: 'LG CNS',
    color: 'var(--axis-graph-infra)',
  },
  {
    label: '현대오토에버',
    color: 'var(--axis-graph-security)',
  },
  {
    label: '포스코DX',
    color: 'var(--axis-graph-deal)',
  },
] as const;

export function withResolvedKeywordSeriesColors(keywordSeries: DashboardKeywordSeries[]) {
  return keywordSeries.map((series, index) => ({
    ...series,
    color: resolveKeywordSeriesColor(series, index),
  }));
}

function resolveKeywordSeriesColor(series: DashboardKeywordSeries, index: number): string {
  const compactName = series.name.replace(/\s+/g, '').toLowerCase();
  if (compactName.includes('ax')) return 'var(--axis-graph-ax)';
  if (compactName.includes('보안') || compactName.includes('security')) return 'var(--axis-graph-security)';
  if (compactName.includes('인프라') || compactName.includes('infra')) return 'var(--axis-graph-infra)';
  if (compactName.includes('수주') || compactName.includes('deal')) return 'var(--axis-graph-deal)';

  const colorKey = series.color.trim().toLowerCase();
  return backendKeywordColorMap.get(colorKey)
    ?? keywordSeriesFallbackColors[index % keywordSeriesFallbackColors.length];
}

export function getSymmetricAxisRange(
  points: Array<Record<string, unknown>>,
  keys: string[],
  minimum: number,
  options: { padding?: number; scale?: number; step?: number } = {},
) {
  const step = options.step ?? 5;
  const padding = options.padding ?? 0;
  const scale = options.scale ?? 1;
  const axisAbsMax = points.reduce((max, point) => {
    const pointMax = keys.reduce((innerMax, key) => {
      const value = point[key];
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return innerMax;
      }
      return Math.max(innerMax, Math.abs(value));
    }, 0);
    return Math.max(max, pointMax);
  }, 0);
  return Math.max(minimum, Math.ceil(((axisAbsMax * scale) + padding) / step) * step);
}

export function formatStockPrice(value?: number | string | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toLocaleString('ko-KR')}원`;
}

export function formatStockRate(value?: number | string | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatKeywordRatio(value?: number | string | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return value.toFixed(2);
}

export function formatKeywordDelta(value?: number | string | null, fractionDigits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(fractionDigits)}pt`;
}

export function formatKeywordAxisTick(value: number) {
  if (Number.isInteger(value)) {
    return `${value}pt`;
  }
  return `${value.toFixed(1)}pt`;
}
