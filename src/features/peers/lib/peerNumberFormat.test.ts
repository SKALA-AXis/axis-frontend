import { describe, expect, it } from 'vitest';
import {
  formatKrwBn,
  formatPercent,
  formatQoqPctPoint,
  formatQoqPercent,
  trendToneClass,
  trimDecimal,
} from './peerNumberFormat';

describe('trimDecimal', () => {
  it('불필요한 끝 0 제거', () => {
    expect(trimDecimal(1.5, 2)).toBe('1.5');
    expect(trimDecimal(1, 2)).toBe('1');
    expect(trimDecimal(1.234, 2)).toBe('1.23');
  });
});

describe('formatKrwBn', () => {
  it('조/억 표시 + null', () => {
    expect(formatKrwBn(null)).toBe('-');
    expect(formatKrwBn(15000)).toBe('1.5조');
    expect(formatKrwBn(3000)).toBe('3,000억');
  });
});

describe('formatPercent / QoQ', () => {
  it('퍼센트/부호', () => {
    expect(formatPercent(12.5)).toBe('12.5%');
    expect(formatPercent(null)).toBe('-');
    expect(formatQoqPercent(2.5)).toBe('+2.5%');
    expect(formatQoqPercent(-1)).toBe('-1%');
    expect(formatQoqPercent(null)).toBeNull();
    expect(formatQoqPctPoint(2)).toBe('+2%p');
  });
});

describe('trendToneClass', () => {
  it('부호별 색상', () => {
    expect(trendToneClass(0)).toContain('muted');
    expect(trendToneClass(5)).toBe('text-[#d3432b]');
    expect(trendToneClass(-5)).toBe('text-[#2563eb]');
  });
});
