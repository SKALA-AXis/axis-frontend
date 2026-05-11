import { DependencyList, useEffect, useState } from 'react';

interface UseAsyncResourceResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

export function useAsyncResource<T>(
  load: () => Promise<T>,
  initialValue: T,
  deps: DependencyList,
): UseAsyncResourceResult<T> {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);

      try {
        const result = await load();

        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, deps);

  return { data, isLoading, error };
}
