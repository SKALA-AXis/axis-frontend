/*
 * 작성일: 2026-06-10
 * 작성자: 박진
 * 변경이력:
 *   2026-06-10 박진 — 챗봇 로직 수정 작업 중 카드뉴스 프레젠테이션 기본값 추가
 */
export const cardNewsPresentationDefaults = {
  peerCompany: '삼성SDS',
  sector: 'AX',
  sourceType: '뉴스',
  coverStyle: 'linear-gradient(180deg, rgba(37,37,40,0.55), rgba(17,17,17,0.82)), linear-gradient(135deg, #364153 0%, #111827 100%)',
  previewImageStyle: 'linear-gradient(135deg, rgba(248,249,251,0.92), rgba(232,236,242,0.74)), linear-gradient(125deg, #dbe3ef 0%, #edf2f7 100%)',
} as const;
