/**
 * CardNewsBookSpine — press.stripe.com 톤의 책등 (라이트 변형).
 * 라이트 cream 배경 + 2px Peer 색 테두리. hover 시 테두리 두꺼워지고 Peer-색 그림자.
 * 3D perspective + 스크롤 연동 tilt + 일회성 entrance.
 *
 * 정적 트랜지션·hover·entrance 정의는 theme.css `.axis-spine` 블록 참조.
 */
import { useEffect, useRef, useState } from 'react';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import { getPeerLabel } from '../../features/card-news/mappers/cardNewsExecutive';
import { getPeerTheme } from '../../features/card-news/peerTheme';
import { getCardImage, unsplashUrl } from '../../features/card-news/cardImages';

interface CardNewsBookSpineProps {
  card: CardNewsItem;
  index: number;
  onClick: () => void;
}

export function CardNewsBookSpine({ card, index, onClick }: CardNewsBookSpineProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);

  /* entrance — IntersectionObserver (한 번만) ─────────────── */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* 스크롤 연동 tilt — viewport 안 위치에 따라 rotateX 변화 ── */
  useEffect(() => {
    if (!inView) return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = (rect.top + rect.height / 2) / vh;        /* 0 = top, 1 = bottom */
      const offset = Math.max(-1, Math.min(1, (center - 0.5) * 2));
      const tilt = 3 + offset * 5;                              /* viewport 위→정면, 아래→내려다봄 */
      node.style.setProperty('--spine-tilt', `${tilt.toFixed(2)}deg`);
    };

    const onScroll = () => {
      if (!scheduled) {
        rafId = requestAnimationFrame(update);
        scheduled = true;
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, [inView]);

  const theme = getPeerTheme(card.peer_id);
  const image = getCardImage(card);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      data-in-view={inView}
      className="axis-spine group relative block w-full rounded-[4px]"
      style={{
        ['--spine-index' as string]: index,
        ['--spine-border' as string]: theme.solid,
        ['--spine-glow' as string]: `${theme.solid}55`, /* ~33% alpha hover halo */
      }}
      aria-label={`${getPeerLabel(card)} — ${card.title}`}
    >
      {/* ─── 윗면 (책 위에서 본 페이지 단면) ───────────────
       * preserve-3d 부모 안에서 90° 뒤로 누워, 진짜 3D 평면. */}
      <div
        aria-hidden
        className="axis-spine-top pointer-events-none absolute left-0 right-0 -top-[9px] h-[9px] rounded-t-[3px] md:-top-[11px] md:h-[11px]"
      >
        {/* 가는 vertical lines — 페이지 단면 */}
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(60,40,15,0.18) 0 1px, transparent 1px 4px), linear-gradient(180deg, #f5ecd2 0%, #d2bf95 60%, #ad9665 100%)',
          }}
        />
      </div>

      {/* ─── 우측면 (책 옆 단면) ─────────────────────────── */}
      <div
        aria-hidden
        className="axis-spine-right pointer-events-none absolute top-0 bottom-0 -right-[9px] w-[9px] rounded-r-[3px] md:-right-[11px] md:w-[11px]"
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, rgba(60,40,15,0.20) 0 1px, transparent 1px 3px), linear-gradient(90deg, #d2bf95 0%, #b59c6f 65%, #8c7547 100%)',
          }}
        />
      </div>

      {/* ─── 정면 (이미지 + content) ─────────────────────── */}
      <div className="axis-spine-face relative h-[92px] w-full overflow-hidden rounded-[4px] md:h-[104px]">
        {/* 배경 이미지 */}
        <img
          src={unsplashUrl(image.id, 1600, 240)}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />

        {/* 어둠 overlay (좌·우 진하게, 중앙 옅게) */}
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(8,10,16,0.78) 0%, rgba(8,10,16,0.46) 30%, rgba(8,10,16,0.46) 70%, rgba(8,10,16,0.78) 100%)',
          }}
        />

        {/* 상단 highlight — 페이지 단면이 책등 정면에 닿는 미세 글로우 */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,235,180,0.45) 50%, transparent 100%)' }}
        />

        {/* hover 시 Peer-색 상단 sweep */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{ background: `linear-gradient(180deg, ${theme.solid}45 0%, transparent 55%)` }}
        />

        {/* 컨텐츠 — Peer / 제목 / AXIS (3-col) */}
        <div className="relative grid h-full grid-cols-[minmax(150px,1fr)_minmax(0,3fr)_minmax(90px,auto)] items-center gap-6 px-7 md:gap-12 md:px-12">
          <span
            className="font-display tracking-tight text-body-md italic truncate transition-colors duration-300"
            style={{
              fontWeight: 500,
              color: theme.accent,
              textShadow: '0 1px 4px rgba(0,0,0,0.65)',
            }}
          >
            {getPeerLabel(card)}
          </span>

          <span
            className="text-center text-body-md text-white truncate transition-colors duration-300 md:text-body-md-strong"
            style={{
              fontWeight: 500,
              letterSpacing: '-0.01em',
              textShadow: '0 1px 6px rgba(0,0,0,0.7)',
            }}
          >
            {card.title}
          </span>

          <span className="flex items-center justify-end">
            <img
              src="/axis-logo.png"
              alt="AXIS"
              className="h-7 w-auto object-contain opacity-90 transition-opacity duration-300 group-hover:opacity-100 md:h-8"
              style={{ filter: 'brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
            />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── 리스트 컨테이너 ──────────────────────────────────── */
interface CardNewsBookSpineListProps {
  cards: CardNewsItem[];
  onSelect: (cardId: string) => void;
}

export function CardNewsBookSpineList({ cards, onSelect }: CardNewsBookSpineListProps) {
  return (
    <div className="axis-spine-shelf relative space-y-4 md:space-y-5">
      {cards.map((card, idx) => (
        <CardNewsBookSpine key={card.id} card={card} index={idx} onClick={() => onSelect(card.id)} />
      ))}
    </div>
  );
}
