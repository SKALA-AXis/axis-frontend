import type { CardNewsItem } from '../model/cardNews';

export type CardSourceOption = {
  id: string;
  title: string;
  meta: string;
  url: string;
};

/**
 * 카드의 원문 source 후보 목록 통합 — sources[] + evidence_chain.source_links + sourceUrl fallback.
 * URL 중복 제거. FloatingCardNewsOverlay 의 "원문 보기" 드롭다운에서 사용.
 */
export function getCardSourceOptions(card: CardNewsItem): CardSourceOption[] {
  const fromSources = (card.sources ?? []).map((source, index) => ({
    id: `source-${index}`,
    title: source.title || source.source_name || `원문 ${index + 1}`,
    meta: source.source_name ?? source.published_at ?? '',
    url: source.url,
  }));
  const fromEvidence = (card.evidence_chain?.source_links ?? [])
    .filter((source) => typeof source.url === 'string' && source.url.trim().length > 0)
    .map((source, index) => ({
      id: `evidence-${index}`,
      title: source.title || source.source_name || `관련 기사 ${index + 1}`,
      meta: source.source_name ?? '',
      url: source.url as string,
    }));
  const fallback = card.sourceUrl && card.sourceUrl !== '#'
    ? [{
        id: 'fallback',
        title: card.source || '대표 원문',
        meta: '',
        url: card.sourceUrl,
      }]
    : [];

  const seen = new Set<string>();
  return [...fromSources, ...fromEvidence, ...fallback].filter((item) => {
    if (!item.url || seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
}

/**
 * 카드 배열에서 ID 기준 중복 제거 (첫 등장 보존).
 */
export function dedupeCardsById(cards: CardNewsItem[]): CardNewsItem[] {
  const byId = new Map<string, CardNewsItem>();
  cards.forEach((card) => {
    if (!byId.has(card.id)) {
      byId.set(card.id, card);
    }
  });
  return Array.from(byId.values());
}
