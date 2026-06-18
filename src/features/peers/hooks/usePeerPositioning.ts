/*
 * 작성일: 2026-05-26
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-26 안가은 — Peer+ 포지셔닝 그래프 연동으로 포지셔닝 조회 훅 구현, 이후 로딩 표준화 적용
 */
import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { peerPositioningRepository } from '../api/peerPositioningRepository';
import type { PeerPositioningData } from '../model/peerPositioning';

interface UsePeerPositioningResult {
  peerPositioning: PeerPositioningData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function usePeerPositioning(): UsePeerPositioningResult {
  const load = useCallback(() => peerPositioningRepository.getPeerPositioning(), []);
  const { data: peerPositioning, status, isLoading, error, reload } = useAsyncResource<PeerPositioningData | null>(load, null, [load], {
    errorMessage: 'Peer+ 포지셔닝 데이터를 불러오지 못했습니다.',
  });

  return { peerPositioning, status, isLoading, error, reload };
}
