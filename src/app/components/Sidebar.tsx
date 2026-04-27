import { Home, FileText, Bell, Settings, BarChart3, Users, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'issues', icon: FileText, label: '동향 카드' },
    { id: 'peers', icon: Users, label: 'Peer사' },
    { id: 'briefings', icon: BarChart3, label: '브리핑' },
    { id: 'alerts', icon: Bell, label: '알림' },
    { id: 'settings', icon: Settings, label: '설정' },
    { id: 'admin', icon: Shield, label: '관리' },
  ];

  return (
    <div className={`bg-black text-white h-screen flex flex-col border-r border-neutral-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-6 border-b border-neutral-800 ${isCollapsed ? 'p-4' : ''}`}>
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

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} />
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
            <div className="flex-1">
              <p className="text-sm font-medium">SK AX User</p>
              <p className="text-xs text-neutral-400">Strategist</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
