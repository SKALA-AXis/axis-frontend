import type { CardNewsItem } from './model/cardNews';

export type CardLogoKey = NonNullable<CardNewsItem['peer_id']> | 'sk_ax';

export const cardLogoByKey: Record<CardLogoKey, string> = {
  samsung_sds: '/card_logos/samsung_sds.jpeg',
  lg_cns: '/card_logos/lg_cns.png',
  hyundai_autoever: '/card_logos/hyundai_autoever.png',
  posco_dx: '/card_logos/posco_dx.jpg',
  sk_ax: '/card_logos/sk_ax.png',
};

export const cardLogoAltByKey: Record<CardLogoKey, string> = {
  samsung_sds: '삼성SDS 로고',
  lg_cns: 'LG CNS 로고',
  hyundai_autoever: '현대오토에버 로고',
  posco_dx: '포스코DX 로고',
  sk_ax: 'SK AX 로고',
};

const cardLogoAliases: Array<{ key: CardLogoKey; tokens: string[] }> = [
  { key: 'samsung_sds', tokens: ['samsungsds', '삼성sds', '삼성에스디에스'] },
  { key: 'lg_cns', tokens: ['lgcns', '엘지cns', '엘지씨엔에스'] },
  { key: 'hyundai_autoever', tokens: ['hyundaiautoever', '현대오토에버'] },
  { key: 'posco_dx', tokens: ['poscodx', '포스코dx'] },
  { key: 'sk_ax', tokens: ['skax', '에스케이ax'] },
];

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, '');
}

export function inferCardLogoKey(card: Partial<CardNewsItem>): CardLogoKey | undefined {
  if (card.peer_id && cardLogoByKey[card.peer_id]) {
    return card.peer_id;
  }

  const searchText = normalizeSearchText([
    card.title,
    card.subtitle,
    card.detailTitle,
    card.detailDescription,
    card.category,
    card.category_label,
    ...(card.summary ?? []),
    ...(card.summary_lines ?? []),
    ...(card.displayEntries?.map((entry) => entry.peerCompany) ?? []),
  ].filter(Boolean).join(' '));

  return cardLogoAliases.find(({ tokens }) => tokens.some((token) => searchText.includes(normalizeSearchText(token))))?.key;
}

export function getFallbackCardLogo(card: Partial<CardNewsItem>) {
  const logoKey = inferCardLogoKey(card);
  return logoKey
    ? {
        url: cardLogoByKey[logoKey],
        alt: cardLogoAltByKey[logoKey],
      }
    : undefined;
}

export function isCardLogoUrl(url?: string | null) {
  return typeof url === 'string' && url.startsWith('/card_logos/');
}

function getCardLogoKeyByUrl(url?: string | null): CardLogoKey | undefined {
  return (Object.entries(cardLogoByKey) as Array<[CardLogoKey, string]>).find(([, logoUrl]) => logoUrl === url)?.[0];
}

export type CardLogoImageSize = 'hero' | 'card' | 'related' | 'compact';

const cardLogoScaleByKey: Record<CardLogoKey, string> = {
  samsung_sds: 'scale-105',
  lg_cns: 'scale-[1.55]',
  hyundai_autoever: 'scale-110',
  posco_dx: 'scale-105',
  sk_ax: 'scale-105',
};

const cardLogoClassBySize: Record<CardLogoImageSize, string> = {
  hero: 'absolute inset-0 h-full w-full bg-white object-contain opacity-90 transition-opacity',
  card: 'absolute inset-0 h-full w-full bg-white object-contain opacity-90',
  related: 'absolute inset-0 h-full w-full bg-white object-contain opacity-90',
  compact: 'h-full w-full bg-white object-contain opacity-90',
};

export function getCardLogoImageClass(url: string | null | undefined, size: CardLogoImageSize) {
  const logoKey = getCardLogoKeyByUrl(url);
  if (!logoKey && !isCardLogoUrl(url)) {
    return undefined;
  }

  return `${cardLogoClassBySize[size]} ${logoKey ? cardLogoScaleByKey[logoKey] : 'scale-100'}`;
}
