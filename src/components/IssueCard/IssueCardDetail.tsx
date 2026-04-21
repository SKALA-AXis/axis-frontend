import type { IssueCard } from '../../types/api'
import { ImportanceBadge } from './ImportanceBadge'
import { EventTypeTag } from './EventTypeTag'
import { formatDate } from '../../utils/formatDate'
import { X } from 'lucide-react'

interface IssueCardDetailProps {
  card: IssueCard
  onClose: () => void
}

export function IssueCardDetail({ card, onClose }: IssueCardDetailProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full overflow-auto">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <ImportanceBadge importance={card.importance} />
          <EventTypeTag eventType={card.eventType} />
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X size={16} />
        </button>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-3">{card.title}</h2>

      {card.summaryLines && card.summaryLines.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">요약</h3>
          <ul className="space-y-1">
            {card.summaryLines.map((line, i) => (
              <li key={i} className="text-sm text-gray-600">{line}</li>
            ))}
          </ul>
        </div>
      )}

      {card.implication && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-base">✨</span>
            <h3 className="text-sm font-semibold text-blue-800">SK AX 시사점 (AI 초안)</h3>
            {card.implication.confidence < 0.6 && (
              <span className="text-xs text-yellow-600 ml-2">⚠️ 근거 불충분</span>
            )}
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            {card.implication.whyImportant && (
              <div>
                <span className="font-medium">왜 중요한가: </span>
                {card.implication.whyImportant}
              </div>
            )}
            {card.implication.potentialImpact && (
              <div>
                <span className="font-medium">잠재 영향: </span>
                {card.implication.potentialImpact}
              </div>
            )}
            {card.implication.suggestedActions?.length > 0 && (
              <div>
                <span className="font-medium">액션 아이템:</span>
                <ul className="mt-1 space-y-0.5 ml-3">
                  {card.implication.suggestedActions.map((action, i) => (
                    <li key={i} className="list-disc list-inside">{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {card.sources && card.sources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">출처</h3>
          <ul className="space-y-1">
            {card.sources.map((source) => (
              <li key={source.index} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">[{source.index}]</span>{' '}
                <a href={source.url} target="_blank" rel="noopener noreferrer"
                   className="text-blue-600 hover:underline">
                  {source.title}
                </a>
                {' '}— {source.sourceName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.createdAt && (
        <p className="mt-4 text-xs text-gray-400">{formatDate(card.createdAt)}</p>
      )}
    </div>
  )
}
