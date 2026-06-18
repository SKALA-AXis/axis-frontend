/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 작업에서 비동기 리소스 훅 추가, 이후 로딩 표준화 및 키워드 트렌드 지연 로드 반영
 */
import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseAsyncResourceOptions {
  errorMessage?: string;
}

interface UseAsyncResourceResult<T> {
  data: T;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAsyncResource<T>(
  load: () => Promise<T>,
  initialValue: T,
  deps: DependencyList,
  options: UseAsyncResourceOptions = {},
): UseAsyncResourceResult<T> {
  const [data, setData] = useState<T>(initialValue);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus('loading');
    setError(null);

    try {
      const result = await load();

      if (isMountedRef.current && requestIdRef.current === requestId) {
        setData(result);
        setError(null);
        setStatus('success');
      }
    } catch (loadError) {
      if (isMountedRef.current && requestIdRef.current === requestId) {
        setError(loadError instanceof Error ? loadError.message : options.errorMessage ?? 'Unknown error');
        setStatus('error');
      }
    }
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, status, isLoading: status === 'loading', error, reload };
}
