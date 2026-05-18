import { Bookmark, Share2 } from 'lucide-react';
import { useCardNews } from '../../../features/card-news/hooks/useCardNews';

interface CardNewsPreviewPanelProps {
  cardId: string | null;
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

export function CardNewsPreviewPanel({ cardId, bookmarkedIds, onToggleBookmark }: CardNewsPreviewPanelProps) {
  const { cards, isLoading } = useCardNews();
  const card = cards.find((item) => item.id === cardId) ?? null;

  if (isLoading) {
    return (
      <aside className="flex min-h-[32rem] items-center justify-center rounded-[1.1rem] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-[var(--axis-body)]">카드뉴스를 불러오는 중입니다.</p>
      </aside>
    );
  }

  if (!card) {
    return (
      <aside className="flex min-h-[32rem] items-center justify-center rounded-[1.1rem] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-6 text-center shadow-sm">
        <div>
          <p className="text-sm font-medium text-[var(--axis-body)]">카드뉴스를 선택하면 여기에서 미리볼 수 있습니다.</p>
          <p className="mt-2 text-xs text-[var(--axis-muted)]">북마크 목록에서 카드를 선택해 주세요.</p>
        </div>
      </aside>
    );
  }

  const isBookmarked = bookmarkedIds.includes(card.id);

  return (
    <aside className="overflow-hidden rounded-[1.1rem] border border-[var(--axis-hairline)] bg-[#081324] shadow-[0_18px_38px_rgba(17,17,17,0.10)]">
      <div className="relative aspect-[4/5] overflow-hidden">
        {card.coverImageUrl ? (
          <img
            src={card.coverImageUrl}
            alt={card.coverImageAlt}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#081324]/50 to-black/92" />
        <div className="relative flex h-full flex-col justify-between p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold tracking-[0.06em]">
              {card.date}
            </span>
            <span className="rounded-sm border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              {card.category}
            </span>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/75">AXIS CARD</p>
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-white">{card.title}</h2>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-[var(--axis-canvas)] p-3">
        <button
          type="button"
          aria-label={isBookmarked ? '북마크 해제' : '북마크 저장'}
          onClick={() => onToggleBookmark(card.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            isBookmarked ? 'bg-action/12 text-action' : 'text-[var(--axis-body)] hover:bg-cream-soft'
          }`}
        >
          <Bookmark className={isBookmarked ? 'fill-current' : ''} size={18} strokeWidth={1.8} />
        </button>
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--axis-body)] transition hover:bg-cream-soft"
          aria-label="원문 열기"
        >
          <Share2 size={18} strokeWidth={1.8} />
        </a>
      </div>
    </aside>
  );
}
