export const mockAdminPeers = [
  { id: 'samsung_sds', name: '삼성SDS', status: 'active', keywords: '삼성SDS, Samsung SDS' },
  { id: 'lg_cns', name: 'LG CNS', status: 'active', keywords: 'LG CNS, LGCNS' },
  { id: 'hyundai_autoever', name: '현대오토에버', status: 'active', keywords: '현대오토에버, AutoEver' },
  { id: 'posco_dx', name: '포스코DX', status: 'active', keywords: '포스코DX, POSCO DX' },
];

export const mockAdminSources = [
  { id: 'rss-news', name: '산업 뉴스 RSS', type: 'rss', status: 'active', lastRun: '2026-05-04 08:10' },
  { id: 'dart', name: 'DART 공시', type: 'dart', status: 'active', lastRun: '2026-05-04 08:18' },
  { id: 'ir-pdf', name: 'IR PDF', type: 'ir_pdf', status: 'active', lastRun: '2026-05-03 19:30' },
  { id: 'jobspy', name: '채용 공고', type: 'jobspy', status: 'paused', lastRun: '2026-05-02 07:30' },
];

export const mockAdminPrompts = [
  { id: 'prompt-classification-v3', name: '본문 라벨링', agent: 'classification', version: 'v3.0' },
  { id: 'prompt-summary-v3', name: '카드 요약', agent: 'summary', version: 'v3.0' },
  { id: 'prompt-implication-v3', name: 'SK AX 시사점', agent: 'implication', version: 'v3.0' },
  { id: 'prompt-validation-v3', name: 'Evidence 검증', agent: 'validation', version: 'v3.0' },
];

export const mockAdminSchedulerJobs = [
  { id: 'collection-daily', name: 'Collection', pipeline: 'collection', cron: '0 15 8 * * MON-FRI', status: 'active' },
  { id: 'analysis-daily', name: 'Analysis', pipeline: 'analysis', cron: '0 30 8 * * MON-FRI', status: 'active' },
  { id: 'delivery-daily', name: 'Delivery', pipeline: 'delivery', cron: '0 50 8 * * MON-FRI', status: 'active' },
];

export const mockAdminAuditLogs = [
  { id: 1, user: 'admin@skax.com', action: 'prompt.update', resource: 'prompt-summary-v3', ip: '121.168.25.41', at: '2026-05-04 09:30' },
  { id: 2, user: 'strategy@skax.com', action: 'card.share', resource: 'CN-20260502-001', ip: '121.168.25.41', at: '2026-05-04 09:12' },
  { id: 3, user: 'system', action: 'pipeline.trigger', resource: 'collection-daily', ip: 'internal', at: '2026-05-04 08:15' },
];
