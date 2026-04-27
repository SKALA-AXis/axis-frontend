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
