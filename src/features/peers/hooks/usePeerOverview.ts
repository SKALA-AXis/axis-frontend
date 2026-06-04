import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { peerOverviewRepository } from '../api/peerOverviewRepository';
import type { PeerOverviewData } from '../model/peerOverview';

interface UsePeerOverviewResult {
  peerOverview: PeerOverviewData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function usePeerOverview(): UsePeerOverviewResult {
  const load = useCallback(() => peerOverviewRepository.getPeerOverview(), []);
  const { data: peerOverview, status, isLoading, error, reload } = useAsyncResource<PeerOverviewData | null>(load, null, [load], {
    errorMessage: 'Peer+ 개요를 불러오지 못했습니다.',
  });

  return { peerOverview, status, isLoading, error, reload };
}
