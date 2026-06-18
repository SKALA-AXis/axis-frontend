import { describe, expect, it } from 'vitest';
import { clampValue, normalizeBriefingText, stripLeadingRangeLabel } from './briefingText';

describe('stripLeadingRangeLabel', () => {
  it('"에는 "/"에 " 선행 라벨 제거', () => {
    expect(stripLeadingRangeLabel('이번 주에는 협력 확대', '이번 주')).toBe('협력 확대');
    expect(stripLeadingRangeLabel('이번 주에 협력 확대', '이번 주')).toBe('협력 확대');
    expect(stripLeadingRangeLabel('협력 확대', '이번 주')).toBe('협력 확대');
  });
});

describe('normalizeBriefingText', () => {
  it('선행 번호 제거 + 공백 정규화', () => {
    expect(normalizeBriefingText('1. 항목   둘')).toBe('항목 둘');
    expect(normalizeBriefingText('  여러   공백 ')).toBe('여러 공백');
  });
});

describe('clampValue', () => {
  it('빈값/초과/이내', () => {
    expect(clampValue('', '2026-06')).toBe('2026-06');
    expect(clampValue('2026-05', '2026-06')).toBe('2026-05');
    expect(clampValue('2026-07', '2026-06')).toBe('2026-06');
  });
});
