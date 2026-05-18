import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getPeerLabel, getSuggestedActions } from '../../../../features/card-news/mappers/cardNewsExecutive';

import { keywordCategories, keywordKeys, keywordPalette } from './constants';
import type { GraphLink, GraphNode } from './types';

export function buildGraph(cards: CardNewsItem[]) {
  const nodes: GraphNode[] = [
    {
      id: 'root',
      label: 'AXIS',
      kind: 'root',
      color: '#ffffff',
      cards,
    },
  ];
  const links: GraphLink[] = [];
  const peerMap = new Map<string, CardNewsItem[]>();
  const keywordMap = new Map<string, CardNewsItem[]>();

  for (const key of keywordKeys) {
    keywordMap.set(`keyword:${key}`, []);
  }

  for (const card of cards) {
    const peerId = card.peer_id ? `peer:${card.peer_id}` : `peer:${getPeerLabel(card)}`;
    peerMap.set(peerId, [...(peerMap.get(peerId) ?? []), card]);

    for (const keyword of keywordKeys) {
      if (cardMatchesKeyword(card, keyword)) {
        const keywordId = `keyword:${keyword}`;
        keywordMap.set(keywordId, [...(keywordMap.get(keywordId) ?? []), card]);
      }
    }
  }

  Array.from(peerMap.entries()).forEach(([id, peerCards], index) => {
    nodes.push({
      id,
      label: getPeerLabel(peerCards[0]),
      kind: 'peer',
      color: keywordPalette[index % keywordPalette.length],
      cards: peerCards,
    });
    links.push({ source: 'root', target: id });
  });

  Array.from(keywordMap.entries()).forEach(([id, keywordCards], index) => {
    const categoryKey = id.replace('keyword:', '');
    const category = keywordCategories[categoryKey];
    nodes.push({
      id,
      label: category?.name_ko ?? categoryKey,
      kind: 'keyword',
      color: keywordPalette[(index + 2) % keywordPalette.length],
      cards: keywordCards,
    });
    links.push({ source: 'root', target: id });

    if (keywordCards.length > 0) {
      const peers = new Set(keywordCards.map((card) => (card.peer_id ? `peer:${card.peer_id}` : `peer:${getPeerLabel(card)}`)));
      peers.forEach((peerId) => links.push({ source: peerId, target: id }));
    }
  });

  return { nodes, links };
}

export function cardMatchesKeyword(card: CardNewsItem, categoryKey: string) {
  const text = [
    card.title,
    card.subtitle,
    card.category,
    card.category_label,
    ...card.summary,
    ...(card.summary_lines ?? []),
    ...getSuggestedActions(card),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const category = keywordCategories[categoryKey];
  if (!category) return false;

  return category.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
