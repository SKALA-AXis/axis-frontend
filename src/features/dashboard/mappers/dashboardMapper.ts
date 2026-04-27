import type { DashboardData } from '../model/dashboard';

export interface DashboardViewModel extends DashboardData {}

export function mapDashboardToViewModel(data: DashboardData): DashboardViewModel {
  return data;
}
