import { httpClient } from '../../../shared/api/httpClient';
import type { PeerComparisonResponse } from '../model/peerStrategy';

export interface PeerStrategyInput {
  peerId: string;
  windowDays?: number;
  focusSector?: string;
}

export interface PeerStrategyRepository {
  fetch(input: PeerStrategyInput): Promise<PeerComparisonResponse>;
}

class HttpPeerStrategyRepository implements PeerStrategyRepository {
  async fetch({ peerId, windowDays, focusSector }: PeerStrategyInput): Promise<PeerComparisonResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const query = new URLSearchParams();
    if (windowDays !== undefined) {
      query.set('window_days', String(windowDays));
    }
    if (focusSector) {
      query.set('focus_sector', focusSector);
    }
    const suffix = query.toString();
    const path = `/api/monitoring/${encodeURIComponent(peerId)}/strategy${suffix ? `?${suffix}` : ''}`;
    return httpClient.get<PeerComparisonResponse>(path);
  }
}

export const peerStrategyRepository: PeerStrategyRepository = new HttpPeerStrategyRepository();
