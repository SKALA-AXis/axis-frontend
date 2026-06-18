import { describe, expect, it } from 'vitest';
import {
  buildMixerFilterOptions,
  isCompanyKeyword,
  mergeMixerFilterOptions,
  normalizeMixerFilterValue,
  normalizeMixerKeywordForCompare,
} from './mixerFilters';

describe('normalizeMixerFilterValue', () => {
  it('문자열화 + trim, null→빈문자', () => {
    expect(normalizeMixerFilterValue('  x  ')).toBe('x');
    expect(normalizeMixerFilterValue(null)).toBe('');
    expect(normalizeMixerFilterValue(42)).toBe('42');
  });
});

describe('normalizeMixerKeywordForCompare', () => {
  it('소문자 + 공백/._- 제거', () => {
    expect(normalizeMixerKeywordForCompare('SK AX')).toBe('skax');
    expect(normalizeMixerKeywordForCompare('event_type-1')).toBe('eventtype1');
  });
});

describe('isCompanyKeyword', () => {
  it('회사명은 true', () => {
    expect(isCompanyKeyword('삼성SDS')).toBe(true);
    expect(isCompanyKeyword('SK')).toBe(true);
  });
  it('일반 키워드는 false', () => {
    expect(isCompanyKeyword('보안')).toBe(false);
    expect(isCompanyKeyword('AI')).toBe(false);
  });
});

describe('buildMixerFilterOptions', () => {
  it('빈도 집계 + 내림차순, 빈 값 제외', () => {
    expect(buildMixerFilterOptions(['a', 'a', 'b', '', null])).toEqual([
      { value: 'a', label: 'a', count: 2 },
      { value: 'b', label: 'b', count: 1 },
    ]);
  });
  it('labelMap 적용 + limit', () => {
    expect(buildMixerFilterOptions(['x', 'y'], { x: '엑스' }, 1)).toEqual([
      { value: 'x', label: '엑스', count: 1 },
    ]);
  });
});

describe('mergeMixerFilterOptions', () => {
  it('같은 label 합산(value=label)', () => {
    expect(
      mergeMixerFilterOptions([
        { value: 'a', label: 'L', count: 1 },
        { value: 'b', label: 'L', count: 2 },
      ]),
    ).toEqual([{ value: 'L', label: 'L', count: 3 }]);
  });
});
