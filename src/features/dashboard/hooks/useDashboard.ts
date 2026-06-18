/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재정비 시 대시보드 훅 구성, 이후 로딩 표준화와 홈 키워드 트렌드 인사이트·UI 개선 반영
 *   2026-06-05 박진 — 홈 투데이 인사이트 백엔드 연결
 *   2026-06-09 최종민 — 투데이 인사이트 anchor_date 및 브리핑 생성 클라이언트 연동
 */
import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { dashboardRepository } from '../api/dashboardRepository';
import { mapDashboardToViewModel, type DashboardViewModel } from '../mappers/dashboardMapper';
import type { DashboardKeywordTrendsData, TodayInsightData } from '../model/dashboard';

interface UseDashboardResult {
  dashboard: DashboardViewModel | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const load = useCallback(async () => {
    const data = await dashboardRepository.getDashboard();
    return mapDashboardToViewModel(data);
  }, []);
  const { data: dashboard, status, isLoading, error, reload } = useAsyncResource<DashboardViewModel | null>(load, null, [load], {
    errorMessage: '대시보드를 불러오지 못했습니다.',
  });

  return { dashboard, status, isLoading, error, reload };
}

interface UseDashboardKeywordTrendsResult {
  keywordTrends: DashboardKeywordTrendsData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDashboardKeywordTrends(): UseDashboardKeywordTrendsResult {
  const load = useCallback(() => dashboardRepository.getKeywordTrends(), []);
  const {
    data: keywordTrends,
    status,
    isLoading,
    error,
    reload,
  } = useAsyncResource<DashboardKeywordTrendsData | null>(load, null, [load], {
    errorMessage: '섹터 키워드 증감폭 그래프를 불러오지 못했습니다.',
  });

  return { keywordTrends, status, isLoading, error, reload };
}

interface UseTodayInsightResult {
  todayInsight: TodayInsightData | null;
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useTodayInsight(anchorDate?: string): UseTodayInsightResult {
  const load = useCallback(
    () => dashboardRepository.getTodayInsight(anchorDate),
    [anchorDate],
  );
  const {
    data: todayInsight,
    status,
    isLoading,
    error,
    reload,
  } = useAsyncResource<TodayInsightData | null>(load, null, [load], {
    errorMessage: "Today's Insight를 불러오지 못했습니다.",
  });

  return { todayInsight, status, isLoading, error, reload };
}
