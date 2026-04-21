import type { ImportanceEnum } from '../types/api'

export const importanceConfig: Record<ImportanceEnum, {
  bg: string
  badge: string
  border: string
  label: string
  emoji: string
}> = {
  urgent: {
    bg: 'bg-red-50',
    badge: 'bg-red-500 text-white',
    border: 'border-red-200',
    label: '긴급',
    emoji: '🔴',
  },
  notable: {
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
    border: 'border-yellow-200',
    label: '주목',
    emoji: '🟡',
  },
  reference: {
    bg: 'bg-green-50',
    badge: 'bg-green-500 text-white',
    border: 'border-green-200',
    label: '참고',
    emoji: '🟢',
  },
}

export const eventTypeLabel: Record<string, string> = {
  partnership: '파트너십',
  ma: 'M&A',
  personnel: '인사',
  tech: '기술',
  regulation: '규제',
  new_biz: '신규사업',
}
