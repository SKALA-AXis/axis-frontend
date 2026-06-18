/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편(designing 통합·차트/routing/브리핑 흡수) 일부로 도입
 *   2026-05-22 박진 — 카드뉴스 대폭 수정 및 알림 설정 반영
 *   2026-05-27 안가은 — 카드뉴스 데이터 연동, 이미지 없을 때 기업 로고 표시, 브리핑/믹서 표시 동작 수정
 *   2026-06-11 심유정 — 카드뉴스 텍스트/파일/에어드롭 공유 기능 추가, 본문 상세 렌더링, 전략 컨텍스트 토글 추가
 *   2026-06-11 박지원 — 카드 출처 개수 배지 처리 및 이미지 폴백 수정
 *   2026-06-18 안가은 — 모바일 상세 화면 닫기·이전/다음 뉴스 이동 버튼 및 원문 목록 접근성 개선
 */
import { useEffect, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, Newspaper, Share2, Sparkles, X } from 'lucide-react';
import { cardNewsRepository } from '../../../features/card-news/api/cardNewsRepository';
import { getCardLogoImageClass, getFallbackCardLogo, isCardLogoUrl } from '../../../features/card-news/cardLogoFallback';
import type { CardNewsItem, CardNewsStructuredTextItem } from '../../../features/card-news/model/cardNews';
import { getDisplayDate, getPeerLabel, getSummaryLines } from '../../../features/card-news/mappers/cardNewsExecutive';

type ShareDataWithFiles = ShareData & { files?: File[] };
type NavigatorWithFileShare = Navigator & {
  canShare?: (data?: ShareDataWithFiles) => boolean;
  share?: (data?: ShareDataWithFiles) => Promise<void>;
};

function compactShareLines(lines: Array<string | null | undefined>) {
  return lines
    .map((line) => String(line ?? '').trim())
    .filter((line) => line.length > 0);
}

function stripDisplayLabels(value: string) {
  return value
    .replace(/^핵심\s*(?:시사점|대응|방안)\s*[:：]\s*/i, '')
    .replace(/^근거\s*\/?\s*설명\s*[:：]\s*/i, '')
    .trim();
}

function splitMainDetailText(value: string): CardNewsStructuredTextItem {
  const compact = value.replace(/\s+/g, ' ').trim();
  const [main = '', detail = ''] = stripDisplayLabels(compact).split(/\s*근거\s*\/?\s*설명\s*[:：]\s*/);
  return {
    main: stripDisplayLabels(main),
    detail: stripDisplayLabels(detail),
  };
}

function textLinesToStructuredItems(lines: string[]) {
  return lines
    .map(splitMainDetailText)
    .filter((line) => line.main.length > 0);
}

function structuredItemsForDisplay(items: CardNewsStructuredTextItem[] | undefined, fallback: string[]) {
  const normalized = (items ?? [])
    .map((item) => ({
      main: stripDisplayLabels(item.main ?? ''),
      detail: item.detail ? stripDisplayLabels(item.detail) : '',
    }))
    .filter((item) => item.main.length > 0);
  return normalized.length > 0 ? normalized : textLinesToStructuredItems(fallback);
}

function structuredItemsForShare(items: CardNewsStructuredTextItem[] | undefined, fallback: string[]) {
  return structuredItemsForDisplay(items, fallback).map((item) => compactShareLines([item.main, item.detail]).join(' '));
}

function formatShareSection(title: string, lines: string[]) {
  const body = compactShareLines(lines);
  if (body.length === 0) {
    return `**${title}**\n- 내용 없음`;
  }
  return [
    `**${title}**`,
    ...body.map((line, index) => `${index + 1}. ${line}`),
  ].join('\n');
}

function buildCardNewsShareText(card: CardNewsItem) {
  const sections = [
    formatShareSection('요약', getSummaryLines(card)),
    formatShareSection('시사점', structuredItemsForShare(card.insightDetails, card.insights)),
    formatShareSection('대응방안', structuredItemsForShare(card.actionDetails, card.actionItems)),
  ];
  const meta = compactShareLines([
    card.date ? `일자: ${card.date}` : '',
    card.source ? `출처: ${card.source}` : '',
    card.sourceUrl && card.sourceUrl !== '#' ? `원문: ${card.sourceUrl}` : '',
  ]);

  return compactShareLines([
    card.title,
    `# ${card.title}`,
    meta.join('\n'),
    sections.join('\n\n'),
  ]).join('\n\n');
}

function getShareFileName(card: CardNewsItem) {
  const safeTitle = card.title
    .replace(/[\\/:*?"<>|#\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
  return `${safeTitle || 'card-news'}.txt`;
}

function createCardNewsTextFile(text: string, fileName: string) {
  return new File([text], fileName, { type: 'text/plain' });
}

function replaceBrokenCardImage(image: HTMLImageElement, card: CardNewsItem, size: 'hero' | 'related') {
  const fallbackLogo = getFallbackCardLogo(card);
  if (!fallbackLogo || image.getAttribute('src') === fallbackLogo.url) {
    return;
  }
  image.src = fallbackLogo.url;
  image.alt = fallbackLogo.alt;
  image.className = getCardLogoImageClass(fallbackLogo.url, size) ?? image.className;
}

async function copyCardNewsShareText(text: string) {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function shareCardNews(card: CardNewsItem) {
  const text = buildCardNewsShareText(card);
  const fileName = getShareFileName(card);
  const fileShareNavigator = navigator as NavigatorWithFileShare;
  if (fileShareNavigator.share && typeof File !== 'undefined') {
    const textFile = createCardNewsTextFile(text, fileName);
    const filePayloads: ShareDataWithFiles[] = [
      { title: card.title, files: [textFile] },
      { title: card.title, text, files: [textFile] },
    ];
    try {
      for (const payload of filePayloads) {
        const canShareTextFile = fileShareNavigator.canShare ? fileShareNavigator.canShare(payload) : true;
        if (!canShareTextFile) continue;
        await fileShareNavigator.share(payload);
        return '공유를 열었습니다.';
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return '공유를 취소했습니다.';
      }
      // eslint-disable-next-line no-console
      console.warn('Card news text file share failed; trying text share instead.', error);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: card.title,
        text,
      });
      return '공유를 열었습니다.';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return '공유를 취소했습니다.';
      }
      // eslint-disable-next-line no-console
      console.warn('Card news text share failed; falling back to clipboard.', error);
    }
  }

  if (await copyCardNewsShareText(text)) {
    return '공유창을 열 수 없어 카드뉴스 내용을 복사했습니다.';
  }

  return '공유를 처리하지 못했습니다.';
}

export { shareCardNews };

type CardNewsSlideLine = CardNewsStructuredTextItem;

function getCardSourceOptions(card: CardNewsItem) {
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

function dedupeCardsById(cards: CardNewsItem[]) {
  const byId = new Map<string, CardNewsItem>();
  cards.forEach((card) => {
    if (!byId.has(card.id)) {
      byId.set(card.id, card);
    }
  });
  return Array.from(byId.values());
}

export function FloatingCardNewsOverlay({
  card: initialCard,
  bookmarked,
  slideIndex,
  onSlideChange,
  onBookmark,
  onClose,
  cards = [],
  onCardChange,
}: {
  card: CardNewsItem;
  bookmarked: boolean;
  slideIndex: number;
  onSlideChange: (index: number) => void;
  onBookmark: () => void;
  onClose: () => void;
  cards?: CardNewsItem[];
  onCardChange?: (cardId: string) => void;
}) {
  const noDataLine = '데이터 없음';
  const [shareFeedback, setShareFeedback] = useState('');
  const [strategyFeedback, setStrategyFeedback] = useState('');
  const [strategyCard, setStrategyCard] = useState<CardNewsItem | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const card = strategyCard ?? initialCard;
  const slides: Array<{ kicker: string; title: string; lines: CardNewsSlideLine[] }> = [
    {
      kicker: 'AI 요약',
      title: '핵심 변화 3줄 요약',
      lines: getSummaryLines(card).slice(0, 3).map((line) => ({ main: line })),
    },
    {
      kicker: '시사점',
      title: '시장 변화가 주는 시사점',
      lines: structuredItemsForDisplay(card.insightDetails, card.insights).slice(0, 3),
    },
    {
      kicker: '다음 행동',
      title: '우선 실행해야 할 대응',
      lines: structuredItemsForDisplay(card.actionDetails, card.actionItems).slice(0, 3),
    },
  ];
  const slideCount = Math.max(slides.length, 1);
  const activeIndex = ((slideIndex % slideCount) + slideCount) % slideCount;
  const activeSlide = slides[activeIndex] ?? slides[0];
  const showLineNumbers = activeSlide.lines.length > 1;
  const slideImage = card.slides?.[activeIndex]?.image_url ?? card.coverImageUrl;
  const slideImageAlt = card.slides?.[activeIndex]?.image_alt ?? card.coverImageAlt;
  const slideImageClass = getCardLogoImageClass(slideImage, 'hero') ?? 'absolute inset-0 h-full w-full object-cover opacity-58 transition-opacity';
  const strategyApplied = Boolean(card.strategy_context_applied || card.strategyContextApplied);
  const sourceOptions = getCardSourceOptions(card);
  const sourceCount = Math.max(
    card.source_count ?? 0,
    card.source_raw_article_ids?.length ?? 0,
    card.sourceRawArticleIds?.length ?? 0,
    card.evidence_chain?.provenance?.raw_article_ids?.length ?? 0,
    sourceOptions.length,
    1,
  );
  const orderedCards = dedupeCardsById(cards.length > 0 ? cards : [card]);
  const currentCardIndex = orderedCards.findIndex((item) => item.id === card.id);
  const previousCard = currentCardIndex > 0 ? orderedCards[currentCardIndex - 1] : null;
  const nextCard = currentCardIndex >= 0 && currentCardIndex < orderedCards.length - 1 ? orderedCards[currentCardIndex + 1] : null;

  useEffect(() => {
    setStrategyFeedback('');
    setStrategyCard(null);
    setStrategyLoading(false);
  }, [initialCard.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft' && previousCard && onCardChange) {
        onCardChange(previousCard.id);
        return;
      }
      if (event.key === 'ArrowRight' && nextCard && onCardChange) {
        onCardChange(nextCard.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, onCardChange, onClose, previousCard]);

  const openSourceLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setSourcePickerOpen(false);
  };

  const navigateCard = (targetCard: CardNewsItem | null) => {
    if (!targetCard || !onCardChange) return;
    setSourcePickerOpen(false);
    setShareFeedback('');
    onCardChange(targetCard.id);
  };

  const navigateSlide = (direction: -1 | 1) => {
    if (slides.length === 0) return;
    onSlideChange((activeIndex + direction + slides.length) % slides.length);
  };

  const toggleStrategyContextPreview = async () => {
    if (strategyLoading) return;
    setStrategyLoading(true);
    setStrategyFeedback(strategyApplied ? '기본 대응방안으로 되돌리는 중입니다.' : '맞춤 전략을 적용하는 중입니다.');
    try {
      const updatedCard = strategyApplied
        ? await cardNewsRepository.revertStrategyContext(card.id)
        : await cardNewsRepository.applyStrategyContext(card.id);
      setStrategyCard(updatedCard);
      setStrategyFeedback(strategyApplied ? '기본 대응방안으로 되돌렸습니다.' : '맞춤 전략을 적용했습니다.');
    } catch {
      setStrategyFeedback('맞춤 전략 처리를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setStrategyLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="카드뉴스 상세 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(16,16,20,0.30)] backdrop-blur-[3px]"
      />
      <section className="absolute inset-x-3 bottom-3 top-3 overflow-y-auto rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_34px_110px_-42px_rgba(0,0,0,0.58)] md:bottom-auto md:left-1/2 md:top-1/2 md:h-[min(640px,calc(100vh_-_56px))] md:w-[min(960px,calc(100vw_-_32px))] md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-hidden xl:w-[min(960px,calc(100vw_-_360px))]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-[0_16px_44px_-30px_rgba(0,0,0,0.72)] backdrop-blur transition hover:bg-black/60 md:hidden"
          aria-label="카드뉴스 상세 닫기"
        >
          <X size={17} />
        </button>
        <div className="grid md:h-full md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="min-h-[280px] border-b border-[var(--axis-hairline)] bg-[#081324] sm:min-h-[340px] md:min-h-0 md:border-b-0 md:border-r">
            <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#081324] sm:min-h-[340px] md:min-h-0">
              {slideImage ? (
                <img
                  src={slideImage}
                  alt={slideImageAlt}
                  className={slideImageClass}
                  onError={(event) => replaceBrokenCardImage(event.currentTarget, card, 'hero')}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-[#081324]/40 to-black/90" />
              <div className="relative flex h-full min-h-[280px] flex-col justify-between p-4 pr-14 text-white sm:min-h-[340px] md:min-h-0 md:pr-4">
                <div className="flex items-start justify-between gap-3 text-xs font-semibold">
                  <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">{getDisplayDate(card)}</span>
                  <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">{card.category_label ?? card.category}</span>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/72">{getPeerLabel(card)}</p>
                  <h2 className="line-clamp-4 text-[20px] font-semibold leading-tight text-white md:text-[22px]">{card.title}</h2>
                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-white/76">
                    <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/18 bg-white/10 px-2.5 py-1">
                      <Newspaper size={13} />
                      원문 {sourceCount}건
                    </span>
                    <span className="rounded-sm border border-white/18 bg-white/10 px-2.5 py-1">{slides.length}개 관점</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <header className="flex min-h-[132px] shrink-0 items-start justify-between gap-4 border-b border-[var(--axis-hairline)] px-4 py-4 md:h-[164px] md:px-6">
              <div className="min-w-0">
                <p className="axis-kicker">{activeSlide.kicker}</p>
                <h3 className="mt-2 line-clamp-3 font-display text-[21px] font-semibold leading-tight text-[var(--axis-ink)] md:text-[24px]">
                  {activeSlide.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-body)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] md:inline-flex"
                aria-label="카드뉴스 상세 닫기"
              >
                <X size={16} />
              </button>
            </header>

            <nav className="flex min-h-[76px] shrink-0 items-center gap-3 border-b border-[var(--axis-hairline)] px-5 py-3 md:px-6" aria-label="카드뉴스 내용 선택">
              <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-1">
                {slides.map((slide, index) => (
                  <button
                    key={slide.kicker}
                    type="button"
                    onClick={() => onSlideChange(index)}
                    className={`min-h-11 rounded-[var(--axis-radius-sm)] px-2 text-center transition ${
                      index === activeIndex
                        ? 'bg-[var(--axis-canvas)] text-[var(--axis-accent-strong)] shadow-[0_10px_28px_-24px_rgba(0,0,0,0.46)]'
                        : 'text-[var(--axis-muted)] hover:bg-[var(--axis-canvas)] hover:text-[var(--axis-ink)]'
                    }`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-[0.12em]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="mt-0.5 block text-[13px] font-semibold">{slide.kicker}</span>
                  </button>
                ))}
              </div>
              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => navigateSlide(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                  aria-label="이전 카드뉴스 섹션"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigateSlide(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                  aria-label="다음 카드뉴스 섹션"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </nav>

            {orderedCards.length > 1 ? (
              <div className="grid grid-cols-2 gap-2 border-b border-[var(--axis-hairline)] px-4 py-3 md:hidden">
                <button
                  type="button"
                  onClick={() => navigateCard(previousCard)}
                  disabled={!previousCard || !onCardChange}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  이전 뉴스
                </button>
                <button
                  type="button"
                  onClick={() => navigateCard(nextCard)}
                  disabled={!nextCard || !onCardChange}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다음 뉴스
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}

            <article className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
                <div className="mx-auto max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--axis-muted)]">
                  {getPeerLabel(card)} · {card.category_label ?? card.category}
                </p>
                {activeSlide.lines.length > 0 ? (
                  <div className="mt-5 divide-y divide-[var(--axis-hairline)]">
                    {activeSlide.lines.map((line, index) => (
                      <div
                        key={`${activeSlide.kicker}-${index}`}
                        className="grid grid-cols-[34px_minmax(0,1fr)] gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <span className="mt-1 font-mono text-xs font-bold text-[var(--axis-accent-strong)]">
                          {showLineNumbers ? String(index + 1).padStart(2, '0') : ''}
                        </span>
                        <div className="min-w-0">
                          <p className="text-base font-semibold leading-8 text-[var(--axis-ink)]">
                            {line.main}
                          </p>
                          {line.detail ? (
                            <p className="mt-2 text-sm font-medium leading-6 text-[var(--axis-muted)]">
                              {line.detail}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-6 text-sm font-medium text-[var(--axis-muted)]">
                    {noDataLine}
                  </div>
                )}
              </div>
            </article>

            <footer className="border-t border-[var(--axis-hairline)] px-4 py-4 md:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onBookmark}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] border px-3.5 py-2 text-sm font-semibold transition ${
                    bookmarked
                      ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                      : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)] hover:border-[var(--axis-accent)]'
                  }`}
                >
                  <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                  {bookmarked ? '북마크됨' : '북마크'}
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3.5 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
                  onClick={() => {
                    void shareCardNews(card).then(setShareFeedback).catch(() => setShareFeedback('공유를 처리하지 못했습니다.'));
                  }}
                >
                  <Share2 size={15} />
                  공유
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (sourceOptions.length <= 1) {
                        const singleSource = sourceOptions[0];
                        if (singleSource) {
                          openSourceLink(singleSource.url);
                        }
                        return;
                      }
                      setSourcePickerOpen((current) => !current);
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3.5 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
                  >
                    <ExternalLink size={15} />
                    {sourceOptions.length > 1 ? '원문 열기' : '원문 열기'}
                  </button>
                  {sourcePickerOpen && sourceOptions.length > 1 ? (
                    <div
                      role="dialog"
                      aria-label="원문 기사 목록"
                      className="fixed inset-x-5 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[80] max-h-[min(360px,calc(100dvh_-_2rem))] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)] md:absolute md:inset-x-auto md:bottom-[calc(100%_+_10px)] md:right-0 md:z-10 md:w-[min(320px,calc(100vw_-_48px))]"
                    >
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-4 py-3">
                        <p className="axis-kicker">Source links</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">열어볼 원문 기사를 선택하세요.</p>
                      </div>
                      <div className="max-h-[min(260px,calc(100dvh_-_8rem))] overflow-y-auto p-2 md:max-h-[240px]">
                        {sourceOptions.map((source) => (
                          <button
                            key={source.id}
                            type="button"
                            onClick={() => openSourceLink(source.url)}
                            className="block w-full rounded-[var(--axis-radius-md)] p-3 text-left transition hover:bg-[var(--axis-surface-soft)]"
                          >
                            <span className="block text-sm font-semibold text-[var(--axis-ink)]">{source.title}</span>
                            {source.meta ? (
                              <span className="mt-1 block text-xs text-[var(--axis-muted)]">{source.meta}</span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={toggleStrategyContextPreview}
                  disabled={strategyLoading}
                  aria-pressed={strategyApplied}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] border px-3.5 py-2 text-sm font-semibold transition ${
                    strategyApplied
                      ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)] hover:bg-[rgba(220,90,36,0.14)]'
                      : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)] hover:border-[var(--axis-accent)]'
                  } disabled:cursor-wait disabled:opacity-70`}
                >
                  <Sparkles size={15} />
                  {strategyLoading ? '처리 중' : strategyApplied ? '맞춤 전략 적용' : '맞춤 전략 미적용'}
                </button>
              </div>
              {shareFeedback ? <p className="mt-3 text-xs font-semibold text-[var(--axis-muted)]">{shareFeedback}</p> : null}
              {strategyFeedback ? <p className="mt-2 text-xs font-semibold text-[var(--axis-muted)]">{strategyFeedback}</p> : null}
            </footer>
          </div>
        </div>
      </section>
      {previousCard ? (
        <button
          type="button"
          aria-label={`이전 카드: ${previousCard.title}`}
          onClick={() => navigateCard(previousCard)}
          className="absolute left-[max(24px,calc(50%_-_700px))] top-1/2 hidden w-[140px] -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-lg)] border border-white/20 bg-[rgba(16,16,20,0.30)] text-left shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur xl:block"
        >
          <div className="relative h-[128px]">
            {previousCard.coverImageUrl ? (
              <img
                src={previousCard.coverImageUrl}
                alt={previousCard.coverImageAlt}
                className={isCardLogoUrl(previousCard.coverImageUrl)
                  ? `${getCardLogoImageClass(previousCard.coverImageUrl, 'related')} blur-[1px]`
                  : 'absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]'}
                onError={(event) => replaceBrokenCardImage(event.currentTarget, previousCard, 'related')}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/80">
              <ChevronLeft size={12} />
              이전 카드
            </span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[11px] font-semibold text-white/70">{getPeerLabel(previousCard)}</p>
              <p className="mt-1 line-clamp-3 text-xs font-semibold leading-4 text-white">{previousCard.title}</p>
            </div>
          </div>
        </button>
      ) : null}
      {nextCard ? (
        <button
          type="button"
          aria-label={`다음 카드: ${nextCard.title}`}
          onClick={() => navigateCard(nextCard)}
          className="absolute right-[max(24px,calc(50%_-_700px))] top-1/2 hidden w-[140px] -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-lg)] border border-white/20 bg-[rgba(16,16,20,0.30)] text-left shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur xl:block"
        >
          <div className="relative h-[128px]">
            {nextCard.coverImageUrl ? (
              <img
                src={nextCard.coverImageUrl}
                alt={nextCard.coverImageAlt}
                className={isCardLogoUrl(nextCard.coverImageUrl)
                  ? `${getCardLogoImageClass(nextCard.coverImageUrl, 'related')} blur-[1px]`
                  : 'absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]'}
                onError={(event) => replaceBrokenCardImage(event.currentTarget, nextCard, 'related')}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/80">
              다음 카드
              <ChevronRight size={12} />
            </span>
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[11px] font-semibold text-white/70">{getPeerLabel(nextCard)}</p>
              <p className="mt-1 line-clamp-3 text-xs font-semibold leading-4 text-white">{nextCard.title}</p>
            </div>
          </div>
        </button>
      ) : null}
    </div>
  );
}
