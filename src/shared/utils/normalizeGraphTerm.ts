/**
 * 그래프 키워드/노드 라벨 비교용 정규화 — 공백 제거 + 소문자.
 *
 * "Agentic AI" 와 "agentic ai" 와 "AgenticAI" 가 같은 노드로 매칭되도록 함.
 * PeerPlusView 의 키워드 클라우드 매칭 + KeywordGraphView 의 노드 클릭 매칭에서 공유.
 */
export function normalizeGraphTerm(value: string): string {
  return value.replace(/\s/g, '').toLowerCase();
}
