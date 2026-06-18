/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 작업 중 콘텐츠 보기 모드 설정 추가
 */
export type ContentViewMode = 'visual' | 'text';

export const contentViewModeStorageKey = 'axis:content-view-mode';
export const contentViewModeChangeEvent = 'axis:content-view-mode-change';

export function resolveContentViewMode(value: string | null): ContentViewMode {
  return value === 'text' ? 'text' : 'visual';
}

export function getStoredContentViewMode(): ContentViewMode {
  if (typeof window === 'undefined') return 'visual';
  return resolveContentViewMode(window.localStorage.getItem(contentViewModeStorageKey));
}

export function setStoredContentViewMode(mode: ContentViewMode) {
  window.localStorage.setItem(contentViewModeStorageKey, mode);
  window.dispatchEvent(new CustomEvent(contentViewModeChangeEvent, { detail: mode }));
}
