import { History, Newspaper, Pencil, RefreshCw, RotateCcw, Search, Users } from 'lucide-react';
import { type PointerEvent, useEffect, useState } from 'react';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { useAdminAuditLogs } from '../../../../features/admin-audit/hooks/useAdminAuditLogs';
import { useAdminCards } from '../../../../features/admin-cards/hooks/useAdminCards';
import type { AdminCard } from '../../../../features/admin-cards/model/adminCard';
import { useAdminUsers } from '../../../../features/admin-users/hooks/useAdminUsers';
import type { AdminUser, AdminUserStatus } from '../../../../features/admin-users/model/adminUser';
import { mockAdminPeers } from '../../../../shared/mocks/admin';

type AdminTab = 'users' | 'peers' | 'cards' | 'audit';

const tabs: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
  { id: 'users', label: '사용자', icon: Users },
  { id: 'peers', label: 'Peer사', icon: Users },
  { id: 'cards', label: '카드뉴스 관리', icon: Newspaper },
  { id: 'audit', label: '감사 로그', icon: History },
];

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const { users, isLoading, error, updatingUserId, reload, updateStatus } = useAdminUsers();
  const {
    cards,
    isLoading: cardsLoading,
    error: cardsError,
    updatingCardId,
    reload: reloadCards,
    updateStatus: updateCardStatus,
  } = useAdminCards('DELETED');
  const { logs, isLoading: logsLoading, error: logsError, reload: reloadLogs } = useAdminAuditLogs();
  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const suspendedUsers = users.filter((user) => user.status === 'SUSPENDED').length;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader title="관리자" />

        <section className="grid gap-3 md:grid-cols-3">
          <ExecutiveMetric label="전체 사용자" value={users.length} helper="관리 대상 계정" />
          <ExecutiveMetric label="활성 사용자" value={activeUsers} helper="ACTIVE 상태" tone="success" />
          <ExecutiveMetric label="정지 사용자" value={suspendedUsers} helper="SUSPENDED 상태" tone="warning" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="axis-panel-flat h-fit p-3">
            <nav className="flex gap-2 overflow-x-auto xl:flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-3 rounded-[var(--axis-radius-md)] px-4 py-3 text-left transition xl:w-full ${
                      isActive
                        ? 'bg-[var(--axis-accent)] text-white shadow-[0_14px_34px_-26px_rgba(220,90,36,0.65)]'
                        : 'text-[var(--axis-body)] hover:bg-[var(--axis-surface-muted)]'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="axis-panel-flat overflow-visible p-5">
            {activeTab === 'users' ? (
              <AdminUsersPanel
                users={users}
                isLoading={isLoading}
                error={error}
                updatingUserId={updatingUserId}
                onReload={() => void reload()}
                onStatusChange={updateStatus}
              />
            ) : null}
            {activeTab === 'peers' ? <AdminTable title="모니터링 대상 Peer사" rows={mockAdminPeers} /> : null}
            {activeTab === 'cards' ? (
              <AdminDeletedCardsPanel
                cards={cards}
                isLoading={cardsLoading}
                error={cardsError}
                updatingCardId={updatingCardId}
                onReload={() => void reloadCards()}
                onRestore={async (cardId, reason) => {
                  await updateCardStatus(cardId, 'ACTIVE', reason);
                  await reloadCards();
                }}
              />
            ) : null}
            {activeTab === 'audit' ? (
              <AdminAuditLogsPanel
                logs={logs}
                isLoading={logsLoading}
                error={logsError}
                onReload={() => void reloadLogs()}
              />
            ) : null}
          </main>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function AdminUsersPanel({
  users,
  isLoading,
  error,
  updatingUserId,
  onReload,
  onStatusChange,
}: {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  updatingUserId: string | null;
  onReload: () => void;
  onStatusChange: (userId: string, status: AdminUserStatus) => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminUserStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    const matchesSearch = normalizedQuery.length === 0
      || user.name.toLowerCase().includes(normalizedQuery)
      || user.email.toLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesSearch;
  });
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleUsers = filteredUsers.slice(pageStart, pageStart + pageSize);
  const paginationWindowSize = 5;
  const pageWindowStart = Math.floor((safePage - 1) / paginationWindowSize) * paginationWindowSize + 1;
  const visiblePageNumbers = Array.from(
    { length: Math.min(paginationWindowSize, totalPages - pageWindowStart + 1) },
    (_, index) => pageWindowStart + index,
  );
  const previousWindowPage = visiblePageNumbers[0] > 1 ? visiblePageNumbers[0] - 1 : null;
  const nextWindowPage = visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages
    ? visiblePageNumbers[visiblePageNumbers.length - 1] + 1
    : null;
  const setPageSafely = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  };
  const handlePagePointerDown = (page: number) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPageSafely(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, normalizedQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (editingUserId && !visibleUsers.some((user) => user.id === editingUserId)) {
      setEditingUserId(null);
    }
  }, [editingUserId, visibleUsers]);

  const handleStatusSubmit = async (userId: string, nextStatus: AdminUserStatus, currentStatus: AdminUserStatus) => {
    if (nextStatus === currentStatus) {
      setEditingUserId(null);
      return;
    }

    const confirmed = window.confirm(`사용자 상태를 ${statusLabel(currentStatus)}에서 ${statusLabel(nextStatus)}로 변경할까요?`);
    if (!confirmed) {
      setEditingUserId(null);
      return;
    }

    try {
      await onStatusChange(userId, nextStatus);
      setEditingUserId(null);
    } catch {
      // Error state is already handled by the hook and surfaced in the panel.
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">User management</p>
          <h2 className="axis-section-heading mt-1">사용자 목록 · 상태 변경 · 최근 로그인</h2>
        </div>
        <ExecutiveButton variant="secondary" icon={<RefreshCw size={16} />} onClick={onReload}>
          새로고침
        </ExecutiveButton>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--axis-muted)]">상태 필터</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | AdminUserStatus)}
            className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2.5 text-sm text-[var(--axis-ink)]"
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="PENDING">대기</option>
            <option value="SUSPENDED">정지</option>
            <option value="WITHDRAWN">탈퇴</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--axis-muted)]">이름 또는 이메일 검색</span>
          <div className="flex items-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3">
            <Search size={16} className="text-[var(--axis-muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="이름 또는 이메일 입력"
              className="w-full bg-transparent py-2.5 text-sm text-[var(--axis-ink)] outline-none placeholder:text-[var(--axis-muted)]"
            />
          </div>
        </label>

        <div className="flex items-end">
          <ExecutiveBadge tone="accent">총 {filteredUsers.length}명</ExecutiveBadge>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-[var(--axis-radius-md)] border border-[rgba(218,30,40,0.18)] bg-[rgba(218,30,40,0.08)] px-4 py-3 text-sm text-[var(--axis-danger)]">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white">
        <table className="axis-data-table min-w-[760px]">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>최근 로그인</th>
              <th>상태 변경</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-[var(--axis-muted)]">
                  사용자 목록을 불러오는 중입니다.
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-[var(--axis-muted)]">
                  표시할 사용자가 없습니다.
                </td>
              </tr>
            ) : visibleUsers.map((user) => {
              const isUpdating = updatingUserId === user.id;
              const isEditing = editingUserId === user.id;

              return (
                <tr key={user.id}>
                  <td className="font-semibold text-[var(--axis-ink)]">{user.name || '-'}</td>
                  <td>{user.email}</td>
                  <td>{formatLastLogin(user.lastLoginAt)}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-3">
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-2">
                            <span className="sr-only">{user.email} 상태 변경</span>
                            <select
                              defaultValue={user.status}
                              disabled={isUpdating}
                              onChange={(event) => void handleStatusSubmit(
                                user.id,
                                event.target.value as AdminUserStatus,
                                user.status,
                              )}
                              className="min-w-[150px] rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm text-[var(--axis-ink)] disabled:cursor-not-allowed disabled:bg-[var(--axis-surface-muted)]"
                            >
                              <option value="PENDING">대기</option>
                              <option value="ACTIVE">활성</option>
                              <option value="SUSPENDED">정지</option>
                              <option value="WITHDRAWN">탈퇴</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => setEditingUserId(null)}
                            className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            취소
                          </button>
                          {isUpdating ? <span className="text-xs text-[var(--axis-muted)]">저장 중...</span> : null}
                        </div>
                      ) : (
                        <>
                          <ExecutiveBadge tone={statusTone(user.status)}>{statusLabel(user.status)}</ExecutiveBadge>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(user.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                            aria-label={`${user.email} 상태 수정`}
                            title="상태 수정"
                          >
                            <Pencil size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="사용자 목록 페이지 이동"
        className="relative z-10 mt-4 mb-24 flex flex-wrap items-center justify-center gap-3 pointer-events-auto md:justify-end"
      >
        <div className="relative flex flex-wrap items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-2 shadow-[0_12px_32px_-24px_rgba(0,0,0,0.28)]">
          <button
            type="button"
            onPointerDown={previousWindowPage ? handlePagePointerDown(previousWindowPage) : undefined}
            onClickCapture={previousWindowPage ? () => setPageSafely(previousWindowPage) : undefined}
            onClick={previousWindowPage ? () => setPageSafely(previousWindowPage) : undefined}
            disabled={previousWindowPage === null}
            className="cursor-pointer pointer-events-auto rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {'<'}
          </button>
          {visiblePageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onPointerDown={handlePagePointerDown(page)}
              onClickCapture={() => setPageSafely(page)}
              onClick={() => setPageSafely(page)}
              className={`min-w-9 cursor-pointer pointer-events-auto rounded-[var(--axis-radius-sm)] border px-3 py-2 text-sm font-medium transition ${
                page === safePage
                  ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                  : 'border-[var(--axis-hairline)] bg-white text-[var(--axis-ink)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onPointerDown={nextWindowPage ? handlePagePointerDown(nextWindowPage) : undefined}
            onClickCapture={nextWindowPage ? () => setPageSafely(nextWindowPage) : undefined}
            onClick={nextWindowPage ? () => setPageSafely(nextWindowPage) : undefined}
            disabled={nextWindowPage === null}
            className="cursor-pointer pointer-events-auto rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {'>'}
          </button>
        </div>
      </nav>
    </section>
  );
}

function AdminTable({ title, rows }: { title: string; rows: Array<Record<string, string | number>> }) {
  const columns = Object.keys(rows[0] ?? {});

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Operations</p>
          <h2 className="axis-section-heading mt-1">{title}</h2>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white">
        <table className="axis-data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {columns.map((column) => (
                  <td key={column}>
                    {column === 'status' ? (
                      <ExecutiveBadge tone={row[column] === 'active' ? 'success' : 'warning'}>{row[column]}</ExecutiveBadge>
                    ) : (
                      row[column]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminDeletedCardsPanel({
  cards,
  isLoading,
  error,
  updatingCardId,
  onReload,
  onRestore,
}: {
  cards: AdminCard[];
  isLoading: boolean;
  error: string | null;
  updatingCardId: string | null;
  onReload: () => void;
  onRestore: (cardId: string, reason: string) => Promise<void>;
}) {
  const handleRestore = async (card: AdminCard) => {
    const reason = window.prompt(`"${card.title}" 카드뉴스 복구 사유를 입력해주세요.`);
    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      window.alert('복구 사유를 입력해주세요.');
      return;
    }

    const confirmed = window.confirm(`"${card.title}" 카드뉴스를 복구할까요?`);
    if (!confirmed) {
      return;
    }

    try {
      await onRestore(card.id, trimmedReason);
    } catch {
      // Hook error state is surfaced in the panel.
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Card news management</p>
          <h2 className="axis-section-heading mt-1">삭제된 카드뉴스 확인 · 복구</h2>
        </div>
        <ExecutiveButton variant="secondary" icon={<RefreshCw size={16} />} onClick={onReload}>
          새로고침
        </ExecutiveButton>
      </div>

      <div className="mb-4">
        <ExecutiveBadge tone="warning">삭제된 카드뉴스 {cards.length}건</ExecutiveBadge>
      </div>

      {error ? (
        <div className="mb-4 rounded-[var(--axis-radius-md)] border border-[rgba(218,30,40,0.18)] bg-[rgba(218,30,40,0.08)] px-4 py-3 text-sm text-[var(--axis-danger)]">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white">
        <table className="axis-data-table min-w-[920px]">
          <thead>
            <tr>
              <th>제목</th>
              <th>Peer사</th>
              <th>삭제 사유</th>
              <th>삭제한 관리자</th>
              <th>삭제 시각</th>
              <th>복구</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-[var(--axis-muted)]">
                  삭제된 카드뉴스를 불러오는 중입니다.
                </td>
              </tr>
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-[var(--axis-muted)]">
                  삭제된 카드뉴스가 없습니다.
                </td>
              </tr>
            ) : cards.map((card) => (
              <tr key={card.id}>
                <td className="font-semibold text-[var(--axis-ink)]">{card.title}</td>
                <td>{card.peerId}</td>
                <td>{card.deletionReason || '-'}</td>
                <td>{card.deletedBy || '-'}</td>
                <td>{formatLastLogin(card.deletedAt)}</td>
                <td>
                  <button
                    type="button"
                    disabled={updatingCardId === card.id}
                    onClick={() => void handleRestore(card)}
                    className="inline-flex items-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 py-2 text-sm font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RotateCcw size={14} />
                    복구
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminAuditLogsPanel({
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
    <section>
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
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-[var(--axis-muted)]">
                  감사 로그를 불러오는 중입니다.
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-[var(--axis-muted)]">
                  표시할 감사 로그가 없습니다.
                </td>
              </tr>
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

function formatLastLogin(value: string | null) {
  if (!value) return '기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusLabel(status: AdminUserStatus) {
  if (status === 'ACTIVE') return '활성';
  if (status === 'SUSPENDED') return '정지';
  if (status === 'WITHDRAWN') return '탈퇴';
  return '대기';
}

function statusTone(status: AdminUserStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'warning';
  if (status === 'WITHDRAWN') return 'danger';
  return 'neutral';
}

function auditActionLabel(action: string) {
  if (action === 'card_news.delete') return '카드뉴스 삭제';
  if (action === 'card_news.restore') return '카드뉴스 복구';
  if (action === 'card_news.status_change') return '카드뉴스 상태 변경';
  return action;
}
