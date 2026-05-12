import type { DashboardData } from '../model/dashboard';
import { httpClient } from '../../../shared/api/httpClient';
import { mockDashboardData } from '../../../shared/mocks/dashboard';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
}

class HttpDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    if (!httpClient) {
      return mockDashboardData;
    }

    try {
      return await httpClient.get<DashboardData>('/api/dashboard/summary');
    } catch {
      return mockDashboardData;
    }
  }
}

export const dashboardRepository: DashboardRepository = httpClient
  ? new HttpDashboardRepository()
  : new HttpDashboardRepository();
