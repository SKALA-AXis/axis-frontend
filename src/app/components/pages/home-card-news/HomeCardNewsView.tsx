import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';

import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSourceCount,
  getTrustScore,
} from '../../../../features/card-news/mappers/cardNewsExecutive';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { FloatingAiChat } from '../../shared/FloatingAiChat';
import { PlaceholderPattern } from '../../shared/PlaceholderPattern';
import { CardNewsDetailView } from '../../shared/CardNewsDetailView';
import { KeywordPeerGraph } from './KeywordPeerGraph';
import { EditorialCard, Stat } from './cards';
import { shareTargets } from './constants';
import type { ShareTargetId } from './types';
import { buildGraph } from './utils';

interface HomeCardNewsViewProps {
  activeCardId?: string | null;
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

export function HomeCardNewsView({ activeCardId, bookmarkedIds, onToggleBookmark }: HomeCardNewsViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const graph = useMemo(() => buildGraph(rankedCards), [rankedCards]);
  const [selectedNodeId, setSelectedNodeId] = useState('root');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [shareCard, setShareCard] = useState<CardNewsItem | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0];
  const galleryCards = selectedNode?.cards.length ? selectedNode.cards : rankedCards;
  const selectedCard =
    (selectedCardId ? rankedCards.find((card) => card.id === selectedCardId) : null) ??
    galleryCards[0] ??
    rankedCards[0] ??
    null;

  useEffect(() => {
    if (!activeCardId) {
      return;
    }

    const target = rankedCards.find((card) => card.id === activeCardId);
    if (target) {
      setSelectedCardId(target.id);
      setSelectedNodeId(target.peer_id ? `peer:${target.peer_id}` : 'root');
    }
  }, [activeCardId, rankedCards]);

  useEffect(() => {
    if (!selectedCardId && selectedCard) {
      setSelectedCardId(selectedCard.id);
    }
  }, [selectedCard, selectedCardId]);

  const handleShare = async (target: ShareTargetId) => {
    if (!shareCard) {
      return;
    }

    const text = `${shareCard.title}\n${(shareCard.summary_lines ?? []).join('\n')}\n${shareCard.sourceUrl}`;

    if (target === 'copy') {
      await navigator.clipboard.writeText(text);
      setShareFeedback('카드뉴스 링크를 복사했습니다.');
      return;
    }

    if (target === 'mail') {
      window.location.href = `mailto:?subject=${encodeURIComponent(shareCard.title)}&body=${encodeURIComponent(text)}`;
      setShareFeedback('이메일 앱으로 공유를 시도합니다.');
      return;
    }

    if (target === 'native' && navigator.share) {
      await navigator.share({ title: shareCard.title, text, url: shareCard.sourceUrl });
      setShareFeedback('공유를 완료했습니다.');
      return;
    }

    await navigator.clipboard.writeText(text);
    setShareFeedback('기기 공유를 지원하지 않아 링크를 복사했습니다.');
  };

  if (isLoading) {
    return (
      <div className="bg-canvas min-h-full flex items-center justify-center py-32">
        <div className="rounded-lg border border-hairline-soft bg-cream-soft px-5 py-4 text-body-sm text-steel">
          카드뉴스를 준비하는 중입니다.
        </div>
      </div>
    );
  }

  if (error || !selectedCard) {
    return (
      <div className="bg-canvas min-h-full flex items-center justify-center py-32">
        <div className="rounded-lg border-l-4 border-urgent bg-cream-soft px-5 py-4 text-body-sm text-charcoal">
          {error ?? '표시할 카드뉴스가 없습니다.'}
        </div>
      </div>
    );
  }

  const heroCard = rankedCards[0];
  const totalCount = rankedCards.length;
  const urgentCount = rankedCards.filter((card) => card.exposure_band === 'high').length;
  const avgTrust = rankedCards.length
    ? Math.round(rankedCards.reduce((sum, card) => sum + getTrustScore(card), 0) / rankedCards.length)
    : 0;
  const peerSet = new Set(rankedCards.map((card) => card.peer_id ?? 'unknown'));
  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  return (
    <div className="bg-canvas min-h-full">
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-12 lg:py-12">
          <h2 className="font-display text-heading-1 text-ink mb-6" style={{ fontWeight: 800 }}>
            Network Map
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="relative lg:col-span-8">
              <div className="relative axis-graph-stage min-h-[420px]">
                <KeywordPeerGraph
                  nodes={graph.nodes}
                  links={graph.links}
                  selectedNodeId={selectedNodeId}
                  onSelect={(nodeId) => {
                    setSelectedNodeId(nodeId);
                    const nextNode = graph.nodes.find((node) => node.id === nodeId);
                    setSelectedCardId(nextNode?.cards[0]?.id ?? rankedCards[0]?.id ?? null);
                  }}
                />

                <div className="pointer-events-none absolute left-6 top-6">
                  <p className="text-micro-eyebrow text-white/50">Selected</p>
                  <p className="mt-1.5 font-display text-heading-3 text-white" style={{ fontWeight: 700 }}>
                    {selectedNode?.label ?? '전체'}
                  </p>
                </div>

                <div className="pointer-events-none absolute right-6 top-6 flex flex-col items-end gap-3">
                  <p className="text-fine-print text-white/50 tabular-nums">{todayDate}</p>
                  <div className="flex items-center gap-4 text-fine-print text-white/80 tabular-nums">
                    <span><span className="font-display-strong text-white">4</span> 카테고리</span>
                    <span className="text-white/30">·</span>
                    <span><span className="font-display-strong text-white">{peerSet.size}</span> Peer</span>
                    <span className="text-white/30">·</span>
                    <span><span className="font-display-strong text-white">{totalCount}</span> 카드</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedNodeId('root');
                    setSelectedCardId(rankedCards[0]?.id ?? null);
                  }}
                  className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-fine-print text-white hover:bg-white/15 transition-colors"
                >
                  <RotateCcw size={12} />
                  초기화
                </button>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-6">
                <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-hairline-soft">
                  <h3 className="font-display text-heading-5 text-ink" style={{ fontWeight: 700 }}>
                    {selectedNode?.label ?? '전체'} 관련
                  </h3>
                  <span className="text-caption-bold text-stone tabular-nums">{galleryCards.length}건</span>
                </div>

                {galleryCards.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {galleryCards.slice(0, 5).map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setDetailCardId(card.id);
                        }}
                        className={`group block w-full text-left transition-colors ${
                          card.id === selectedCard.id ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-md border border-hairline-soft mb-2.5">
                          <PlaceholderPattern peer={card.peer_id ?? 'default'} ratio="16/9" showLabel={false} />
                          {card.exposure_band === 'high' && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
                          )}
                          {card.id === selectedCard.id && (
                            <div className="absolute inset-0 ring-2 ring-action ring-inset rounded-md" />
                          )}
                        </div>
                        <p className="text-fine-print text-stone mb-1 tabular-nums">
                          {getPeerLabel(card)} · {getDisplayDate(card)}
                        </p>
                        <p className="text-body-md-strong text-ink line-clamp-2 leading-snug">
                          {card.title}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-steel py-12 text-center">
                    노드를 선택하면 관련 카드가 표시됩니다
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12 lg:py-24">
          <p className="text-micro-eyebrow text-action mb-6">오늘의 핵심 동향</p>
          <article
            className="group grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 cursor-pointer"
            onClick={() => setDetailCardId(heroCard.id)}
          >
            <div className="relative overflow-hidden rounded-lg border border-hairline-soft lg:col-span-6">
              <PlaceholderPattern peer={heroCard.peer_id ?? 'default'} ratio="16/9" />
              {heroCard.exposure_band === 'high' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
              )}
            </div>
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-caption-bold text-stone mb-4">
                {getPeerLabel(heroCard)} · {heroCard.category_label || heroCard.category}
              </p>
              <h1 className="text-heading-1 font-display text-ink mb-4">{heroCard.title}</h1>
              {heroCard.subtitle && (
                <p className="text-subtitle text-charcoal mb-6">{heroCard.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-caption text-stone mb-8">
                <span>AXIS AI</span><span className="text-hairline-strong">·</span>
                <span>{getDisplayDate(heroCard)}</span><span className="text-hairline-strong">·</span>
                <span>출처 {getSourceCount(heroCard)}건</span><span className="text-hairline-strong">·</span>
                <span>신뢰도 {getTrustScore(heroCard)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setDetailCardId(heroCard.id)}>
                  전체 보기
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            <Stat label="오늘 동향 카드" value={totalCount} unit="건" />
            <Stat label="우선 검토" value={urgentCount} unit="건" />
            <Stat label="평균 신뢰도" value={avgTrust} unit="%" />
            <Stat label="모니터링 Peer" value={peerSet.size} unit="사" />
          </div>
        </div>
      </section>

      {rankedCards.length > 0 && (
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12 lg:py-24">
            <div className="mb-12">
              <p className="text-micro-eyebrow text-action mb-3">전체 카드뉴스</p>
              <h2 className="font-display text-heading-2 text-ink" style={{ fontWeight: 700 }}>
                Insights <span className="tabular-nums text-stone">{rankedCards.length}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
              {rankedCards.map((card) => (
                <EditorialCard
                  key={card.id}
                  card={card}
                  onClick={() => setDetailCardId(card.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {detailCardId && (() => {
        const detailCard = rankedCards.find((card) => card.id === detailCardId);
        if (!detailCard) return null;
        const related = rankedCards
          .filter((card) =>
            card.id !== detailCard.id &&
            (card.peer_id === detailCard.peer_id || card.category === detailCard.category),
          )
          .slice(0, 3);
        return (
          <CardNewsDetailView
            card={detailCard}
            bookmarked={bookmarkedIds.includes(detailCard.id)}
            onBookmark={() => onToggleBookmark(detailCard.id)}
            onClose={() => setDetailCardId(null)}
            relatedCards={related}
            onSelectRelated={(id) => setDetailCardId(id)}
          />
        );
      })()}

      <Dialog open={Boolean(shareCard)} onOpenChange={(open) => !open && setShareCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공유할 곳 선택</DialogTitle>
            <DialogDescription>{shareCard?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {shareTargets.map((target) => {
              const Icon = target.icon;
              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => void handleShare(target.id)}
                  className="flex w-full items-center gap-3 rounded-md border border-hairline-soft bg-canvas px-4 py-3 text-left transition-colors hover:border-action"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-action text-white">
                    <Icon size={18} />
                  </span>
                  <span className="text-body-md-strong text-ink">{target.label}</span>
                </button>
              );
            })}
          </div>
          {shareFeedback && <p className="mt-3 text-caption text-steel">{shareFeedback}</p>}
        </DialogContent>
      </Dialog>

      <FloatingAiChat />
    </div>
  );
}
