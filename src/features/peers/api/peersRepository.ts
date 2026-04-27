import type { PeersData } from '../model/peer';
import { mockPeersData } from '../../../shared/mocks/peers';

export interface PeersRepository {
  getPeers(): Promise<PeersData>;
}

class MockPeersRepository implements PeersRepository {
  async getPeers(): Promise<PeersData> {
    return Promise.resolve(mockPeersData);
  }
}

export const peersRepository: PeersRepository = new MockPeersRepository();
