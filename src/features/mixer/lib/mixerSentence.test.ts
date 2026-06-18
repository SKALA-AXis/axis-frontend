import { describe, expect, it } from 'vitest';
import { isCompleteMixerSentence, mixerSentenceBase, splitMixerReadableText } from './mixerSentence';

describe('mixerSentenceBase', () => {
  it('따옴표 + 끝 문장부호 제거', () => {
    expect(mixerSentenceBase('"안녕하세요!"')).toBe('안녕하세요');
    expect(mixerSentenceBase('계약 체결.')).toBe('계약 체결');
  });
});

describe('isCompleteMixerSentence', () => {
  it('종결어미로 끝나면 완결', () => {
    expect(isCompleteMixerSentence('새 계약을 체결했습니다')).toBe(true);
  });
  it('미완결 조사로 끝나면 미완결', () => {
    expect(isCompleteMixerSentence('새 계약을')).toBe(false);
    expect(isCompleteMixerSentence('회사는')).toBe(false);
  });
  it('빈 값은 미완결', () => {
    expect(isCompleteMixerSentence('')).toBe(false);
  });
});

describe('splitMixerReadableText', () => {
  it('완결 문장 1개', () => {
    expect(splitMixerReadableText('계약을 체결했습니다.')).toEqual(['계약을 체결했습니다.']);
  });
  it('빈 텍스트는 빈 배열', () => {
    expect(splitMixerReadableText('')).toEqual([]);
  });
});
