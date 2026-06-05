import { httpClient } from '../../../shared/api/httpClient';
import type { PeerOverviewData, PeerOverviewRow } from '../model/peerOverview';

export interface PeerOverviewRepository {
  getPeerOverview(): Promise<PeerOverviewData>;
}

class HttpPeerOverviewRepository implements PeerOverviewRepository {
  async getPeerOverview(): Promise<PeerOverviewData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const payload = await httpClient.get<unknown>('/api/monitoring/overview/peer-table');
    return normalizePeerOverviewData(payload);
  }
}

export const peerOverviewRepository: PeerOverviewRepository = new HttpPeerOverviewRepository();

function normalizePeerOverviewData(payload: unknown): PeerOverviewData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Peer overview payload is empty.');
  }

  const record = payload as Record<string, unknown>;
  const candidateRows = Array.isArray(record.rows)
    ? record.rows
    : Array.isArray((record.data as Record<string, unknown> | undefined)?.rows)
      ? ((record.data as Record<string, unknown>).rows as unknown[])
      : null;

  if (!candidateRows) {
    throw new Error('Peer overview payload does not contain rows.');
  }

  return {
    periodLabel: typeof record.periodLabel === 'string'
      ? record.periodLabel
      : typeof (record.data as Record<string, unknown> | undefined)?.periodLabel === 'string'
        ? ((record.data as Record<string, unknown>).periodLabel as string)
        : null,
    coverageLabel: pickString(record, 'coverageLabel') ?? '공통 분기 미확보',
    financialSourceLabel: pickString(record, 'financialSourceLabel') ?? '미확인',
    supplementalSourceLabel: pickString(record, 'supplementalSourceLabel') ?? '미확인',
    rows: candidateRows.map(normalizePeerOverviewRow),
  };
}

function normalizePeerOverviewRow(value: unknown): PeerOverviewRow {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: pickString(row, 'id') ?? '',
    label: pickString(row, 'label') ?? pickString(row, 'name') ?? '',
    revenueKrwBn: pickNumber(row, 'revenueKrwBn', 'revenue_krwbn'),
    revenueQoqPct: pickNumber(row, 'revenueQoqPct', 'revenue_qoq_pct'),
    operatingProfitKrwBn: pickNumber(row, 'operatingProfitKrwBn', 'operating_profit_krwbn'),
    operatingProfitQoqPct: pickNumber(row, 'operatingProfitQoqPct', 'operating_profit_qoq_pct'),
    netIncomeKrwBn: pickNumber(row, 'netIncomeKrwBn', 'net_income_krwbn'),
    operatingMarginPct: pickNumber(row, 'operatingMarginPct', 'operating_margin_pct'),
    operatingMarginQoqDeltaPctp: pickNumber(row, 'operatingMarginQoqDeltaPctp', 'operating_margin_qoq_delta_pctp'),
    axRevenueSharePct: pickNumber(row, 'axRevenueSharePct', 'ax_revenue_share_pct'),
    contractCount: pickInteger(row, 'contractCount', 'contract_count'),
    topKeyword: pickString(row, 'topKeyword', 'top_keyword'),
    dartRceptNo: pickString(row, 'dartRceptNo', 'dart_rcept_no'),
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
