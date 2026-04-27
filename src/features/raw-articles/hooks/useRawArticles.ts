import { useEffect, useState } from 'react';
import type { RawArticle } from '../model/rawArticle';
import { rawArticlesRepository } from '../api/rawArticlesRepository';

interface UseRawArticlesResult {
  articles: RawArticle[];
  isLoading: boolean;
  error: string | null;
}

export function useRawArticles(): UseRawArticlesResult {
  const [articles, setArticles] = useState<RawArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const result = await rawArticlesRepository.list();
        if (isMounted) {
          setArticles(result);
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
  return { articles, isLoading, error };
}
