import { useCallback, useState } from 'react';
import { globalTrendsRepository, type GlobalTrendsInput } from '../api/globalTrendsRepository';
import type { GlobalTrendsResponse } from '../model/globalTrends';

interface UseGlobalTrendsResult {
  data: GlobalTrendsResponse | null;
  isLoading: boolean;
  error: string | null;
  run: (input?: GlobalTrendsInput) => Promise<GlobalTrendsResponse | null>;
}

// Module-level cache — 같은 input 조합 (window_days / company_ids / focus_themes /
// sk_ax_business_lines) 재호출 시 cached 반환. LLM 호출 비용/시간 절감. page reload
// 시까지 유지. forceRefresh 전달 시 무효화.
const _gtCache = new Map<string, GlobalTrendsResponse>();

function _cacheKey(input: GlobalTrendsInput): string {
  return JSON.stringify({
    c: input.companyIds ?? [],
    t: input.focusThemes ?? [],
    w: input.windowDays ?? 30,
    l: input.skAxBusinessLines ?? [],
  });
}

export function useGlobalTrends(): UseGlobalTrendsResult {
  const [data, setData] = useState<GlobalTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (input?: GlobalTrendsInput, opts?: { forceRefresh?: boolean }) => {
      const effective = input ?? {};
      const key = _cacheKey(effective);
      if (!opts?.forceRefresh) {
        const cached = _gtCache.get(key);
        if (cached) {
          setData(cached);
          setError(null);
          return cached;
        }
      } else {
        _gtCache.delete(key);
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await globalTrendsRepository.run(effective);
        _gtCache.set(key, result);
        setData(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'GlobalTrends 분석 실패';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { data, isLoading, error, run };
}
