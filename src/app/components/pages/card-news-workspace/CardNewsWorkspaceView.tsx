import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CalendarDays, Filter, Share2, Trash2 } from 'lucide-react';
import { getCardLogoImageClass } from '../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { buildCardCatalog } from '../../../../features/card-news/mappers/cardNewsPresentation';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getLatestFirst } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { adminCardsRepository } from '../../../../features/admin-cards/api/adminCardsRepository';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { ExecutiveHeader, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay, shareCardNews } from '../../shared/FloatingCardNewsOverlay';
import { EmptyBlock, LoadingBlock } from '../shared/axis';

function buildCardNewsRows(cards: CardNewsItem[]) {
  const catalog = buildCardCatalog(getLatestFirst(cards));
  const uniqueRows = Array.from(
    new Map(catalog.map((card) => [card.card.id, card])).values(),
  );
  return uniqueRows.map((card) => ({
    ...card,
    id: card.card.id,
    sourceId: card.card.id,
    originalTitle: card.card.title,
    cardNewsTitle: card.title,
    sourceType: card.sector,
    keywords: [card.peer, card.sector, card.accentLabel].filter(Boolean),
  }));
}

export function CardNewsWorkspaceView({
  bookmarkedIds,
  onToggleBookmark,
  initialQuery = '',
  onUpdateTimeChange,
  canManageCards = false,
}: {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
  initialQuery?: string;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
  canManageCards?: boolean;
}) {
  const { cards, isLoading, error, reload } = useCardNews();
  const [peerFilter, setPeerFilter] = useState('전체');
  const [sectorFilter, setSectorFilter] = useState('전체');
  const [dateFilter, setDateFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState(initialQuery);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [cardPage, setCardPage] = useState(1);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [detailSlideIndex, setDetailSlideIndex] = useState(0);
  const [actionFeedback, setActionFeedback] = useState('');
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const rows = useMemo(() => buildCardNewsRows(cards), [cards]);
  const peerOptions = ['전체', ...Array.from(new Set(rows.map((row) => row.peer)))];
  const sectorOptions = ['전체', ...Array.from(new Set(rows.map((row) => row.sourceType)))];
  const visibleRows = rows.filter((row) => {
    const peerMatched = peerFilter === '전체' || row.peer === peerFilter;
    const sectorMatched = sectorFilter === '전체' || row.sourceType === sectorFilter;
    const normalizedDate = (row.card.published_date ?? row.card.date ?? '').slice(0, 10);
    const dateMatched = !dateFilter || normalizedDate === dateFilter;
    const normalizedKeyword = keywordFilter.trim().toLowerCase();
    const haystack = [
      row.cardNewsTitle,
      row.originalTitle,
      row.peer,
      row.sourceType,
      row.accentLabel,
      row.card.category,
      row.card.category_label,
      row.card.subtitle,
      ...(row.card.summary_lines ?? row.card.summary),
      ...(row.card.insights ?? []),
      ...(row.card.actionItems ?? []),
    ].filter(Boolean).join(' ').toLowerCase();
    const keywordMatched = !normalizedKeyword || haystack.includes(normalizedKeyword);
    const bookmarkMatched = !bookmarkedOnly || bookmarkedIds.includes(row.sourceId);
    return peerMatched && sectorMatched && dateMatched && keywordMatched && bookmarkMatched;
  });
  const cardPageSize = 15;
  const totalCardPages = Math.max(1, Math.ceil(visibleRows.length / cardPageSize));
  const pagedVisibleRows = visibleRows.slice((cardPage - 1) * cardPageSize, cardPage * cardPageSize);
  const cardPaginationWindowSize = 5;
  const cardPageWindowStart = Math.floor((cardPage - 1) / cardPaginationWindowSize) * cardPaginationWindowSize + 1;
  const cardPageNumbers = useMemo(() => {
    const windowEnd = Math.min(totalCardPages, cardPageWindowStart + cardPaginationWindowSize - 1);
    return Array.from({ length: windowEnd - cardPageWindowStart + 1 }, (_, index) => cardPageWindowStart + index);
  }, [cardPageWindowStart, totalCardPages]);
  const detailCard = detailCardId ? cards.find((card) => card.id === detailCardId) ?? null : null;

  useEffect(() => {
    setDetailSlideIndex(0);
  }, [detailCardId]);

  useEffect(() => {
    setKeywordFilter(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setCardPage(1);
  }, [peerFilter, sectorFilter, dateFilter, keywordFilter, bookmarkedOnly]);

  useEffect(() => {
    if (cardPage > totalCardPages) {
      setCardPage(totalCardPages);
    }
  }, [cardPage, totalCardPages]);

  useEffect(() => {
    if (isLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, isLoading, onUpdateTimeChange]);

  if (isLoading) return <LoadingBlock label="카드뉴스를 불러오는 중입니다." />;
  if (error) return <LoadingBlock label={error} />;

  const handleDeleteCard = async (card: CardNewsItem) => {
    const reason = window.prompt(`"${card.title}" 카드뉴스 삭제 사유를 입력해주세요.`);
    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      window.alert('삭제 사유를 입력해주세요.');
      return;
    }

    const confirmed = window.confirm(`"${card.title}" 카드뉴스를 정말 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setUpdatingCardId(card.id);

    try {
      await adminCardsRepository.updateStatus(card.id, 'DELETED', trimmedReason);
      if (detailCardId === card.id) {
        setDetailCardId(null);
      }
      setActionFeedback('카드뉴스를 삭제했습니다.');
      await reload();
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : '카드뉴스를 삭제하지 못했습니다.');
    } finally {
      setUpdatingCardId(null);
    }
  };

  return (
    <ExecutivePage className="overflow-visible">
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Card news workspace"
          title="카드뉴스"
          subtitle="카드 커버 단위로 전체 흐름을 빠르게 훑고, 필요한 카드만 열어 AI 요약, 시사점, 원문 링크까지 이어서 확인할 수 있는 화면입니다."
        />

        <section data-guide="cardnews-filter" className="relative z-0 mb-5 flex flex-wrap items-center gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--axis-canvas)] px-3 text-xs font-semibold text-[var(--axis-muted)]">
            <Filter size={14} />
            필터
          </span>
          <select
            value={peerFilter}
            onChange={(event) => setPeerFilter(event.target.value)}
            className="h-9 min-w-[132px] rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
            aria-label="Peer사 필터"
          >
            {peerOptions.map((peer) => (
              <option key={peer} value={peer}>{peer}</option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(event) => setSectorFilter(event.target.value)}
            className="h-9 min-w-[132px] rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
            aria-label="섹터 필터"
          >
            {sectorOptions.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <label className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)]">
            <CalendarDays size={14} className="text-[var(--axis-accent)]" />
            <span className="sr-only">카드뉴스 날짜 선택</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-7 w-[130px] bg-transparent text-sm font-semibold text-[var(--axis-ink)] outline-none"
            />
          </label>
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">카드뉴스 키워드 검색</span>
            <input
              type="search"
              value={keywordFilter}
              onChange={(event) => setKeywordFilter(event.target.value)}
              placeholder="키워드 내용 검색..."
              className="h-9 w-full rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 text-sm font-semibold text-[var(--axis-ink)] outline-none placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)]"
            />
          </label>
          <button
            type="button"
            onClick={() => setBookmarkedOnly((current) => !current)}
            className={`ml-auto inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
              bookmarkedOnly
                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
            }`}
            aria-pressed={bookmarkedOnly}
          >
            <Bookmark size={14} fill={bookmarkedOnly ? 'currentColor' : 'none'} />
            북마크만
          </button>
          <span className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-[var(--axis-muted)]">
            {visibleRows.length}건
          </span>
        </section>

        <section>
          {visibleRows.length === 0 ? (
            <EmptyBlock label="선택한 필터에 해당하는 카드뉴스가 없습니다." />
          ) : (
            <>
              <main data-guide="cardnews-grid" className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5 xl:gap-5">
                {pagedVisibleRows.map((row) => {
                  const bookmarked = bookmarkedIds.includes(row.sourceId);
                  return (
                    <article
                      key={row.id}
                      className="relative overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[#081324] shadow-[0_18px_48px_-32px_rgba(0,0,0,0.55)] transition hover:border-[var(--axis-accent)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setDetailCardId(row.sourceId);
                        }}
                        className="relative block aspect-[3/4] w-full overflow-hidden text-left sm:aspect-[4/5]"
                      >
                        {row.card.coverImageUrl ? (
                          <img
                            src={row.card.coverImageUrl}
                            alt={row.card.coverImageAlt}
                            className={getCardLogoImageClass(row.card.coverImageUrl, 'card') ?? 'absolute inset-0 h-full w-full object-cover opacity-55'}
                          />
                        ) : (
                          <div className="absolute inset-0" style={{ background: row.coverStyle }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/38 via-[#081324]/48 to-black/92" />
                        <div className="relative flex h-full flex-col justify-between p-3 text-white sm:p-4">
                          <div className="flex items-start justify-between gap-2 text-[10px] font-semibold sm:text-xs">
                            <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-0.5 tracking-[0.06em] sm:px-2.5 sm:py-1">
                              {getDisplayDate(row.card)}
                            </span>
                            <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1">
                              {row.accentLabel}
                            </span>
                          </div>
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 sm:text-xs">{row.peer}</p>
                            <h2 className="line-clamp-3 text-[13px] font-semibold leading-tight text-white sm:line-clamp-4 sm:text-[18px]">{row.cardNewsTitle}</h2>
                          </div>
                        </div>
                      </button>
                      <div className="absolute right-2 top-14 flex flex-col gap-2 sm:right-4 sm:top-20">
                        <button
                          type="button"
                          aria-label={bookmarked ? '북마크 해제' : '북마크'}
                          onClick={() => onToggleBookmark(row.sourceId)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition ${
                            bookmarked
                              ? 'border-white/40 bg-white text-[#081324]'
                              : 'border-white/25 bg-black/20 text-white hover:bg-white/15'
                          }`}
                        >
                          <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          aria-label="공유"
                          onClick={() => {
                            void shareCardNews(row.card).then(setActionFeedback).catch(() => setActionFeedback('공유를 처리하지 못했습니다.'));
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-white/15"
                        >
                          <Share2 size={14} />
                        </button>
                        {canManageCards ? (
                          <button
                            type="button"
                            aria-label="카드뉴스 삭제"
                            disabled={updatingCardId === row.card.id}
                            onClick={() => void handleDeleteCard(row.card)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,110,110,0.45)] bg-[rgba(140,20,20,0.55)] text-white backdrop-blur transition hover:bg-[rgba(180,24,24,0.72)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </main>
              <div className="mt-5 flex items-center justify-center px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={cardPageWindowStart === 1}
                    onClick={() => setCardPage(Math.max(1, cardPageWindowStart - cardPaginationWindowSize))}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    &lt;
                  </button>
                  {cardPageNumbers.map((pageNumber) => {
                    const isActive = pageNumber === cardPage;
                    return (
                      <button
                        key={`cardnews-page-${pageNumber}`}
                        type="button"
                        onClick={() => setCardPage(pageNumber)}
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                          isActive
                            ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                            : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={cardPageWindowStart + cardPaginationWindowSize > totalCardPages}
                    onClick={() => setCardPage(Math.min(totalCardPages, cardPageWindowStart + cardPaginationWindowSize))}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
        {actionFeedback ? (
          <p className="mt-4 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--axis-muted)]">
            {actionFeedback}
          </p>
        ) : null}
      </ExecutiveContainer>
      {detailCard ? (
        <FloatingCardNewsOverlay
          card={detailCard}
          cards={visibleRows.map((row) => row.card)}
          bookmarked={bookmarkedIds.includes(detailCard.id)}
          slideIndex={detailSlideIndex}
          onSlideChange={setDetailSlideIndex}
          onBookmark={() => onToggleBookmark(detailCard.id)}
          onCardChange={(cardId) => {
            setDetailCardId(cardId);
            setDetailSlideIndex(0);
          }}
          onClose={() => {
            setDetailCardId(null);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
