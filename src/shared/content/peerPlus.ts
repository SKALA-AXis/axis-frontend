/*
 * 작성일: 2026-05-15
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-15 최종민 — GlobalTrends 뷰 추가 및 전면 개편·Peer+ 글로벌 산업 탭 연동/사이드바 정리
 */
export type PeerPlusPeerId = 'samsung_sds' | 'lg_cns' | 'hyundai_autoever' | 'posco_dx';

export const peerPlusSelectionStorageKey = 'axis:peerPlus:selectedPeer';

export const peerPlusOptions = [
  { id: 'samsung_sds', label: '삼성 SDS' },
  { id: 'lg_cns', label: 'LG CNS' },
  { id: 'hyundai_autoever', label: '현대 오토에버' },
  { id: 'posco_dx', label: '포스코 DX' },
] as const satisfies ReadonlyArray<{ id: PeerPlusPeerId; label: string }>;
