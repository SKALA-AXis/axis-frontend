import type { AlertsData } from '../model/alert';
import { httpClient } from '../../../shared/api/httpClient';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { env } from '../../../shared/config/env';
import { mockAlertsData } from '../../../shared/mocks/alerts';

export interface AlertsRepository {
  getAlerts(): Promise<AlertsData>;
}

class MockAlertsRepository implements AlertsRepository {
  async getAlerts(): Promise<AlertsData> {
    return Promise.resolve(mockAlertsData);
  }
}

class HttpAlertsRepository implements AlertsRepository {
  async getAlerts(): Promise<AlertsData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<AlertsData>('/alerts');
  }
}

class HybridAlertsRepository implements AlertsRepository {
  constructor(
    private readonly remoteRepository: AlertsRepository,
    private readonly fallbackRepository: AlertsRepository,
  ) {}

  async getAlerts(): Promise<AlertsData> {
    return resolveWithFallback(
      () => this.remoteRepository.getAlerts(),
      () => this.fallbackRepository.getAlerts(),
    );
  }
}

const fallbackAlertsRepository = new MockAlertsRepository();

export const alertsRepository: AlertsRepository = httpClient
  ? new HybridAlertsRepository(new HttpAlertsRepository(), fallbackAlertsRepository)
  : env.enableMockData
    ? fallbackAlertsRepository
    : new HttpAlertsRepository();
