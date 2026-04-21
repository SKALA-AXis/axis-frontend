import { useState } from 'react'
import { useTodayIssues } from '../hooks/useIssueCards'
import { IssueCard } from '../components/IssueCard/IssueCard'
import { IssueCardDetail } from '../components/IssueCard/IssueCardDetail'
import { WeakSignalSection } from '../components/WeakSignal/WeakSignalSection'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { EmptyState } from '../components/common/EmptyState'
import type { IssueCard as IssueCardType } from '../types/api'

export default function BriefingPage() {
  const { data: issues = [], isLoading } = useTodayIssues()
  const [selectedCard, setSelectedCard] = useState<IssueCardType | null>(null)

  const urgentCount = issues.filter((i) => i.importance === 'urgent').length
  const notableCount = issues.filter((i) => i.importance === 'notable').length
  const referenceCount = issues.filter((i) => i.importance === 'reference').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">오늘의 브리핑</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-red-600 font-medium">🔴 긴급 {urgentCount}건</span>
          <span className="text-yellow-600 font-medium">🟡 주목 {notableCount}건</span>
          <span className="text-green-600 font-medium">🟢 참고 {referenceCount}건</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          {isLoading && <LoadingSpinner />}
          {!isLoading && issues.length === 0 && (
            <EmptyState message="오늘의 이슈 카드가 없습니다" />
          )}
          {issues.map((card) => (
            <IssueCard
              key={card.id}
              card={card}
              onClick={() => setSelectedCard(card)}
              isSelected={selectedCard?.id === card.id}
            />
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedCard ? (
            <IssueCardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center h-64">
              <p className="text-sm text-gray-400">이슈 카드를 선택하면 상세 내용이 표시됩니다</p>
            </div>
          )}
        </div>
      </div>

      <WeakSignalSection />
    </div>
  )
}
