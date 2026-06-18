/*
 * 작성일: 2026-05-15
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-15 최종민 — Mixer 분석 훅 신설 및 SSE 실시간 단계 진행 반영
 *   2026-06-10 박진 — mock 비활성화 및 챗봇 로직 수정
 */
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
        const message = streamErr instanceof Error ? streamErr.message : '믹서 스트리밍 결과를 받지 못했습니다.';
        setError(message);
        return null;
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
