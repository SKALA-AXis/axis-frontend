import type { DashboardData } from '../model/dashboard';
import { httpClient } from '../../../shared/api/httpClient';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { mockDashboardData } from '../../../shared/mocks/dashboard';

export interface DashboardRepository {
  getDashboard(): Promise<DashboardData>;
}

class MockDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    return Promise.resolve(mockDashboardData);
  }
}

class HttpDashboardRepository implements DashboardRepository {
  async getDashboard(): Promise<DashboardData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<DashboardData>('/dashboard');
  }
}

class HybridDashboardRepository implements DashboardRepository {
  constructor(
    private readonly remoteRepository: DashboardRepository,
    private readonly fallbackRepository: DashboardRepository,
  ) {}

  async getDashboard(): Promise<DashboardData> {
    return resolveWithFallback(
      () => this.remoteRepository.getDashboard(),
      () => this.fallbackRepository.getDashboard(),
    );
  }
}

const fallbackDashboardRepository = new MockDashboardRepository();

export const dashboardRepository: DashboardRepository = httpClient
  ? new HybridDashboardRepository(new HttpDashboardRepository(), fallbackDashboardRepository)
  : fallbackDashboardRepository;
