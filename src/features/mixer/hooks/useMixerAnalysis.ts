import { useCallback, useState } from 'react';
import { mixerRepository, type MixerAnalyzeInput } from '../api/mixerRepository';
import type { MixerAnalysisResponse, MixerStageEvent } from '../model/mixer';

interface UseMixerAnalysisResult {
  data: MixerAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  /** 실행 중 현재 단계 (SSE). 미실행/완료 시 null. */
  stage: MixerStageEvent | null;
  analyze: (input: MixerAnalyzeInput) => Promise<MixerAnalysisResponse | null>;
  reset: () => void;
}

export function useMixerAnalysis(): UseMixerAnalysisResult {
  const [data, setData] = useState<MixerAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<MixerStageEvent | null>(null);

  const analyze = useCallback(
    async (input: MixerAnalyzeInput): Promise<MixerAnalysisResponse | null> => {
      if (input.cardIds.length < 2) {
        setError('카드 2개 이상이 필요합니다.');
        return null;
      }
      setIsLoading(true);
      setError(null);
      setStage(null);
      try {
        // 1차: SSE 스트리밍 — 실행 중 실제 단계를 실시간 표시.
        const result = await mixerRepository.analyzeStream(input, (event) => setStage(event));
        setData(result);
        return result;
      } catch (streamErr) {
        // 스트리밍 실패 시 단일 호출 fallback (fixture 포함, 기존 경로).
        try {
          const result = await mixerRepository.analyze(input);
          setData(result);
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : streamErr instanceof Error ? streamErr.message : 'Mixer 분석 실패';
          setError(message);
          return null;
        }
      } finally {
        setIsLoading(false);
        setStage(null);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStage(null);
  }, []);

  return { data, isLoading, error, stage, analyze, reset };
}
