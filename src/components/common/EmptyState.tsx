import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = '데이터 없음' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <InboxIcon size={32} className="mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
