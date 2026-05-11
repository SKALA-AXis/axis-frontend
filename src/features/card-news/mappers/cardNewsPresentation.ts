import type { CardNewsItem } from '../model/cardNews';
import {
  cardNewsPresentationDefaults,
  fallbackCardNewsDisplayEntries,
} from '../../../shared/mocks/cardNewsPresentation';

export type PeerName = '삼성SDS' | 'LG CNS' | '현대 오토에버' | '포스코 DX';
export type SectorName = 'AX' | '보안' | '수주' | '인프라' | '섹터' | 'AI' | 'Peer';
export type SourceTypeName = '증권사' | '뉴스' | 'IR' | '블로그';

export type CardCatalogItem = {
  id: string;
  cardId: string;
  card: CardNewsItem;
  title: string;
  subtitle: string;
  peer: PeerName;
  sector: Exclude<SectorName, '섹터' | 'AI' | 'Peer'>;
  date: string;
  coverStyle: string;
  accentLabel: string;
  previewImageStyle: string;
};

export type MixerCardItem = {
  id: string;
  card: CardNewsItem;
  peer: PeerName;
  sourceType: SourceTypeName;
  accentLabel: string;
  coverStyle: string;
};

type DisplayEntryItem = CardCatalogItem & {
  sourceType: SourceTypeName;
};

function buildDisplayEntries(cards: CardNewsItem[]): DisplayEntryItem[] {
  const withApiEntries = cards.flatMap((card) =>
    (card.displayEntries ?? []).map((entry) => ({
      id: entry.id,
      cardId: card.id,
      card,
      title: entry.title,
      subtitle: entry.subtitle ?? entry.title,
      peer: (entry.peerCompany ?? cardNewsPresentationDefaults.peerCompany) as PeerName,
      sector: (entry.sector ?? cardNewsPresentationDefaults.sector) as Exclude<SectorName, '섹터' | 'AI' | 'Peer'>,
      sourceType: (entry.sourceType ?? cardNewsPresentationDefaults.sourceType) as SourceTypeName,
      date: entry.displayDate ?? card.date,
      accentLabel: entry.badgeLabel ?? card.category,
      coverStyle:
        entry.coverStyle ??
        cardNewsPresentationDefaults.coverStyle,
      previewImageStyle:
        entry.previewImageStyle ??
        cardNewsPresentationDefaults.previewImageStyle,
    })),
  );

  if (withApiEntries.length > 0) {
    return withApiEntries;
  }

  const cardMap = new Map(cards.map((card) => [card.id, card]));
  return fallbackCardNewsDisplayEntries.flatMap((entry) => {
    const card = cardMap.get(entry.cardId);
    if (!card) {
      return [];
    }

    return [
      {
        id: entry.id,
        cardId: card.id,
        card,
        title: entry.title,
        subtitle: entry.title,
        peer: entry.peerCompany as PeerName,
        sector: entry.sector as Exclude<SectorName, '섹터' | 'AI' | 'Peer'>,
        sourceType: entry.sourceType as SourceTypeName,
        date: entry.displayDate,
        accentLabel: entry.badgeLabel,
        coverStyle: entry.coverStyle,
        previewImageStyle: entry.previewImageStyle,
      },
    ];
  });
}

export function buildCardCatalog(cards: CardNewsItem[]): CardCatalogItem[] {
  return buildDisplayEntries(cards).map((entry) => ({
    id: entry.id,
    cardId: entry.cardId,
    card: entry.card,
    title: entry.title,
    subtitle: entry.subtitle,
    peer: entry.peer,
    sector: entry.sector,
    date: entry.date,
    coverStyle: entry.coverStyle,
    accentLabel: entry.accentLabel,
    previewImageStyle: entry.previewImageStyle,
  }));
}

export function buildMixerCards(cards: CardNewsItem[]): MixerCardItem[] {
  return buildDisplayEntries(cards).map((entry) => ({
    id: entry.id,
    card: entry.card,
    peer: entry.peer,
    sourceType: entry.sourceType,
    accentLabel: entry.accentLabel,
    coverStyle: entry.coverStyle,
  }));
}
