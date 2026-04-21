import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Bell } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          SK
        </div>
      </div>
    </header>
  )
}
