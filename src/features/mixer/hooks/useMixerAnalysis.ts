import { useCallback, useState } from 'react';
import { mixerRepository, type MixerAnalyzeInput } from '../api/mixerRepository';
import type { MixerAnalysisResponse } from '../model/mixer';

interface UseMixerAnalysisResult {
  data: MixerAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  analyze: (input: MixerAnalyzeInput) => Promise<MixerAnalysisResponse | null>;
  reset: () => void;
}

export function useMixerAnalysis(): UseMixerAnalysisResult {
  const [data, setData] = useState<MixerAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (input: MixerAnalyzeInput): Promise<MixerAnalysisResponse | null> => {
      if (input.cardIds.length < 2) {
        setError('카드 2개 이상이 필요합니다.');
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await mixerRepository.analyze(input);
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Mixer 분석 실패';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, analyze, reset };
}
