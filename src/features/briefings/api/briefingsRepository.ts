import type { BriefingsData } from '../model/briefing';
import { mockBriefingsData } from '../../../shared/mocks/briefings';

export interface BriefingsRepository {
  getBriefings(): Promise<BriefingsData>;
}

class MockBriefingsRepository implements BriefingsRepository {
  async getBriefings(): Promise<BriefingsData> {
    return Promise.resolve(mockBriefingsData);
  }
}

export const briefingsRepository: BriefingsRepository = new MockBriefingsRepository();
