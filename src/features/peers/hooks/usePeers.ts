import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import type { PeersData } from '../model/peer';
import { peersRepository } from '../api/peersRepository';

interface UsePeersResult {
  peersData: PeersData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function usePeers(): UsePeersResult {
  const load = useCallback(() => peersRepository.getPeers(), []);
  const { data: peersData, status, isLoading, error, reload } = useAsyncResource<PeersData | null>(load, null, [load], {
    errorMessage: 'Peer사 데이터를 불러오지 못했습니다.',
  });

  return { peersData, status, isLoading, error, reload };
}
