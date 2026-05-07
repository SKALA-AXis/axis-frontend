/**
 * TopNav — 글로벌 상단 navigation bar (라이트 톤, 80px)
 * 본문 흰 배경에 어울리도록 warm off-white nav.
 * Layout: grid-cols-[1fr_minmax(0,720px)_1fr] — 가운데 검색 정확히 중앙
 */
import { useEffect, useState } from 'react';
import { Bell, HelpCircle, Search } from 'lucide-react';

interface TopNavProps {
  activeView: string;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
}

const viewLabels: Record<string, string> = {
  home: '홈',
  monitoring: '모니터링',
  issues: '카드뉴스',
  briefings: '브리핑',
  rawArticles: '믹서기',
  settings: '설정',
  admin: '관리자',
};

function formatKstTime() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

export function TopNav({ activeView, onSearchClick, onNotificationsClick }: TopNavProps) {
  const currentLabel = viewLabels[activeView] ?? activeView;
  const [now, setNow] = useState(formatKstTime);

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatKstTime()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header
      className="relative grid h-20 shrink-0 grid-cols-[1fr_minmax(0,720px)_1fr] items-center gap-4 bg-canvas px-4 lg:px-6 overflow-hidden z-10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
    >
      {/* ─── 상단 1.5px sk-mistral 시그니처 stripe ──────────── */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-sk-mistral" />

      {/* ─── 좌측 상단 ambient 빨간 glow (SK 정체성, 라이트에 매우 약하게) ── */}
      <div
        className="pointer-events-none absolute -left-32 -top-24 h-64 w-64 rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, #EA002C 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ─── 좌측: AXIS 로고 + 현재 페이지 ────────────────── */}
      <div className="relative flex items-center gap-5 min-w-0">
        <img
          src="/axis-logo.png"
          alt="AXIS"
          className="h-14 w-auto object-contain shrink-0"
        />

        {/* vertical bar + eyebrow + heading */}
        <div className="hidden md:flex items-center gap-3 ml-1">
          <span className="h-7 w-px bg-hairline-strong" aria-hidden />
          <div className="leading-none flex flex-col gap-1">
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
      </div>

      {/* ─── 가운데: 글로벌 검색 input ──────────────────────── */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={onSearchClick}
          className="group flex h-10 w-full items-center gap-2.5 rounded-md border border-hairline bg-surface px-3.5 text-body-sm text-stone hover:border-hairline-strong hover:text-charcoal transition-colors"
          aria-label="검색"
        >
          <Search size={15} strokeWidth={2.2} className="shrink-0" />
          <span className="flex-1 text-left truncate">Peer 동향 · 키워드 · 카드뉴스 검색...</span>
          <kbd className="hidden md:inline rounded-sm bg-cream-soft border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-stone group-hover:bg-cream">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ─── 우측: Live + 액션 ───────────────────────────── */}
      <div className="relative flex items-center gap-1 justify-end min-w-0">
        {/* Live 지표 */}
        <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-md bg-cream-soft border border-hairline">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-action animate-ping opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-action" />
          </span>
          <span className="text-fine-print text-charcoal tracking-wider uppercase" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
            Live
          </span>
          <span className="text-stone/40">·</span>
          <span className="font-mono text-fine-print text-charcoal tabular-nums">{now}</span>
          <span className="font-mono text-[9px] text-stone tabular-nums tracking-wider">KST</span>
        </div>

        {/* 알림 */}
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-stone hover:bg-cream-soft hover:text-ink transition-colors"
          aria-label="알림"
        >
          <Bell size={16} strokeWidth={2} />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-sk-red" />
        </button>

        {/* 도움말 */}
        <button
          type="button"
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-md text-stone hover:bg-cream-soft hover:text-ink transition-colors"
          aria-label="도움말"
        >
          <HelpCircle size={16} strokeWidth={2} />
        </button>

        {/* divider */}
        <span className="hidden md:inline-block h-5 w-px bg-hairline mx-2" />

        {/* User */}
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md pl-1 pr-2.5 hover:bg-cream-soft transition-colors"
          aria-label="사용자 메뉴"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sk-red text-fine-print font-display-strong text-white">
            SK
          </span>
          <span className="hidden lg:inline text-body-sm-strong text-ink">박지원</span>
        </button>
      </div>
    </header>
  );
}
