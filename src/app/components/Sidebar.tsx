import { Home, FileText, Bell, Settings, BarChart3, Users, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../App';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUserRole: UserRole;
}

export function Sidebar({ activeView, onViewChange, currentUserRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'issues', icon: FileText, label: '동향 카드' },
    { id: 'peers', icon: Users, label: 'Peer사' },
    { id: 'briefings', icon: BarChart3, label: '브리핑' },
    { id: 'alerts', icon: Bell, label: '알림' },
    { id: 'settings', icon: Settings, label: '설정' },
    { id: 'admin', icon: Shield, label: '관리' },
  ].filter((item) => item.id !== 'admin' || currentUserRole === 'admin');

  return (
    <>
    <div className={`hidden h-dvh flex-col border-r border-neutral-800 bg-black text-white transition-all duration-300 md:flex ${isCollapsed ? 'w-16' : 'w-56'}`}>
      <div className={`border-b border-neutral-800 p-4 ${isCollapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">AXIS</h1>
              <p className="text-xs text-neutral-400">Peer Monitoring</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={19} className="shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-neutral-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
              <Users size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">SK AX User</p>
              <p className="truncate text-xs text-neutral-400">{currentUserRole}</p>
            </div>
          </div>
        </div>
      )}
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-neutral-800 bg-black px-2 py-2 text-white md:hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 transition-colors ${
              isActive ? 'bg-orange-600 text-white' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
            title={item.label}
          >
            <Icon size={18} />
            <span className="max-w-full truncate text-[11px] leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
    </>
  );
}
