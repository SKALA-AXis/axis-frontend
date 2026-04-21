import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { peersApi } from '../api/peers'
import { useIssueCards } from '../hooks/useIssueCards'
import { IssueCard } from '../components/IssueCard/IssueCard'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { EmptyState } from '../components/common/EmptyState'

export default function PeerMonitorPage() {
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null)
  const { data: peers = [] } = useQuery({ queryKey: ['peers'], queryFn: peersApi.getList })
  const { data: issues = [], isLoading } = useIssueCards(selectedPeer ? { peerId: selectedPeer } : {})

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Peer사 모니터링</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPeer(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!selectedPeer ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          전체
        </button>
        {peers.map((peer: { peerId: string; name: string }) => (
          <button
            key={peer.peerId}
            onClick={() => setSelectedPeer(peer.peerId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedPeer === peer.peerId ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            {peer.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : issues.length === 0 ? (
        <EmptyState message="이슈 카드가 없습니다" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((card) => (
            <IssueCard key={card.id} card={card} onClick={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
