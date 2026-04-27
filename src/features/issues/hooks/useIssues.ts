import { useEffect, useState } from 'react';
import type { Issue } from '../../../entities/issue/model';
import { issuesRepository } from '../api/issuesRepository';

interface UseIssuesResult {
  issues: Issue[];
  isLoading: boolean;
  error: string | null;
}

export function useIssues(): UseIssuesResult {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const result = await issuesRepository.list();

        if (isMounted) {
          setIssues(result);
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

  return { issues, isLoading, error };
}
