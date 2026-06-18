/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 개편으로 이슈 훅 정리, 이후 UI 개선·로딩 표준화
 */
import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import type { Issue } from '../../../entities/issue/model';
import { issuesRepository } from '../api/issuesRepository';

interface UseIssuesResult {
  issues: Issue[];
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useIssues(): UseIssuesResult {
  const load = useCallback(() => issuesRepository.list(), []);
  const { data: issues, status, isLoading, error, reload } = useAsyncResource(load, [] as Issue[], [load], {
    errorMessage: '동향 데이터를 불러오지 못했습니다.',
  });

  return { issues, status, isLoading, error, reload };
}
