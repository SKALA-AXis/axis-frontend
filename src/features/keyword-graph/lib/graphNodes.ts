import type { KeywordEdge, KeywordNode } from '../../../shared/content/keywordGraph';

// 키워드 그래프 카테고리 상수 + API payload → 모델 정규화 (refactoring P2).
// KeywordGraphView 에서 컴포넌트와 정규화기가 공유하던 카테고리 목록을 단일 출처로 모음.

export const graphCategories = ['AX', '보안', '인프라', '수주'] as const;
export const allGraphCategories = ['기업', ...graphCategories] as const;

/** API 노드(부분형) → KeywordNode. id/label 없으면 null, 좌표/크기 등 기본값 채움. */
export function normalizeKeywordGraphNode(node: Partial<KeywordNode>, index: number): KeywordNode | null {
  if (!node.id || !node.label) return null;
  const category = allGraphCategories.includes(node.category as KeywordNode['category'])
    ? node.category as KeywordNode['category']
    : 'AX';
  return {
    id: node.id,
    label: node.label,
    x: typeof node.x === 'number' ? node.x : 450 + Math.cos(index) * 180,
    y: typeof node.y === 'number' ? node.y : 280 + Math.sin(index) * 180,
    size: typeof node.size === 'number' ? node.size : 18,
    category,
    score: typeof node.score === 'number' ? node.score : 0,
    changeRate: typeof node.changeRate === 'number' ? node.changeRate : 0,
    sourceType: node.sourceType ?? 'raw_articles',
  };
}

/** API 엣지(부분형) → KeywordEdge. source/target 없으면 null, weight/relationType 기본값. */
export function normalizeKeywordGraphEdge(edge: Partial<KeywordEdge>): KeywordEdge | null {
  if (!edge.source || !edge.target) return null;
  return {
    source: edge.source,
    target: edge.target,
    weight: typeof edge.weight === 'number' ? edge.weight : 2,
    relationType: edge.relationType ?? '관련 기사',
  };
}
