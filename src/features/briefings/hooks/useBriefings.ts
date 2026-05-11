import { useCallback, useMemo } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { briefingsRepository } from '../api/briefingsRepository';
import { mapBriefingsToViewModel, type BriefingsViewModel } from '../mappers/briefingsMapper';

interface UseBriefingsResult {
  briefings: BriefingsViewModel | null;
  isLoading: boolean;
  error: string | null;
}

export function useBriefings(): UseBriefingsResult {
  const load = useCallback(async () => {
    const data = await briefingsRepository.getBriefings();
    return mapBriefingsToViewModel(data);
  }, []);
  const { data: briefings, isLoading, error } = useAsyncResource<BriefingsViewModel | null>(load, null, [load]);

  return { briefings, isLoading, error };
}
