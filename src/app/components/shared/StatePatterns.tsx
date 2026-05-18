/**
 * State Patterns — Loading skeleton / Empty / Error (§20)
 * 모든 화면이 일관된 state 표현 사용.
 */
import { AlertCircle, FileSearch } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';

/* ─── Skeleton — 카드 자리 placeholder ─────────────────────── */
export function CardSkeleton({ ratio = '4/3' }: { ratio?: '4/3' | '16/9' }) {
  const aspectClass = ratio === '16/9' ? 'aspect-[16/9]' : 'aspect-[4/3]';
  return (
    <div className="rounded-lg border border-hairline-soft bg-canvas overflow-hidden animate-pulse">
      <div className={cn('w-full bg-surface', aspectClass)} />
      <div className="p-6 space-y-3">
        <div className="h-3 w-24 rounded bg-surface" />
        <div className="h-6 w-3/4 rounded bg-surface" />
        <div className="h-4 w-full rounded bg-surface" />
        <div className="h-4 w-5/6 rounded bg-surface" />
        <div className="h-3 w-32 rounded bg-surface mt-4" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 6, ratio = '4/3' }: { count?: number; ratio?: '4/3' | '16/9' }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} ratio={ratio} />
      ))}
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────── */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="bg-cream-soft rounded-full p-6 mb-6">
        {icon || <FileSearch className="size-12 text-stone" />}
      </div>
      <h3 className="font-display text-heading-4 text-ink mb-2">{title}</h3>
      {body && <p className="text-body-md text-steel max-w-md mb-6">{body}</p>}
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ─── Error State ─────────────────────────────────────────── */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = '데이터를 불러올 수 없습니다', message, onRetry }: ErrorStateProps) {
  return (
    <div className="border-l-4 border-urgent bg-cream-soft rounded-md p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-urgent shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-body text-heading-5 text-ink mb-1">{title}</h4>
          <p className="text-body-sm text-charcoal mb-3">{message}</p>
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
