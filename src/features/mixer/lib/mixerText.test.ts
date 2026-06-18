import { describe, expect, it } from 'vitest';
import {
  areMixerTextsSimilar,
  dedupeMixerSentences,
  formatMixerDate,
  mixerModeLabel,
  normalizeMixerTextKey,
  provenanceString,
  sanitizeMixerActionText,
} from './mixerText';

describe('provenanceString', () => {
  it('비어있지 않은 문자열만, 그 외 null', () => {
    expect(provenanceString({ k: 'v' }, 'k')).toBe('v');
    expect(provenanceString({ k: '   ' }, 'k')).toBeNull();
    expect(provenanceString({}, 'k')).toBeNull();
  });
});

describe('sanitizeMixerActionText', () => {
  it('상투적 접두 문구 제거', () => {
    expect(sanitizeMixerActionText('경영진 리뷰 안건을 정보 공유가 아니라 자원 배분 의사결정으로 격상한다. 나머지'))
      .toBe('나머지');
    expect(sanitizeMixerActionText(null)).toBe('');
  });
});

describe('mixerModeLabel', () => {
  it('deep=정확 분석, 그 외=빠른 실행', () => {
    expect(mixerModeLabel('deep')).toBe('정확 분석');
    expect(mixerModeLabel('fast')).toBe('빠른 실행');
    expect(mixerModeLabel(null)).toBe('빠른 실행');
  });
});

describe('formatMixerDate', () => {
  it('ISO 날짜 10자리, 무효는 앞 10자, 빈값은 빈문자', () => {
    expect(formatMixerDate('2026-06-18T10:00:00Z')).toBe('2026-06-18');
    expect(formatMixerDate('bad-date-xx')).toBe('bad-date-x');
    expect(formatMixerDate(null)).toBe('');
  });
});

describe('normalizeMixerTextKey', () => {
  it('소문자화 + 비영숫자 제거', () => {
    expect(normalizeMixerTextKey('Hello World!')).toBe('helloworld');
  });
});

describe('areMixerTextsSimilar', () => {
  it('정규화 키 동일이면 유사', () => {
    expect(areMixerTextsSimilar('Hello, World', 'hello world')).toBe(true);
    expect(areMixerTextsSimilar('완전히 다름', 'xyz')).toBe(false);
    expect(areMixerTextsSimilar('', 'x')).toBe(false);
  });
});

describe('dedupeMixerSentences', () => {
  it('유사 문장 중복 제거', () => {
    expect(dedupeMixerSentences('같다. 같다.')).toBe('같다.');
    expect(dedupeMixerSentences('')).toBe('');
  });
});
