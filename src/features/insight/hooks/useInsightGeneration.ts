import { useCallback, useEffect, useMemo, useState } from 'react';
import { insightRepository } from '../api/insightRepository';
import type {
  InsightCascadeResponse,
  InsightDisplayResult,
  InsightFlowStep,
} from '../model/insight';

const FLOW_STEP_LABELS: Record<InsightFlowStep['id'], string> = {
  cause: '원인',
  change: '변화',
  impact: '영향',
  response: '대응',
};

function firstNonEmpty(items: string[], fallback: string): string {
  for (const item of items) {
    if (typeof item === 'string' && item.trim().length > 0) {
      return item.trim();
    }
  }
  return fallback;
}

function buildFlowSteps(raw: InsightCascadeResponse): InsightFlowStep[] {
  const responseLine = raw.response.length > 0
    ? raw.response
        .slice()
        .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
        .map((item) => item.action)
        .filter((s) => s && s.trim().length > 0)[0]
    : '';

  return [
    {
      id: 'cause',
      label: FLOW_STEP_LABELS.cause,
      description: firstNonEmpty(raw.cause, '원인 신호가 충분히 잡히지 않았습니다.'),
    },
    {
      id: 'change',
      label: FLOW_STEP_LABELS.change,
      description: firstNonEmpty(raw.change, '변화 신호가 충분히 잡히지 않았습니다.'),
    },
    {
      id: 'impact',
      label: FLOW_STEP_LABELS.impact,
      description: firstNonEmpty(raw.impact, '영향 분석을 도출하지 못했습니다.'),
    },
    {
      id: 'response',
      label: FLOW_STEP_LABELS.response,
      description: responseLine ?? '대응 액션이 제안되지 않았습니다.',
    },
  ];
}

export function adaptInsightResponse(raw: InsightCascadeResponse): InsightDisplayResult {
  const evidence = raw.reasoning_trail.length > 0
    ? raw.reasoning_trail.map((item) => item.one_liner).filter((s) => s.trim().length > 0)
    : raw.cause.concat(raw.change).slice(0, 5);

  const implications = raw.response.length > 0
    ? raw.response
        .slice()
        .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
        .map((item) => (item.rationale ? `${item.action} — ${item.rationale}` : item.action))
    : raw.impact.slice(0, 5);

  return {
    title: firstNonEmpty([raw.final_one_liner], 'New 인사이트'),
    summary: firstNonEmpty([raw.sk_ax_implication, raw.final_one_liner], '분석 결과가 비어 있습니다.'),
    evidence,
    implications,
    flowSteps: buildFlowSteps(raw),
    raw,
  };
}

interface UseInsightGenerationOptions {
  cardIds: string[];
  autoRun?: boolean;
}

interface UseInsightGenerationResult {
  result: InsightDisplayResult | null;
  raw: InsightCascadeResponse | null;
  isLoading: boolean;
  error: string | null;
  regenerate: () => void;
}

export function useInsightGeneration({
  cardIds,
  autoRun = true,
}: UseInsightGenerationOptions): UseInsightGenerationResult {
  const [result, setResult] = useState<InsightDisplayResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runToken, setRunToken] = useState(0);

  const stableKey = useMemo(() => cardIds.join('|'), [cardIds]);

  const regenerate = useCallback(() => {
    setRunToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!autoRun || cardIds.length === 0) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    insightRepository
      .generate({ cardIds })
      .then((raw) => {
        if (cancelled) return;
        setResult(adaptInsightResponse(raw));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Insight 생성 실패');
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // stableKey changes drive re-run; autoRun + runToken capture user-triggered regen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, autoRun, runToken]);

  return {
    result,
    raw: result?.raw ?? null,
    isLoading,
    error,
    regenerate,
  };
}
