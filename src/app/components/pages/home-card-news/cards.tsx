import { ArrowUpRight } from 'lucide-react';

import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getPeerLabel, getSectorLabel, getSourceCount, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { getCardImage, unsplashUrl } from '../../../../features/card-news/cardImages';

export function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-micro-eyebrow text-stone mb-2">{label}</p>
      <p className="font-display text-stat-display text-ink tabular-nums">
        {value.toLocaleString('ko-KR')}
        {unit && <span className="ml-1 text-heading-4 text-steel">{unit}</span>}
      </p>
    </div>
  );
}

export function EditorialCard({ card, onClick }: { card: CardNewsItem; onClick: () => void }) {
  const body = card.subtitle || card.summary?.[0] || getSummaryLines(card)[0] || '';
  const image = getCardImage(card);

  return (
    <article className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-hairline-soft mb-7 bg-cream-soft">
        <img
          src={unsplashUrl(image.id, 800, 450)}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {card.exposure_band === 'high' && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
        )}
      </div>

      <p className="text-fine-print font-display-strong tracking-[0.12em] uppercase text-action mb-4">
        {getPeerLabel(card)}
      </p>

      <h3
        className="font-display text-heading-3 text-ink leading-[1.2] mb-5 group-hover:text-action transition-colors"
        style={{ fontWeight: 700 }}
      >
        {card.title}
      </h3>

      {body && (
        <p className="text-body-md leading-[1.7] text-charcoal mb-8 line-clamp-5">
          {body}
        </p>
      )}

      <p className="inline-block text-body-sm-strong text-action border-b-2 border-action pb-1.5 group-hover:border-primary-deep group-hover:text-primary-deep transition-colors">
        {getSectorLabel(card)}
      </p>
    </article>
  );
}

export function GalleryCard({ card }: { card: CardNewsItem }) {
  return (
    <>
      <p className="text-fine-print text-stone mb-1 tabular-nums">
        {getPeerLabel(card)} · {getDisplayDate(card)}
      </p>
      <p className="text-body-md-strong text-ink line-clamp-2 leading-snug">
        {card.title}
      </p>
    </>
  );
}

export function HeroMeta({ card }: { card: CardNewsItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-caption text-stone">
      <span>AXIS AI</span><span className="text-hairline-strong">·</span>
      <span>{getDisplayDate(card)}</span><span className="text-hairline-strong">·</span>
      <span>출처 {getSourceCount(card)}건</span>
    </div>
  );
}

export function CardLinkIcon() {
  return <ArrowUpRight className="absolute bottom-6 right-6 size-4 text-stone group-hover:text-action transition-colors" />;
}
