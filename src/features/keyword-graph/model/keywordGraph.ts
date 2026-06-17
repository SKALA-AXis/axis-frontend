import type { CardNewsItem } from '../../card-news/model/cardNews';
import type { KeywordEdge, KeywordNode } from '../../../shared/content/keywordGraph';

export type KeywordGraphPayload = {
  selectedId?: string;
  nodes?: Array<Partial<KeywordNode>>;
  edges?: Array<Partial<KeywordEdge>>;
};

export type KeywordGraphCardsPayload = {
  items?: Array<Partial<CardNewsItem>>;
  total?: number;
};
