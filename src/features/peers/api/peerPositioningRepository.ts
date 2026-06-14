import { httpClient } from '../../../shared/api/httpClient';
import type { PeerPositioningData, PeerPositioningPoint } from '../model/peerPositioning';

export interface PeerPositioningRepository {
  getPeerPositioning(): Promise<PeerPositioningData>;
}

class HttpPeerPositioningRepository implements PeerPositioningRepository {
  async getPeerPositioning(): Promise<PeerPositioningData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const payload = await httpClient.get<unknown>('/api/monitoring/overview/positioning');
    return normalizePeerPositioningData(payload);
  }
}

export const peerPositioningRepository: PeerPositioningRepository = new HttpPeerPositioningRepository();

function normalizePeerPositioningData(payload: unknown): PeerPositioningData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Peer positioning payload is empty.');
  }

  const record = payload as Record<string, unknown>;
  const nestedData = record.data as Record<string, unknown> | undefined;
  const candidatePoints = Array.isArray(record.points)
    ? record.points
    : Array.isArray(nestedData?.points)
      ? (nestedData.points as unknown[])
      : null;

  if (!candidatePoints) {
    throw new Error('Peer positioning payload does not contain points.');
  }

  return {
    periodLabel: pickString(record, 'periodLabel') ?? pickString(nestedData ?? {}, 'periodLabel'),
    coverageLabel: pickString(record, 'coverageLabel') ?? pickString(nestedData ?? {}, 'coverageLabel') ?? '공통 분기 미확보',
    financialSourceLabel: pickString(record, 'financialSourceLabel') ?? pickString(nestedData ?? {}, 'financialSourceLabel') ?? '미확인',
    xAxisLabel: pickString(record, 'xAxisLabel') ?? pickString(nestedData ?? {}, 'xAxisLabel') ?? '사업 규모',
    yAxisLabel: pickString(record, 'yAxisLabel') ?? pickString(nestedData ?? {}, 'yAxisLabel') ?? '매출 성장률',
    referenceRevenueKrwBn: pickNumber(record, 'referenceRevenueKrwBn', 'reference_revenue_krwbn')
      ?? pickNumber(nestedData ?? {}, 'referenceRevenueKrwBn', 'reference_revenue_krwbn')
      ?? 30000,
    referenceGrowthPct: pickNumber(record, 'referenceGrowthPct', 'reference_growth_pct')
      ?? pickNumber(nestedData ?? {}, 'referenceGrowthPct', 'reference_growth_pct')
      ?? 5,
    dataUpdatedAt: pickString(record, 'dataUpdatedAt', 'data_updated_at')
      ?? pickString(nestedData ?? {}, 'dataUpdatedAt', 'data_updated_at'),
    points: candidatePoints.map(normalizePeerPositioningPoint),
  };
}

function normalizePeerPositioningPoint(value: unknown): PeerPositioningPoint {
  const point = (value ?? {}) as Record<string, unknown>;
  return {
    id: pickString(point, 'id') ?? '',
    label: pickString(point, 'label', 'name') ?? '',
    periodLabel: pickString(point, 'periodLabel', 'period_label'),
    x: pickNumber(point, 'x'),
    y: pickNumber(point, 'y'),
    revenueKrwBn: pickNumber(point, 'revenueKrwBn', 'revenue_krwbn'),
    revenueYoyPct: pickNumber(point, 'revenueYoyPct', 'revenue_yoy_pct'),
    revenueSourceType: pickString(point, 'revenueSourceType', 'revenue_source_type'),
    revenueYoySourceType: pickString(point, 'revenueYoySourceType', 'revenue_yoy_source_type'),
    revenueConfidence: pickNumber(point, 'revenueConfidence', 'revenue_confidence'),
    revenueYoyConfidence: pickNumber(point, 'revenueYoyConfidence', 'revenue_yoy_confidence'),
    revenueArticleId: pickInteger(point, 'revenueArticleId', 'revenue_article_id'),
    revenueYoyArticleId: pickInteger(point, 'revenueYoyArticleId', 'revenue_yoy_article_id'),
    isSelf: Boolean(point.isSelf ?? point.is_self),
  };
}

function pickString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function pickInteger(record: Record<string, unknown>, ...keys: string[]) {
  const value = pickNumber(record, ...keys);
  return value == null ? null : Math.trunc(value);
}
