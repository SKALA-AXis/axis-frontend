import { useCallback, useEffect, useState } from 'react';
import {
  globalTrendsRepository,
  type GlobalTrendsInput,
  type GlobalTrendsListInput,
} from '../api/globalTrendsRepository';
import type { GlobalIndustryTrendRow, GlobalTrendsResponse } from '../model/globalTrends';

interface UseGlobalTrendsResult {
  /** axis-ai `/global/trends/run` 응답 (POST run 직후) */
  data: GlobalTrendsResponse | null;
  /** axis-backend `/api/global/trends/latest` 응답 (cron 결과 DB read) */
  rows: GlobalIndustryTrendRow[];
  isLoading: boolean;
  isReanalyzing: boolean;
  error: string | null;
  /** "재분석" 버튼 — LLM 3 회 비용 발생 */
  run: (input?: GlobalTrendsInput) => Promise<GlobalTrendsResponse | null>;
  /** GET 으로 cron 결과 다시 가져오기 */
  refresh: (input?: GlobalTrendsListInput) => Promise<GlobalIndustryTrendRow[]>;
}

/**
 * Peer+ "글로벌 산업" 탭 데이터 훅.
 *
 * <p>전략: page/tab 진입 시 GET `/latest` 로 cron 결과 (₩0) 를 먼저 받고,
 * DB 가 비어있으면(예: dev 환경) POST `/run` 으로 fallback 1 회 실행. 사용자가
 * "재분석" 버튼을 누르면 명시적으로 run() 호출.</p>
 *
 * <p>auto-fetch 끄려면 {@code skipInitialFetch: true}.</p>
 */
export function useGlobalTrends(options?: {
  skipInitialFetch?: boolean;
  initialLimit?: number;
  fallbackOnEmpty?: boolean;
  fallbackWindowDays?: number;
}): UseGlobalTrendsResult {
  const {
    skipInitialFetch = false,
    initialLimit = 50,
    fallbackOnEmpty = true,
    fallbackWindowDays = 30,
  } = options ?? {};

  const [data, setData] = useState<GlobalTrendsResponse | null>(null);
  const [rows, setRows] = useState<GlobalIndustryTrendRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (input?: GlobalTrendsListInput): Promise<GlobalIndustryTrendRow[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await globalTrendsRepository.listLatest({
          limit: input?.limit ?? initialLimit,
          from: input?.from,
          to: input?.to,
        });
        const safe = Array.isArray(result) ? result : [];
        setRows(safe);
        return safe;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '글로벌 트렌드 조회 실패';
        setError(msg);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit],
  );

  const run = useCallback(
    async (input?: GlobalTrendsInput): Promise<GlobalTrendsResponse | null> => {
      setIsReanalyzing(true);
      setError(null);
      try {
        const result = await globalTrendsRepository.run(input ?? { windowDays: fallbackWindowDays });
        setData(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'GlobalTrends 재분석 실패';
        setError(msg);
        return null;
      } finally {
        setIsReanalyzing(false);
      }
    },
    [fallbackWindowDays],
  );

  useEffect(() => {
    if (skipInitialFetch) return;
    let cancelled = false;
    (async () => {
      const fetched = await refresh();
      if (cancelled) return;
      if (fetched.length === 0 && fallbackOnEmpty) {
        await run({ windowDays: fallbackWindowDays });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skipInitialFetch, fallbackOnEmpty, fallbackWindowDays, refresh, run]);

  return { data, rows, isLoading, isReanalyzing, error, run, refresh };
}
