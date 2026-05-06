import {
  ChevronLeft,
  ChevronRight,
  FileChartColumn,
  FileSearch,
  Home,
  MonitorDot,
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
  { id: 'home', icon: Home, label: '홈', caption: 'Executive cards' },
  { id: 'monitoring', icon: MonitorDot, label: '모니터링', caption: 'Peer command' },
  { id: 'issues', icon: FileChartColumn, label: '카드뉴스', caption: 'Evidence library' },
  { id: 'briefings', icon: FileSearch, label: '브리핑', caption: 'Narrative report' },
  { id: 'rawArticles', icon: Sparkles, label: '믹서기', caption: 'Action synthesis' },
] as const;

export function Sidebar({ activeView, onViewChange, currentUserRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = currentUserRole === 'admin'
    ? [...baseMenuItems, { id: 'admin', icon: Users, label: '관리자' as const, caption: 'Operations' }]
    : baseMenuItems;

  return (
    <>
      <aside className={`hidden h-dvh shrink-0 flex-col border-r border-[var(--axis-hairline)] bg-[var(--axis-surface)] transition-[width] duration-300 md:flex ${collapsed ? 'w-[88px]' : 'w-[252px]'}`}>
        <div className={`${collapsed ? 'px-3 py-5' : 'px-5 py-5'}`}>
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-sm font-semibold tracking-[-0.02em] text-white">
              AX
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-[-0.04em] text-[var(--axis-ink)]">AXIS</div>
                <div className="text-xs font-medium text-[var(--axis-muted)]">Executive Intelligence</div>
              </div>
            ) : null}
          </div>
        </div>

        <nav className={`flex-1 ${collapsed ? 'px-3' : 'px-4'}`}>
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex w-full items-center rounded-[var(--axis-radius-md)] text-left transition ${
                    isActive
                      ? 'bg-[var(--axis-navy)] text-white'
                      : 'text-[var(--axis-body)] hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]'
                  } ${collapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-3'}`}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed ? (
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={`block text-[11px] ${isActive ? 'text-white/56' : 'text-[var(--axis-muted)]'}`}>{item.caption}</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <div className={`${collapsed ? 'px-3 pb-5 pt-4' : 'px-4 pb-5 pt-4'}`}>
          <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center gap-2'}`}>
            <button
              type="button"
              onClick={() => onViewChange('settings')}
              className={`min-w-0 rounded-[var(--axis-radius-md)] border bg-white text-left transition hover:border-[var(--axis-accent)] ${
                collapsed ? 'h-11 w-11 p-0' : 'flex-1 px-3 py-2.5'
              } ${activeView === 'settings' ? 'border-[var(--axis-accent)]' : 'border-[var(--axis-hairline)]'}`}
              aria-label="회원 설정"
            >
              {collapsed ? (
                <div className="flex justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-sm)] bg-[var(--axis-surface-muted)] text-xs font-semibold text-[var(--axis-ink)]">
                    SK
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-sm)] bg-[var(--axis-surface-muted)] text-xs font-semibold text-[var(--axis-ink)]">
                    SK
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[var(--axis-ink)]">SK AX User</div>
                    <div className="truncate text-[11px] capitalize text-[var(--axis-muted)]">{currentUserRole}</div>
                  </div>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-ink)]"
              aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-2 py-2 md:hidden">
        {[...menuItems, { id: 'settings', icon: Users, label: '설정' as const, caption: '' }].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[var(--axis-radius-md)] px-1 py-2 transition ${
                isActive ? 'bg-[var(--axis-navy)] text-white' : 'text-[var(--axis-muted)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
