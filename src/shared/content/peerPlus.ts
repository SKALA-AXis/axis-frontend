export type PeerPlusPeerId = 'samsung_sds' | 'lg_cns' | 'hyundai_autoever' | 'posco_dx';

export const peerPlusSelectionStorageKey = 'axis:peerPlus:selectedPeer';

export const peerPlusOptions = [
  { id: 'samsung_sds', label: '삼성 SDS' },
  { id: 'lg_cns', label: 'LG CNS' },
  { id: 'hyundai_autoever', label: '현대 오토에버' },
  { id: 'posco_dx', label: '포스코 DX' },
] as const satisfies ReadonlyArray<{ id: PeerPlusPeerId; label: string }>;
