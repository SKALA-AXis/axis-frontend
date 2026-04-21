import { Zap } from 'lucide-react'
import { SignalStrengthBadge } from './SignalStrengthBadge'

interface WeakSignal {
  id: string
  peerId: string
  signal: string
  detail: string
  strength: 'weak' | 'medium' | 'strong'
  detectedAt: string
}

interface WeakSignalSectionProps {
  signals?: WeakSignal[]
  isLoading?: boolean
}

export function WeakSignalSection({ signals = [], isLoading = false }: WeakSignalSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-yellow-500" />
        <h2 className="text-sm font-bold text-gray-900">약한 신호 — 아직 보도 안 된 변화</h2>
      </div>
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}
      {!isLoading && signals.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">감지된 약한 신호 없음</p>
      )}
      {!isLoading && signals.map((signal) => (
        <div key={signal.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
          <SignalStrengthBadge strength={signal.strength} />
          <div>
            <p className="text-sm font-medium text-gray-800">{signal.signal}</p>
            <p className="text-xs text-gray-500 mt-0.5">{signal.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
