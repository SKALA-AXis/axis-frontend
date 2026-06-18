import { sanitizeMixerDisplayText, uniqueMixerTexts } from './mixerText';

// Mixer 문장 완결성 판정 + 읽기 좋은 문장 분할 순수 유틸 (refactoring P2/stage3).
// MixerView 에서 그대로 옮긴 것.

// 한국어 미완결 종결(조사/연결어미 등) — 이걸로 끝나면 잘린 문장으로 본다.
export const MIXER_INCOMPLETE_ENDINGS = [
  '가',
  '이',
  '은',
  '는',
  '을',
  '를',
  '와',
  '과',
  '로',
  '으로',
  '에',
  '에서',
  '에게',
  '까지',
  '보다',
  '처럼',
  '같은',
  '위한',
  '통해',
  '대해',
  '하며',
  '하고',
  '하거나',
  '또는',
  '및',
];

/** 따옴표/끝 문장부호 제거한 본문. */
export function mixerSentenceBase(value: string) {
  return value.replace(/["'“”‘’]+/g, '').trim().replace(/[.!?。]+$/g, '').trim();
}

/** 완결 문장(종결어미로 끝나고 미완결 조사로 끝나지 않음)인지. */
export function isCompleteMixerSentence(value: string) {
  const base = mixerSentenceBase(value);
  if (!base) return false;
  if (MIXER_INCOMPLETE_ENDINGS.some((ending) => base.endsWith(ending))) return false;
  if (base.length <= 12 && !/(습니다|합니다|됩니다|입니다|니다|요|다)$/.test(base)) return false;
  return /(습니다|합니다|됩니다|입니다|니다|요|다)$/.test(base);
}

/** 텍스트를 완결 문장 단위로 분할(정제+중복제거, maxItems 제한). */
export function splitMixerReadableText(text: string, maxItems = 3) {
  const normalized = sanitizeMixerDisplayText(text)
    .replace(/…|\.{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];
  const sentenceMatches = normalized.match(/[^.!?。]+[.!?。]+/g) ?? [];
  const sentences = sentenceMatches
    .map((sentence) => sentence.trim())
    .filter(isCompleteMixerSentence);
  if (sentences.length === 0 && isCompleteMixerSentence(normalized)) {
    sentences.push(normalized);
  }
  const uniqueSentences = uniqueMixerTexts(sentences);
  return maxItems > 0 ? uniqueSentences.slice(0, maxItems) : uniqueSentences;
}
