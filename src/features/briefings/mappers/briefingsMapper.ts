/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트 폴더 구조 재구성 과정에서 브리핑 매퍼 정리
 */
import type { BriefingsData } from '../model/briefing';

export interface BriefingsViewModel extends BriefingsData {}

export function mapBriefingsToViewModel(data: BriefingsData): BriefingsViewModel {
  return data;
}
