import { describe, expect, it } from 'vitest';

import {
  displayTodayInsightLabel,
  isTruthyMeta,
  normalizeTodayInsightSignal,
  splitReadableInsightText,
} from './todayInsightUtils';

// P0 안전망 — 동작 불변 기준선(characterization). 리팩토링 시 이 출력이 바뀌면 회귀.
describe('todayInsightUtils', () => {
  it('isTruthyMeta: true/"true"/1/"1" 만 true', () => {
    for (const v of [true, 'true', 1, '1']) {
      expect(isTruthyMeta(v)).toBe(true);
    }
    for (const v of [false, 'false', 0, '0', '', null, undefined, 'yes', 2]) {
      expect(isTruthyMeta(v)).toBe(false);
    }
  });

  it('displayTodayInsightLabel: "종합 결과" → "관찰 포인트", 그 외 그대로', () => {
    expect(displayTodayInsightLabel('종합 결과')).toBe('관찰 포인트');
    expect(displayTodayInsightLabel('주요 신호')).toBe('주요 신호');
    expect(displayTodayInsightLabel('다음 판단')).toBe('다음 판단');
  });

  it('splitReadableInsightText: 문장 분리 후 최대 3개, 빈 입력은 []', () => {
    expect(splitReadableInsightText('')).toEqual([]);
    expect(splitReadableInsightText('   ')).toEqual([]);
    const out = splitReadableInsightText('첫째 문장. 둘째 문장! 셋째 문장? 넷째 문장.');
    expect(out).toHaveLength(3);
    expect(out[0]).toBe('첫째 문장.');
  });

  it('normalizeTodayInsightSignal: snake/camel evidence 정규화 + 기본 라벨', () => {
    const result = normalizeTodayInsightSignal({
      value: 'x',
      evidence: { related_keywords: ['a'], source_ids: ['s1'] },
    });
    expect(result.label).toBe('관찰 포인트'); // 기본 라벨
    expect(result.evidence.relatedKeywords).toEqual(['a']);
    expect(result.evidence.sourceIds).toEqual(['s1']);
    // summary 미지정 시 value 로 채움 — 같은 sanitize 거치므로 동일
    expect(result.summary).toBe(result.value);
    expect(result.responseDirection).toEqual([]);
  });
});
