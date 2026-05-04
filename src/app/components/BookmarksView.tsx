import { Bookmark, Share2 } from 'lucide-react';
import { useState } from 'react';
import { cardNewsItems } from '../../shared/mocks/cardNews';
import { CardNewsPreviewPanel } from './CardNewsPreviewPanel';
import { Button } from './ui/button';

interface BookmarksViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

export function BookmarksView({ bookmarkedIds, onToggleBookmark }: BookmarksViewProps) {
  const cards = cardNewsItems.filter((card) => bookmarkedIds.includes(card.id));
  const [previewCardId, setPreviewCardId] = useState<string | null>(cards[0]?.id ?? null);

  return (
    <div className="axis-page min-h-full px-3 py-4 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[68rem]">
        <div className="axis-page-header">
          <h1 className="axis-page-title">북마크</h1>
          <p className="axis-page-subtitle">저장한 카드뉴스를 다시 확인할 수 있습니다.</p>
        </div>

        {cards.length === 0 ? (
          <div className="axis-panel rounded-[1.25rem] p-7 text-center">
            <p className="text-base text-black/72">아직 저장된 카드뉴스가 없습니다.</p>
            <p className="mt-1.5 text-xs text-black/46">홈 화면에서 북마크 아이콘을 누르면 여기에 추가됩니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className={`axis-panel rounded-[1.25rem] bg-white/86 p-5 transition ${
                    previewCardId === card.id ? 'border-[#ff7f00]/24' : 'border-black/8'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#ff7f00] px-3 py-1.5 text-xs font-semibold text-white">
                          {card.category}
                        </span>
                        <span className="text-xs text-black/42">{card.date}</span>
                      </div>
                      <h2 className="mt-3 text-base font-semibold leading-snug text-black/90">{card.title}</h2>
                    </div>
                    <Bookmark className="fill-current text-[#d96200]" size={18} />
                  </div>

                  <ul className="mt-4 space-y-1.5 pl-4 text-xs leading-5 text-black/72">
                    {card.summary.slice(0, 3).map((item) => (
                      <li key={item} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <Button
                      type="button"
                      onClick={() => setPreviewCardId(card.id)}
                      className="h-8 rounded-full bg-[#111111] px-4 text-xs text-white hover:bg-[#ff7f00]"
                    >
                      카드 보기
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onToggleBookmark(card.id)}
                      className="h-8 rounded-full border-black/10 bg-white px-4 text-xs text-black/72 hover:bg-[#f5f6fa]"
                    >
                      북마크 해제
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(card.sourceUrl, '_blank', 'noopener,noreferrer')}
                      className="h-8 rounded-full border-black/10 bg-white px-4 text-xs text-black/72 hover:bg-[#f5f6fa]"
                    >
                      <Share2 className="mr-2 size-4" />
                      원문 열기
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="xl:sticky xl:top-4 xl:self-start">
              <CardNewsPreviewPanel
                cardId={previewCardId}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={onToggleBookmark}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
