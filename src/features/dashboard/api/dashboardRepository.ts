import type { DashboardData } from '../model/dashboard';
import { mockDashboardData } from '../../../shared/mocks/dashboard';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
}

class MockDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    return Promise.resolve(mockDashboardData);
  }
}

export const dashboardRepository: DashboardRepository = new MockDashboardRepository();
