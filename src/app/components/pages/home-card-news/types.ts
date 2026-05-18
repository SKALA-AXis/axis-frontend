import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';

export type GraphNodeKind = 'root' | 'peer' | 'keyword';

export type GraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  color: string;
  cards: CardNewsItem[];
};

export type GraphLink = {
  source: string;
  target: string;
};

export type ShareTargetId = 'copy' | 'mail' | 'native';
