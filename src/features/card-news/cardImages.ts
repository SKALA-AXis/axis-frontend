/**
 * 카드뉴스 카테고리별 큐레이션된 Unsplash 이미지 풀.
 * 모든 photo ID 는 Unsplash License (CC0 류, 상업 사용 가능) 으로 검증됨.
 * card.sector / card.category 를 기반으로 deterministic 하게 1장 매핑.
 */
import type { CardNewsItem } from './model/cardNews';

type ImageCategory = 'ax' | 'security' | 'infra' | 'deals';

export type CuratedImage = {
  id: string;       /* Unsplash photo ID (URL 의 photo-{id} 부분) */
  alt: string;
  photographer: string;
};

export const cardImagePool: Record<ImageCategory, CuratedImage[]> = {
  ax: [
    { id: '1644088379091-d574269d422f', alt: '추상 데이터 네트워크 노드', photographer: 'Conny Schneider' },
    { id: '1545987796-200677ee1011', alt: '금속 격자 구조 — 신경망 메타포', photographer: 'Alina Grubnyak' },
    { id: '1597733336794-12d05021d510', alt: '보라·파랑 그라디언트 디지털', photographer: 'JJ Ying' },
  ],
  security: [
    { id: '1548092372-0d1bd40894a3', alt: '파란 노트북 보안 클로즈업', photographer: 'Philipp Katzenberger' },
    { id: '1614064641938-3bbee52942c7', alt: '어두운 키보드 위 빨간 자물쇠', photographer: 'FlyD' },
    { id: '1526374965328-7f61d4dc18c5', alt: '녹색 매트릭스 바이너리 코드', photographer: 'Markus Spiske' },
  ],
  infra: [
    { id: '1558494949-ef010cbdcc31', alt: '데이터센터 파란 케이블 네트워크', photographer: 'Taylor Vick' },
    { id: '1695668548342-c0c1ad479aee', alt: '서버 랙 클로즈업', photographer: 'Kevin Ache' },
    { id: '1561233835-f937539b95b9', alt: '인디케이터 LED 벽', photographer: 'Krzysztof Kowalik' },
  ],
  deals: [
    { id: '1517048676732-d65bc937f952', alt: '회의 테이블 — 펜과 노트', photographer: 'Dylan Gillis' },
    { id: '1573164574572-cb89e39749b4', alt: '노트북 앞 악수', photographer: 'Mina Rad' },
    { id: '1616587656977-ac36a5a430bc', alt: '오픈플랜 회의', photographer: 'LinkedIn Sales Solutions' },
  ],
};

/* card.sector / category 를 image category 로 ───────────── */
function pickImageCategory(card: CardNewsItem): ImageCategory {
  if (card.sector === 'ax') return 'ax';
  if (card.sector === 'security') return 'security';
  if (card.sector === 'infra') return 'infra';
  if (card.sector === 'biz_area') return 'deals';

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
