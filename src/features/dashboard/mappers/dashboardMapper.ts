/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재정비 시 대시보드 매퍼 추가
 */
import type { DashboardData } from '../model/dashboard';

export interface DashboardViewModel extends DashboardData {}

export function mapDashboardToViewModel(data: DashboardData): DashboardViewModel {
  return data;
}
