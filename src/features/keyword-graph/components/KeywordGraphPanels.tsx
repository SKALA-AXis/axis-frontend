import { getCardLogoImageClass } from '../../card-news/cardLogoFallback';
import { getDisplayDate, getPeerLabel } from '../../card-news/mappers/cardNewsExecutive';
import type { CardNewsItem } from '../../card-news/model/cardNews';
import type { KeywordGraphLoadStage } from '../model/keywordGraph';
import { Skeleton } from '../../../app/components/ui/skeleton';

// 키워드 그래프 관련 표현 컴포넌트(카드버튼·로딩) (refactoring P2/stage3). KeywordGraphView 에서 그대로 옮긴 것.
export function KeywordRelatedCardButton({ card, onOpen }: { card: CardNewsItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full min-w-0 flex-col rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)]"
    >
      <div className="relative mb-3 aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[var(--axis-radius-md)] bg-[#081324]">
        {card.coverImageUrl ? (
          <img
            src={card.coverImageUrl}
            alt={card.coverImageAlt}
            className={getCardLogoImageClass(card.coverImageUrl, 'related') ?? 'absolute inset-0 h-full w-full object-cover opacity-55'}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
        <span className="absolute bottom-2 left-2 max-w-[calc(100%_-_16px)] truncate text-xs font-semibold text-white">{getPeerLabel(card)}</span>
      </div>
      <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
      <h3 className="mt-1 min-h-[3.75rem] line-clamp-3 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
    </button>
  );
}

export function KeywordRelatedCardsLoading() {
  return (
    <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
          <Skeleton className="aspect-[4/3] w-full bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-3 h-3 w-20 bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-2 h-4 w-full bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-2 h-4 w-4/5 bg-[var(--axis-surface-muted)]" />
        </div>
      ))}
    </div>
  );
}

export function KeywordGraphLoading({
  stage,
  elapsedSeconds,
}: {
  stage: KeywordGraphLoadStage;
  elapsedSeconds: number;
}) {
  const stageLabel =
    stage === 'requesting' ? '데이터 요청 중' : stage === 'normalizing' ? '응답 정리 중' : '그래프 구성 중';
  const elapsedLabel =
    elapsedSeconds < 60
      ? `${elapsedSeconds}초`
      : `${Math.floor(elapsedSeconds / 60)}분 ${String(elapsedSeconds % 60).padStart(2, '0')}초`;

  return (
    <div className="flex h-full min-h-[420px] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[360px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-7 text-center shadow-[0_24px_70px_-42px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(220,90,36,0.22)] bg-[rgba(220,90,36,0.08)]">
          <div className="relative h-11 w-7 animate-[spin_1.8s_ease-in-out_infinite]">
            <div className="absolute inset-x-0 top-0 mx-auto h-5 w-6 rounded-b-full border-2 border-[var(--axis-accent)] border-t-0" />
            <div className="absolute inset-x-0 bottom-0 mx-auto h-5 w-6 rounded-t-full border-2 border-[var(--axis-accent)] border-b-0" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--axis-accent)]" />
          </div>
        </div>

        <p className="mt-6 axis-kicker">Keyword graph</p>
        <h2 className="mt-2 text-xl font-semibold leading-7 text-[var(--axis-ink)]">{stageLabel}</h2>
        <div className="mt-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">실제 경과 시간</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--axis-ink)]">{elapsedLabel}</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--axis-surface-muted)]">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(220,90,36,0.22),var(--axis-accent),rgba(220,90,36,0.22))]" />
        </div>
      </div>
    </div>
  );
}
