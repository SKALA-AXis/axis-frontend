import { useCallback, useState } from 'react';
import { globalTrendsRepository, type GlobalTrendsInput } from '../api/globalTrendsRepository';
import type { GlobalTrendsResponse } from '../model/globalTrends';

interface UseGlobalTrendsResult {
  data: GlobalTrendsResponse | null;
  isLoading: boolean;
  error: string | null;
  run: (input?: GlobalTrendsInput) => Promise<GlobalTrendsResponse | null>;
}

export function useGlobalTrends(): UseGlobalTrendsResult {
  const [data, setData] = useState<GlobalTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (input?: GlobalTrendsInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await globalTrendsRepository.run(input ?? {});
      setData(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'GlobalTrends 분석 실패';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, run };
}
