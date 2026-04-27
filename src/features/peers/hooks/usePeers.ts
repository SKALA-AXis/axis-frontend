import { useEffect, useState } from 'react';
import type { PeersData } from '../model/peer';
import { peersRepository } from '../api/peersRepository';

interface UsePeersResult {
  peersData: PeersData | null;
  isLoading: boolean;
  error: string | null;
}

export function usePeers(): UsePeersResult {
  const [peersData, setPeersData] = useState<PeersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const result = await peersRepository.getPeers();
        if (isMounted) {
          setPeersData(result);
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
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { peersData, isLoading, error };
}
