import { describe, expect, it } from 'vitest';
import { formatFileSize, formatStrategyContextTime, strategyContextPreview } from './strategyContextFormat';

describe('formatStrategyContextTime', () => {
  it('무효는 "방금", 유효는 포맷', () => {
    expect(formatStrategyContextTime('nope')).toBe('방금');
    expect(formatStrategyContextTime('2026-06-18T10:00:00Z')).toContain('06');
  });
});

describe('formatFileSize', () => {
  it('KB/MB 변환', () => {
    expect(formatFileSize(0)).toBe('0 KB');
    expect(formatFileSize(-5)).toBe('0 KB');
    expect(formatFileSize(500)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('strategyContextPreview', () => {
  it('공백 정규화, 빈값은 "내용 없음"', () => {
    expect(strategyContextPreview('  a   b  ')).toBe('a b');
    expect(strategyContextPreview('   ')).toBe('내용 없음');
  });
});
