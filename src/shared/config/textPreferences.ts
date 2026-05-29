export const largeTextPreferenceStorageKey = 'axis:large-text-preference';
export const largeTextPreferenceChangeEvent = 'axis:large-text-preference-change';

export const textScaleSteps = [1, 1.06, 1.12, 1.18, 1.24, 1.32] as const;
export const defaultTextScaleStep = 2;

export type TextPreference = {
  enabled: boolean;
  step: number;
};

export function clampTextScaleStep(value: number) {
  return Math.min(Math.max(Math.round(value), 0), textScaleSteps.length - 1);
}

export function normalizeTextPreference(value: unknown): TextPreference {
  if (!value || typeof value !== 'object') {
    return { enabled: false, step: defaultTextScaleStep };
  }

  const candidate = value as Partial<TextPreference>;
  return {
    enabled: candidate.enabled === true,
    step: clampTextScaleStep(typeof candidate.step === 'number' ? candidate.step : defaultTextScaleStep),
  };
}

export function resolveTextPreference(raw: string | null): TextPreference {
  if (!raw) {
    return { enabled: false, step: defaultTextScaleStep };
  }

  try {
    return normalizeTextPreference(JSON.parse(raw));
  } catch {
    return { enabled: false, step: defaultTextScaleStep };
  }
}

export function getStoredTextPreference(): TextPreference {
  if (typeof window === 'undefined') {
    return { enabled: false, step: defaultTextScaleStep };
  }
  return resolveTextPreference(window.localStorage.getItem(largeTextPreferenceStorageKey));
}

export function setStoredTextPreference(preference: TextPreference) {
  const normalized = normalizeTextPreference(preference);
  window.localStorage.setItem(largeTextPreferenceStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(largeTextPreferenceChangeEvent, { detail: normalized }));
}

export function getAppliedTextScale(preference: TextPreference) {
  return preference.enabled ? textScaleSteps[clampTextScaleStep(preference.step)] : 1;
}
