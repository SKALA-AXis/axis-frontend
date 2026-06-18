/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 과정에서 Peer사별 테마 색상 정의 추가
 */
export type PeerTheme = {
  hero: string;
  solid: string;
  accent: string;
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
