import type { PeersData } from '../model/peer';
import { httpClient } from '../../../shared/api/httpClient';

export interface PeersRepository {
  getPeers(): Promise<PeersData>;
}

class HttpPeersRepository implements PeersRepository {
  async getPeers(): Promise<PeersData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<PeersData>('/api/peers');
  }
}

export const peersRepository: PeersRepository = new HttpPeersRepository();
