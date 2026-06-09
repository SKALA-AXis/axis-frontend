import { useCallback, useState } from 'react';
import { globalTrendsRepository } from '../api/globalTrendsRepository';
import type { GlobalTrendsRunRequest, GlobalTrendsRunResult } from '../model/globalTrends';

const ANALYSIS_STEPS = [
  { label: '스냅샷', detail: '글로벌 6사 newsroom 분포 집계' },
  { label: '트렌드 탐지', detail: '핵심 IT 키워드·빈도 산출' },
  { label: '섹터 매핑', detail: '사업 섹터·키워드 분류' },
  { label: '변화 분석', detail: '과거 대비 트렌드 이동률 계산' },
  { label: '종합', detail: '글로벌 동향 한 줄 요약' },
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
        include_peer_alignment: false,
        max_trend_count: 10,
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
