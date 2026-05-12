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
