import { RefreshCw } from 'lucide-react';
import { ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { TableStateRow } from '../../../app/components/shared/PageState';
import { auditActionLabel, formatLastLogin } from '../../admin-users/lib/adminFormat';

// 관리자 감사 로그 패널 표현 컴포넌트 (refactoring P2/stage3 하드분할). AdminView 에서 그대로 옮긴 것.
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
  return (
    <section data-guide="admin-audit">
      <div className="mb-4 flex items-center justify-between gap-3">
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

      <div className="overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white">
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
            ) : logs.map((log) => (
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
    </section>
  );
}
