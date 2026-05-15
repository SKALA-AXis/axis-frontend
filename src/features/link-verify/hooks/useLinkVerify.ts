import { useCallback, useState } from 'react';
import { linkVerifyRepository } from '../api/linkVerifyRepository';
import type { LinkVerifyResponse } from '../model/linkVerify';

interface UseLinkVerifyResult {
  data: LinkVerifyResponse | null;
  isLoading: boolean;
  error: string | null;
  verify: (cardId: string) => Promise<LinkVerifyResponse | null>;
  reset: () => void;
}

export function useLinkVerify(): UseLinkVerifyResult {
  const [data, setData] = useState<LinkVerifyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (cardId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await linkVerifyRepository.verify(cardId);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '링크 검증 실패');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, verify, reset };
}
