/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 폴더 구조 재정리 과정에서 Issue 엔티티 모델 정의
 */
export type IssueImportance = 'urgent' | 'notable' | 'reference';

export interface Issue {
  id: string;
  peerId: string;
  peerName: string;
  title: string;
  summaryLines: string[];
  importance: IssueImportance;
  createdAt: string;
  sourceUrl?: string;
}
