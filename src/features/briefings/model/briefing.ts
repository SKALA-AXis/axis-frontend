/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재구성 과정에서 브리핑 모델 정리
 *   2026-06-12 박진 — 생성 브리핑 UI 연결에 맞춰 모델 보강
 */
export interface BriefingHistoryItem {
  id: string;
  date: string;
  title: string;
  status: 'delivered';
  summary: string;
  primaryCount: number;
  watchCount: number;
  evidence: string[];
}

export interface BriefingSectionItem {
  headline: string;
  source: string;
}

export interface BriefingSection {
  title: string;
  items: BriefingSectionItem[];
}

export interface BriefingSnapshot {
  title: string;
  summary: string;
  sections: BriefingSection[];
}

export interface BriefingsData {
  dailySnapshot: BriefingSnapshot;
  weeklySnapshot: BriefingSnapshot;
  monthlySnapshot: BriefingSnapshot;
  evidenceSources: string[];
  history: BriefingHistoryItem[];
}
