import {
  Bell,
  Bookmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutDashboard,
  Newspaper,
  Settings,
  Users,
  Waves,
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../App';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUserRole: UserRole;
}

const brandLogoSrc = '/png.png';

export function Sidebar({ activeView, onViewChange, currentUserRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [logoVisible, setLogoVisible] = useState(true);

  const menuItems = [
    { id: 'home',        icon: House,           label: '홈' },
    { id: 'dashboard',   icon: LayoutDashboard, label: '대시보드' },
    { id: 'issues',      icon: Briefcase,       label: '동향 카드' },
    { id: 'peers',       icon: Users,           label: 'Peer사' },
    { id: 'briefings',   icon: Newspaper,       label: '브리핑' },
    { id: 'rawArticles', icon: Waves,           label: '믹서기' },
    { id: 'bookmarks',   icon: Bookmark,        label: '북마크' },
  ];

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden h-dvh flex-col bg-white border-r border-black/[0.06] shadow-[1px_0_0_rgba(0,0,0,0.04)] text-[rgba(15,17,23,0.88)] transition-all duration-300 md:flex ${
          isCollapsed ? 'w-[82px]' : 'w-[214px]'
        }`}
        style={{ willChange: 'width' }}
      >
        {/* Brand */}
        <div className={`flex items-center border-b border-black/[0.05] ${isCollapsed ? 'justify-center px-0 py-5' : 'gap-3 px-5 py-5'}`}>
          <button
            type="button"
            onClick={() => onViewChange('home')}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          >
            {logoVisible ? (
              <img
                src={brandLogoSrc}
                alt="SK AX logo"
                className="h-8 w-8 shrink-0 object-contain"
                onError={() => setLogoVisible(false)}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ff8c00,#ff4400)' }}>
                AX
              </div>
            )}
            {!isCollapsed && (
              <div className="leading-none">
                <span className="block text-[1.05rem] font-black tracking-[-0.04em] text-[#E1002A]">AXIS</span>
              </div>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex flex-1 items-center overflow-y-auto py-8 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div className="flex w-full flex-col justify-center gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                    className={`sidebar-item ${isActive ? 'active' : ''} ${
                    isCollapsed ? 'justify-center px-0 py-4' : 'py-4'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={`shrink-0 transition-colors ${isActive ? 'text-[#d96200]' : ''}`}
                  />
                  {!isCollapsed && <span className="leading-none">{item.label}</span>}
                  {isActive && !isCollapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff7f00] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={`border-t border-black/[0.05] py-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onViewChange('settings')}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-black/[0.04]"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_2px_8px_rgba(255,127,0,0.30)]"
                  style={{ background: 'linear-gradient(135deg,#ff8c00,#e05000)' }}
                >
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.82rem] font-semibold text-black/85 leading-none">Andrew Smith</p>
                  <p className="mt-0.5 text-[10px] text-black/40 leading-none">{currentUserRole}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-black/36 transition hover:bg-black/[0.05] hover:text-[#ff7f00]"
                aria-label="사이드바 접기"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ff8c00,#e05000)' }}
              >
                A
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-black/36 transition hover:bg-black/[0.05] hover:text-[#ff7f00]"
                aria-label="사이드바 펼치기"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-black/[0.07] bg-white/95 backdrop-blur-lg px-1 py-1.5 md:hidden"
        style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.05), 0 -4px 12px rgba(0,0,0,0.06)' }}>
        {menuItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`flex min-w-[4rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition ${
                isActive
                  ? 'text-[#d96200]'
                  : 'text-black/40 hover:text-black/60'
              }`}
              title={item.label}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
                isActive ? 'bg-[#ff7f00]/10' : ''
              }`}>
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span className="max-w-full truncate text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
