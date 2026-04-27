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
