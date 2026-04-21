import type { ImportanceEnum } from '../../types/api'
import { importanceConfig } from '../../utils/importanceColor'

interface ImportanceBadgeProps {
  importance: ImportanceEnum
}

export function ImportanceBadge({ importance }: ImportanceBadgeProps) {
  const config = importanceConfig[importance]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
      {config.emoji} {config.label}
    </span>
  )
}
