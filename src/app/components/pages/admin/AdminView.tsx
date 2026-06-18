/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편 반영
 *   2026-05-22 박진 — 카드뉴스 수정·알림 설정, 챗봇 로직 수정·고도화 및 목업 삭제
 *   2026-05-29 안가은 — 관리자 카드뉴스 관리·감사로그 화면, 대시보드/검색 인사이트 UI, 튜토리얼·관리자 UI 정리
 *   2026-06-18 안가은 — 관리자 화면 모바일 탭·목록을 사용자 화면과 같은 흐름으로 보이도록 개선
 */
import { History, Newspaper, Pencil, RefreshCw, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { useAdminAuditLogs } from '../../../../features/admin-audit/hooks/useAdminAuditLogs';
import { AdminAuditLogsPanel } from '../../../../features/admin-audit/components/AdminAuditLogsPanel';
import { useAdminCards } from '../../../../features/admin-cards/hooks/useAdminCards';
import { AdminDeletedCardsPanel } from '../../../../features/admin-cards/components/AdminDeletedCardsPanel';
import { useAdminUsers } from '../../../../features/admin-users/hooks/useAdminUsers';
import type { AdminUser, AdminUserStatus } from '../../../../features/admin-users/model/adminUser';
import { formatLastLogin, statusLabel, statusTone } from '../../../../features/admin-users/lib/adminFormat';
import { TableStateRow } from '../../shared/PageState';
import { PageWindowPagination } from '../../shared/PageWindowPagination';

type AdminTab = 'users' | 'cards' | 'audit';

const tabs: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
  { id: 'users', label: '사용자', icon: Users },
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

        <section data-guide="admin-metrics" className="grid gap-3 md:grid-cols-3">
          <ExecutiveMetric label="전체 사용자" value={users.length} helper="관리 대상 계정" />
          <ExecutiveMetric label="활성 사용자" value={activeUsers} helper="ACTIVE 상태" tone="success" />
          <ExecutiveMetric label="정지 사용자" value={suspendedUsers} helper="SUSPENDED 상태" tone="warning" />
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-5">
          <aside className="axis-panel-flat h-fit overflow-hidden p-2 xl:p-3">
            <nav data-guide="admin-tabs" className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-w-[104px] flex-1 items-center justify-center gap-2 rounded-[var(--axis-radius-md)] px-3 py-2.5 text-center transition sm:gap-3 xl:w-full xl:flex-none xl:justify-start xl:px-4 xl:py-3 xl:text-left ${
                      isActive
                        ? 'bg-[var(--axis-accent)] text-white shadow-[0_14px_34px_-26px_rgba(220,90,36,0.65)]'
                        : 'text-[var(--axis-body)] hover:bg-[var(--axis-surface-muted)]'
                    }`}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="min-w-0 truncate text-sm font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main data-guide="admin-main" className="axis-panel-flat overflow-visible p-4 sm:p-5">
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
  const setPageSafely = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
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
    <section data-guide="admin-users">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
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

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4 text-sm font-semibold text-[var(--axis-muted)]">
            사용자 목록을 불러오는 중입니다.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4 text-sm font-semibold text-[var(--axis-muted)]">
            표시할 사용자가 없습니다.
          </div>
        ) : visibleUsers.map((user) => {
          const isUpdating = updatingUserId === user.id;
          const isEditing = editingUserId === user.id;

          return (
            <article key={user.id} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[var(--axis-ink)]">{user.name || '-'}</p>
                  <p className="mt-1 break-all text-sm text-[var(--axis-muted)]">{user.email}</p>
                </div>
                <ExecutiveBadge tone={statusTone(user.status)}>{statusLabel(user.status)}</ExecutiveBadge>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold text-[var(--axis-muted)]">최근 로그인</dt>
                  <dd className="text-right font-medium text-[var(--axis-body)]">{formatLastLogin(user.lastLoginAt)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isEditing ? (
                  <>
                    <label className="min-w-[160px] flex-1">
                      <span className="sr-only">{user.email} 상태 변경</span>
                      <select
                        defaultValue={user.status}
                        disabled={isUpdating}
                        onChange={(event) => void handleStatusSubmit(
                          user.id,
                          event.target.value as AdminUserStatus,
                          user.status,
                        )}
                        className="h-10 w-full rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 text-sm text-[var(--axis-ink)] disabled:cursor-not-allowed disabled:bg-[var(--axis-surface-muted)]"
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
                      className="h-10 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 text-sm font-semibold text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      취소
                    </button>
                    {isUpdating ? <span className="text-xs text-[var(--axis-muted)]">저장 중...</span> : null}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingUserId(user.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-white px-3 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                  >
                    <Pencil size={15} />
                    상태 수정
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white md:block">
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
              <TableStateRow colSpan={4} label="사용자 목록을 불러오는 중입니다." skeleton />
            ) : filteredUsers.length === 0 ? (
              <TableStateRow colSpan={4} label="표시할 사용자가 없습니다." />
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

      <PageWindowPagination
        className="relative z-10 mt-4 mb-24 pointer-events-auto"
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPageSafely}
        ariaLabel="사용자 목록 페이지 이동"
      />
    </section>
  );
}
