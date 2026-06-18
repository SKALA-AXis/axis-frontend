/*
 * 작성일: 2026-05-29
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-29 안가은 — 브리핑·믹서 페이지 구성 수정과 함께 글자 크기 조절 기능 추가, 이후 믹서 사용자 기능 보완
 *   2026-06-11 박진 — 챗봇 프론트엔드 플로우 업데이트에 맞춰 조정
 */
export const largeTextPreferenceStorageKey = 'axis:large-text-preference';
export const largeTextPreferenceChangeEvent = 'axis:large-text-preference-change';

const currentTextPreferenceVersion = 2;
const legacyTextScaleSteps = [1, 1.1, 1.22, 1.36, 1.52, 1.7] as const;

export const textScaleSteps = [
  1,
  1.05,
  1.1,
  1.15,
  1.2,
  1.25,
  1.3,
  1.35,
  1.4,
  1.45,
  1.5,
  1.55,
  1.6,
  1.65,
  1.7,
] as const;
export const defaultTextScaleStep = 4;

export type TextPreference = {
  enabled: boolean;
  step: number;
  version?: number;
};

export function clampTextScaleStep(value: number) {
  return Math.min(Math.max(Math.round(value), 0), textScaleSteps.length - 1);
}

function defaultTextPreference(): TextPreference {
  return { enabled: false, step: defaultTextScaleStep, version: currentTextPreferenceVersion };
}

function nearestTextScaleStep(scale: number) {
  let nearestIndex = 0;
  let nearestDistance = Math.abs(textScaleSteps[0] - scale);

  for (let index = 1; index < textScaleSteps.length; index += 1) {
    const distance = Math.abs(textScaleSteps[index] - scale);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  }

  return nearestIndex;
}

function normalizeLegacyTextScaleStep(value: number) {
  const legacyStep = Math.min(Math.max(Math.round(value), 0), legacyTextScaleSteps.length - 1);
  return nearestTextScaleStep(legacyTextScaleSteps[legacyStep]);
}

export function normalizeTextPreference(value: unknown): TextPreference {
  if (!value || typeof value !== 'object') {
    return defaultTextPreference();
  }

  const candidate = value as Partial<TextPreference>;
  const hasStep = typeof candidate.step === 'number';
  return {
    enabled: candidate.enabled === true,
    step: hasStep
      ? candidate.version === currentTextPreferenceVersion
        ? clampTextScaleStep(candidate.step ?? defaultTextScaleStep)
        : normalizeLegacyTextScaleStep(candidate.step ?? defaultTextScaleStep)
      : defaultTextScaleStep,
    version: currentTextPreferenceVersion,
  };
}

export function resolveTextPreference(raw: string | null): TextPreference {
  if (!raw) {
    return defaultTextPreference();
  }

  try {
    return normalizeTextPreference(JSON.parse(raw));
  } catch {
    return defaultTextPreference();
  }
}

export function getStoredTextPreference(): TextPreference {
  if (typeof window === 'undefined') {
    return defaultTextPreference();
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
