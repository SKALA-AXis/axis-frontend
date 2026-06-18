/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선, 카드뉴스 데이터 연동, 브리핑·믹서 페이지 구성 수정
 *   2026-05-18 최종민 — 프론트 전면 개편(designing 통합·차트·라우팅·브리핑 흡수) 반영
 *   2026-05-18 박지원 — 신뢰도 점수 UI 제거
 *   2026-06-15 최종민 — 전 페이지 하단 문의 연락처 푸터 추가
 */
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bookmark,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Link2,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { CardNewsItem } from '../../../features/card-news/model/cardNews';
import {
  getEvidenceChain,
  getEvidenceCompleteness,
  getEvidenceStatus,
  getExposureLabel,
  getExposureScore,
  getFinancialNarrative,
  getFollowUpQuestions,
  getPeerLabel,
  getPotentialImpact,
  getSectorLabel,
  getSourceCount,
  getSuggestedActions,
  getSummaryLines,
  getTrustScore,
  getWhyImportant,
} from '../../../features/card-news/mappers/cardNewsExecutive';

// 모든 뷰 하단에 공통으로 노출되는 지원/문의 푸터. ExecutivePage 가 렌더하므로
// DashboardShell 이 분기하는 11개 뷰 전체에 한 번에 적용된다.
function SupportFooter() {
  return (
    <footer className="border-t border-[var(--axis-hairline)]">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col items-start gap-1.5 px-3 py-4 text-caption text-[var(--axis-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5 2xl:px-6">
        <p>© 2026 SK AX · AXIS — AX Intelligence Signal</p>
        <p>
          문제 발생 또는 문의사항은{' '}
          <a
            href="mailto:axis.admin@sk.com"
            className="font-semibold text-[var(--axis-body)] underline-offset-2 hover:underline"
          >
            axis.admin@sk.com
          </a>
          {' '}으로 연락해 주세요.
        </p>
      </div>
    </footer>
  );
}

export function ExecutivePage({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  // 자식 뷰는 flex-1 래퍼 안에서 기존 block flow 를 그대로 유지하고,
  // 푸터만 그 아래로 밀어 짧은 페이지에서도 화면 하단에 고정되게 한다.
  return (
    <div className={`axis-executive-page flex min-h-full flex-col overflow-auto ${className}`}>
      <div className="flex-1">{children}</div>
      <SupportFooter />
    </div>
  );
}

export function ExecutiveContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1760px] px-3 py-4 sm:px-4 lg:px-5 2xl:px-6 ${className}`}>{children}</div>;
}

export function ExecutiveHeader({
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  if (!actions) {
    return <h1 className="sr-only">{title}</h1>;
  }

  return (
    <header className="mb-3 flex justify-end pb-1">
      <h1 className="sr-only">{title}</h1>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function ExecutiveButton({
  children,
  variant = 'primary',
  icon,
  disabled = false,
  onClick,
  type = 'button',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const variants = {
    primary: 'bg-[var(--axis-accent)] text-white hover:bg-[var(--axis-accent-strong)]',
    secondary: 'border border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-[var(--axis-ink)] hover:border-[var(--axis-accent)]',
    ghost: 'bg-transparent text-[var(--axis-ink)] hover:bg-[var(--axis-surface-muted)]',
    danger: 'bg-[var(--axis-danger)] text-white hover:bg-primary-deep',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] px-4 py-2 text-body-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function ExecutiveMetric({
  label,
  value,
  helper,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    neutral: 'text-[var(--axis-ink)]',
    accent: 'text-[var(--axis-accent-strong)]',
    success: 'text-[var(--axis-success)]',
    warning: 'text-[var(--axis-warning)]',
    danger: 'text-[var(--axis-danger)]',
  };

  return (
    <div className="axis-panel-flat p-4">
      <p className="text-caption-bold text-[var(--axis-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${tones[tone]}`}>{value}</p>
      {helper ? <p className="mt-1 text-caption leading-5 text-[var(--axis-muted)]">{helper}</p> : null}
    </div>
  );
}

export function ExecutiveBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'dark';
}) {
  const tones = {
    neutral: 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-[var(--axis-muted)]',
    accent: 'border-[rgba(198,106,74,0.22)] bg-[rgba(198,106,74,0.10)] text-[var(--axis-accent-strong)]',
    success: 'border-[rgba(25,128,56,0.18)] bg-[rgba(25,128,56,0.08)] text-[var(--axis-success)]',
    warning: 'border-[rgba(183,121,31,0.18)] bg-[rgba(183,121,31,0.10)] text-[var(--axis-warning)]',
    danger: 'border-[rgba(218,30,40,0.18)] bg-[rgba(218,30,40,0.08)] text-[var(--axis-danger)]',
    dark: 'border-[var(--axis-navy)] bg-[var(--axis-navy)] text-white',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-[var(--axis-radius-sm)] border px-2.5 py-1 text-caption-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ExecutiveCard({
  card,
  selected = false,
  compact = false,
  bookmarked = false,
  onOpen,
  onBookmark,
  onSelect,
}: {
  card: CardNewsItem;
  selected?: boolean;
  compact?: boolean;
  bookmarked?: boolean;
  onOpen?: () => void;
  onBookmark?: () => void;
  onSelect?: () => void;
}) {
  const exposure = getExposureScore(card);
  const trust = getTrustScore(card);
  const evidence = getEvidenceStatus(card);
  const tone = card.exposure_band === 'high' ? 'danger' : card.exposure_band === 'medium' ? 'warning' : 'neutral';
  const summaryLines = getSummaryLines(card).slice(0, compact ? 2 : 3);

  return (
    <article
      className={`axis-executive-card group ${selected ? 'ring-2 ring-[var(--axis-accent)]' : ''}`}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <ExecutiveBadge tone={tone}>{getExposureLabel(card)}</ExecutiveBadge>
            <ExecutiveBadge>{getPeerLabel(card)}</ExecutiveBadge>
            <ExecutiveBadge>{getSectorLabel(card)}</ExecutiveBadge>
          </div>
          <h3 className="mt-3 line-clamp-3 text-heading-5 font-semibold tracking-[-0.02em] text-[var(--axis-ink)]">
            {card.title}
          </h3>
        </div>
        <button
          type="button"
          aria-label={bookmarked ? '북마크 해제' : '북마크 저장'}
          onClick={(event) => {
            event.stopPropagation();
            onBookmark?.();
          }}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] border transition ${
            bookmarked
              ? 'border-[rgba(198,106,74,0.32)] bg-[rgba(198,106,74,0.12)] text-[var(--axis-accent)]'
              : 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-[var(--axis-muted)] hover:text-[var(--axis-accent)]'
          }`}
        >
          <Bookmark className={bookmarked ? 'fill-current' : ''} size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {summaryLines.map((line) => (
          <p key={line} className="text-body-sm text-[var(--axis-body)]">
            {line}
          </p>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Exposure" value={`${exposure}`} />
        <MiniMetric label="Trust" value={`${trust}`} />
        <MiniMetric label="Evidence" value={`${getEvidenceCompleteness(card)}%`} />
      </div>

      {!compact ? (
        <div className="mt-4 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-3">
          <p className="text-caption-bold text-[var(--axis-muted)]">Next action</p>
          <p className="mt-1 text-body-sm font-medium text-[var(--axis-ink)]">{getSuggestedActions(card)[0] ?? '데이터 없음'}</p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-[var(--axis-hairline)] pt-3 text-caption text-[var(--axis-muted)]">
        <span className="inline-flex items-center gap-1.5">
          {evidence.passed ? <CheckCircle2 size={14} className="text-[var(--axis-success)]" /> : <CircleDashed size={14} className="text-[var(--axis-warning)]" />}
          {evidence.passed ? 'Evidence passed' : 'Review required'}
        </span>
        {onOpen ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-1 font-semibold text-[var(--axis-accent-strong)] transition hover:text-[var(--axis-ink)]"
          >
            상세
            <ArrowUpRight size={14} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function InsightActionStrip({ card }: { card: CardNewsItem }) {
  const actions = getSuggestedActions(card).slice(0, 3);
  const questions = getFollowUpQuestions(card).slice(0, 2);

  return (
    <section className="axis-panel-flat p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={17} className="text-[var(--axis-accent)]" />
        <h3 className="axis-section-heading">Actionable insights</h3>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {actions.length > 0 ? (
          actions.map((action, index) => (
            <div key={action} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-3">
              <span className="text-caption-bold text-[var(--axis-accent-strong)]">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-1 text-body-sm font-medium text-[var(--axis-ink)]">{action}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-3 text-body-sm text-[var(--axis-muted)]">
            데이터 없음
          </div>
        )}
      </div>
      {questions.length > 0 ? (
        <div className="mt-4 border-t border-[var(--axis-hairline)] pt-4">
          <p className="text-caption-bold text-[var(--axis-muted)]">Follow-up questions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {questions.map((question) => (
              <span key={question} className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-2 text-caption font-medium text-[var(--axis-body)]">
                {question}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function EvidenceChainPanel({ card }: { card: CardNewsItem }) {
  const chain = getEvidenceChain(card);
  const status = getEvidenceStatus(card);
  const sourceLinks = chain.source_links ?? [];
  const financialRefs = chain.financial_refs ?? [];
  const mbbRefs = chain.mbb_refs ?? [];

  return (
    <section className="axis-panel-flat overflow-hidden">
      <div className="border-b border-[var(--axis-hairline)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="axis-kicker">Evidence chain</p>
            <h3 className="axis-section-heading mt-1">검증 근거 4종</h3>
          </div>
          <ExecutiveBadge tone={status.passed ? 'success' : 'warning'}>
            {status.passed ? '검증 통과' : `검토 필요 ${status.missing.length ? status.missing.join(', ') : ''}`}
          </ExecutiveBadge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <EvidencePill active={status.source} icon={<Link2 size={15} />} label="Source" />
          <EvidencePill active={status.financial} icon={<BarChart3 size={15} />} label="Financial" />
          <EvidencePill active={status.provenance} icon={<Network size={15} />} label="Provenance" />
          <EvidencePill active={status.market} icon={<FileText size={15} />} label="MBB / Market" />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-[var(--axis-hairline)] p-4 lg:border-b-0 lg:border-r">
          <h4 className="text-heading-5 font-semibold text-[var(--axis-ink)]">출처 링크</h4>
          <div className="mt-3 space-y-2">
            {sourceLinks.length > 0 ? (
              sourceLinks.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-3 transition hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-semibold text-[var(--axis-ink)]">{source.title ?? '원문 기사'}</span>
                    <span className="mt-1 block text-caption text-[var(--axis-muted)]">
                      {source.source_name ?? 'Source'} · 신뢰도 {Math.round((source.credibility_score ?? 0.8) * 100)}
                    </span>
                  </span>
                  <ExternalLink size={15} className="shrink-0 text-[var(--axis-accent)]" />
                </a>
              ))
            ) : (
              <EmptyEvidence label="연결된 출처 링크가 없습니다." />
            )}
          </div>
        </div>

        <div className="p-4">
          <h4 className="text-heading-5 font-semibold text-[var(--axis-ink)]">재무·시장 근거</h4>
          <div className="mt-3 space-y-2">
            {financialRefs.length > 0 ? (
              financialRefs.map((ref, index) => (
                <div key={`${ref.period}-${index}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-caption-bold text-[var(--axis-accent-strong)]">{ref.period ?? '기간 미상'}</span>
                    <span className="text-caption text-[var(--axis-muted)]">
                      DART {ref.dart_rcept_no ?? '-'} {ref.ir_page ? `· p.${ref.ir_page}` : ''}
                    </span>
                  </div>
                  <p className="mt-2 text-body-sm font-medium text-[var(--axis-ink)]">{ref.narrative ?? getFinancialNarrative(card)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-caption text-[var(--axis-muted)]">
                    {typeof ref.delta_pct_qoq === 'number' ? <span>QoQ {ref.delta_pct_qoq > 0 ? '+' : ''}{ref.delta_pct_qoq}%</span> : null}
                    {typeof ref.delta_pct_yoy === 'number' ? <span>YoY {ref.delta_pct_yoy > 0 ? '+' : ''}{ref.delta_pct_yoy}%</span> : null}
                    {typeof ref.value_krwbn === 'number' ? <span>{ref.metric_ko ?? ref.metric}: {ref.value_krwbn.toLocaleString()}억원</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyEvidence label="재무 연결 근거가 없습니다." />
            )}

            {mbbRefs.length > 0 ? (
              <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] p-3 text-white">
                <p className="text-caption-bold text-ink">Market reference</p>
                {mbbRefs.map((ref, index) => (
                  <p key={`${ref.title}-${index}`} className="mt-1 text-body-sm text-ink">
                    {ref.firm} · {ref.title}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CardDecisionPanel({ card }: { card: CardNewsItem }) {
  const potentialImpact = getPotentialImpact(card);
  const whyImportant = getWhyImportant(card);
  return (
    <section className="axis-panel-flat p-4">
      <p className="axis-kicker">Decision note</p>
      <h3 className="mt-2 text-heading-3 font-semibold tracking-[-0.03em] text-[var(--axis-ink)]">{potentialImpact || '데이터 없음'}</h3>
      <p className="mt-3 text-body-sm text-[var(--axis-body)]">{whyImportant || '데이터 없음'}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Source count" value={String(getSourceCount(card))} />
        <MiniMetric label="Trust score" value={String(getTrustScore(card))} />
        <MiniMetric label="Evidence" value={`${getEvidenceCompleteness(card)}%`} />
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2">
      <p className="text-fine-print font-semibold text-[var(--axis-muted)]">{label}</p>
      <p className="mt-1 text-heading-4 font-semibold text-[var(--axis-ink)]">{value}</p>
    </div>
  );
}

function EvidencePill({ active, icon, label }: { active: boolean; icon: ReactNode; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-[var(--axis-radius-md)] border px-3 py-2 text-caption-bold ${
      active
        ? 'border-[rgba(25,128,56,0.20)] bg-[rgba(25,128,56,0.08)] text-[var(--axis-success)]'
        : 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-[var(--axis-muted)]'
    }`}
    >
      {active ? <BadgeCheck size={15} /> : icon}
      {label}
    </div>
  );
}

function EmptyEvidence({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] p-4 text-body-sm text-[var(--axis-muted)]">
      {label}
    </div>
  );
}

export function TrustSeal() {
  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--axis-radius-md)] border border-[rgba(15,98,254,0.18)] bg-[rgba(15,98,254,0.08)] px-3 py-2 text-caption-bold text-[var(--axis-blue)]">
      <ShieldCheck size={15} />
      Evidence ready
    </div>
  );
}
