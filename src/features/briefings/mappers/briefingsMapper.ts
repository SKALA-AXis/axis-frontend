import type { BriefingsData } from '../model/briefing';

export interface BriefingsViewModel extends BriefingsData {}

export function mapBriefingsToViewModel(data: BriefingsData): BriefingsViewModel {
  return data;
}
