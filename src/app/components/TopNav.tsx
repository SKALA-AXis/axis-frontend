import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bell, HelpCircle, Search, Settings } from 'lucide-react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSummaryLines,
} from '../../features/card-news/mappers/cardNewsExecutive';
import { viewLabels } from '../../shared/content/navigation';
import { searchSuggestionKeywords } from '../../shared/content/searchSuggestions';
import {
  mockNotificationItems,
  notificationClearedStorageKey,
  notificationStorageKey,
  type NotificationItem,
} from '../../shared/mocks/notifications';
import { mockPeerPlusOptions, type PeerPlusPeerId } from '../../shared/mocks/peerPlus';

interface TopNavProps {
  activeView: string;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onNotificationSelect?: (view: string) => void;
  onLogoClick?: () => void;
  onUserClick?: () => void;
  onHelpClick?: () => void;
  onSearchNavigate?: (target: string, options?: { peerId?: PeerPlusPeerId; query?: string }) => void;
}

function formatLastCrawlUpdate() {
  const date = new Date();
  const dateLabel = date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\.$/, '');
  return `${dateLabel} 08:30`;
}

function loadNotifications() {
  try {
    const stored = window.localStorage.getItem(notificationStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    const storedItems = Array.isArray(parsed) ? parsed.filter((item): item is NotificationItem => item && typeof item.id === 'string') : [];
    if (stored && window.localStorage.getItem(notificationClearedStorageKey) === 'true') {
      return storedItems;
    }
    const byId = new Map(storedItems.map((item) => [item.id, item]));
    const seeded = mockNotificationItems.map((item) => byId.get(item.id) ?? item);
    const extraStored = storedItems.filter((item) => !mockNotificationItems.some((seed) => seed.id === item.id));
    return [...seeded, ...extraStored];
  } catch {
    return mockNotificationItems;
  }
}

export function TopNav({
  activeView,
  onSearchClick,
  onNotificationsClick,
  onNotificationSelect,
  onLogoClick,
  onUserClick,
  onHelpClick,
  onSearchNavigate,
}: TopNavProps) {
  const currentLabel = viewLabels[activeView] ?? activeView;
  const lastCrawlUpdate = formatLastCrawlUpdate();
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(loadNotifications);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cards } = useCardNews();
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const peerResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return mockPeerPlusOptions.filter((peer) => peer.label.toLowerCase().replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, '')));
  }, [normalizedQuery]);
  const cardResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return rankedCards
      .filter((card) => {
        const haystack = [
          card.title,
          getPeerLabel(card),
          card.category,
          card.category_label,
          card.subtitle,
          card.sector,
          ...getSummaryLines(card),
          ...(card.insights ?? []),
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 4);
  }, [normalizedQuery, rankedCards]);
  const keywordFallback = hasQuery && peerResults.length === 0 && cardResults.length === 0;
  const showSearchPanel = searchOpen && (hasQuery || searchSuggestionKeywords.length > 0);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleNotifications = showAllNotifications ? notifications : notifications.slice(0, 3);

  useEffect(() => {
    window.localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
  }, [notifications]);

  const navigateFromSearch = (target: string, options?: { peerId?: PeerPlusPeerId; query?: string }) => {
    setSearchOpen(false);
    setQuery('');
    onSearchNavigate?.(target, options);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedQuery) {
      onSearchClick?.();
      setSearchOpen(true);
      return;
    }
    const peer = peerResults[0];
    if (peer) {
      navigateFromSearch('peerPlus', { peerId: peer.id, query });
      return;
    }
    navigateFromSearch('issues', { query });
  };

  return (
    <header
      className="relative z-10 flex h-20 shrink-0 items-center gap-4 bg-canvas px-4 lg:px-6"
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
              className="text-[10px] tracking-[0.16em] uppercase text-stone"
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
      <form
        data-guide="global-search"
        className="relative min-w-0 flex-1"
        onSubmit={handleSearchSubmit}
        onMouseEnter={() => setSearchOpen(true)}
        onMouseLeave={() => {
          if (document.activeElement?.id !== 'axis-global-search' && !query.trim()) {
            setSearchOpen(false);
          }
        }}
      >
        <label htmlFor="axis-global-search" className="sr-only">검색</label>
        <Search
          size={15}
          strokeWidth={2.2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
        />
        <input
          id="axis-global-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => {
            setSearchOpen(true);
            onSearchClick?.();
          }}
          onBlur={() => window.setTimeout(() => setSearchOpen(false), 160)}
          className="h-10 w-full min-w-0 rounded-md border border-hairline bg-surface px-10 pr-14 text-body-sm text-charcoal outline-none transition-colors placeholder:text-stone hover:border-hairline-strong focus:border-action"
          placeholder="Peer 동향 · 키워드 · 카드뉴스 검색..."
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-sm border border-hairline bg-cream-soft px-1.5 py-0.5 font-mono text-[10px] text-stone md:inline">
            ⌘K
        </kbd>
        {showSearchPanel ? (
          <section className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)]">
            <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-4 py-3">
              <p className="axis-kicker">{hasQuery ? 'Search results' : 'Recommended keywords'}</p>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {!hasQuery ? (
                <div className="p-2">
                  <div className="flex flex-wrap gap-2">
                    {searchSuggestionKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => navigateFromSearch('issues', { query: keyword })}
                        className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {mockPeerPlusOptions.slice(0, 4).map((peer) => (
                      <button
                        key={peer.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => navigateFromSearch('peerPlus', { peerId: peer.id, query: peer.label })}
                        className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3 text-left transition hover:border-[var(--axis-accent)]"
                      >
                        <span className="text-[11px] font-semibold text-[var(--axis-muted)]">Peer 바로가기</span>
                        <span className="mt-1 block text-sm font-bold text-[var(--axis-ink)]">{peer.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {peerResults.map((peer) => (
                <button
                  key={peer.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateFromSearch('peerPlus', { peerId: peer.id, query })}
                  className="block w-full rounded-[var(--axis-radius-md)] p-3 text-left transition hover:bg-[var(--axis-surface-soft)]"
                >
                  <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">Peer+ 이동</span>
                  <span className="mt-1 block text-sm font-bold text-[var(--axis-ink)]">{peer.label}</span>
                </button>
              ))}
              {cardResults.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateFromSearch('issues', { query })}
                  className="block w-full rounded-[var(--axis-radius-md)] p-3 text-left transition hover:bg-[var(--axis-surface-soft)]"
                >
                  <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)} · {getDisplayDate(card)}</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-bold leading-5 text-[var(--axis-ink)]">{card.title}</span>
                  <span className="mt-1 line-clamp-1 block text-xs text-[var(--axis-muted)]">{getSummaryLines(card)[0]}</span>
                </button>
              ))}
              {keywordFallback ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateFromSearch('issues', { query })}
                  className="block w-full rounded-[var(--axis-radius-md)] p-3 text-left transition hover:bg-[var(--axis-surface-soft)]"
                >
                  <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">키워드로 카드뉴스 검색</span>
                  <span className="mt-1 block text-sm font-bold text-[var(--axis-ink)]">‘{query.trim()}’ 관련 카드뉴스 보기</span>
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </form>

      {/* ─── 우측: 크롤링 업데이트 + 액션 ───────────────────────────── */}
      <div className="relative flex min-w-fit shrink-0 items-center justify-end gap-1">
        {/* 마지막 크롤링 업데이트 */}
        <div className="mr-1 hidden items-center gap-2 rounded-md border border-hairline bg-cream-soft px-2.5 py-1.5 xl:flex">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-charcoal">
            업데이트
          </span>
          <span className="text-stone/40">·</span>
          <span className="font-mono text-sm text-charcoal tabular-nums">{lastCrawlUpdate}</span>
          <span className="font-mono text-[11px] text-stone tabular-nums tracking-wider">KST</span>
        </div>

        {/* 알림 */}
        <button
          type="button"
          onClick={() => {
            onNotificationsClick?.();
            setNotificationsOpen((open) => !open);
          }}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-stone hover:bg-cream-soft hover:text-ink transition-colors"
          aria-label="알림"
          aria-expanded={notificationsOpen}
        >
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-sk-red px-1 text-[9px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>

        {notificationsOpen ? (
          <section className="absolute right-14 top-12 z-30 w-[360px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">Notifications</p>
                <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">안읽음 {unreadCount}건</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllNotifications((current) => !current)}
                  className="text-xs font-semibold text-[var(--axis-accent-strong)] hover:text-[var(--axis-ink)]"
                >
                  {showAllNotifications ? '최근만' : '전체보기'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.setItem(notificationClearedStorageKey, 'true');
                    setNotifications([]);
                    setShowAllNotifications(false);
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
              {visibleNotifications.length === 0 ? (
                <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4 text-center text-sm font-semibold text-[var(--axis-muted)]">
                  표시할 알림이 없습니다.
                </div>
              ) : null}
              {visibleNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setNotifications((current) => current.map((notice) => notice.id === item.id ? { ...notice, read: true } : notice));
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
                    <span>{item.peer} · {item.tone}</span>
                    <span className={item.read ? 'text-[var(--axis-muted)]' : 'text-sk-red'}>{item.read ? '읽음' : '안읽음'} · {item.time}</span>
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-5 text-[var(--axis-ink)]">{item.title}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* 도움말 */}
        <button
          type="button"
          onClick={onHelpClick}
          className="hidden h-9 w-9 items-center justify-center rounded-md text-stone transition-colors hover:bg-cream-soft hover:text-ink xl:flex"
          aria-label="도움말"
        >
          <HelpCircle size={16} strokeWidth={2} />
        </button>

        {/* User */}
        <button
          type="button"
          onClick={onUserClick}
          className="flex h-9 items-center gap-2 rounded-md pl-1 pr-2.5 hover:bg-cream-soft transition-colors"
          aria-label="회원정보 및 설정"
          title="회원정보 및 설정"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sk-red text-fine-print font-display-strong text-white">
            SK
          </span>
          <span className="hidden text-body-sm-strong text-ink sm:inline">박지원</span>
          <Settings size={14} className="hidden text-stone lg:block" />
        </button>
      </div>
    </header>
  );
}
