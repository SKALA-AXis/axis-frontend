/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재정비 및 대시보드 리포지토리 구성, 이후 홈 그래프 데이터 연동과 키워드 스파이크 인사이트·로딩 표준화 반영
 *   2026-06-05 박진 — 홈 투데이 인사이트 백엔드 연결
 *   2026-06-09 최종민 — 투데이 인사이트 anchor_date 및 브리핑 생성 클라이언트 연동
 */
import type {
  DashboardData,
  DashboardKeywordTrendsData,
  TodayInsightData,
  TodayInsightWarmupResult,
} from '../model/dashboard';
import { httpClient } from '../../../shared/api/httpClient';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
  getKeywordTrends(): Promise<DashboardKeywordTrendsData>;
  getTodayInsight(anchorDate?: string): Promise<TodayInsightData>;
  warmupTodayInsight(): Promise<TodayInsightWarmupResult>;
}

class HttpDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    if (!httpClient) {
      throw new Error('대시보드 API 주소가 설정되어 있지 않습니다. VITE_API_BASE_URL을 확인하세요.');
    }
    return await httpClient.get<DashboardData>('/api/dashboard/summary');
  }

  async getKeywordTrends(): Promise<DashboardKeywordTrendsData> {
    if (!httpClient) {
      throw new Error('대시보드 API 주소가 설정되어 있지 않습니다. VITE_API_BASE_URL을 확인하세요.');
    }
    return await httpClient.get<DashboardKeywordTrendsData>('/api/dashboard/keyword-trends');
  }

  async getTodayInsight(anchorDate?: string): Promise<TodayInsightData> {
    if (!httpClient) {
      throw new Error('대시보드 API 주소가 설정되어 있지 않습니다. VITE_API_BASE_URL을 확인하세요.');
    }
    const query = anchorDate?.trim()
      ? `?anchor_date=${encodeURIComponent(anchorDate.trim())}`
      : '';
    return await httpClient.get<TodayInsightData>(`/api/dashboard/today-insight${query}`);
  }

  async warmupTodayInsight(): Promise<TodayInsightWarmupResult> {
    if (!httpClient) {
      throw new Error('대시보드 API 주소가 설정되어 있지 않습니다. VITE_API_BASE_URL을 확인하세요.');
    }
    return await httpClient.post<TodayInsightWarmupResult>('/api/dashboard/today-insight/warmup');
  }
}

export const dashboardRepository: DashboardRepository = new HttpDashboardRepository();
