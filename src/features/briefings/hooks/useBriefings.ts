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
