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
