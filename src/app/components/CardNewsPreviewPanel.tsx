import { Bookmark, Share2 } from 'lucide-react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';

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
      <aside className="flex min-h-[32rem] items-center justify-center rounded-[1.1rem] border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-black/70">카드뉴스를 불러오는 중입니다.</p>
      </aside>
    );
  }

  if (!card) {
    return (
      <aside className="flex min-h-[32rem] items-center justify-center rounded-[1.1rem] border border-black/10 bg-white p-6 text-center shadow-sm">
        <div>
          <p className="text-sm font-medium text-black/70">카드뉴스를 선택하면 여기에서 미리볼 수 있습니다.</p>
          <p className="mt-2 text-xs text-black/48">북마크 목록에서 카드를 선택해 주세요.</p>
        </div>
      </aside>
    );
  }

  const isBookmarked = bookmarkedIds.includes(card.id);

  return (
    <aside className="rounded-[1.1rem] border-[3px] border-[#EE7501]/26 bg-white p-5 shadow-[0_18px_38px_rgba(17,17,17,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex min-w-20 justify-center rounded-lg bg-action px-3 py-1.5 text-[0.95rem] font-bold text-white">
            {card.category}
          </span>
          <span className="text-[0.95rem] font-medium text-black/44">{card.date}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={isBookmarked ? '북마크 해제' : '북마크 저장'}
            onClick={() => onToggleBookmark(card.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              isBookmarked ? 'bg-action/12 text-action' : 'text-black/84 hover:bg-cream-soft'
            }`}
          >
            <Bookmark className={isBookmarked ? 'fill-current' : ''} size={18} strokeWidth={1.8} />
          </button>
          <a
            href={card.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/84 transition hover:bg-cream-soft"
            aria-label="원문 열기"
          >
            <Share2 size={18} strokeWidth={1.8} />
          </a>
        </div>
      </div>

      <h2 className="mt-4 text-[1rem] font-semibold tracking-[-0.03em] text-black/92 sm:text-[1.14rem]">
        {card.title}
      </h2>

      <div className="mt-4 h-px bg-black/75" />

      <section className="mt-4">
        <h3 className="mb-3 border-l-[3px] border-[#E1002A] pl-2 text-[0.9rem] font-semibold tracking-[-0.02em] text-black/88">
          뉴스 요약
        </h3>
        <ul className="space-y-1 pl-4.5 text-[0.74rem] leading-5 text-black/86 marker:text-action">
          {card.summary.map((item) => (
            <li key={item} className="list-disc">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h3 className="mb-3 border-l-[3px] border-[#E1002A] pl-2 text-[0.9rem] font-semibold tracking-[-0.02em] text-black/88">
          SK AX 관점에서의 시사점
        </h3>
        <ul className="space-y-1 pl-4.5 text-[0.74rem] leading-5 text-black/86 marker:text-action">
          {card.insights.map((item) => (
            <li key={item} className="list-disc">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
