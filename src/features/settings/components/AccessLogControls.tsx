import type { AccessLogItem } from '../model/accessLog';
import { accessLogStatus } from '../lib/accessLogFormat';

// 접속 로그 상태 배지 표현 컴포넌트 (refactoring P2/stage3). SettingsView 에서 이동.

export function AccessLogStatusPill({ item }: { item: AccessLogItem }) {
  const status = accessLogStatus(item);
  return (
    <span className={`inline-flex h-7 min-w-[3rem] items-center justify-center rounded-sm border px-2 text-caption-bold ${status.className}`}>
      {status.label}
    </span>
  );
}
