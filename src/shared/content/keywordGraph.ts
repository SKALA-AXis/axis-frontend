/*
 * 작성일: 2026-06-10
 * 작성자: 박진
 * 변경이력:
 *   2026-06-10 박진 — 챗봇 로직 수정 작업 중 키워드 그래프 타입/데이터 추가
 */
export type KeywordNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  category: '기업' | 'AX' | '보안' | '인프라' | '수주';
  score: number;
  changeRate: number;
  sourceType: string;
};

export type KeywordEdge = {
  source: string;
  target: string;
  weight: number;
  relationType: string;
};

export const graphCategoryColor: Record<KeywordNode['category'], string> = {
  기업: 'var(--axis-graph-company)',
  AX: 'var(--axis-graph-ax)',
  보안: 'var(--axis-graph-security)',
  인프라: 'var(--axis-graph-infra)',
  수주: 'var(--axis-graph-deal)',
};
