/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트엔드 폴더 구조 재정비 과정에서 Peers 조회 훅 구성, 이후 화면 UI 개선 및 로딩 표준화 적용
 */
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
