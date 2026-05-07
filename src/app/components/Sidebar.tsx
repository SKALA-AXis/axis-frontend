import {
  ChevronLeft,
  ChevronRight,
  FileChartColumn,
  FileSearch,
  Home,
  MonitorDot,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../App';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUserRole: UserRole;
}

const baseMenuItems = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'monitoring', icon: MonitorDot, label: '모니터링' },
  { id: 'issues', icon: FileChartColumn, label: '카드뉴스' },
  { id: 'briefings', icon: FileSearch, label: '브리핑' },
  { id: 'rawArticles', icon: Sparkles, label: '믹서기' },
] as const;

/**
 * Sidebar — Notion / YouTube / Stripe 톤
 * 흰 배경 + 우측 hairline border + 활성 = bg-cream-soft + bold + filled icon
 * 220px 폭 (collapsed 64px)
 */
export function Sidebar({ activeView, onViewChange, currentUserRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = currentUserRole === 'admin'
    ? [...baseMenuItems, { id: 'admin', icon: Users, label: '관리자' }]
    : baseMenuItems;

  return (
    <>
      {/* ─── Desktop sidebar — Notion 톤 ────────────────────── */}
      <aside
        className={`hidden h-dvh shrink-0 flex-col border-r border-hairline-soft bg-canvas transition-[width] duration-200 md:flex ${
          collapsed ? 'w-[64px]' : 'w-[220px]'
        }`}
      >
        {/* Menu — 상단 TopNav 가 로고 표시. 사이드바는 메뉴만. */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} pt-5 overflow-y-auto`}>
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex w-full items-center rounded-md text-left transition-colors ${
                    isActive
                      ? 'bg-cream-soft text-ink'
                      : 'text-charcoal hover:bg-surface'
                  } ${collapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3.5 py-3'}`}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-sk-red rounded-r-md" />
                  )}
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-sk-red' : 'text-stone'}`}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  {!collapsed && (
                    <span
                      className="text-body-md leading-tight"
                      style={{ fontWeight: isActive ? 700 : 600 }}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          {!collapsed && <div className="my-4 border-t border-hairline-soft" />}

          {/* Settings */}
          <button
            type="button"
            onClick={() => onViewChange('settings')}
            className={`relative flex w-full items-center rounded-md text-left transition-colors ${
              activeView === 'settings' ? 'bg-cream-soft text-ink' : 'text-charcoal hover:bg-surface'
            } ${collapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3.5 py-3'}`}
            aria-label="설정"
            title={collapsed ? '설정' : undefined}
          >
            {activeView === 'settings' && (
              <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-sk-red rounded-r-md" />
            )}
            <Settings
              className={`h-5 w-5 shrink-0 ${activeView === 'settings' ? 'text-sk-red' : 'text-stone'}`}
              strokeWidth={activeView === 'settings' ? 2.4 : 2}
            />
            {!collapsed && (
              <span
                className="text-body-md leading-tight"
                style={{ fontWeight: activeView === 'settings' ? 700 : 600 }}
              >
                설정
              </span>
            )}
          </button>
        </nav>

        {/* User block */}
        <div className={`border-t border-hairline-soft ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sk-red text-fine-print font-display-strong text-white">
                SK
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption-bold text-ink leading-tight">SK AX User</p>
                <p className="truncate text-fine-print text-stone capitalize leading-tight mt-0.5">{currentUserRole}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sk-red text-fine-print font-display-strong text-white">
                SK
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="mt-2 flex w-full h-6 items-center justify-center gap-1.5 rounded-md text-stone hover:bg-surface transition-colors"
            aria-label={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="text-fine-print">접기</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Mobile bottom nav ────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline-soft bg-canvas px-2 py-2 md:hidden">
        {[...menuItems, { id: 'settings', icon: Settings, label: '설정' }].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors ${
                isActive ? 'text-action' : 'text-stone'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`truncate text-fine-print ${isActive ? 'font-display-strong' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
