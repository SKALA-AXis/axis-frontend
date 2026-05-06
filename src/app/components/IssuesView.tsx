import { Bookmark, ChevronLeft, ChevronRight, Copy, Mail, Send, Share2, X } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import {
  buildCardCatalog,
  type CardCatalogItem,
  type PeerName,
} from '../../features/card-news/mappers/cardNewsPresentation';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type PeerFilter = '전체' | PeerName;
type SectorFilter = '전체' | 'AX' | '보안' | '수주' | '인프라';

const peerFilters: PeerFilter[] = ['전체', '삼성SDS', 'LG CNS', '현대 오토에버', '포스코 DX'];
const sectorFilters: SectorFilter[] = ['전체', 'AX', '보안', '수주', '인프라'];
const visibleCount = 5;
const shareTargets = [
  { id: 'copy', label: '링크 복사', icon: Copy },
  { id: 'mail', label: '이메일 공유', icon: Mail },
  { id: 'native', label: '기기 공유', icon: Send },
] as const;

interface IssuesViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

export function IssuesView({ bookmarkedIds, onToggleBookmark }: IssuesViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const [selectedPeer, setSelectedPeer] = useState<PeerFilter>('전체');
  const [selectedSector, setSelectedSector] = useState<SectorFilter>('전체');
  const [peerPage, setPeerPage] = useState(0);
  const [sectorPage, setSectorPage] = useState(0);
  const [bookmarkPage, setBookmarkPage] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const cardCatalog = useMemo<CardCatalogItem[]>(() => {
    return buildCardCatalog(cards);
  }, [cards]);

  const selectedCard = selectedCardId ? cardCatalog.find((item) => item.id === selectedCardId) ?? null : null;

  const peerCards = useMemo(() => {
    return cardCatalog.filter((item) => selectedPeer === '전체' || item.peer === selectedPeer);
  }, [selectedPeer]);

  const sectorCards = useMemo(() => {
    return cardCatalog.filter((item) => selectedSector === '전체' || item.sector === selectedSector);
  }, [selectedSector]);

  const bookmarkCards = useMemo(() => {
    return cardCatalog.filter((item) => bookmarkedIds.includes(item.cardId));
  }, [bookmarkedIds, cardCatalog]);

  if (isLoading) {
    return <div className="axis-page flex-1 p-6 text-sm text-black/56">카드뉴스를 불러오는 중입니다.</div>;
  }

  if (error) {
    return <div className="axis-page flex-1 p-6 text-sm text-black/56">{error}</div>;
  }

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-[1.55rem] font-black tracking-[-0.045em] text-[#171717]">카드뉴스</h1>
        </div>

        <div className="space-y-7">
          <CardRowSection
            title="Peer사"
            filters={peerFilters}
            selectedFilter={selectedPeer}
            onFilterChange={(value) => {
              setSelectedPeer(value as PeerFilter);
              setPeerPage(0);
            }}
            cards={peerCards}
            page={peerPage}
            onPageChange={setPeerPage}
            onCardSelect={setSelectedCardId}
          />

          <CardRowSection
            title="섹터"
            filters={sectorFilters}
            selectedFilter={selectedSector}
            onFilterChange={(value) => {
              setSelectedSector(value as SectorFilter);
              setSectorPage(0);
            }}
            cards={sectorCards}
            page={sectorPage}
            onPageChange={setSectorPage}
            onCardSelect={setSelectedCardId}
          />

          <CardRowSection
            title="북마크"
            filters={null}
            selectedFilter=""
            onFilterChange={() => undefined}
            cards={bookmarkCards}
            page={bookmarkPage}
            onPageChange={setBookmarkPage}
            onCardSelect={setSelectedCardId}
            emptyMessage="홈 화면에서 북마크한 카드뉴스가 여기에 모입니다."
          />
        </div>
      </div>

      {selectedCard ? (
        <CardOverlay
          cards={cardCatalog}
          card={selectedCard}
          bookmarkedIds={bookmarkedIds}
          onClose={() => setSelectedCardId(null)}
          onToggleBookmark={onToggleBookmark}
          onCardChange={setSelectedCardId}
        />
      ) : null}
    </div>
  );
}

function CardRowSection({
  title,
  filters,
  selectedFilter,
  onFilterChange,
  cards,
  page,
  onPageChange,
  onCardSelect,
  emptyMessage,
}: {
  title: string;
  filters: readonly string[] | null;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  cards: CardCatalogItem[];
  page: number;
  onPageChange: (page: number) => void;
  onCardSelect: (cardId: string) => void;
  emptyMessage?: string;
}) {
  const maxPage = Math.max(0, Math.ceil(cards.length / visibleCount) - 1);
  const currentPage = Math.min(page, maxPage);
  const visibleCards = cards.slice(currentPage * visibleCount, currentPage * visibleCount + visibleCount);
  const placeholders = Math.max(0, visibleCount - visibleCards.length);

  return (
    <section className="rounded-[1.35rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,249,251,0.96))] px-4 py-4 shadow-[0_10px_30px_rgba(17,17,17,0.04)] sm:px-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="min-w-[4.5rem] text-[0.98rem] font-bold tracking-[-0.03em] text-[#232323]">{title}</h2>
        {filters ? (
          <div className="inline-flex flex-wrap items-center gap-1 rounded-[1rem] border border-black/6 bg-[linear-gradient(180deg,#f4f5f7,#eceef2)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            {filters.map((filter) => {
              const active = selectedFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onFilterChange(filter)}
                  className={`rounded-[0.8rem] px-3.5 py-2 text-[0.73rem] font-bold transition ${
                    active
                      ? 'bg-white text-[#d96200] shadow-[0_8px_18px_rgba(17,17,17,0.08)]'
                      : 'text-black/48 hover:bg-white/72 hover:text-black/68'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {cards.length === 0 ? (
        <div className="rounded-[1rem] border border-dashed border-black/12 bg-white/84 px-5 py-10 text-sm text-black/46">
          {emptyMessage ?? '표시할 카드뉴스가 없습니다.'}
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          <ArrowButton
            direction="left"
            disabled={currentPage === 0}
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          />

          <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:gap-5">
            {visibleCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onCardSelect(card.id)}
                className="group overflow-hidden rounded-[1rem] border border-black/10 bg-white text-left shadow-[0_8px_18px_rgba(17,17,17,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(17,17,17,0.12)]"
              >
                <div
                  className="relative aspect-[0.72] w-full overflow-hidden"
                  style={{ background: card.coverStyle }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.14)_52%,rgba(0,0,0,0.58))]" />
                  <div className="relative z-10 flex h-full flex-col justify-between p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-white/12 px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.02em] text-white/80 backdrop-blur-sm">
                        {card.date}
                      </span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.62rem] font-bold tracking-[0.01em] text-white backdrop-blur-sm">
                        {card.accentLabel}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="line-clamp-3 whitespace-pre-line text-[0.84rem] font-semibold leading-[1.4] tracking-[-0.02em] text-white/96">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {Array.from({ length: placeholders }).map((_, index) => (
              <div
                key={`placeholder-${title}-${index}`}
                className="aspect-[0.72] rounded-[1rem] border border-dashed border-black/8 bg-white/55"
              />
            ))}
          </div>

          <ArrowButton
            direction="right"
            disabled={currentPage >= maxPage}
            onClick={() => onPageChange(Math.min(maxPage, currentPage + 1))}
          />
        </div>
      )}
    </section>
  );
}

function CardOverlay({
  cards,
  card,
  bookmarkedIds,
  onClose,
  onToggleBookmark,
  onCardChange,
}: {
  cards: CardCatalogItem[];
  card: CardCatalogItem;
  bookmarkedIds: string[];
  onClose: () => void;
  onToggleBookmark: (cardId: string) => void;
  onCardChange: (cardId: string) => void;
}) {
  const detail = card.card;
  const isBookmarked = bookmarkedIds.includes(detail.id);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  const cardIndex = cards.findIndex((item) => item.id === card.id);
  const previousCard = cardIndex > 0 ? cards[cardIndex - 1] : null;
  const nextCard = cardIndex >= 0 && cardIndex < cards.length - 1 ? cards[cardIndex + 1] : null;
  const totalPages = getTotalPages(detail);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [card.id]);

  const handleShare = async (target: (typeof shareTargets)[number]['id']) => {
    const sharePayload = {
      title: detail.title,
      text: `${detail.title}\n${detail.summary.join('\n')}`,
      url: detail.sourceUrl,
    };

    if (target === 'copy') {
      await navigator.clipboard.writeText(`${detail.title}\n${detail.sourceUrl}`);
      setShareFeedback('링크를 복사했습니다.');
      return;
    }

    if (target === 'mail') {
      const subject = encodeURIComponent(detail.title);
      const body = encodeURIComponent(`${detail.title}\n\n${detail.sourceUrl}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      setShareFeedback('이메일 앱으로 공유를 시도합니다.');
      return;
    }

    if (target === 'native' && navigator.share) {
      await navigator.share(sharePayload);
      setShareFeedback('공유를 완료했습니다.');
      return;
    }

    await navigator.clipboard.writeText(`${detail.title}\n${detail.sourceUrl}`);
    setShareFeedback('기기 공유를 지원하지 않아 링크를 복사했습니다.');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/26 px-3 py-6 backdrop-blur-[7px] sm:px-4 sm:py-8">
        <button type="button" aria-label="닫기" className="absolute inset-0" onClick={onClose} />

        <div className="relative z-10 flex w-full max-w-[1120px] items-center justify-center gap-3 sm:gap-4">
          <OverlaySideCard card={previousCard} direction="left" onSelect={onCardChange} />

          <div className="relative w-full max-w-[640px] xl:max-w-[680px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/82 text-black/72 shadow-sm transition hover:bg-white"
            aria-label="닫기"
          >
            <X size={16} />
          </button>

          <article className="grid items-start gap-3 sm:grid-cols-[64px_minmax(0,1fr)_78px] sm:gap-5">
            <div className="hidden sm:flex justify-center pt-[10.5rem]">
              <OverlayArrowButton
                direction="previous"
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex((current) => Math.max(0, current - 1))}
              />
            </div>

            <div className="relative w-full">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <span
                      key={`${detail.id}-${index}`}
                      className={`block h-1.5 rounded-full transition-all ${
                        index === currentPageIndex ? 'w-6 bg-[#EE7501]' : 'w-1.5 bg-black/12'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[0.75rem] text-black/42">
                  {currentPageIndex + 1} / {totalPages}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.7rem] border-[4px] border-[#efc4b8] bg-white shadow-[0_24px_42px_rgba(17,17,17,0.18)]">
                <div className="relative aspect-[4/5] w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,242,0.78))] p-5 sm:p-6">
                  <OverlayCardPage card={detail} pageIndex={currentPageIndex} />
                </div>
              </div>

              <div className="mt-2 px-1 text-[0.76rem] text-black/44">
                {card.peer} · {card.date}
              </div>
            </div>

            <div className="sm:hidden">
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <div className="flex gap-2 sm:hidden">
                  <OverlayIconButton
                    label={isBookmarked ? '북마크 해제' : '북마크 저장'}
                    onClick={() => onToggleBookmark(detail.id)}
                    active={isBookmarked}
                  >
                    <Bookmark className={isBookmarked ? 'fill-current' : ''} size={18} strokeWidth={1.8} />
                  </OverlayIconButton>
                  <OverlayIconButton
                    label="공유"
                    onClick={() => {
                      setIsShareOpen(true);
                      setShareFeedback('');
                    }}
                  >
                    <Share2 size={18} strokeWidth={1.8} />
                  </OverlayIconButton>
                  <OverlayArrowButton
                    direction="previous"
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex((current) => Math.max(0, current - 1))}
                  />
                  <OverlayArrowButton
                    direction="next"
                    disabled={currentPageIndex === totalPages - 1}
                    onClick={() => setCurrentPageIndex((current) => Math.min(totalPages - 1, current + 1))}
                  />
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center pt-[10.5rem]">
              <OverlayArrowButton
                direction="next"
                disabled={currentPageIndex === totalPages - 1}
                onClick={() => setCurrentPageIndex((current) => Math.min(totalPages - 1, current + 1))}
              />
              <div className="mt-3 flex flex-col items-center gap-3">
              <OverlayIconButton
                label={isBookmarked ? '북마크 해제' : '북마크 저장'}
                onClick={() => onToggleBookmark(detail.id)}
                active={isBookmarked}
              >
                <Bookmark className={isBookmarked ? 'fill-current' : ''} size={18} strokeWidth={1.8} />
              </OverlayIconButton>
              <OverlayIconButton
                label="공유"
                onClick={() => {
                  setIsShareOpen(true);
                  setShareFeedback('');
                }}
              >
                <Share2 size={18} strokeWidth={1.8} />
              </OverlayIconButton>
              </div>
            </div>
          </article>
          </div>

          <OverlaySideCard card={nextCard} direction="right" onSelect={onCardChange} />
        </div>
      </div>
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md rounded-3xl border-black/10 bg-white/95 p-6">
          <DialogHeader>
            <DialogTitle className="text-black/90">공유할 곳 선택</DialogTitle>
            <DialogDescription className="text-black/58">{detail.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {shareTargets.map((target) => {
              const Icon = target.icon;

              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => void handleShare(target.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:border-[#EE7501]/28 hover:bg-[#fff7f0]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EE7501]/10 text-[#EE7501]">
                    <Icon size={18} />
                  </span>
                  <span className="font-medium text-black/88">{target.label}</span>
                </button>
              );
            })}
          </div>

          {shareFeedback ? <p className="text-sm text-black/56">{shareFeedback}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OverlaySideCard({
  card,
  direction,
  onSelect,
}: {
  card: CardCatalogItem | null;
  direction: 'left' | 'right';
  onSelect: (cardId: string) => void;
}) {
  if (!card) {
    return <div className="hidden w-[132px] shrink-0 xl:block" />;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      className={`hidden w-[132px] shrink-0 rounded-[1rem] border border-black/12 bg-white/72 p-2 text-left opacity-70 blur-[0.2px] transition hover:opacity-100 xl:block ${
        direction === 'left' ? '-rotate-2' : 'rotate-2'
      }`}
    >
      <div
        className="aspect-[4/5] overflow-hidden rounded-[0.9rem] border-[3px] border-[#efc4b8] shadow-[0_12px_22px_rgba(17,17,17,0.1)]"
        style={{ background: card.coverStyle }}
      >
        <div className="flex h-full items-end bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.56))] p-3">
          <p className="line-clamp-4 whitespace-pre-line text-[0.82rem] font-semibold leading-[1.45] text-white">
            {card.title}
          </p>
        </div>
      </div>
    </button>
  );
}

function OverlayCardPage({ card, pageIndex }: { card: CardNewsItem; pageIndex: number }) {
  const pageLabel = `${pageIndex + 1} / ${getTotalPages(card)}`;

  if (pageIndex === 0) {
    return <OverlayCoverPage card={card} pageLabel={pageLabel} />;
  }

  if (pageIndex <= card.articlePages.length) {
    return <OverlayArticlePage page={card.articlePages[pageIndex - 1]} pageLabel={pageLabel} />;
  }

  if (pageIndex === card.articlePages.length + 1) {
    return <OverlayInsightPage card={card} pageLabel={pageLabel} />;
  }

  return <OverlayDetailPage card={card} pageLabel={pageLabel} />;
}

function OverlayCoverPage({ card, pageLabel }: { card: CardNewsItem; pageLabel: string }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[1.25rem] bg-[#fcf7f4]">
      <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-22" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.9)_28%,rgba(255,255,255,0.76)_100%)]" />
      <div className="relative flex h-full flex-col justify-start p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex min-w-20 justify-center rounded-xl bg-[#ffab4a] px-4 py-2 text-[0.92rem] font-bold text-white shadow-sm">
            {card.category}
          </span>
          <span className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black/48">{pageLabel}</span>
        </div>

        <div className="mt-10 max-w-[84%]">
          <h2 className="text-[1rem] font-extrabold leading-[1.65] tracking-[-0.02em] text-black sm:text-[1.28rem] lg:text-[1.42rem]">
            {card.title}
          </h2>
        </div>
      </div>
    </div>
  );
}

function OverlayArticlePage({ page, pageLabel }: { page: CardNewsItem['articlePages'][number]; pageLabel: string }) {
  return (
    <div className="flex h-full flex-col rounded-[1.25rem] bg-[#fffaf5] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#EE7501]/70">Article Summary</p>
        <span className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black/48">{pageLabel}</span>
      </div>
      <OverlaySectionTitle>{page.title}</OverlaySectionTitle>
      <div className="space-y-4 text-[0.92rem] leading-7 text-black/82 sm:text-[0.98rem]">
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

function OverlayInsightPage({ card, pageLabel }: { card: CardNewsItem; pageLabel: string }) {
  return (
    <div className="flex h-full flex-col rounded-[1.25rem] border border-[#E1002A]/10 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E1002A]/70">Insight</p>
        <span className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black/48">{pageLabel}</span>
      </div>
      <OverlaySectionTitle>SK AX 관점에서의 시사점</OverlaySectionTitle>
      <OverlayBulletList items={card.insights} />
    </div>
  );
}

function OverlayDetailPage({ card, pageLabel }: { card: CardNewsItem; pageLabel: string }) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-[1.25rem] bg-[#111111] px-6 py-7 text-white sm:px-8 sm:py-8">
      <div>
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">Final Page</p>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/72">{pageLabel}</span>
        </div>
        <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.18rem]">
          {card.detailTitle}
        </h3>
      </div>

      <section className="rounded-[1rem] bg-white/8 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">요약</p>
        <p className="mt-3 text-[0.88rem] leading-7 text-white/76">{card.detailDescription}</p>
        <div className="mt-4 space-y-2.5">
          {card.detailPoints.map((item) => (
            <div key={item} className="rounded-[0.85rem] bg-white/10 px-3.5 py-3 text-[0.84rem] leading-6 text-white/82">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-auto text-white">
        <p className="text-[0.82rem] leading-6 text-white/56">{card.source}</p>
      </section>
    </div>
  );
}

function getTotalPages(card: CardNewsItem) {
  return card.articlePages.length + 3;
}

function OverlayArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  const label = direction === 'previous' ? '이전 페이지' : '다음 페이지';

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/92 text-black/78 shadow-sm transition hover:border-[#EE7501]/28 hover:bg-[#fff7f0] disabled:cursor-not-allowed disabled:opacity-35"
    >
      <Icon size={20} />
    </button>
  );
}

function OverlaySectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-3 mt-4 border-l-[3px] border-[#E1002A] pl-2 text-[1rem] font-semibold tracking-[-0.02em] text-black/88 sm:text-[1.08rem]">
      {children}
    </h3>
  );
}

function OverlayBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5 text-[0.94rem] leading-7 text-black/86 marker:text-[#EE7501] sm:text-[0.98rem]">
      {items.map((item) => (
        <li key={item} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

function OverlayIconButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition ${
        active ? 'border-[#EE7501]/24 bg-[#EE7501]/10 text-[#EE7501]' : 'text-black/84 hover:border-[#EE7501]/24 hover:bg-[#fff5ea]'
      }`}
    >
      {children}
    </button>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white/88 text-black/58 shadow-[0_6px_18px_rgba(17,17,17,0.04)] transition hover:bg-white hover:text-black/78 disabled:cursor-not-allowed disabled:border-black/5 disabled:text-black/18 disabled:hover:bg-white/88"
      aria-label={direction === 'left' ? '이전 카드 보기' : '다음 카드 보기'}
    >
      <Icon size={22} strokeWidth={1.8} />
    </button>
  );
}
