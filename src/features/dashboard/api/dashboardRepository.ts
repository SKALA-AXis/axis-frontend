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
