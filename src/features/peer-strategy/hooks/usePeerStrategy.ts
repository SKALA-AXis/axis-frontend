import { useCallback, useEffect, useMemo, useState } from 'react';
import { peerStrategyRepository } from '../api/peerStrategyRepository';
import type { PeerComparisonResponse } from '../model/peerStrategy';

interface UsePeerStrategyOptions {
  peerId: string;
  windowDays?: number;
  focusSector?: string;
  enabled?: boolean;
}

interface UsePeerStrategyResult {
  data: PeerComparisonResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Module-level cache — 같은 (peerId, windowDays, focusSector) 조합 재진입 시
// cached 반환. LLM 호출 비용/시간 절감. page reload 시까지 유지. refetch() 호출
// 시 무효화.
const _strategyCache = new Map<string, PeerComparisonResponse>();

export function usePeerStrategy({
  peerId,
  windowDays,
  focusSector,
  enabled = true,
}: UsePeerStrategyOptions): UsePeerStrategyResult {
  const [data, setData] = useState<PeerComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const stableKey = useMemo(
    () => `${peerId}|${windowDays ?? ''}|${focusSector ?? ''}`,
    [peerId, windowDays, focusSector],
  );

  const refetch = useCallback(() => {
    _strategyCache.delete(stableKey);
    setToken((prev) => prev + 1);
  }, [stableKey]);

  useEffect(() => {
    if (!enabled || !peerId) {
      return;
    }

    // Cache hit — LLM 호출 스킵
    const cached = _strategyCache.get(stableKey);
    if (cached) {
      setData(cached);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    peerStrategyRepository
      .fetch({ peerId, windowDays, focusSector })
      .then((result) => {
        if (cancelled) return;
        _strategyCache.set(stableKey, result);
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Peer 분석 실패');
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, enabled, token]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
