import { create } from 'zustand'
import type { IssueCard } from '../types/api'

interface AxisStore {
  selectedCard: IssueCard | null
  selectedPeerId: string | null
  setSelectedCard: (card: IssueCard | null) => void
  setSelectedPeerId: (peerId: string | null) => void
}

export const useAxisStore = create<AxisStore>((set) => ({
  selectedCard: null,
  selectedPeerId: null,
  setSelectedCard: (card) => set({ selectedCard: card }),
  setSelectedPeerId: (peerId) => set({ selectedPeerId: peerId }),
}))
