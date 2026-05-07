import { FormEvent, useState } from 'react';
import { Bell, HelpCircle, Search, Settings } from 'lucide-react';

interface TopNavProps {
  activeView: string;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onNotificationSelect?: (view: string) => void;
  onLogoClick?: () => void;
  onUserClick?: () => void;
}

const viewLabels: Record<string, string> = {
  home: '홈',
  assignment: 'Peer+',
  matching: '믹서',
  peerPlus: 'Peer+',
  issues: '카드뉴스',
  insight: '인사이트',
  keywordGraph: '키워드 그래프',
  monitoring: 'Peer+',
  mixer: '믹서',
  briefings: '브리핑',
  rawArticles: '믹서기',
  settings: '설정',
  admin: '관리자',
};

function formatLastCrawlUpdate() {
  const date = new Date();
  const dateLabel = date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\.$/, '');
  return `${dateLabel} 08:30`;
}

const notificationItems = [
  { peer: '포스코DX', title: '공공 메가딜 우선협상 신호가 감지되었습니다.', tone: '대응 필요', target: 'keywordGraph' },
  { peer: 'LG CNS', title: 'AX 금융 패키지 관련 카드뉴스 요약이 준비되었습니다.', tone: '카드뉴스 보기', target: 'issues' },
  { peer: '삼성SDS', title: 'IR 기반 AI agent 지표가 Peer+에 반영되었습니다.', tone: 'Peer+ 이동', target: 'peerPlus' },
];

export function TopNav({
  activeView,
  onSearchClick,
  onNotificationsClick,
  onNotificationSelect,
  onLogoClick,
  onUserClick,
}: TopNavProps) {
  const currentLabel = viewLabels[activeView] ?? activeView;
  const lastCrawlUpdate = formatLastCrawlUpdate();
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchClick?.();
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
      <form className="relative min-w-0 flex-1" onSubmit={handleSearchSubmit}>
        <label htmlFor="axis-global-search" className="sr-only">검색</label>
        <Search
          size={15}
          strokeWidth={2.2}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
        />
        <input
          id="axis-global-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => onSearchClick?.()}
          className="h-10 w-full min-w-0 rounded-md border border-hairline bg-surface px-10 pr-14 text-body-sm text-charcoal outline-none transition-colors placeholder:text-stone hover:border-hairline-strong focus:border-action"
          placeholder="Peer 동향 · 키워드 · 카드뉴스 검색..."
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-sm border border-hairline bg-cream-soft px-1.5 py-0.5 font-mono text-[10px] text-stone md:inline">
            ⌘K
        </kbd>
      </form>

      {/* ─── 우측: 크롤링 업데이트 + 액션 ───────────────────────────── */}
      <div className="relative flex min-w-fit shrink-0 items-center justify-end gap-1">
        {/* 마지막 크롤링 업데이트 */}
        <div className="mr-1 hidden items-center gap-2.5 rounded-md border border-hairline bg-cream-soft px-3 py-2 xl:flex">
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
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-sk-red" />
        </button>

        {notificationsOpen ? (
          <section className="absolute right-14 top-12 z-30 w-[320px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_22px_70px_-36px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="axis-kicker">Notifications</p>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="text-xs font-semibold text-[var(--axis-muted)] hover:text-[var(--axis-ink)]"
              >
                닫기
              </button>
            </div>
            <div className="space-y-2">
              {notificationItems.map((item) => (
                <button
                  key={`${item.peer}-${item.title}`}
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    onNotificationSelect?.(item.target);
                  }}
                  className="block w-full rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:bg-[var(--axis-surface-muted)]"
                >
                  <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">{item.peer} · {item.tone}</span>
                  <span className="mt-1 block text-sm font-semibold leading-5 text-[var(--axis-ink)]">{item.title}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* 도움말 */}
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-stone transition-colors hover:bg-cream-soft hover:text-ink 2xl:flex"
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
