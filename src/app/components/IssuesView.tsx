/**
 * IssuesView — 사이드바 "카드뉴스" 탭. press.stripe.com 톤 책등 리스트 단일 뷰.
 * Peer 칩 필터만 최소로 유지. 책등 클릭 시 CardNewsDetailView 풀스크린.
 */
import { useMemo, useState } from 'react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import type { CardNewsItem, PeerId } from '../../features/card-news/model/cardNews';
import { getExecutiveRank } from '../../features/card-news/mappers/cardNewsExecutive';
import { CardNewsBookSpineList } from './CardNewsBookSpine';
import { CardNewsDetailView } from './CardNewsDetailView';

interface IssuesViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

const peerChips: Array<{ id: 'all' | PeerId; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'samsung_sds', label: '삼성SDS' },
  { id: 'lg_cns', label: 'LG CNS' },
  { id: 'hyundai_autoever', label: '현대오토에버' },
  { id: 'posco_dx', label: '포스코DX' },
];

export function IssuesView({ bookmarkedIds, onToggleBookmark }: IssuesViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const [peerFilter, setPeerFilter] = useState<'all' | PeerId>('all');
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const ranked = getExecutiveRank(cards);
    return peerFilter === 'all' ? ranked : ranked.filter((c) => c.peer_id === peerFilter);
  }, [cards, peerFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas py-32">
        <p className="text-body-sm text-steel">카드뉴스를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas py-32">
        <p className="text-body-sm text-charcoal">{error}</p>
      </div>
    );
  }

  const detailCard: CardNewsItem | null = detailCardId
    ? filtered.find((c) => c.id === detailCardId) ?? cards.find((c) => c.id === detailCardId) ?? null
    : null;

  const relatedCards = detailCard
    ? filtered
        .filter((c) => c.id !== detailCard.id && (c.peer_id === detailCard.peer_id || c.category === detailCard.category))
        .slice(0, 3)
    : [];

  return (
    <div
      className="min-h-full"
      style={{
        background:
          'radial-gradient(ellipse at 50% -10%, var(--cream-soft) 0%, var(--surface) 40%, var(--canvas) 100%)',
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12 lg:py-24">
        {/* 헤더 */}
        <div className="mb-12">
          <p className="text-micro-eyebrow text-action mb-3">Card News Library</p>
          <h1 className="font-display text-heading-1 text-ink mb-3" style={{ fontWeight: 800 }}>
            카드뉴스
          </h1>
          <p className="text-body-md text-steel max-w-[58ch]">
            Peer 사별 시그니처 색을 입은 책등을 클릭하면 카드뉴스 상세가 열립니다. 총{' '}
            <span className="tabular-nums text-ink">{filtered.length}</span>건.
          </p>
        </div>

        {/* Peer 칩 필터 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {peerChips.map((chip) => {
            const active = peerFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setPeerFilter(chip.id)}
                className={`rounded-full border px-4 py-2 text-caption-bold transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-hairline-strong bg-canvas text-charcoal hover:border-ink hover:bg-cream-soft'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* 책등 리스트 */}
        {filtered.length > 0 ? (
          <CardNewsBookSpineList cards={filtered} onSelect={(id) => setDetailCardId(id)} />
        ) : (
          <div className="rounded-md border border-hairline bg-cream-soft px-6 py-16 text-center text-body-sm text-steel">
            선택한 Peer 의 카드뉴스가 없습니다.
          </div>
        )}
      </div>

      {/* Detail overlay */}
      {detailCard && (
        <CardNewsDetailView
          card={detailCard}
          bookmarked={bookmarkedIds.includes(detailCard.id)}
          onBookmark={() => onToggleBookmark(detailCard.id)}
          onClose={() => setDetailCardId(null)}
          relatedCards={relatedCards}
          onSelectRelated={(id) => setDetailCardId(id)}
        />
      )}
    </div>
  );
}
