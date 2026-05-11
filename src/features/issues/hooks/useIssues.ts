import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import type { Issue } from '../../../entities/issue/model';
import { issuesRepository } from '../api/issuesRepository';

interface UseIssuesResult {
  issues: Issue[];
  isLoading: boolean;
  error: string | null;
}

export function useIssues(): UseIssuesResult {
  const load = useCallback(() => issuesRepository.list(), []);
  const { data: issues, isLoading, error } = useAsyncResource(load, [] as Issue[], [load]);

  return { issues, isLoading, error };
}
