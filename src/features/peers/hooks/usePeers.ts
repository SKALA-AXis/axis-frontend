import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import type { PeersData } from '../model/peer';
import { peersRepository } from '../api/peersRepository';

interface UsePeersResult {
  peersData: PeersData | null;
  isLoading: boolean;
  error: string | null;
}

export function usePeers(): UsePeersResult {
  const load = useCallback(() => peersRepository.getPeers(), []);
  const { data: peersData, isLoading, error } = useAsyncResource<PeersData | null>(load, null, [load]);

  return { peersData, isLoading, error };
}
