/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편 반영, Peer+ 글로벌 산업 탭 연동, 글로벌 트렌드 사이드바 제거
 *   2026-05-29 안가은 — 브리핑·믹서 페이지 구성 수정 및 사용자 기능 추가 반영
 *   2026-06-18 안가은 — 모바일 하단 내비를 모든 메뉴가 보이는 그리드 구조로 개선
 */
import {
  ChevronLeft,
  ChevronRight,
  FileChartColumn,
  FileText,
  Home,
  Lightbulb,
  Moon,
  Network,
  Shuffle,
  Sun,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { adminNavigationItem, primaryNavigationItems } from '../../../shared/content/navigation';
import type { UserRole } from '../../types/userRole';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUserRole: UserRole;
  themeMode: 'light' | 'dark';
  onThemeToggle: () => void;
}

const menuIcons = {
  home: Home,
  briefings: FileText,
  insight: Lightbulb,
  peerPlus: Users,
  issues: FileChartColumn,
  mixer: Shuffle,
  keywordGraph: Network,
  admin: Users,
} as const;

export function Sidebar({ activeView, onViewChange, currentUserRole, themeMode, onThemeToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = currentUserRole === 'admin'
    ? [...primaryNavigationItems, adminNavigationItem]
    : primaryNavigationItems;
  const ThemeIcon = themeMode === 'dark' ? Sun : Moon;
  const mobileGridClass = menuItems.length > 6 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <>
      {/* ─── Desktop sidebar — Notion 톤 ────────────────────── */}
      <aside
        className={`hidden h-full shrink-0 flex-col bg-canvas transition-[width] duration-200 md:flex ${
          collapsed ? 'w-[64px]' : 'w-[220px]'
        }`}
      >
        {/* Menu — 상단 TopNav 가 로고 표시. 사이드바는 메뉴만. */}
        <nav data-guide="sidebar-nav" className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${collapsed ? 'px-2' : 'px-4'} py-8`}>
          <div className="space-y-5">
            {menuItems.map((item) => {
              const Icon = menuIcons[item.id];
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
            data-guide="sidebar-nav"
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
      <nav
        aria-label="주요 메뉴"
        className={`fixed inset-x-0 bottom-0 z-40 grid ${mobileGridClass} gap-1 border-t border-hairline-soft bg-canvas px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_48px_-42px_rgba(0,0,0,0.58)] md:hidden`}
      >
        {menuItems.map((item) => {
          const Icon = menuIcons[item.id];
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-1.5 transition-colors ${
                isActive ? 'bg-[rgba(220,90,36,0.08)] text-action' : 'text-stone hover:bg-surface'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`max-w-full truncate text-[10px] leading-tight ${isActive ? 'font-display-strong' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
