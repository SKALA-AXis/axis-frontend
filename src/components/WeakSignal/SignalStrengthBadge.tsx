type SignalStrength = 'weak' | 'medium' | 'strong'

const config: Record<SignalStrength, { label: string; className: string; emoji: string }> = {
  weak:   { label: '약', className: 'bg-gray-100 text-gray-600', emoji: '⚪' },
  medium: { label: '중', className: 'bg-yellow-100 text-yellow-700', emoji: '🟡' },
  strong: { label: '강', className: 'bg-red-100 text-red-700', emoji: '🔴' },
}

export function SignalStrengthBadge({ strength }: { strength: SignalStrength }) {
  const c = config[strength]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.emoji} {c.label}
    </span>
  )
}
