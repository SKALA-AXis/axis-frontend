/*
 * 작성일: 2026-06-01
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-01 안가은 — 카드뉴스 워크스페이스 뷰 신규 작성 및 이미지 없을 때 기업 로고 폴백 추가
 *   2026-06-04 안가은 — 로딩 표준화 및 키워드 트렌드 지연 로딩 적용
 *   2026-06-14 안가은 — 브리핑/믹서 표시 동작 및 튜토리얼·관리자 UI 정리
 *   2026-06-15 박지원 — 카드뉴스 이미지 폴백 수정
 *   2026-06-15 박진 — 사용자 챗봇 프론트엔드 업데이트 반영
 *   2026-06-18 안가은 — 모바일 필터·검색 영역이 깨지지 않도록 카드뉴스 워크스페이스 반응형 개선
 */
import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CalendarDays, Filter, Share2, Trash2 } from 'lucide-react';
import { getCardLogoImageClass, getFallbackCardLogo } from '../../../../features/card-news/cardLogoFallback';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { buildCardCatalog } from '../../../../features/card-news/mappers/cardNewsPresentation';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getLatestFirst } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { adminCardsRepository } from '../../../../features/admin-cards/api/adminCardsRepository';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { ExecutiveHeader, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay, shareCardNews } from '../../shared/FloatingCardNewsOverlay';
import { PageWindowPagination } from '../../shared/PageWindowPagination';
import { PageProcessLoading, PageState } from '../../shared/PageState';
import { EmptyBlock } from '../shared/axis';

function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readCardDeepLinkId() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('card');
}

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

function replaceBrokenCardImage(image: HTMLImageElement, card: CardNewsItem) {
  const fallbackLogo = getFallbackCardLogo(card);
  if (!fallbackLogo || image.getAttribute('src') === fallbackLogo.url) {
    return;
  }
  image.src = fallbackLogo.url;
  image.alt = fallbackLogo.alt;
  image.className = getCardLogoImageClass(fallbackLogo.url, 'card') ?? image.className;
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
  const [deepLinkedCardId, setDeepLinkedCardId] = useState<string | null>(() => readCardDeepLinkId());
  const [actionFeedback, setActionFeedback] = useState('');
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const todayDateValue = useMemo(() => toLocalDateInputValue(), []);
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
  const detailCard = detailCardId ? cards.find((card) => card.id === detailCardId) ?? null : null;
  const visibleDetailCards = visibleRows.map((row) => row.card);
  const overlayCards = detailCard && visibleDetailCards.some((card) => card.id === detailCard.id)
    ? visibleDetailCards
    : cards;

  useEffect(() => {
    const syncDeepLink = () => {
      setDeepLinkedCardId(readCardDeepLinkId());
    };
    window.addEventListener('popstate', syncDeepLink);
    return () => window.removeEventListener('popstate', syncDeepLink);
  }, []);

  useEffect(() => {
    setDetailSlideIndex(0);
  }, [detailCardId]);

  useEffect(() => {
    if (!deepLinkedCardId || isLoading) return;
    if (!cards.some((card) => card.id === deepLinkedCardId)) return;
    setDetailCardId(deepLinkedCardId);
    setDetailSlideIndex(0);
    setDeepLinkedCardId(null);
  }, [cards, deepLinkedCardId, isLoading]);

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

  if (isLoading || error) {
    return (
      <PageState
        loading={isLoading}
        error={error}
        loadingLabel="카드뉴스를 불러오는 중입니다."
        loadingFallback={(
          <PageProcessLoading
            eyebrow="Card news workspace"
            title="카드뉴스 목록을 불러오는 중"
            description="카드 원본을 가져온 뒤 필터, 북마크, 커버 이미지 정보를 한 화면에서 탐색할 수 있게 정리합니다."
            steps={[
              { label: '카드 API 요청', detail: '/api/cards 응답 대기' },
              { label: '카탈로그 정리', detail: '중복 카드 제거와 최신순 정렬' },
              { label: '필터 준비', detail: 'Peer사, 섹터, 날짜, 검색 필터 구성' },
            ]}
            meta={['source: card news', 'endpoint: /api/cards']}
          />
        )}
        onRetry={reload}
      >
        {null}
      </PageState>
    );
  }

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

        <section data-guide="cardnews-filter" className="relative z-0 mb-5 grid grid-cols-2 items-center gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2 sm:flex sm:flex-wrap">
          <span className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[var(--axis-canvas)] px-3 text-xs font-semibold text-[var(--axis-muted)] sm:justify-start">
            <Filter size={14} />
            필터
          </span>
          <select
            value={peerFilter}
            onChange={(event) => setPeerFilter(event.target.value)}
            className="h-9 min-w-0 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)] sm:min-w-[132px]"
            aria-label="Peer사 필터"
          >
            {peerOptions.map((peer) => (
              <option key={peer} value={peer}>{peer}</option>
            ))}
          </select>
          <select
            value={sectorFilter}
            onChange={(event) => setSectorFilter(event.target.value)}
            className="h-9 min-w-0 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)] sm:min-w-[132px]"
            aria-label="섹터 필터"
          >
            {sectorOptions.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <label className="inline-flex h-9 min-w-0 items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)]">
            <CalendarDays size={14} className="text-[var(--axis-accent)]" />
            <span className="sr-only">카드뉴스 날짜 선택</span>
            <input
              type="date"
              value={dateFilter}
              max={todayDateValue}
              onChange={(event) => setDateFilter(event.target.value > todayDateValue ? todayDateValue : event.target.value)}
              className="h-7 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--axis-ink)] outline-none sm:w-[130px]"
            />
          </label>
          <label className="relative col-span-2 min-w-0 flex-1 sm:min-w-[220px]">
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
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold transition sm:ml-auto ${
              bookmarkedOnly
                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
            }`}
            aria-pressed={bookmarkedOnly}
          >
            <Bookmark size={14} fill={bookmarkedOnly ? 'currentColor' : 'none'} />
            북마크만
          </button>
          <span className="inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold text-[var(--axis-muted)] sm:justify-start">
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
                            onError={(event) => replaceBrokenCardImage(event.currentTarget, row.card)}
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
              <PageWindowPagination
                className="mt-5 px-4 py-3"
                currentPage={cardPage}
                totalPages={totalCardPages}
                onPageChange={setCardPage}
                ariaLabel="카드뉴스 페이지 이동"
              />
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
          cards={overlayCards}
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
