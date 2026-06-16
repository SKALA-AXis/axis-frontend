import type { ExposureBand, PeerId, SectorId } from '../../features/card-news/model/cardNews';

export const cardNewsPeerLabels: Record<PeerId, string> = {
  samsung_sds: '삼성SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대오토에버',
  posco_dx: '포스코DX',
  industry_trend: 'industry',
};

export const cardNewsSectorLabels: Record<SectorId, string> = {
  ax: 'AX',
  security: '보안',
  infra: '인프라',
  deal: '수주',
  industry: 'industry',
  other: '기타',
};

export const cardNewsExposureLabels: Record<ExposureBand, string> = {
  high: 'High exposure',
  medium: 'Medium exposure',
  low: 'Low exposure',
};

export const cardNewsExecutiveDefaults = {
  peerLabel: '전체 Peer',
  exposureLabel: 'Watch',
  exposureScore: 74,
  trustScore: 86,
  financialNarrative: '재무 연결 정보는 상세 근거에서 확인하세요.',
} as const;

export const cardNewsPeerTitleAliases = [
  { token: '삼성', label: '삼성SDS' },
  { token: 'LG', label: 'LG CNS' },
  { token: '현대', label: '현대오토에버' },
  { token: '포스코', label: '포스코DX' },
] as const;
