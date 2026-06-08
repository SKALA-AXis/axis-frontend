import { useCallback, useState } from 'react';
import { globalTrendsRepository } from '../api/globalTrendsRepository';
import type { GlobalTrendsRunRequest, GlobalTrendsRunResult } from '../model/globalTrends';

const ANALYSIS_STEPS = [
  { label: 'Snapshot', detail: '글로벌 6사 newsroom 분포 집계' },
  { label: 'Trend Detection', detail: '키워드 빈도·강도 산출' },
  { label: 'Peer Alignment', detail: 'SK AX + 4 Peer alignment 비교' },
  { label: 'Impact Mapping', detail: 'SK AX 사업라인 영향 매트릭스' },
  { label: 'Synthesis', detail: '전망·의사결정 한 줄 요약' },
] as const;

export function useGlobalTrendsAnalysis() {
  const [data, setData] = useState<GlobalTrendsRunResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const run = useCallback(async (request: GlobalTrendsRunRequest = {}): Promise<GlobalTrendsRunResult | null> => {
    setIsLoading(true);
    setError(null);
    setActiveStep(0);

    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 12000);

    try {
      const result = await globalTrendsRepository.run({
        window_days: 30,
        include_peer_alignment: true,
        max_trend_count: 8,
        min_mention_count: 3,
        ...request,
      });
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '글로벌 트렌드 분석에 실패했습니다.';
      setError(message);
      return null;
    } finally {
      window.clearInterval(timer);
      setActiveStep(ANALYSIS_STEPS.length - 1);
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setActiveStep(0);
  }, []);

  return {
    data,
    isLoading,
    error,
    activeStep,
    steps: ANALYSIS_STEPS,
    run,
    reset,
  };
}
