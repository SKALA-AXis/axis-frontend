import { httpClient } from '../../../shared/api/httpClient';
import type { PeerAnalysisTraceItem, PeerComparisonInsightItem, PeerOverviewData, PeerOverviewRow, PeerSwotInsightItem } from '../model/peerOverview';

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
    comparisonInsights: normalizeComparisonInsights(
      record.comparisonInsights ?? (record.data as Record<string, unknown> | undefined)?.comparisonInsights
    ),
    swotInsights: normalizeSwotInsights(
      record.swotInsights ?? (record.data as Record<string, unknown> | undefined)?.swotInsights
    ),
    analysisTraces: normalizeAnalysisTraces(
      record.analysisTraces ?? (record.data as Record<string, unknown> | undefined)?.analysisTraces
    ),
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
    netIncomeQoqPct: pickNumber(row, 'netIncomeQoqPct', 'net_income_qoq_pct'),
    operatingMarginPct: pickNumber(row, 'operatingMarginPct', 'operating_margin_pct'),
    operatingMarginQoqDeltaPctp: pickNumber(row, 'operatingMarginQoqDeltaPctp', 'operating_margin_qoq_delta_pctp'),
    axRevenueSharePct: pickNumber(row, 'axRevenueSharePct', 'ax_revenue_share_pct'),
    topKeyword: pickString(row, 'topKeyword', 'top_keyword'),
    businessKeyword: pickString(row, 'businessKeyword', 'business_keyword'),
    technologyKeyword: pickString(row, 'technologyKeyword', 'technology_keyword'),
    topKeywordReason: pickString(row, 'topKeywordReason', 'top_keyword_reason'),
    topKeywordBasis: pickString(row, 'topKeywordBasis', 'top_keyword_basis'),
    topKeywordScore: pickNumber(row, 'topKeywordScore', 'top_keyword_score'),
    topKeywordEvidence: pickStringArray(row, 'topKeywordEvidence', 'top_keyword_evidence'),
    topKeywordEvidenceUrls: pickStringArray(row, 'topKeywordEvidenceUrls', 'top_keyword_evidence_urls'),
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

function pickStringArray(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }
  return [];
}

function normalizeComparisonInsights(value: unknown): Record<string, PeerComparisonInsightItem[]> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const result: Record<string, PeerComparisonInsightItem[]> = {};
  for (const [key, rawItems] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(rawItems)) continue;
    const items = rawItems
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        const label = pickString(record, 'label');
        const body = pickString(record, 'body');
        if (!isComparisonInsightLabel(label) || !body) return null;
        const reasoningSummary = pickString(record, 'reasoningSummary', 'reasoning_summary');
        const evidenceSummary = pickString(record, 'evidenceSummary', 'evidence_summary');
        return {
          label,
          body,
          ...(reasoningSummary ? { reasoningSummary } : {}),
          ...(evidenceSummary ? { evidenceSummary } : {}),
        };
      })
      .filter((item): item is PeerComparisonInsightItem => item !== null);
    if (items.length > 0) {
      result[key] = items;
    }
  }

  return result;
}

function isComparisonInsightLabel(value: string | null): value is PeerComparisonInsightItem['label'] {
  return value === '포지셔닝' || value === '사업 신호' || value === '기술 신호' || value === '리스크';
}

function normalizeSwotInsights(value: unknown): Record<string, PeerSwotInsightItem[]> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const result: Record<string, PeerSwotInsightItem[]> = {};
  for (const [key, rawItems] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(rawItems)) continue;
    const items = rawItems
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        const label = pickString(record, 'label');
        const body = pickString(record, 'body');
        if (!isSwotInsightLabel(label) || !body) return null;
        const normalized: PeerSwotInsightItem = {
          label,
          body,
        };
        const title = pickString(record, 'title');
        const reasoningSummary = pickString(record, 'reasoningSummary', 'reasoning_summary');
        const evidenceSummary = pickString(record, 'evidenceSummary', 'evidence_summary');
        if (title) normalized.title = title;
        if (reasoningSummary) normalized.reasoningSummary = reasoningSummary;
        if (evidenceSummary) normalized.evidenceSummary = evidenceSummary;
        return normalized;
      })
      .filter((item): item is PeerSwotInsightItem => item !== null);
    if (items.length > 0) {
      result[key] = items;
    }
  }

  return result;
}

function isSwotInsightLabel(value: string | null): value is PeerSwotInsightItem['label'] {
  return value === 'Strength' || value === 'Weakness' || value === 'Opportunity' || value === 'Threat';
}

function normalizeAnalysisTraces(value: unknown): Record<string, PeerAnalysisTraceItem[]> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const result: Record<string, PeerAnalysisTraceItem[]> = {};
  for (const [key, rawItems] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(rawItems)) continue;
    const items = rawItems
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        const label = pickString(record, 'label', 'step');
        const body = pickString(record, 'body', 'summary');
        const reasoning = pickString(record, 'reasoning', 'reasoningSummary', 'reasoning_summary', 'interpretation');
        const evidence = pickString(record, 'evidence', 'evidenceSummary', 'evidence_summary', 'basis', 'sourceSummary', 'source_summary');
        if (!label || (!body && !reasoning && !evidence)) return null;
        return {
          label,
          body: body ?? reasoning ?? evidence ?? '',
          ...(reasoning ? { reasoning } : {}),
          ...(evidence ? { evidence } : {}),
        };
      })
      .filter((item): item is PeerAnalysisTraceItem => item !== null);
    if (items.length > 0) {
      result[key] = items;
    }
  }

  return result;
}
