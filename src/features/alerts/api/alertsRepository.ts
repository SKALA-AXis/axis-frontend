import type { AlertsData } from '../model/alert';
import { mockAlertsData } from '../../../shared/mocks/alerts';

export interface AlertsRepository {
  getAlerts(): Promise<AlertsData>;
}

class MockAlertsRepository implements AlertsRepository {
  async getAlerts(): Promise<AlertsData> {
    return Promise.resolve(mockAlertsData);
  }
}

export const alertsRepository: AlertsRepository = new MockAlertsRepository();
