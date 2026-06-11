/**
 * 카드뉴스 카테고리별 큐레이션된 Unsplash 이미지 풀.
 * 모든 photo ID 는 Unsplash License (CC0 류, 상업 사용 가능) 으로 검증됨.
 * card.sector / card.category 를 기반으로 deterministic 하게 1장 매핑.
 */
import type { CardNewsItem } from './model/cardNews';
import { cardImagePool, type CuratedImage, type ImageCategory } from '../../shared/content/cardImagePool';
export type { CuratedImage } from '../../shared/content/cardImagePool';

/* card.sector / category 를 image category 로 ───────────── */
function pickImageCategory(card: CardNewsItem): ImageCategory {
  if (card.sector === 'ax') return 'ax';
  if (card.sector === 'security') return 'security';
  if (card.sector === 'infra') return 'infra';
  if (card.sector === 'deal') return 'deals';

  const cat = `${card.category_label ?? ''} ${card.category ?? ''}`;
  if (/AX|AI|디지털|섹터/i.test(cat)) return 'ax';
  if (/보안|cyber|security/i.test(cat)) return 'security';
  if (/인프라|클라우드|데이터센터|infra/i.test(cat)) return 'infra';
  if (/수주|계약|딜|deal|peer|파트너십/i.test(cat)) return 'deals';

  return 'ax';
}

/* card.id 의 stable hash → 같은 카드는 항상 같은 이미지 ── */
function hashIndex(id: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % mod;
}

export function getCardImage(card: CardNewsItem): CuratedImage {
  const category = pickImageCategory(card);
  const pool = cardImagePool[category];
  return pool[hashIndex(card.id, pool.length)];
}

/* Unsplash CDN URL builder ─────────────────────────────── */
export function unsplashUrl(photoId: string, width: number, height: number, quality = 80) {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&q=${quality}`;
}
