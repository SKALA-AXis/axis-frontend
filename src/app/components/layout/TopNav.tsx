/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편 반영, 알림 드롭다운 '지우기' 전체 알림 삭제(scope=ALL) 처리
 *   2026-05-21 박진 — 로그인/회원가입 로직 개선, 카드뉴스 수정·알림 설정, 챗봇 프론트 반영
 *   2026-05-29 안가은 — 관리자 카드뉴스 관리·대시보드/검색 인사이트·키워드 트렌드 UI 반영
 */
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bell, HelpCircle, Search, Settings } from 'lucide-react';
import type { AuthUser } from '../../../features/auth/model/auth';
import { notificationsRepository } from '../../../features/notifications/api/notificationsRepository';
import { formatNotificationCount, type NotificationItem } from '../../../features/notifications/model/notification';
import type { SearchScope } from '../../../features/search/model/search';
import { viewLabels } from '../../../shared/content/navigation';
import { formatTopNavUpdateTime } from '../../../shared/lib/viewFreshness';
import type { PeerPlusPeerId } from '../../../shared/content/peerPlus';

interface TopNavProps {
  activeView: string;
  currentViewUpdatedAt?: string | null;
  showUpdateTime?: boolean;
  currentUser?: AuthUser | null;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onNotificationSelect?: (view: string) => void;
  onLogoClick?: () => void;
  onUserClick?: () => void;
  onHelpClick?: () => void;
  onSearchNavigate?: (target: string, options?: { peerId?: PeerPlusPeerId; query?: string; scope?: SearchScope }) => void;
}

const searchScopeOptions: Array<{ value: SearchScope; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'BRIEFING', label: '브리핑' },
  { value: 'PEER_PLUS', label: 'Peer+' },
  { value: 'CARD_NEWS', label: '카드뉴스' },
];

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMinutes = Math.floor((now - date.getTime()) / 60000);
  if (diffMinutes < 1) return '방금';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)}시간 전`;
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\.$/, '');
}

function notificationTone(item: NotificationItem) {
  if (item.matchedKeywords.length > 0) return item.matchedKeywords[0];
  return '알림';
}

export function TopNav({
  activeView,
  currentViewUpdatedAt,
  showUpdateTime = false,
  currentUser,
  onSearchClick,
  onNotificationsClick,
  onNotificationSelect,
  onLogoClick,
  onUserClick,
  onHelpClick,
  onSearchNavigate,
}: TopNavProps) {
  const currentLabel = viewLabels[activeView] ?? activeView;
  const userLabel = currentUser?.name || currentUser?.email?.split('@')[0] || 'AXIS 사용자';
  const userInitials = userLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SK';
  const lastCrawlUpdate = formatTopNavUpdateTime(currentViewUpdatedAt);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>('ALL');
  const visibleNotifications = notifications.slice(0, 5);
  const unreadCountLabel = formatNotificationCount(unreadCount);
  const hideGlobalSearch = activeView === 'search';

  const loadNotifications = useCallback(async (limit = 10) => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setNotificationsLoading(true);
    setNotificationError('');
    try {
      const result = await notificationsRepository.list(limit);
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : '알림을 불러오지 못했습니다.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [currentUser]);

  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await notificationsRepository.unreadCount());
    } catch {
      // 배지 갱신 실패는 팝오버 조회 시 다시 표출한다.
    }
  }, [currentUser]);

  useEffect(() => {
    void loadNotifications(10);
  }, [loadNotifications]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (notificationsOpen) {
        void loadNotifications(10);
      } else {
        void refreshUnreadCount();
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications, notificationsOpen, refreshUnreadCount]);

  useEffect(() => {
    const handleGlobalSearchShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget = target?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleGlobalSearchShortcut);
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      searchInputRef.current?.focus();
      return;
    }
    onSearchClick?.();
    onSearchNavigate?.('search', { query: normalizedQuery, scope: searchScope });
    setQuery('');
  };

  return (
    <header
      className="relative z-40 flex h-20 shrink-0 items-center gap-4 bg-canvas px-4 lg:px-6"
    >
      {/* ─── 좌측: AXIS 로고 + 현재 페이지 ────────────────── */}
      <div className="relative flex min-w-[150px] shrink-0 items-center gap-4 lg:min-w-[240px]">
        <button
          type="button"
          onClick={onLogoClick}
          className="rounded-[var(--axis-radius-md)] p-1 transition hover:bg-[var(--axis-surface-soft)]"
          aria-label="홈으로 이동"
        >
          <img
            src="/axis-logo.png"
            alt="AXIS"
            className="h-12 w-auto shrink-0 object-contain"
          />
        </button>

        <div className="hidden min-w-0 flex-col gap-1 leading-none lg:flex">
            <span
              className="text-fine-print tracking-[0.16em] uppercase text-stone"
              style={{ fontWeight: 600 }}
            >
              Now Viewing
            </span>
            <span
              className="font-display text-body-md-strong text-ink tracking-tight"
              style={{ fontWeight: 700 }}
            >
              {currentLabel}
            </span>
        </div>
      </div>

      {/* ─── 가운데: 글로벌 검색 input ──────────────────────── */}
      {hideGlobalSearch ? (
        <div className="min-w-0 flex-1" aria-hidden="true" />
      ) : (
        <form
          data-guide="global-search"
          className="relative min-w-0 flex-1"
          onSubmit={handleSearchSubmit}
        >
          <label htmlFor="axis-global-search" className="sr-only">검색</label>
          <div className="flex h-10 min-w-0 items-center overflow-hidden rounded-md border border-hairline bg-surface transition-colors hover:border-hairline-strong focus-within:border-action">
            <select
              value={searchScope}
              onChange={(event) => setSearchScope(event.target.value as SearchScope)}
              className="h-full w-[118px] shrink-0 border-r border-hairline bg-transparent px-3 text-caption-bold text-[var(--axis-ink)] outline-none sm:w-[132px]"
              aria-label="검색 범위"
            >
              {searchScopeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Search size={15} strokeWidth={2.2} className="ml-3 shrink-0 text-stone" />
            <input
              id="axis-global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={onSearchClick}
              ref={searchInputRef}
              className="h-full min-w-0 flex-1 bg-transparent px-3 pr-2 text-body-sm text-charcoal outline-none placeholder:text-stone"
              placeholder="Peer 동향 · 키워드 · 카드뉴스 검색..."
            />
            <kbd className="pointer-events-none mr-3 hidden shrink-0 rounded-sm border border-hairline bg-cream-soft px-1.5 py-0.5 font-mono text-fine-print text-stone md:inline">
              /
            </kbd>
          </div>
        </form>
      )}

      {/* ─── 우측: 크롤링 업데이트 + 액션 ───────────────────────────── */}
      <div className="relative flex min-w-fit shrink-0 items-center justify-end gap-1">
        {/* 마지막 크롤링 업데이트 */}
        {showUpdateTime ? (
          <div
            data-guide="topnav-update"
            className="mr-1 hidden min-w-[184px] items-center gap-2 rounded-md border border-hairline bg-cream-soft px-2.5 py-1.5 xl:flex"
          >
            <span className="text-caption-bold uppercase tracking-[0.08em] text-charcoal">
              업데이트
            </span>
            <span className="text-stone/40">·</span>
            <span className={`font-mono text-sm tabular-nums ${lastCrawlUpdate ? 'text-charcoal' : 'text-stone/50'}`}>
              {lastCrawlUpdate ?? '--.-- --:--'}
            </span>
            <span className="font-mono text-[11px] text-stone tabular-nums tracking-wider">KST</span>
          </div>
        ) : null}

        {/* 알림 */}
        <button
          data-guide="topnav-alerts"
          type="button"
          onClick={() => {
            onNotificationsClick?.();
            const nextOpen = !notificationsOpen;
            setNotificationsOpen(nextOpen);
            if (nextOpen) {
              void loadNotifications(10);
            }
          }}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-stone hover:bg-cream-soft hover:text-ink transition-colors"
          aria-label="알림"
          aria-expanded={notificationsOpen}
        >
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-sk-red px-1 text-[9px] font-bold leading-none text-white">
              {unreadCountLabel}
            </span>
          ) : null}
        </button>

        {notificationsOpen ? (
          <section className="absolute right-14 top-12 z-30 w-[360px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">Notifications</p>
                <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">안읽음 {unreadCountLabel}건</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    onNotificationSelect?.('notifications');
                  }}
                  className="text-xs font-semibold text-[var(--axis-accent-strong)] hover:text-[var(--axis-ink)]"
                >
                  전체보기
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await notificationsRepository.clearAll();
                      setNotifications([]);
                      setUnreadCount(0);
                      setNotificationError('');
                    } catch (error) {
                      setNotificationError(error instanceof Error ? error.message : '알림을 지우지 못했습니다.');
                    }
                  }}
                  className="text-xs font-semibold text-[var(--axis-muted)] hover:text-[var(--axis-danger)]"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-[var(--axis-muted)] hover:text-[var(--axis-ink)]"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {notificationsLoading ? (
                <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4 text-center text-sm font-semibold text-[var(--axis-muted)]">
                  알림을 불러오는 중입니다.
                </div>
              ) : null}
              {notificationError ? (
                <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,38,38,0.24)] bg-[rgba(220,38,38,0.08)] p-4 text-center text-sm font-semibold text-[var(--axis-danger)]">
                  {notificationError}
                </div>
              ) : null}
              {!notificationsLoading && !notificationError && visibleNotifications.length === 0 ? (
                <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4 text-center text-sm font-semibold text-[var(--axis-muted)]">
                  표시할 알림이 없습니다.
                </div>
              ) : null}
              {!notificationError && visibleNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    try {
                      if (!item.read) {
                        const updated = await notificationsRepository.markRead(item.id);
                        setNotifications((current) => current.map((notice) => notice.id === item.id ? updated : notice));
                        setUnreadCount((current) => Math.max(0, current - 1));
                      }
                    } catch (error) {
                      setNotificationError(error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.');
                      return;
                    }
                    setNotificationsOpen(false);
                    onNotificationSelect?.(item.target);
                  }}
                  className={`block w-full rounded-[var(--axis-radius-md)] border p-3 text-left transition hover:bg-[var(--axis-surface-muted)] ${
                    item.read
                      ? 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] opacity-72'
                      : 'border-[rgba(220,90,36,0.32)] bg-[rgba(220,90,36,0.08)]'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 text-[11px] font-semibold text-[var(--axis-accent-strong)]">
                    <span>{item.companyName || 'AXIS'} · {notificationTone(item)}</span>
                    <span className={item.read ? 'text-[var(--axis-muted)]' : 'text-sk-red'}>{item.read ? '읽음' : '안읽음'} · {formatNotificationTime(item.createdAt)}</span>
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-5 text-[var(--axis-ink)]">{item.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--axis-muted)]">{item.message}</span>
                  {item.matchedKeywords.length > 0 ? (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {item.matchedKeywords.slice(0, 3).map((keyword) => (
                        <span key={keyword} className="rounded-sm border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--axis-muted)]">
                          {keyword}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* 도움말 */}
        <button
          data-guide="topnav-help"
          type="button"
          onClick={onHelpClick}
          className="hidden h-9 w-9 items-center justify-center rounded-md text-stone transition-colors hover:bg-cream-soft hover:text-ink xl:flex"
          aria-label="도움말"
        >
          <HelpCircle size={16} strokeWidth={2} />
        </button>

        {/* User */}
        <button
          data-guide="topnav-profile"
          type="button"
          onClick={onUserClick}
          className="flex h-9 items-center gap-2 rounded-md pl-1 pr-2.5 hover:bg-cream-soft transition-colors"
          aria-label="회원정보 및 설정"
          title="회원정보 및 설정"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sk-red text-fine-print font-display-strong text-white">
            {userInitials}
          </span>
          <span className="hidden max-w-[8rem] truncate text-body-sm-strong text-ink sm:inline">{userLabel}</span>
          <Settings size={14} className="hidden text-stone lg:block" />
        </button>
      </div>
    </header>
  );
}
