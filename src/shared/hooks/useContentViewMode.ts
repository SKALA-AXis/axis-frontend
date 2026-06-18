/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 작업에서 콘텐츠 보기 모드 훅 추가
 */
import { useEffect, useState } from 'react';
import {
  contentViewModeChangeEvent,
  contentViewModeStorageKey,
  getStoredContentViewMode,
  resolveContentViewMode,
  type ContentViewMode,
} from '../config/viewPreferences';

export function useContentViewMode(): ContentViewMode {
  const [mode, setMode] = useState<ContentViewMode>(getStoredContentViewMode);

  useEffect(() => {
    const syncMode = () => setMode(getStoredContentViewMode());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === contentViewModeStorageKey) {
        setMode(resolveContentViewMode(event.newValue));
      }
    };
    const handleCustomEvent = (event: Event) => {
      setMode(resolveContentViewMode((event as CustomEvent<ContentViewMode>).detail));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(contentViewModeChangeEvent, handleCustomEvent);
    syncMode();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(contentViewModeChangeEvent, handleCustomEvent);
    };
  }, []);

  return mode;
}
