const PEER_LOGOS: Record<string, string> = {
  samsung_sds: '/logos/samsung_sds.svg',
  lg_cns: '/logos/lg_cns.svg',
  hyundai_autoever: '/logos/hyundai_autoever.svg',
  posco_dx: '/logos/posco_dx.svg',
};

const DEFAULT_LOGO = '/logos/default.svg';

export function getPeerLogo(peerId?: string | null): string {
  if (!peerId) return DEFAULT_LOGO;
  return PEER_LOGOS[peerId] ?? DEFAULT_LOGO;
}

const PEER_LABELS: Record<string, string> = {
  samsung_sds: 'Samsung SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대오토에버',
  posco_dx: 'POSCO DX',
};

export function getPeerLabel(peerId?: string | null): string {
  if (!peerId) return 'AXIS';
  return PEER_LABELS[peerId] ?? peerId;
}
