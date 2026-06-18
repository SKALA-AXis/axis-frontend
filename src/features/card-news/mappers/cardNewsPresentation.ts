/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선, 이후 대시보드·검색 인사이트 UI 개선
 *   2026-06-10 박진 — 챗봇 로직 수정
 *   2026-06-16 박지원 — 산업 트렌드 카드뉴스 지원
 */
import type { CardNewsItem } from '../model/cardNews';
import { cardNewsPeerLabels } from '../../../shared/content/cardNewsLabels';
import { cardNewsPresentationDefaults } from '../../../shared/content/cardNewsPresentationDefaults';

export type PeerName = '삼성SDS' | 'LG CNS' | '현대 오토에버' | '포스코 DX' | 'industry';
export type SectorName = 'AX' | '보안' | '수주' | '인프라' | 'industry' | '섹터' | 'AI' | 'Peer';
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
  return cards.flatMap((card) => {
    const apiEntries = (card.displayEntries ?? []).map((entry) => ({
      id: entry.id,
      cardId: card.id,
      card,
      title: entry.title,
      subtitle: entry.subtitle ?? entry.title,
      peer: (entry.peerCompany ?? derivePeerName(card)) as PeerName,
      sector: (entry.sector ?? deriveSectorName(card)) as Exclude<SectorName, '섹터' | 'AI' | 'Peer'>,
      sourceType: (entry.sourceType ?? deriveSourceType(card)) as SourceTypeName,
      date: entry.displayDate ?? card.date,
      accentLabel: entry.badgeLabel ?? card.category_label ?? card.category,
      coverStyle: entry.coverStyle ?? cardNewsPresentationDefaults.coverStyle,
      previewImageStyle: entry.previewImageStyle ?? cardNewsPresentationDefaults.previewImageStyle,
    }));

    if (apiEntries.length > 0) {
      return apiEntries;
    }

    return [
      {
        id: `${card.id}-default`,
        cardId: card.id,
        card,
        title: card.title,
        subtitle: card.subtitle ?? card.title,
        peer: derivePeerName(card) as PeerName,
        sector: deriveSectorName(card) as Exclude<SectorName, '섹터' | 'AI' | 'Peer'>,
        sourceType: deriveSourceType(card) as SourceTypeName,
        date: card.published_date ?? card.date,
        accentLabel: card.category_label ?? card.category,
        coverStyle: cardNewsPresentationDefaults.coverStyle,
        previewImageStyle: cardNewsPresentationDefaults.previewImageStyle,
      },
    ];
  });
}

function derivePeerName(card: CardNewsItem): PeerName {
  return (card.peer_id ? cardNewsPeerLabels[card.peer_id] : undefined) as PeerName ?? cardNewsPresentationDefaults.peerCompany;
}

function deriveSectorName(card: CardNewsItem): Exclude<SectorName, '섹터' | 'AI' | 'Peer'> {
  const sector = card.category_label ?? card.category ?? cardNewsPresentationDefaults.sector;
  if (sector === '보안' || sector === '수주' || sector === '인프라' || sector === 'AX' || sector === 'industry') {
    return sector;
  }
  return cardNewsPresentationDefaults.sector;
}

function deriveSourceType(card: CardNewsItem): SourceTypeName {
  if (card.source?.toLowerCase().includes('ir')) return 'IR';
  if (card.source?.toLowerCase().includes('blog')) return '블로그';
  if (card.source?.toLowerCase().includes('news')) return '뉴스';
  return cardNewsPresentationDefaults.sourceType;
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
  const uniqueEntries = Array.from(
    new Map(buildDisplayEntries(cards).map((entry) => [entry.card.id, entry])).values(),
  );
  return uniqueEntries.map((entry) => ({
    id: entry.card.id,
    card: entry.card,
    peer: entry.peer,
    sourceType: entry.sourceType,
    accentLabel: entry.accentLabel,
    coverStyle: entry.coverStyle,
  }));
}
