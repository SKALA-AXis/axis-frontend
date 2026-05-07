/**
 * Peer 별 시그니처 색상 — book spine, hero, citation 등에서 공통 사용.
 */

export type PeerTheme = {
  /** book spine / hero 등 큰 면적용 그라디언트 */
  hero: string;
  /** 단색 (작은 chip / dot 용) */
  solid: string;
  /** eyebrow / 강조 색 */
  accent: string;
  /** spine / hero 위 텍스트 색 */
  contrastInk: string;
};

export const peerThemes: Record<string, PeerTheme> = {
  samsung_sds: {
    hero: 'linear-gradient(135deg, #0A1A6B 0%, #1428A0 50%, #2438B5 100%)',
    solid: '#1428A0',
    accent: '#7A87E0',
    contrastInk: '#FFFFFF',
  },
  lg_cns: {
    hero: 'linear-gradient(135deg, #6B0021 0%, #A50034 50%, #B82A1F 100%)',
    solid: '#A50034',
    accent: '#F2C56B',
    contrastInk: '#FFFFFF',
  },
  hyundai_autoever: {
    hero: 'linear-gradient(135deg, #001433 0%, #002C5F 50%, #0E5C9A 100%)',
    solid: '#002C5F',
    accent: '#5891C6',
    contrastInk: '#FFFFFF',
  },
  posco_dx: {
    hero: 'linear-gradient(135deg, #00305C 0%, #005AAB 50%, #2B7AC2 100%)',
    solid: '#005AAB',
    accent: '#83BFE9',
    contrastInk: '#FFFFFF',
  },
  sk_ax: {
    hero: 'linear-gradient(135deg, #B00022 0%, #EA002C 50%, #DC5A24 100%)',
    solid: '#EA002C',
    accent: '#F2C56B',
    contrastInk: '#FFFFFF',
  },
  default: {
    hero: 'linear-gradient(135deg, #5A2A0F 0%, #B8451A 50%, #DC5A24 100%)',
    solid: '#B8451A',
    accent: '#F2C56B',
    contrastInk: '#FFFFFF',
  },
};

export function getPeerTheme(peerId?: string | null): PeerTheme {
  return peerThemes[peerId ?? 'default'] ?? peerThemes.default;
}
