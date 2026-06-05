import type { AlertsData } from '../model/alert';
import { httpClient } from '../../../shared/api/httpClient';
import { getCachedResource, prefetchCachedResource } from '../../../shared/api/resourceCache';
import { resolveWithFallback } from '../../../shared/api/resolveWithFallback';
import { mockAlertsData } from '../../../shared/mocks/alerts';

export interface AlertsRepository {
  getAlerts(): Promise<AlertsData>;
  prefetch?(): Promise<void>;
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
    return getCachedResource('alerts:summary', () => resolveWithFallback(
      () => this.remoteRepository.getAlerts(),
      () => this.fallbackRepository.getAlerts(),
    ));
  }

  prefetch(): Promise<void> {
    return prefetchCachedResource('alerts:summary', () => resolveWithFallback(
      () => this.remoteRepository.getAlerts(),
      () => this.fallbackRepository.getAlerts(),
    ));
  }
}

const fallbackAlertsRepository = new MockAlertsRepository();

export const alertsRepository: AlertsRepository = httpClient
  ? new HybridAlertsRepository(new HttpAlertsRepository(), fallbackAlertsRepository)
  : fallbackAlertsRepository;
