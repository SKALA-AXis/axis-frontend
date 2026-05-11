/**
 * CardNewsDetailView — press.stripe.com 톤의 카드뉴스 상세 페이지.
 * 풀스크린 overlay. 상단 sticky bar (좌: 피어사 / 중앙: 약식 제목 / 우: AXIS).
 * Hero 는 피어사별 시그니처 색으로 flooding.
 */
import { useEffect } from 'react';
import { ArrowUpRight, Bookmark, X } from 'lucide-react';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  getDisplayDate,
  getFollowUpQuestions,
  getPeerLabel,
  getPotentialImpact,
  getSourceCount,
  getSummaryLines,
  getSuggestedActions,
  getTrustScore,
  getWhyImportant,
} from '../../features/card-news/mappers/cardNewsExecutive';
import { getPeerTheme } from '../../features/card-news/peerTheme';

interface CardNewsDetailViewProps {
  card: CardNewsItem;
  bookmarked: boolean;
  onBookmark: () => void;
  onClose: () => void;
  relatedCards?: CardNewsItem[];
  onSelectRelated?: (cardId: string) => void;
}

/* 본문에서 [숫자] citation 을 anchor 로 변환 ───────────── */
function renderWithCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, idx) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return <span key={idx}>{part}</span>;
    return (
      <a
        key={idx}
        href={`#source-${match[1]}`}
        className="mx-0.5 inline-flex items-center justify-center rounded-sm bg-cream px-1 text-fine-print font-display-strong text-action no-underline align-baseline hover:bg-action hover:text-white transition-colors"
      >
        [{match[1]}]
      </a>
    );
  });
}

export function CardNewsDetailView({
  card,
  bookmarked,
  onBookmark,
  onClose,
  relatedCards = [],
  onSelectRelated,
}: CardNewsDetailViewProps) {
  const theme = getPeerTheme(card.peer_id);
  const peerLabel = getPeerLabel(card);
  const summaryLines = getSummaryLines(card);
  const whyImportant = getWhyImportant(card);
  const potentialImpact = getPotentialImpact(card);
  const suggestedActions = getSuggestedActions(card);
  const followUps = getFollowUpQuestions(card);
  const sources = card.sources ?? [];

  /* ESC 닫기 + 배경 스크롤 잠금 ───────────────────────── */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      {/* ─── Sticky Top Bar — 좌: 피어 / 중앙: 약식 제목 / 우: AXIS ─── */}
      <header className="sticky top-0 z-20 border-b border-hairline-soft bg-canvas/92 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-[1280px] grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-4 px-6 lg:px-12">
          {/* Left — peer name */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: theme.accent }}
              aria-hidden
            />
            <span className="text-caption-bold tracking-wider uppercase text-ink truncate">
              {peerLabel}
            </span>
          </div>

          {/* Center — brief title (line-clamp-1) */}
          <div className="text-center">
            <p className="text-body-sm-strong text-charcoal truncate">{card.title}</p>
          </div>

          {/* Right — AXIS + close */}
          <div className="flex items-center justify-end gap-3">
            <span className="font-display text-body-md-strong tracking-tight text-ink hidden md:inline">
              AXIS
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md text-stone hover:bg-cream-soft hover:text-ink transition-colors"
              aria-label="닫기"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO — 피어사 시그니처 색 flooding ─────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: theme.hero, color: theme.contrastInk }}
      >
        {/* abstract dot pattern (PlaceholderPattern 과 일관) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.18] pointer-events-none"
          viewBox="0 0 800 600"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="detail-dots" width="48" height="48" patternUnits="userSpaceOnUse">
              <circle cx="24" cy="24" r="1.6" fill="white" opacity="0.5" />
              <circle cx="0" cy="0" r="0.8" fill="white" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#detail-dots)" />
        </svg>

        {/* radial highlight */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.accent}55 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />

        <div className="relative mx-auto max-w-[1280px] px-6 py-24 lg:px-12 lg:py-32">
          {/* eyebrow */}
          <p
            className="text-micro-eyebrow mb-8"
            style={{ color: theme.accent }}
          >
            {peerLabel} · {card.category_label || card.category} · {getDisplayDate(card)}
          </p>

          {/* headline */}
          <h1 className="font-display text-display-lg tracking-tight mb-8 max-w-[18ch] leading-[1.05]">
            {card.title}
          </h1>

          {/* subtitle / lede */}
          {card.subtitle && (
            <p className="text-subtitle text-white/85 max-w-[60ch] mb-12">
              {card.subtitle}
            </p>
          )}

          {/* meta row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-fine-print text-white/60 tabular-nums tracking-wider uppercase border-t border-white/15 pt-6">
            <span>AXIS AI</span>
            <span className="text-white/30">·</span>
            <span>{getDisplayDate(card)}</span>
            <span className="text-white/30">·</span>
            <span>출처 {getSourceCount(card)}건</span>
            <span className="text-white/30">·</span>
            <span>신뢰도 {getTrustScore(card)}%</span>
          </div>
        </div>
      </section>

      {/* ─── BODY — editorial 1-column ───────────────────────── */}
      <article className="mx-auto max-w-[760px] px-6 py-20 lg:py-32">
        {/* Lede — 첫 번째 summary 를 큰 lead 로 */}
        {summaryLines[0] && (
          <p
            className="text-heading-4 leading-[1.45] text-ink mb-16 first-letter:font-display first-letter:text-[5rem] first-letter:leading-[0.9] first-letter:float-left first-letter:mr-3 first-letter:mt-1"
            style={{ fontWeight: 500 }}
          >
            {renderWithCitations(summaryLines[0])}
          </p>
        )}

        {/* Article pages — H2 + paragraphs */}
        {card.articlePages?.map((page, pIdx) => (
          <section key={pIdx} className="mb-16">
            <h2
              className="font-display text-heading-2 text-ink mb-6 tracking-tight"
              style={{ fontWeight: 700 }}
            >
              {page.title}
            </h2>
            <div className="space-y-5">
              {page.paragraphs.map((para, idx) => (
                <p key={idx} className="text-body-md leading-[1.85] text-charcoal">
                  {renderWithCitations(para)}
                </p>
              ))}
            </div>
          </section>
        ))}

        {/* ─── SK AX 시사점 — pull-quote 톤 ─────────────────── */}
        {whyImportant && (
          <section
            className="my-20 -mx-6 lg:mx-0 px-6 lg:px-10 py-12 border-l-[3px]"
            style={{ borderColor: theme.accent, background: 'var(--cream-soft)' }}
          >
            <p
              className="text-micro-eyebrow mb-4"
              style={{ color: 'var(--primary-deep)' }}
            >
              SK AX 시사점
            </p>
            <p
              className="font-display text-heading-3 text-ink leading-snug mb-6"
              style={{ fontWeight: 700 }}
            >
              {whyImportant}
            </p>
            {potentialImpact && (
              <p className="text-body-md leading-[1.8] text-charcoal">
                {potentialImpact}
              </p>
            )}
          </section>
        )}

        {/* ─── 핵심 인사이트 ─────────────────────────────────── */}
        {card.insights?.length > 0 && (
          <section className="mb-16">
            <h2
              className="font-display text-heading-2 text-ink mb-8 tracking-tight"
              style={{ fontWeight: 700 }}
            >
              핵심 인사이트
            </h2>
            <ul className="space-y-5">
              {card.insights.map((item, idx) => (
                <li key={idx} className="flex gap-5">
                  <span
                    className="shrink-0 font-display text-body-sm-strong tabular-nums tracking-wider mt-1.5"
                    style={{ color: theme.accent === '#F2C56B' ? 'var(--primary-deep)' : theme.accent }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body-md leading-[1.8] text-charcoal flex-1">
                    {renderWithCitations(item)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─── 제안 액션 ────────────────────────────────────── */}
        {suggestedActions.length > 0 && (
          <section className="mb-16">
            <h2
              className="font-display text-heading-2 text-ink mb-8 tracking-tight"
              style={{ fontWeight: 700 }}
            >
              제안 액션
            </h2>
            <ol className="space-y-4">
              {suggestedActions.map((action, idx) => (
                <li
                  key={idx}
                  className="flex gap-5 rounded-md border border-hairline-soft bg-canvas px-5 py-4 hover:border-hairline-strong transition-colors"
                >
                  <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white text-fine-print font-display-strong tabular-nums">
                    {idx + 1}
                  </span>
                  <p className="text-body-md leading-[1.7] text-charcoal flex-1 pt-0.5">
                    {action}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ─── 후속 질문 ────────────────────────────────────── */}
        {followUps.length > 0 && (
          <section className="mb-16">
            <h2
              className="font-display text-heading-2 text-ink mb-8 tracking-tight"
              style={{ fontWeight: 700 }}
            >
              후속 질문
            </h2>
            <ul className="space-y-3">
              {followUps.map((q, idx) => (
                <li
                  key={idx}
                  className="text-body-md leading-[1.7] text-charcoal pl-5 border-l-2 border-hairline-strong italic"
                >
                  {q}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─── 출처 / Sources ───────────────────────────────── */}
        {sources.length > 0 && (
          <section className="border-t border-hairline pt-12 mt-20">
            <p className="text-micro-eyebrow text-stone mb-6">Sources</p>
            <ol className="space-y-4">
              {sources.map((src) => {
                const idx = src.index ?? 1;
                return (
                  <li
                    key={`${src.url}-${idx}`}
                    id={`source-${idx}`}
                    className="flex gap-4 text-body-sm text-charcoal"
                  >
                    <span className="shrink-0 text-fine-print font-display-strong text-action tabular-nums tracking-wider mt-1">
                      [{idx}]
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm-strong text-ink leading-snug">{src.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-fine-print text-stone tabular-nums">
                        {src.source_name && <span>{src.source_name}</span>}
                        {src.published_at && (
                          <>
                            <span className="text-hairline-strong">·</span>
                            <span>{src.published_at.slice(0, 10)}</span>
                          </>
                        )}
                        {typeof src.credibility_score === 'number' && (
                          <>
                            <span className="text-hairline-strong">·</span>
                            <span>신뢰도 {Math.round(src.credibility_score * 100)}%</span>
                          </>
                        )}
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-fine-print text-action hover:underline"
                        >
                          원문 열기
                          <ArrowUpRight size={11} />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* ─── 액션 바 (하단) ───────────────────────────────── */}
        <div className="mt-16 flex flex-wrap gap-3 border-t border-hairline pt-8">
          <button
            type="button"
            onClick={onBookmark}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-body-sm-strong transition-colors ${
              bookmarked
                ? 'bg-action text-white hover:bg-primary-deep'
                : 'border border-hairline-strong text-ink hover:bg-cream-soft'
            }`}
          >
            <Bookmark size={15} className={bookmarked ? 'fill-current' : ''} />
            {bookmarked ? '북마크됨' : '북마크'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border border-hairline-strong px-4 py-2.5 text-body-sm-strong text-ink hover:bg-cream-soft transition-colors"
          >
            목록으로
          </button>
        </div>
      </article>

      {/* ─── 관련 카드 (하단 footer) ──────────────────────────── */}
      {relatedCards.length > 0 && (
        <section className="border-t border-hairline-soft bg-surface">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12">
            <p className="text-micro-eyebrow text-action mb-3">More from AXIS</p>
            <h2
              className="font-display text-heading-2 text-ink mb-10 tracking-tight"
              style={{ fontWeight: 700 }}
            >
              관련 동향
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {relatedCards.slice(0, 3).map((rc) => {
                const rcTheme = getPeerTheme(rc.peer_id);
                return (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => onSelectRelated?.(rc.id)}
                    className="group text-left"
                  >
                    <div
                      className="relative aspect-[16/9] w-full overflow-hidden rounded-md mb-4"
                      style={{ background: rcTheme.hero }}
                    >
                      <svg
                        className="absolute inset-0 h-full w-full opacity-25"
                        viewBox="0 0 400 300"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <pattern
                            id={`rd-${rc.id}`}
                            width="40"
                            height="40"
                            patternUnits="userSpaceOnUse"
                          >
                            <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.4" />
                          </pattern>
                        </defs>
                        <rect width="400" height="300" fill={`url(#rd-${rc.id})`} />
                      </svg>
                    </div>
                    <p
                      className="text-fine-print font-display-strong tracking-wider uppercase mb-2"
                      style={{ color: rcTheme.accent === '#F2C56B' ? 'var(--primary-deep)' : rcTheme.accent }}
                    >
                      {getPeerLabel(rc)} · {getDisplayDate(rc)}
                    </p>
                    <h3
                      className="font-display text-heading-4 text-ink leading-snug line-clamp-3 group-hover:text-action transition-colors"
                      style={{ fontWeight: 700 }}
                    >
                      {rc.title}
                    </h3>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
