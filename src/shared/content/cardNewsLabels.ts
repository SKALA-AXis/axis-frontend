/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 작업 중 카드뉴스 라벨 추가
 *   2026-05-12 박진 — 섹터별 오류 수정
 *   2026-05-18 박지원 — credibility score UI 제거 및 industry trend 카드뉴스 라벨 지원
 *   2026-05-18 최종민 — 프론트 전면 개편(designing 통합·차트/routing/브리핑 흡수)에 맞춰 반영
 */
import type { ExposureBand, PeerId, SectorId } from '../../features/card-news/model/cardNews';

export const cardNewsPeerLabels: Record<PeerId, string> = {
  samsung_sds: '삼성SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대오토에버',
  posco_dx: '포스코DX',
  industry_trend: '산업 동향',
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
