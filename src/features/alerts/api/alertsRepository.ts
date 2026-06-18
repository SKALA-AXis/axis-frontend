/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재정리 과정에서 알림 리포지토리 추가
 *   2026-06-10 박진 — 챗봇 로직 수정 및 목 비활성화 작업 중 함께 변경
 */
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
