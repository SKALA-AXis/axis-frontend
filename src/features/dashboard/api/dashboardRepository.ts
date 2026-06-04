import type { DashboardData } from '../model/dashboard';
import { httpClient } from '../../../shared/api/httpClient';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
}

class HttpDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    if (!httpClient) {
      throw new Error('대시보드 API 주소가 설정되어 있지 않습니다. VITE_API_BASE_URL을 확인하세요.');
    }
    return await httpClient.get<DashboardData>('/api/dashboard/summary');
  }
}

export const dashboardRepository: DashboardRepository = new HttpDashboardRepository();
