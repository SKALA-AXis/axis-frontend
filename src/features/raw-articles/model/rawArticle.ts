/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 폴더 구조 재정리 시 원문 기사 타입 정의
 */
export interface RawArticle {
  id: number;
  title: string;
  url: string;
  sourceName: string;
  peerId: string;
  publishedAt: string;
  collectedAt: string;
  importanceLevel: 'urgent' | 'notable' | null;
}
