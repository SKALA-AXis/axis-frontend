/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 카드뉴스 수정과 함께 알림 설정 UI 추가, 이후 목업 제거 및 챗봇 연동 고도화
 *   2026-06-14 안가은 — 브리핑/믹서 표시 동작 및 튜토리얼·관리자 UI 정리
 */
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationsRepository } from '../../../../features/notifications/api/notificationsRepository';
import { formatNotificationCount, type NotificationItem } from '../../../../features/notifications/model/notification';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { PageWindowPagination } from '../../shared/PageWindowPagination';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
const notificationsPageSize = 20;

export function NotificationsView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(items.length / notificationsPageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleItems = useMemo(
    () => items.slice((safeCurrentPage - 1) * notificationsPageSize, safeCurrentPage * notificationsPageSize),
    [items, safeCurrentPage],
  );

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await notificationsRepository.listAll(100);
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setTotalCount(result.items.length);
      setCurrentPage(1);
      setStatus('success');
    } catch (loadError) {
      setStatus('error');
      setError(loadError instanceof Error ? loadError.message : '알림을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const movePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const markAllRead = async () => {
    await notificationsRepository.markAllRead();
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  const deleteRead = async () => {
    await notificationsRepository.deleteRead();
    await load();
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.read) {
      await notificationsRepository.markRead(item.id);
      setItems((current) => current.map((notice) => notice.id === item.id ? { ...notice, read: true } : notice));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    onNavigate?.(item.target);
  };
  const unreadCountLabel = formatNotificationCount(unreadCount);
  const rangeStart = totalCount === 0 ? 0 : (safeCurrentPage - 1) * notificationsPageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(totalCount, rangeStart + visibleItems.length - 1);

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="Notifications"
          title="알림 센터"
          subtitle="키워드와 중요 시그널로 생성된 알림을 확인합니다."
          actions={(
            <div data-guide="notifications-actions" className="flex flex-wrap items-center gap-2">
              <ExecutiveBadge tone={unreadCount > 0 ? 'danger' : 'neutral'}>안읽음 {unreadCountLabel}건</ExecutiveBadge>
              <ExecutiveButton variant="secondary" icon={<CheckCheck size={16} />} onClick={() => void markAllRead()}>모두 읽음</ExecutiveButton>
              <ExecutiveButton variant="secondary" icon={<Trash2 size={16} />} onClick={() => void deleteRead()}>읽은 알림 지우기</ExecutiveButton>
            </div>
          )}
        />

        <section data-guide="notifications-list" className="axis-panel-flat overflow-hidden">
          {status === 'loading' ? (
            <div className="p-6 text-sm font-semibold text-[var(--axis-muted)]">알림을 불러오는 중입니다.</div>
          ) : null}
          {status === 'error' ? (
            <div className="p-6 text-sm font-semibold text-[var(--axis-danger)]">{error}</div>
          ) : null}
          {status === 'success' && items.length === 0 ? (
            <div className="p-6 text-sm font-semibold text-[var(--axis-muted)]">표시할 알림이 없습니다.</div>
          ) : null}
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void openNotification(item)}
              className={`flex w-full gap-4 border-b border-[var(--axis-hairline)] p-5 text-left transition hover:bg-[var(--axis-surface-muted)] ${
                item.read ? 'bg-[var(--axis-surface)]' : 'bg-[rgba(220,90,36,0.07)]'
              }`}
            >
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]">
                <Bell size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[var(--axis-ink)]">{item.title}</span>
                  <ExecutiveBadge tone={item.read ? 'neutral' : 'danger'}>{item.read ? '읽음' : '안읽음'}</ExecutiveBadge>
                </span>
                <span className="mt-2 block text-sm leading-6 text-[var(--axis-body)]">{item.message}</span>
                <span className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--axis-muted)]">
                  <span>{item.companyName || 'AXIS'}</span>
                  <span>{formatNotificationTime(item.createdAt)}</span>
                  {item.matchedKeywords.map((keyword) => (
                    <span key={keyword} className="rounded-sm border border-[var(--axis-hairline)] px-1.5 py-0.5">{keyword}</span>
                  ))}
                </span>
              </span>
            </button>
          ))}
          {status === 'success' && totalCount > 0 ? (
            <div className="border-t border-[var(--axis-hairline)] px-5 py-5 text-center">
              <p className="text-xs font-semibold text-[var(--axis-muted)]">
                총 {totalCount.toLocaleString('ko-KR')}건 중 {rangeStart.toLocaleString('ko-KR')}-{rangeEnd.toLocaleString('ko-KR')}건
              </p>
              <PageWindowPagination
                className="mt-3 w-full"
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={movePage}
                ariaLabel="알림 목록 페이지 이동"
              />
            </div>
          ) : null}
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '시간 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}
