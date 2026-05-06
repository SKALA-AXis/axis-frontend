export type CardNewsArticlePage = {
  title: string;
  paragraphs: string[];
};

export type CardNewsMediaAsset = {
  id: string;
  type: 'image';
  url: string;
  alt: string;
};

export type CardNewsTextField = {
  id: string;
  label: string;
  value: string;
};

export type CardNewsValueField = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
};

export type CardNewsDisplayEntry = {
  id: string;
  title: string;
  subtitle?: string;
  peerCompany?: string;
  sector?: string;
  sourceType?: string;
  badgeLabel?: string;
  displayDate?: string;
  coverStyle?: string;
  previewImageStyle?: string;
};

export type CardNewsItem = {
  id: string;
  category: string;
  date: string;
  title: string;
  coverImageUrl: string;
  coverImageAlt: string;
  summary: string[];
  articlePages: CardNewsArticlePage[];
  insights: string[];
  source: string;
  sourceUrl: string;
  detailTitle: string;
  detailDescription: string;
  detailPoints: string[];
  actionItems: string[];
  mediaAssets?: CardNewsMediaAsset[];
  textFields?: CardNewsTextField[];
  valueFields?: CardNewsValueField[];
  displayEntries?: CardNewsDisplayEntry[];
};
