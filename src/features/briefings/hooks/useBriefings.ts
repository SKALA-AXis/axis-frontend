/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재구성 과정에서 브리핑 훅 정리, 이후 화면 UI 개선·로딩 표준화 및 키워드 트렌드 지연 로딩
 */
import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { briefingsRepository } from '../api/briefingsRepository';
import { mapBriefingsToViewModel, type BriefingsViewModel } from '../mappers/briefingsMapper';

interface UseBriefingsResult {
  briefings: BriefingsViewModel | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useBriefings(): UseBriefingsResult {
  const load = useCallback(async () => {
    const data = await briefingsRepository.getBriefings();
    return mapBriefingsToViewModel(data);
  }, []);
  const { data: briefings, status, isLoading, error, reload } = useAsyncResource<BriefingsViewModel | null>(load, null, [load], {
    errorMessage: '브리핑을 불러오지 못했습니다.',
  });

  return { briefings, status, isLoading, error, reload };
}
