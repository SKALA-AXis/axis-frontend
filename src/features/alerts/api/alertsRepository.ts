import type { AlertsData } from '../model/alert';
import { httpClient } from '../../../shared/api/httpClient';

export interface AlertsRepository {
  getAlerts(): Promise<AlertsData>;
}

class HttpAlertsRepository implements AlertsRepository {
  async getAlerts(): Promise<AlertsData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<AlertsData>('/alerts');
  }
}

export const alertsRepository: AlertsRepository = new HttpAlertsRepository();
