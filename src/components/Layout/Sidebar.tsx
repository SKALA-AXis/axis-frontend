import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, BarChart2, Settings } from 'lucide-react'

const navItems = [
  { to: '/briefing', icon: LayoutDashboard, label: '브리핑' },
  { to: '/search', icon: Search, label: 'AI 검색' },
  { to: '/peers', icon: BarChart2, label: 'Peer사' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export default function Sidebar() {
  return (
    <aside className="w-16 md:w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <span className="font-bold text-xl text-blue-600 hidden md:block">AXIS</span>
        <span className="font-bold text-xl text-blue-600 md:hidden">A</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={18} />
            <span className="hidden md:block">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
