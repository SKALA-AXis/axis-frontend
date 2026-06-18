import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { TableStateRow } from '../../../app/components/shared/PageState';
import { PageWindowPagination } from '../../../app/components/shared/PageWindowPagination';
import { auditActionLabel, formatLastLogin } from '../../admin-users/lib/adminFormat';

// 관리자 감사 로그 패널 표현 컴포넌트 (refactoring P2/stage3 하드분할). AdminView 에서 이동.
export function AdminAuditLogsPanel({
  logs,
  isLoading,
  error,
  onReload,
}: {
  logs: Array<{
    id: number;
    actorEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    resourceTitle: string | null;
    reason: string | null;
    createdAt: string | null;
  }>;
  isLoading: boolean;
  error: string | null;
  onReload: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleLogs = logs.slice(pageStart, pageStart + pageSize);
  const setPageSafely = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [logs.length]);

  return (
    <section data-guide="admin-audit">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="axis-kicker">Audit trail</p>
          <h2 className="axis-section-heading mt-1">관리자 감사 로그</h2>
        </div>
        <ExecutiveButton variant="secondary" icon={<RefreshCw size={16} />} onClick={onReload}>
          새로고침
        </ExecutiveButton>
      </div>

      {error ? (
        <div className="mb-4 rounded-[var(--axis-radius-md)] border border-[rgba(218,30,40,0.18)] bg-[rgba(218,30,40,0.08)] px-4 py-3 text-sm text-[var(--axis-danger)]">
          {error}
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4 text-sm font-semibold text-[var(--axis-muted)]">
            감사 로그를 불러오는 중입니다.
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4 text-sm font-semibold text-[var(--axis-muted)]">
            표시할 감사 로그가 없습니다.
          </div>
        ) : visibleLogs.map((log) => (
          <article key={log.id} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--axis-accent-strong)]">{auditActionLabel(log.action)}</p>
                <p className="mt-1 break-all text-sm text-[var(--axis-muted)]">{log.actorEmail}</p>
              </div>
              <span className="shrink-0 text-right text-xs font-semibold text-[var(--axis-muted)]">{formatLastLogin(log.createdAt)}</span>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3">
                <dt className="font-semibold text-[var(--axis-muted)]">대상</dt>
                <dd className="min-w-0 break-words text-[var(--axis-body)]">{log.resourceTitle || log.resourceId}</dd>
              </div>
              <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3">
                <dt className="font-semibold text-[var(--axis-muted)]">사유</dt>
                <dd className="min-w-0 break-words text-[var(--axis-body)]">{log.reason || '-'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white md:block">
        <table className="axis-data-table min-w-[860px]">
          <thead>
            <tr>
              <th>시각</th>
              <th>관리자</th>
              <th>작업</th>
              <th>대상</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableStateRow colSpan={5} label="감사 로그를 불러오는 중입니다." skeleton />
            ) : logs.length === 0 ? (
              <TableStateRow colSpan={5} label="표시할 감사 로그가 없습니다." />
            ) : visibleLogs.map((log) => (
              <tr key={log.id}>
                <td>{formatLastLogin(log.createdAt)}</td>
                <td>{log.actorEmail}</td>
                <td>{auditActionLabel(log.action)}</td>
                <td>{log.resourceTitle || log.resourceId}</td>
                <td>{log.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PageWindowPagination
        className="mt-4"
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPageSafely}
        ariaLabel="감사 로그 페이지 이동"
      />
    </section>
  );
}
