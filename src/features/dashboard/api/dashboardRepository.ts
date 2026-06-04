import type { DashboardData, DashboardKeywordTrendsData } from '../model/dashboard';
import { httpClient } from '../../../shared/api/httpClient';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
  getKeywordTrends(): Promise<DashboardKeywordTrendsData>;
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
}

export const dashboardRepository: DashboardRepository = new HttpDashboardRepository();
