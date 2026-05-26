import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { peerPositioningRepository } from '../api/peerPositioningRepository';
import type { PeerPositioningData } from '../model/peerPositioning';

interface UsePeerPositioningResult {
  peerPositioning: PeerPositioningData | null;
  isLoading: boolean;
  error: string | null;
}

export function usePeerPositioning(): UsePeerPositioningResult {
  const load = useCallback(() => peerPositioningRepository.getPeerPositioning(), []);
  const { data: peerPositioning, isLoading, error } = useAsyncResource<PeerPositioningData | null>(load, null, [load]);

  return { peerPositioning, isLoading, error };
}
