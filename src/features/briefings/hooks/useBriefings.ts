import { useEffect, useState } from 'react';
import { briefingsRepository } from '../api/briefingsRepository';
import { mapBriefingsToViewModel, type BriefingsViewModel } from '../mappers/briefingsMapper';

interface UseBriefingsResult {
  briefings: BriefingsViewModel | null;
  isLoading: boolean;
  error: string | null;
}

export function useBriefings(): UseBriefingsResult {
  const [briefings, setBriefings] = useState<BriefingsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await briefingsRepository.getBriefings();

        if (isMounted) {
          setBriefings(mapBriefingsToViewModel(data));
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { briefings, isLoading, error };
}
