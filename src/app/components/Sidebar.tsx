import {
  ChevronLeft,
  ChevronRight,
  FileChartColumn,
  Home,
  Moon,
  Network,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../App';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUserRole: UserRole;
  themeMode: 'light' | 'dark';
  onThemeToggle: () => void;
}

const baseMenuItems = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'peerPlus', icon: Users, label: 'Peer+' },
  { id: 'issues', icon: FileChartColumn, label: '카드뉴스' },
  { id: 'insight', icon: Sparkles, label: '인사이트' },
  { id: 'mixer', icon: Sparkles, label: '믹서' },
  { id: 'keywordGraph', icon: Network, label: '키워드 그래프' },
] as const;

export function Sidebar({ activeView, onViewChange, currentUserRole, themeMode, onThemeToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = currentUserRole === 'admin'
    ? [...baseMenuItems, { id: 'admin', icon: Users, label: '관리자' }]
    : baseMenuItems;
  const ThemeIcon = themeMode === 'dark' ? Sun : Moon;

  return (
    <>
      {/* ─── Desktop sidebar — Notion 톤 ────────────────────── */}
      <aside
        className={`hidden h-full shrink-0 flex-col bg-canvas transition-[width] duration-200 md:flex ${
          collapsed ? 'w-[64px]' : 'w-[220px]'
        }`}
      >
        {/* Menu — 상단 TopNav 가 로고 표시. 사이드바는 메뉴만. */}
        <nav className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${collapsed ? 'px-2' : 'px-4'} py-8`}>
          <div className="space-y-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex w-full items-center rounded-md transition-colors ${
                    isActive
                      ? 'text-ink'
                      : 'text-charcoal hover:bg-surface'
                  } ${collapsed ? 'justify-center px-3 py-3' : 'justify-start gap-3 px-3.5 py-3 text-left'}`}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
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

        </nav>

        <div className={`${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
          <button
            type="button"
            onClick={onThemeToggle}
            className={`flex w-full h-9 items-center justify-center gap-2 rounded-md text-stone hover:bg-surface transition-colors ${
              collapsed ? 'px-0' : 'px-2'
            }`}
            aria-label={themeMode === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            title={themeMode === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            <ThemeIcon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="text-fine-print">{themeMode === 'dark' ? '라이트 모드' : '다크 모드'}</span>
            )}
          </button>

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
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-hairline-soft bg-canvas px-2 py-2 md:hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative flex min-w-[72px] flex-none flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors ${
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
