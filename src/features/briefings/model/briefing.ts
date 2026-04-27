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
  evidenceSources: string[];
  history: BriefingHistoryItem[];
}
