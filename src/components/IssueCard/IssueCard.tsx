import React from 'react'
import type { IssueCard as IssueCardType } from '../../types/api'
import { ImportanceBadge } from './ImportanceBadge'
import { EventTypeTag } from './EventTypeTag'
import { importanceConfig } from '../../utils/importanceColor'
import { formatRelativeDate } from '../../utils/formatDate'

interface IssueCardProps {
  card: IssueCardType
  onClick: () => void
  isSelected?: boolean
}

/**
 * 이슈 카드 컴포넌트
 * 중요도에 따라 배경색이 다르게 렌더링된다.
 */
export const IssueCard = React.memo(function IssueCard({ card, onClick, isSelected = false }: IssueCardProps) {
  const config = importanceConfig[card.importance]
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${config.bg} ${config.border}
        ${isSelected ? 'ring-2 ring-blue-400' : 'hover:shadow-md'}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <ImportanceBadge importance={card.importance} />
        <EventTypeTag eventType={card.eventType} />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{card.title}</h3>
      {card.createdAt && (
        <p className="text-xs text-gray-400">{formatRelativeDate(card.createdAt)}</p>
      )}
    </div>
  )
})
