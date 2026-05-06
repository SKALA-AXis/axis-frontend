import { useEffect, useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Copy, ExternalLink, Mail, Send, Share2 } from 'lucide-react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FloatingAiChat } from './FloatingAiChat';

interface HomeCardNewsViewProps {
  activeCardId?: string | null;
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

type TouchState = {
  startY: number;
  startX: number;
};

const shareTargets = [
  { id: 'copy', label: '링크 복사', icon: Copy },
  { id: 'mail', label: '이메일 공유', icon: Mail },
  { id: 'native', label: '기기 공유', icon: Send },
] as const;

export function HomeCardNewsView({ activeCardId, bookmarkedIds, onToggleBookmark }: HomeCardNewsViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pageIndexByCardId, setPageIndexByCardId] = useState<Record<string, number>>({});
  const [shareCard, setShareCard] = useState<CardNewsItem | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const wheelLockRef = useRef(false);

  const currentCard = cards[currentIndex] ?? null;
  const currentPageIndex = currentCard ? pageIndexByCardId[currentCard.id] ?? 0 : 0;
  const totalPages = currentCard ? getTotalPages(currentCard) : 0;
  const isBookmarked = currentCard ? bookmarkedIds.includes(currentCard.id) : false;

  useEffect(() => {
    if (cards.length === 0) {
      return;
    }

    setPageIndexByCardId((current) => {
      const next = { ...current };

      for (const card of cards) {
        if (next[card.id] === undefined) {
          next[card.id] = 0;
        }
      }

      return next;
    });

    setCurrentIndex((current) => Math.min(current, cards.length - 1));
  }, [cards]);

  useEffect(() => {
    if (!activeCardId || cards.length === 0) {
      return;
    }

    const targetIndex = cards.findIndex((card) => card.id === activeCardId);
    if (targetIndex >= 0) {
      setCurrentIndex(targetIndex);
    }
  }, [activeCardId, cards]);

  const moveToNextCard = () => {
    if (cards.length === 0) {
      return;
    }
    setCurrentIndex((current) => (current + 1) % cards.length);
    setShareFeedback('');
  };

  const moveToPreviousCard = () => {
    if (cards.length === 0) {
      return;
    }
    setCurrentIndex((current) => (current - 1 + cards.length) % cards.length);
    setShareFeedback('');
  };

  const movePage = (direction: 'previous' | 'next') => {
    if (!currentCard) {
      return;
    }
    setPageIndexByCardId((current) => {
      const maxIndex = getTotalPages(currentCard) - 1;
      const previousIndex = current[currentCard.id] ?? 0;
      const nextIndex = direction === 'next' ? Math.min(previousIndex + 1, maxIndex) : Math.max(previousIndex - 1, 0);

      return {
        ...current,
        [currentCard.id]: nextIndex,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="axis-page flex h-full min-h-screen items-center justify-center px-4">
        <div className="axis-panel rounded-[1.25rem] px-6 py-5 text-sm text-black/56">카드뉴스를 불러오는 중입니다.</div>
      </div>
    );
  }

  if (error || !currentCard) {
    return (
      <div className="axis-page flex h-full min-h-screen items-center justify-center px-4">
        <div className="axis-panel rounded-[1.25rem] px-6 py-5 text-sm text-black/56">
          {error ?? '카드뉴스를 표시할 수 없습니다.'}
        </div>
      </div>
    );
  }

  const handleTouchStart = (clientX: number, clientY: number) => {
    setTouchState({ startX: clientX, startY: clientY });
  };

  const handleTouchEnd = (clientX: number, clientY: number) => {
    if (!touchState) {
      return;
    }

    const deltaY = clientY - touchState.startY;
    const deltaX = Math.abs(touchState.startX - clientX);

    if (deltaY < -80 && deltaX < 60) {
      moveToNextCard();
    }

    if (deltaY > 80 && deltaX < 60) {
      moveToPreviousCard();
    }

    setTouchState(null);
  };

  const handleWheel = (deltaY: number) => {
    if (wheelLockRef.current || Math.abs(deltaY) < 24) {
      return;
    }

    wheelLockRef.current = true;

    if (deltaY > 0) {
      moveToNextCard();
    } else {
      moveToPreviousCard();
    }

    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 360);
  };

  const handleShare = async (target: (typeof shareTargets)[number]['id']) => {
    if (!shareCard) {
      return;
    }

    const sharePayload = {
      title: shareCard.title,
      text: `${shareCard.title}\n${shareCard.summary.join('\n')}`,
      url: shareCard.sourceUrl,
    };

    if (target === 'copy') {
      await navigator.clipboard.writeText(`${shareCard.title}\n${shareCard.sourceUrl}`);
      setShareFeedback('링크를 복사했습니다.');
      return;
    }

    if (target === 'mail') {
      const subject = encodeURIComponent(shareCard.title);
      const body = encodeURIComponent(`${shareCard.title}\n\n${shareCard.sourceUrl}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      setShareFeedback('이메일 앱으로 공유를 시도합니다.');
      return;
    }

    if (target === 'native' && navigator.share) {
      await navigator.share(sharePayload);
      setShareFeedback('공유를 완료했습니다.');
      return;
    }

    await navigator.clipboard.writeText(`${shareCard.title}\n${shareCard.sourceUrl}`);
    setShareFeedback('기기 공유를 지원하지 않아 링크를 복사했습니다.');
  };

  return (
    <div className="axis-page h-full min-h-screen overflow-hidden px-2 py-2 sm:px-3 lg:px-4">
      <div className="mx-auto flex h-full max-w-[80rem] flex-col">
        <div className="axis-page-header px-1 pb-2" />

        <div
          role="region"
          tabIndex={0}
          onTouchStart={(event) => handleTouchStart(event.touches[0].clientX, event.touches[0].clientY)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY)}
          onWheel={(event) => {
            event.preventDefault();
            handleWheel(event.deltaY);
          }}
          className="flex flex-1 items-center justify-center pb-6 outline-none sm:pb-8"
        >
          <article className="grid w-full max-w-[72rem] -translate-y-5 grid-cols-[minmax(2.75rem,4.5rem)_minmax(0,1fr)_minmax(2.75rem,4.5rem)] items-center gap-2 sm:-translate-y-8 sm:gap-4">
            <div className="flex -translate-y-10 items-center justify-center sm:-translate-y-12">
              <SidePageButton
                direction="previous"
                disabled={currentPageIndex === 0}
                onClick={() => movePage('previous')}
              />
            </div>

            <div className="flex justify-center">
              <div className="w-auto max-w-full">
                <div className="mb-4 flex items-center justify-between px-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/92 px-2 py-1.5 shadow-[0_10px_24px_rgba(17,17,17,0.06)]">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <span
                        key={`${currentCard.id}-${index}`}
                        className={`block h-1.5 rounded-full transition-all ${
                          index === currentPageIndex ? 'w-10 bg-[#EE7501]' : 'w-2.5 bg-black/14'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[0.84rem] font-medium tracking-[0.03em] text-black/42 sm:text-[0.92rem]">
                    {currentCard.date}
                  </span>
                </div>
                <div className="relative aspect-[4/5] h-[78vh] max-h-[980px] min-h-[620px] w-auto max-w-full overflow-hidden rounded-[1.9rem] border-[4px] border-[#efc4b8] bg-white shadow-[0_28px_52px_rgba(17,17,17,0.2)] sm:h-[84vh]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,242,0.78))]" />

                  <div className="relative z-10 flex h-full flex-col p-6 sm:p-8">
                    <NewsCardPage
                      card={currentCard}
                      pageIndex={currentPageIndex}
                      pageLabel={`${currentPageIndex + 1} / ${totalPages}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex translate-y-10 flex-col items-center gap-4 sm:translate-y-12">
                <SidePageButton
                  direction="next"
                  disabled={currentPageIndex === totalPages - 1}
                  onClick={() => movePage('next')}
                />

                <div className="h-12 w-px bg-black/10" />

                <IconActionButton
                  label={isBookmarked ? '북마크 해제' : '북마크 저장'}
                  onClick={() => onToggleBookmark(currentCard.id)}
                  active={isBookmarked}
                >
                  <Bookmark className={isBookmarked ? 'fill-current' : ''} size={24} strokeWidth={1.8} />
                </IconActionButton>
                <IconActionButton
                  label="공유"
                  onClick={() => {
                    setShareCard(currentCard);
                    setShareFeedback('');
                  }}
                >
                  <Share2 size={24} strokeWidth={1.8} />
                </IconActionButton>
              </div>
            </div>
          </article>
        </div>
      </div>

      <Dialog open={Boolean(shareCard)} onOpenChange={(open) => !open && setShareCard(null)}>
        <DialogContent className="max-w-md rounded-3xl border-black/10 bg-white/95 p-6">
          <DialogHeader>
            <DialogTitle className="text-black/90">공유할 곳 선택</DialogTitle>
            <DialogDescription className="text-black/58">{shareCard?.title}</DialogDescription>
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

      <FloatingAiChat />
    </div>
  );
}

type NewsCardPageProps = {
  card: CardNewsItem;
  pageIndex: number;
  pageLabel: string;
};

type CoverPageProps = {
  card: CardNewsItem;
  pageLabel: string;
};

type ArticlePageProps = {
  page: CardNewsItem['articlePages'][number];
  pageLabel: string;
};

type InsightPageProps = {
  card: CardNewsItem;
  pageLabel: string;
};

function NewsCardPage({ card, pageIndex, pageLabel }: NewsCardPageProps): JSX.Element {
  if (pageIndex === 0) {
    return <CoverPage card={card} pageLabel={pageLabel} />;
  }

  if (pageIndex <= card.articlePages.length) {
    return <ArticlePage page={card.articlePages[pageIndex - 1]} pageLabel={pageLabel} />;
  }

  if (pageIndex === card.articlePages.length + 1) {
    return <InsightPage card={card} pageLabel={pageLabel} />;
  }

  return <DetailPromptPage card={card} pageLabel={pageLabel} />;
}

function CoverPage({ card, pageLabel }: CoverPageProps): JSX.Element {
  return (
    <div className="relative h-full overflow-hidden rounded-[1.25rem] bg-[#fcf7f4]">
      <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-28" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.88)_24%,rgba(255,255,255,0.72)_100%)]" />
      <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.62),transparent_70%)]" />
      <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex min-w-24 justify-center rounded-xl bg-[#ffab4a] px-4 py-2.5 text-[0.96rem] font-bold text-white shadow-[0_10px_22px_rgba(255,171,74,0.26)] sm:text-[1rem]">
            {card.category}
          </span>
          <span className="rounded-full bg-black/5 px-3.5 py-1.5 text-[13px] font-medium text-black/48">{pageLabel}</span>
        </div>

        <div className="max-w-[86%]">
          <p className="mb-3 text-[0.76rem] font-bold uppercase tracking-[0.24em] text-black/34">Executive Summary</p>
          <h2 className="text-[1.18rem] font-extrabold leading-[1.68] tracking-[-0.03em] text-black sm:text-[1.42rem] lg:text-[1.62rem]">
            {card.title}
          </h2>
          <div className="mt-6 h-px w-24 bg-[linear-gradient(90deg,#ff7f00,rgba(255,127,0,0))]" />
        </div>
      </div>
    </div>
  );
}

function ArticlePage({ page, pageLabel }: ArticlePageProps): JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-[1.25rem] bg-[linear-gradient(180deg,#fffaf5,#fffefc)] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#EE7501]/70">Article Summary</p>
        <span className="rounded-full bg-black/5 px-3.5 py-1.5 text-[13px] font-medium text-black/48">{pageLabel}</span>
      </div>
      <SectionTitle>{page.title}</SectionTitle>
      <div className="space-y-4 text-[0.98rem] leading-8 text-black/82 lg:text-[1.06rem]">
        {page.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

function InsightPage({ card, pageLabel }: InsightPageProps): JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-[1.25rem] border border-[#E1002A]/10 bg-[linear-gradient(180deg,#fffefe,#fff8f6)] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#E1002A]/70">Insight</p>
        <span className="rounded-full bg-black/5 px-3.5 py-1.5 text-[13px] font-medium text-black/48">{pageLabel}</span>
      </div>
      <SectionTitle>SK AX 관점에서의 시사점</SectionTitle>
      <BulletList items={card.insights} />
    </div>
  );
}

function DetailPromptPage({ card, pageLabel }: InsightPageProps): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-5 rounded-[1.25rem] bg-[linear-gradient(180deg,#161616,#0f0f10)] px-6 py-7 text-white sm:px-8 sm:py-8">
      <div>
        <div className="flex items-center gap-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/58">Final Page</p>
          <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white/72">{pageLabel}</span>
        </div>
        <h3 className="mt-3 text-[1.18rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.32rem]">
          {card.detailTitle}
        </h3>
      </div>

      <section className="rounded-[1rem] bg-white/8 p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/52">요약</p>
        <p className="mt-3 text-[0.92rem] leading-7 text-white/76">{card.detailDescription}</p>
        <div className="mt-4 space-y-2.5">
          {card.detailPoints.map((item) => (
            <div key={item} className="rounded-[0.85rem] bg-white/10 px-3.5 py-3 text-[0.88rem] leading-6 text-white/82">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-auto text-white">
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-[0.96rem] font-semibold text-[#ffb15c] transition hover:text-[#ffd19a]"
        >
          원문 링크 열기
          <ExternalLink size={16} />
        </a>
        <p className="mt-2 break-all text-[0.84rem] leading-6 text-white/54">{card.sourceUrl}</p>
      </section>
    </div>
  );
}

function getTotalPages(card: CardNewsItem) {
  return card.articlePages.length + 3;
}

function SidePageButton({
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

function SectionTitle({ children }: { children: string }): JSX.Element {
  return (
    <h3 className="mb-3 mt-4 border-l-[3px] border-[#E1002A] pl-2 text-[1.12rem] font-semibold tracking-[-0.02em] text-black/88 sm:text-[1.18rem]">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }): JSX.Element {
  return (
    <ul className="space-y-2 pl-5 text-[1rem] leading-8 text-black/86 marker:text-[#EE7501] sm:text-[1.06rem]">
      {items.map((item) => (
        <li key={item} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

function IconActionButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white transition ${
        active ? 'border-[#EE7501]/24 bg-[#EE7501]/10 text-[#EE7501]' : 'text-black/84 hover:border-[#EE7501]/24 hover:bg-[#fff5ea]'
      }`}
    >
      {children}
    </button>
  );
}
