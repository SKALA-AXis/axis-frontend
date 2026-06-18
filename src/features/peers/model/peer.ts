/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트엔드 폴더 구조 재정리 시 Peer 데이터 타입 정의
 *   2026-05-07 박지원 — company tier 관련 필드 추가
 */
export type PeriodFilter = 'yearly' | 'quarterly' | 'monthly';

export interface PeerSummary {
  id: string;
  name: string;
  keywords: string[];
  priority: 'high' | 'medium';
  stats: {
    primary: number;
    watch: number;
    archive: number;
  };
  direction: string;
  implication: string;
}

export interface PeerAnalysis {
  source: string;
  title: string;
  summary: string;
  highlightsTitle: string;
  highlights: string[];
  pillars: Array<{
    name: string;
    details: string[];
  }>;
}

export interface PeersData {
  peers: PeerSummary[];
  periodLabels: Record<PeriodFilter, string>;
  periodDescriptions: Record<PeriodFilter, string>;
  analyses: Record<string, PeerAnalysis>;
}
