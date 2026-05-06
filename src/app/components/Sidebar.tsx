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
  { id: 'home', icon: Home, label: '홈' },
  { id: 'monitoring', icon: MonitorDot, label: '모니터링' },
  { id: 'issues', icon: FileChartColumn, label: '카드뉴스' },
  { id: 'briefings', icon: FileSearch, label: '브리핑' },
  { id: 'rawArticles', icon: Sparkles, label: '믹서기' },
] as const;

export function Sidebar({ activeView, onViewChange, currentUserRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = currentUserRole === 'admin'
    ? [...baseMenuItems, { id: 'admin', icon: Users, label: '관리자' as const }]
    : baseMenuItems;

  return (
    <>
      <aside className={`hidden h-dvh shrink-0 flex-col bg-white transition-[width] duration-300 md:flex ${collapsed ? 'w-[92px]' : 'w-[220px]'}`}>
        <div className={`${collapsed ? 'px-3 pb-8 pt-7' : 'px-5 pb-8 pt-7'}`}>
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)]">
              A
              </div>
              {!collapsed ? (
                <div>
                <div className="text-[20px] font-semibold tracking-[-0.04em] text-slate-900">AXIS</div>
                <div className="text-sm text-slate-400">Strategic Intelligence</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <nav className={`flex-1 ${collapsed ? 'px-3' : 'px-4'}`}>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex w-full items-center rounded-2xl text-left transition ${
                  isActive
                    ? 'bg-[#f97316]/90 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                  } ${collapsed ? 'justify-center px-3 py-3.5' : 'gap-3 px-4 py-3.5'}`}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed ? <span className="text-[17px] font-medium tracking-[-0.03em]">{item.label}</span> : null}
                </button>
              );
            })}
          </div>
        </nav>

        <div className={`${collapsed ? 'px-3 pb-5 pt-6' : 'px-4 pb-5 pt-6'}`}>
          {collapsed ? (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onViewChange('settings')}
                className={`rounded-[20px] border bg-white p-2.5 shadow-[0_10px_24px_rgba(148,163,184,0.1)] transition hover:border-slate-300 hover:bg-slate-50 ${
                  activeView === 'settings' ? 'border-orange-200 ring-2 ring-orange-100' : 'border-slate-200'
                }`}
                aria-label="회원 설정"
                title="회원 설정"
              >
                <div className="flex justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[0.78rem] font-semibold text-white">
                    SK
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_8px_18px_rgba(148,163,184,0.08)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                aria-label="사이드바 펼치기"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onViewChange('settings')}
                className={`min-w-0 flex-1 rounded-[18px] border bg-white px-3 py-2.5 text-left shadow-[0_8px_20px_rgba(148,163,184,0.09)] transition hover:border-slate-300 hover:bg-slate-50 ${
                  activeView === 'settings' ? 'border-orange-200 ring-2 ring-orange-100' : 'border-slate-200'
                }`}
                aria-label="회원 설정"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[0.78rem] font-semibold text-white">
                    SK
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.9rem] font-semibold text-slate-900">SK AX User</div>
                    <div className="truncate text-[0.74rem] capitalize text-slate-400">{currentUserRole}</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_8px_18px_rgba(148,163,184,0.08)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                aria-label="사이드바 접기"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition ${
                isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => onViewChange('settings')}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition ${
            activeView === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-slate-500'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="truncate text-[11px] font-medium">설정</span>
        </button>
      </nav>
    </>
  );
}
