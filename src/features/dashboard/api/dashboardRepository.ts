import type { DashboardData } from '../model/dashboard';
import { httpClient } from '../../../shared/api/httpClient';
import { getCachedResource, prefetchCachedResource } from '../../../shared/api/resourceCache';
import { mockDashboardData } from '../../../shared/mocks/dashboard';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
  prefetch?(): Promise<void>;
}

class HttpDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    return getCachedResource('dashboard:summary', () => this.loadDashboard());
  }

  prefetch(): Promise<void> {
    return prefetchCachedResource('dashboard:summary', () => this.loadDashboard());
  }

  private async loadDashboard(): Promise<DashboardData> {
    if (!httpClient) {
      return mockDashboardData;
    }
    return await httpClient.get<DashboardData>('/api/dashboard/summary');
  }
}

export const dashboardRepository: DashboardRepository = httpClient
  ? new HttpDashboardRepository()
  : new HttpDashboardRepository();
