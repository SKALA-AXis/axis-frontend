import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'yyyy.MM.dd HH:mm', { locale: ko })
}

export function formatRelativeDate(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ko })
}
