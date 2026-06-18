import type { ReactNode } from 'react';
import type { AccessLogItem } from '../model/accessLog';
import { accessLogStatus } from '../lib/accessLogFormat';

// 접속 로그 상태 배지 + 페이지 버튼 표현 컴포넌트 (refactoring P2/stage3). SettingsView 에서 그대로 옮긴 것.

export function AccessLogStatusPill({ item }: { item: AccessLogItem }) {
  const status = accessLogStatus(item);
  return (
    <span className={`inline-flex h-7 min-w-[3rem] items-center justify-center rounded-sm border px-2 text-caption-bold ${status.className}`}>
      {status.label}
    </span>
  );
}

export function AccessLogPageButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-caption-bold transition ${
        isActive
          ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
          : 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-[var(--axis-body)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent)]'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
