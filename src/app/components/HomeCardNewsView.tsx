import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, ExternalLink, Mail, Send, Share2 } from 'lucide-react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  getCardImage,
  getCardImageAlt,
  getDisplayDate,
  getExecutiveRank,
  getExposureScore,
  getPeerLabel,
  getPotentialImpact,
  getSuggestedActions,
  getSummaryLines,
  getTrustScore,
} from '../../features/card-news/mappers/cardNewsExecutive';
import {
  CardDecisionPanel,
  EvidenceChainPanel,
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveCard,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
  InsightActionStrip,
  TrustSeal,
} from './executive/ExecutiveSystem';
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

const shareTargets = [
  { id: 'copy', label: '링크 복사', icon: Copy },
  { id: 'mail', label: '이메일 공유', icon: Mail },
  { id: 'native', label: '기기 공유', icon: Send },
] as const;

export function HomeCardNewsView({ activeCardId, bookmarkedIds, onToggleBookmark }: HomeCardNewsViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shareCard, setShareCard] = useState<CardNewsItem | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');

  const activeCard = rankedCards[activeIndex] ?? null;
  const highExposureCount = rankedCards.filter((card) => card.exposure_band === 'high' || getExposureScore(card) >= 80).length;
  const averageTrust =
    rankedCards.length === 0
      ? 0
      : Math.round(rankedCards.reduce((total, card) => total + getTrustScore(card), 0) / rankedCards.length);
  const actionCount = rankedCards.reduce((total, card) => total + getSuggestedActions(card).length, 0);

  useEffect(() => {
    if (!activeCardId || rankedCards.length === 0) {
      return;
    }

    const targetIndex = rankedCards.findIndex((card) => card.id === activeCardId);
    if (targetIndex >= 0) {
      setActiveIndex(targetIndex);
    }
  }, [activeCardId, rankedCards]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, rankedCards.length - 1)));
  }, [rankedCards.length]);

  const move = (direction: 'previous' | 'next') => {
    if (rankedCards.length === 0) {
      return;
    }

    setActiveIndex((current) => {
      if (direction === 'previous') {
        return (current - 1 + rankedCards.length) % rankedCards.length;
      }

      return (current + 1) % rankedCards.length;
    });
  };

  const handleShare = async (target: (typeof shareTargets)[number]['id']) => {
    if (!shareCard) {
      return;
    }

    const payload = {
      title: shareCard.title,
      text: `${shareCard.title}\n${getSummaryLines(shareCard).join('\n')}`,
      url: shareCard.sourceUrl,
    };

    if (target === 'copy') {
      await navigator.clipboard.writeText(`${shareCard.title}\n${shareCard.sourceUrl}`);
      setShareFeedback('공유 링크를 복사했습니다.');
      return;
    }

    if (target === 'mail') {
      window.location.href = `mailto:?subject=${encodeURIComponent(shareCard.title)}&body=${encodeURIComponent(payload.text)}`;
      setShareFeedback('이메일 앱으로 공유를 시도합니다.');
      return;
    }

    if (target === 'native' && navigator.share) {
      await navigator.share(payload);
      setShareFeedback('공유를 완료했습니다.');
      return;
    }

    await navigator.clipboard.writeText(`${shareCard.title}\n${shareCard.sourceUrl}`);
    setShareFeedback('기기 공유를 지원하지 않아 링크를 복사했습니다.');
  };

  if (isLoading) {
    return (
      <ExecutivePage className="flex items-center justify-center">
        <div className="axis-panel-flat p-5 text-sm text-[var(--axis-muted)]">Executive briefing을 불러오는 중입니다.</div>
      </ExecutivePage>
    );
  }

  if (error || !activeCard) {
    return (
      <ExecutivePage className="flex items-center justify-center">
        <div className="axis-panel-flat p-5 text-sm text-[var(--axis-muted)]">{error ?? '표시할 카드뉴스가 없습니다.'}</div>
      </ExecutivePage>
    );
  }

  const isBookmarked = bookmarkedIds.includes(activeCard.id);

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="Executive intelligence console"
          title="오늘의 전략 카드뉴스"
          subtitle="백엔드 CardNews, EvidenceChain, Financial Reference를 기준으로 고노출 신호와 후속 액션을 한 화면에 정렬했습니다."
          actions={
            <>
              <TrustSeal />
              <ExecutiveButton variant="secondary" icon={<Share2 size={16} />} onClick={() => setShareCard(activeCard)}>
                공유
              </ExecutiveButton>
            </>
          }
        />

        <section className="grid gap-3 md:grid-cols-3">
          <ExecutiveMetric label="High exposure" value={highExposureCount} helper="80점 이상 또는 high band" tone="danger" />
          <ExecutiveMetric label="Average trust" value={`${averageTrust}`} helper="출처 신뢰도 평균" tone="success" />
          <ExecutiveMetric label="Suggested actions" value={actionCount} helper="오늘 검토 가능한 실행 항목" tone="accent" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_26rem]">
          <article className="axis-panel-flat overflow-hidden">
            <div className="grid min-h-[520px] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-[360px] overflow-hidden bg-[var(--axis-navy)]">
                <img src={getCardImage(activeCard)} alt={getCardImageAlt(activeCard)} className="absolute inset-0 h-full w-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.2),rgba(17,24,39,0.94))]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <ExecutiveBadge tone="dark">{getPeerLabel(activeCard)}</ExecutiveBadge>
                    <ExecutiveBadge tone={activeCard.validation_pass ? 'success' : 'warning'}>
                      {activeCard.validation_pass ? 'Evidence passed' : 'Review required'}
                    </ExecutiveBadge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">{getDisplayDate(activeCard)}</p>
                    <h2 className="mt-3 text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[2.8rem]">
                      {activeCard.title}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/72">{getPotentialImpact(activeCard)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <ExecutiveBadge tone={activeCard.exposure_band === 'high' ? 'danger' : 'warning'}>
                    Exposure {getExposureScore(activeCard)}
                  </ExecutiveBadge>
                  <ExecutiveBadge tone="success">Trust {getTrustScore(activeCard)}</ExecutiveBadge>
                  <ExecutiveBadge>Source {activeCard.source_count ?? activeCard.sources?.length ?? 1}</ExecutiveBadge>
                </div>

                <div>
                  <p className="axis-kicker">3-line readout</p>
                  <div className="mt-3 space-y-3">
                    {getSummaryLines(activeCard).slice(0, 3).map((line) => (
                      <p key={line} className="border-l-2 border-[var(--axis-accent)] pl-3 text-base leading-7 text-[var(--axis-body)]">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <CardDecisionPanel card={activeCard} />

                <div className="mt-auto flex flex-wrap gap-2">
                  <ExecutiveButton
                    variant={isBookmarked ? 'primary' : 'secondary'}
                    onClick={() => onToggleBookmark(activeCard.id)}
                  >
                    {isBookmarked ? '북마크 해제' : '북마크 저장'}
                  </ExecutiveButton>
                  <a
                    href={activeCard.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:bg-[var(--axis-surface-muted)]"
                  >
                    <ExternalLink size={16} />
                    원문
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-3">
              <button
                type="button"
                onClick={() => move('previous')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)]"
                aria-label="이전 카드"
              >
                <ArrowLeft size={17} />
              </button>
              <div className="flex items-center gap-2">
                {rankedCards.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-10 bg-[var(--axis-accent)]' : 'w-2.5 bg-[var(--axis-hairline)]'}`}
                    aria-label={`${index + 1}번째 카드 보기`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => move('next')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)]"
                aria-label="다음 카드"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </article>

          <aside className="grid gap-3">
            {rankedCards.slice(0, 4).map((card, index) => (
              <ExecutiveCard
                key={card.id}
                card={card}
                compact
                selected={index === activeIndex}
                bookmarked={bookmarkedIds.includes(card.id)}
                onSelect={() => setActiveIndex(index)}
                onBookmark={() => onToggleBookmark(card.id)}
              />
            ))}
          </aside>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <InsightActionStrip card={activeCard} />
          <EvidenceChainPanel card={activeCard} />
        </section>
      </ExecutiveContainer>

      <Dialog open={Boolean(shareCard)} onOpenChange={(open) => !open && setShareCard(null)}>
        <DialogContent className="max-w-md rounded-[var(--axis-radius-xl)] border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-6">
          <DialogHeader>
            <DialogTitle className="text-[var(--axis-ink)]">공유할 곳 선택</DialogTitle>
            <DialogDescription className="text-[var(--axis-muted)]">{shareCard?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {shareTargets.map((target) => {
              const Icon = target.icon;

              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => void handleShare(target.id)}
                  className="flex w-full items-center gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white px-4 py-3 text-left transition hover:border-[var(--axis-accent)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-[var(--axis-accent)]">
                    <Icon size={18} />
                  </span>
                  <span className="font-medium text-[var(--axis-ink)]">{target.label}</span>
                </button>
              );
            })}
          </div>

          {shareFeedback ? <p className="text-sm text-[var(--axis-muted)]">{shareFeedback}</p> : null}
        </DialogContent>
      </Dialog>

      <FloatingAiChat />
    </ExecutivePage>
  );
}
