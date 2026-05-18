import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import type { CardNewsItem } from '../model/cardNews';
import { getDisplayDate, getPeerLabel, getSummaryLines } from '../mappers/cardNewsExecutive';
import { getCardSourceOptions, dedupeCardsById } from '../utils/cardSources';
import { shareCardNews } from '../utils/cardSharing';
import { getPeerLogo } from '../../../shared/utils/peerLogo';
import { ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';

export function FloatingCardNewsOverlay({
  card,
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
  const slides = [
    {
      kicker: 'AI 요약',
      title: card.title,
      lines: getSummaryLines(card).slice(0, 3),
    },
    {
      kicker: '시사점',
      title: card.detailTitle || 'SK AX 관점',
      lines: (card.insights.length > 0 ? card.insights : card.detailPoints).slice(0, 3),
    },
    {
      kicker: '다음 행동',
      title: '대응 방향',
      lines: (card.actionItems.length > 0 ? card.actionItems : card.detailPoints).slice(0, 3),
    },
  ].filter((slide) => slide.lines.length > 0);
  const activeIndex = slideIndex % Math.max(slides.length, 1);
  const activeSlide = slides[activeIndex] ?? slides[0];
  const slideImage = card.slides?.[activeIndex]?.image_url ?? card.coverImageUrl;
  const slideImageAlt = card.slides?.[activeIndex]?.image_alt ?? card.coverImageAlt;
  const [shareFeedback, setShareFeedback] = useState('');
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const sourceOptions = getCardSourceOptions(card);
  const orderedCards = dedupeCardsById(cards.length > 0 ? cards : [card]);
  const currentCardIndex = orderedCards.findIndex((item) => item.id === card.id);
  const previousCard = currentCardIndex > 0 ? orderedCards[currentCardIndex - 1] : null;
  const nextCard = currentCardIndex >= 0 && currentCardIndex < orderedCards.length - 1 ? orderedCards[currentCardIndex + 1] : null;

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

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="카드뉴스 상세 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(16,16,20,0.30)] backdrop-blur-[3px]"
      />
      <section className="absolute left-1/2 top-1/2 h-[min(620px,calc(100vh-56px))] w-[min(820px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_34px_110px_-42px_rgba(0,0,0,0.58)]">
        <div className="grid h-full md:grid-cols-[0.82fr_1fr]">
          <div className="relative min-h-[260px] bg-[#081324] md:h-full">
            {slideImage ? (
              <img src={slideImage} alt={slideImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-58 transition-opacity" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#081324]/48 to-black/92" />
            <div className="relative flex h-full flex-col justify-between p-6 text-white">
              <div className="flex items-start justify-between gap-3 text-xs font-semibold">
                <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">{getDisplayDate(card)}</span>
                <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1">{card.category_label ?? card.category}</span>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/72">{getPeerLabel(card)}</p>
                <h2 className="text-[26px] font-semibold leading-tight text-white">{card.title}</h2>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="axis-kicker">{activeSlide.kicker}</p>
                <h3 className="mt-2 text-heading-4 font-display leading-tight text-[var(--axis-ink)]">{activeSlide.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {activeSlide.lines.map((line, index) => (
                <p key={`${activeSlide.kicker}-${index}`} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3 text-sm leading-6 text-[var(--axis-body)]">
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-4 flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.kicker}
                    type="button"
                    onClick={() => onSlideChange(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-9 bg-[var(--axis-accent)]' : 'w-2.5 bg-[var(--axis-hairline)]'}`}
                    aria-label={`${slide.kicker} 보기`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <ExecutiveButton variant="secondary" onClick={() => onSlideChange((activeIndex + slides.length - 1) % slides.length)}>
                  이전
                </ExecutiveButton>
                <ExecutiveButton variant="secondary" onClick={() => onSlideChange((activeIndex + 1) % slides.length)}>
                  다음
                </ExecutiveButton>
                <ExecutiveButton variant={bookmarked ? 'primary' : 'secondary'} onClick={onBookmark}>
                  {bookmarked ? '북마크됨' : '북마크'}
                </ExecutiveButton>
                <ExecutiveButton
                  variant="secondary"
                  icon={<Share2 size={15} />}
                  onClick={() => {
                    void shareCardNews(card).then(setShareFeedback).catch(() => setShareFeedback('공유를 처리하지 못했습니다.'));
                  }}
                >
                  공유
                </ExecutiveButton>
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
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
                  >
                    {sourceOptions.length > 1 ? '원문 선택' : '원문 열기'}
                  </button>
                  {sourcePickerOpen && sourceOptions.length > 1 ? (
                    <div className="absolute bottom-[calc(100%+10px)] right-0 z-10 w-[320px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)]">
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-4 py-3">
                        <p className="axis-kicker">Source links</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">열어볼 원문 기사를 선택하세요.</p>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto p-2">
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
              </div>
              {shareFeedback ? <p className="mt-3 text-xs font-semibold text-[var(--axis-muted)]">{shareFeedback}</p> : null}
            </div>
          </div>
        </div>
      </section>
      {previousCard ? (
        <button
          type="button"
          onClick={() => navigateCard(previousCard)}
          className="absolute left-[max(16px,calc(50%-584px))] top-1/2 hidden w-[156px] -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-lg)] border border-white/20 bg-[rgba(16,16,20,0.28)] text-left shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur md:block"
        >
          <div className="relative h-[128px]">
            <img
              src={previousCard.coverImageUrl ?? getPeerLogo(previousCard.peer_id)}
              alt={previousCard.coverImageAlt ?? previousCard.title}
              className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
            <span className="absolute left-3 top-3 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/80">이전 카드</span>
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
          onClick={() => navigateCard(nextCard)}
          className="absolute right-[max(16px,calc(50%-584px))] top-1/2 hidden w-[156px] -translate-y-1/2 overflow-hidden rounded-[var(--axis-radius-lg)] border border-white/20 bg-[rgba(16,16,20,0.28)] text-left shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur md:block"
        >
          <div className="relative h-[128px]">
            <img
              src={nextCard.coverImageUrl ?? getPeerLogo(nextCard.peer_id)}
              alt={nextCard.coverImageAlt ?? nextCard.title}
              className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
            <span className="absolute right-3 top-3 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/80">다음 카드</span>
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
