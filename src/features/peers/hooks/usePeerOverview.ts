import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { peerOverviewRepository } from '../api/peerOverviewRepository';
import type { PeerOverviewData } from '../model/peerOverview';

interface UsePeerOverviewResult {
  peerOverview: PeerOverviewData | null;
  isLoading: boolean;
  error: string | null;
}

export function usePeerOverview(): UsePeerOverviewResult {
  const load = useCallback(() => peerOverviewRepository.getPeerOverview(), []);
  const { data: peerOverview, isLoading, error } = useAsyncResource<PeerOverviewData | null>(load, null, [load]);

  return { peerOverview, isLoading, error };
}
