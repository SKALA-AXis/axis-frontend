/*
 * 작성일: 2026-06-04
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-04 안가은 — 로딩 상태 표준화 및 키워드 트렌드 지연 로딩, peer 개요/카드 로고 폴백·대시보드 키워드 트렌드 UI 정리
 *   2026-06-12 최종민 — 라우트 단위 lazy 청크 분리 및 캐시 헤더 추가
 */
import { useEffect, useState, type ReactNode } from 'react';

import { ExecutiveButton, ExecutiveContainer, ExecutivePage } from '../executive/ExecutiveSystem';
import { Skeleton } from '../ui/skeleton';

type PageStateVariant = 'page' | 'panel' | 'inline';
export type PageSkeletonVariant = 'dashboard' | 'cards' | 'workspace' | 'analysis' | 'briefing';

interface PageStateProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  loadingLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  variant?: PageStateVariant;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  emptyFallback?: ReactNode;
  onRetry?: () => void;
}

interface StateMessageProps {
  label: string;
  variant: PageStateVariant;
  tone?: 'neutral' | 'danger';
  onRetry?: () => void;
}

export type LoadingProcessStep = {
  label: string;
  detail: string;
};

interface PageProcessLoadingProps {
  eyebrow: string;
  title: string;
  description: string;
  steps: LoadingProcessStep[];
  meta?: string[];
}

function StateMessage({ label, variant, tone = 'neutral', onRetry }: StateMessageProps) {
  const toneClass = tone === 'danger' ? 'text-[var(--axis-danger)]' : 'text-[var(--axis-muted)]';
  const content = (
    <div className={`axis-panel-flat flex min-h-[180px] flex-col items-center justify-center gap-3 p-8 text-center text-sm ${toneClass}`}>
      <span>{label}</span>
      {onRetry ? (
        <ExecutiveButton variant="secondary" onClick={onRetry}>
          다시 시도
        </ExecutiveButton>
      ) : null}
    </div>
  );

  if (variant === 'page') {
    return (
      <ExecutivePage>
        <ExecutiveContainer className="flex min-h-full items-center justify-center py-12">
          <div className="w-full max-w-xl">{content}</div>
        </ExecutiveContainer>
      </ExecutivePage>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-4 py-3 text-sm ${toneClass}`}>
        {label}
      </div>
    );
  }

  return content;
}

export function PageState({
  children,
  loading = false,
  error = null,
  empty = false,
  loadingLabel = '데이터를 불러오는 중입니다.',
  errorLabel = '데이터를 불러오지 못했습니다.',
  emptyLabel = '표시할 데이터가 없습니다.',
  variant = 'page',
  loadingFallback,
  errorFallback,
  emptyFallback,
  onRetry,
}: PageStateProps) {
  if (loading) {
    return loadingFallback ?? <StateMessage label={loadingLabel} variant={variant} />;
  }

  if (error) {
    return errorFallback ?? <StateMessage label={error || errorLabel} variant={variant} tone="danger" onRetry={onRetry} />;
  }

  if (empty) {
    return emptyFallback ?? <StateMessage label={emptyLabel} variant={variant} />;
  }

  return <>{children}</>;
}

export function PageProcessLoading({
  eyebrow,
  title,
  description,
}: PageProcessLoadingProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 500);
    return () => window.clearInterval(intervalId);
  }, []);

  const elapsedLabel =
    elapsedSeconds < 60
      ? `${elapsedSeconds}초`
      : `${Math.floor(elapsedSeconds / 60)}분 ${String(elapsedSeconds % 60).padStart(2, '0')}초`;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="flex min-h-[calc(100dvh-7rem)] items-center justify-center py-10">
        <div className="w-full max-w-[420px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-7 text-center shadow-[0_24px_70px_-42px_rgba(0,0,0,0.28)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(220,90,36,0.22)] bg-[rgba(220,90,36,0.08)]">
            <div className="relative h-11 w-7 animate-[spin_1.8s_ease-in-out_infinite]">
              <div className="absolute inset-x-0 top-0 mx-auto h-5 w-6 rounded-b-full border-2 border-[var(--axis-accent)] border-t-0" />
              <div className="absolute inset-x-0 bottom-0 mx-auto h-5 w-6 rounded-t-full border-2 border-[var(--axis-accent)] border-b-0" />
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--axis-accent)]" />
            </div>
          </div>

          <p className="mt-6 axis-kicker">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold leading-7 text-[var(--axis-ink)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">{description}</p>

          <div className="mt-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">실제 경과 시간</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--axis-ink)]">{elapsedLabel}</p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--axis-surface-muted)]">
            <div className="h-full w-full origin-left animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(220,90,36,0.22),var(--axis-accent),rgba(220,90,36,0.22))]" />
          </div>

          <p className="mt-4 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
            데이터가 준비되는 즉시 화면이 전환됩니다.
          </p>
        </div>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function DashboardSkeletonBody({ rows }: { rows: number }) {
  return (
    <>
      <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="axis-panel-flat p-5">
          <Skeleton className="h-3 w-28 bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-4 h-9 w-3/4 bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-3 h-5 w-1/2 bg-[var(--axis-surface-muted)]" />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 bg-[var(--axis-surface-muted)]" />
            ))}
          </div>
        </div>
        <div className="axis-panel-flat p-4">
          <Skeleton className="h-3 w-24 bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-4 aspect-[4/3] w-full bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-3 h-5 w-4/5 bg-[var(--axis-surface-muted)]" />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: Math.max(2, Math.min(rows, 4)) }).map((_, index) => (
          <div key={index} className="axis-panel-flat p-4">
            <Skeleton className="h-3 w-28 bg-[var(--axis-surface-muted)]" />
            <Skeleton className="mt-4 h-52 w-full bg-[var(--axis-surface-muted)]" />
          </div>
        ))}
      </div>
    </>
  );
}

function CardSkeletonBody({ rows }: { rows: number }) {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-2">
        <Skeleton className="h-9 w-24 rounded-full bg-[var(--axis-surface-muted)]" />
        <Skeleton className="h-9 w-32 rounded-full bg-[var(--axis-surface-muted)]" />
        <Skeleton className="h-9 w-32 rounded-full bg-[var(--axis-surface-muted)]" />
        <Skeleton className="h-9 min-w-[220px] flex-1 rounded-full bg-[var(--axis-surface-muted)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="axis-panel-flat overflow-hidden p-3">
            <Skeleton className="aspect-[4/3] w-full bg-[var(--axis-surface-muted)]" />
            <Skeleton className="mt-4 h-3 w-20 bg-[var(--axis-surface-muted)]" />
            <Skeleton className="mt-3 h-5 w-full bg-[var(--axis-surface-muted)]" />
            <Skeleton className="mt-2 h-5 w-4/5 bg-[var(--axis-surface-muted)]" />
          </div>
        ))}
      </div>
    </>
  );
}

function WorkspaceSkeletonBody({ rows }: { rows: number }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="axis-panel-flat p-5">
        <Skeleton className="h-3 w-28 bg-[var(--axis-surface-muted)]" />
        <Skeleton className="mt-4 h-8 w-2/3 bg-[var(--axis-surface-muted)]" />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
              <Skeleton className="h-5 w-5 rounded-full bg-[var(--axis-surface-muted)]" />
              <Skeleton className="mt-4 h-5 w-full bg-[var(--axis-surface-muted)]" />
              <Skeleton className="mt-2 h-4 w-5/6 bg-[var(--axis-surface-muted)]" />
            </div>
          ))}
        </div>
      </div>
      <aside className="axis-panel-flat p-5">
        <Skeleton className="h-3 w-24 bg-[var(--axis-surface-muted)]" />
        <Skeleton className="mt-4 h-28 w-full bg-[var(--axis-surface-muted)]" />
        <Skeleton className="mt-4 h-10 w-full bg-[var(--axis-surface-muted)]" />
      </aside>
    </div>
  );
}

function AnalysisSkeletonBody({ rows }: { rows: number }) {
  return (
    <>
      <div className="mb-5 flex justify-end gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full bg-[var(--axis-surface-muted)]" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="axis-panel-flat p-5">
          <Skeleton className="h-3 w-28 bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-4 h-72 w-full bg-[var(--axis-surface-muted)]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: Math.max(3, Math.min(rows, 5)) }).map((_, index) => (
            <div key={index} className="axis-panel-flat p-4">
              <Skeleton className="h-4 w-28 bg-[var(--axis-surface-muted)]" />
              <Skeleton className="mt-3 h-5 w-full bg-[var(--axis-surface-muted)]" />
              <Skeleton className="mt-2 h-4 w-3/4 bg-[var(--axis-surface-muted)]" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BriefingSkeletonBody({ rows }: { rows: number }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="axis-panel-flat p-5">
        <Skeleton className="h-9 w-36 bg-[var(--axis-surface-muted)]" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full bg-[var(--axis-surface-muted)]" />
          ))}
        </div>
      </aside>
      <main className="axis-panel-flat p-6">
        <Skeleton className="h-3 w-24 bg-[var(--axis-surface-muted)]" />
        <Skeleton className="mt-4 h-8 w-2/3 bg-[var(--axis-surface-muted)]" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-5 w-1/3 bg-[var(--axis-surface-muted)]" />
              <Skeleton className="mt-3 h-4 w-full bg-[var(--axis-surface-muted)]" />
              <Skeleton className="mt-2 h-4 w-11/12 bg-[var(--axis-surface-muted)]" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function PageSkeleton({
  rows = 4,
  variant = 'dashboard',
}: {
  rows?: number;
  variant?: PageSkeletonVariant;
}) {
  const content = {
    dashboard: <DashboardSkeletonBody rows={rows} />,
    cards: <CardSkeletonBody rows={rows} />,
    workspace: <WorkspaceSkeletonBody rows={rows} />,
    analysis: <AnalysisSkeletonBody rows={rows} />,
    briefing: <BriefingSkeletonBody rows={rows} />,
  }[variant];

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        {content}
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

export function TableStateRow({
  colSpan,
  label,
  rows = 4,
  skeleton = false,
}: {
  colSpan: number;
  label: string;
  rows?: number;
  skeleton?: boolean;
}) {
  if (!skeleton) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-10 text-center text-sm text-[var(--axis-muted)]">
          {label}
        </td>
      </tr>
    );
  }

  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td colSpan={colSpan} className="px-4 py-3">
            <Skeleton className="h-5 w-full bg-[var(--axis-surface-muted)]" />
          </td>
        </tr>
      ))}
    </>
  );
}
