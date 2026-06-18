import { describe, expect, it } from 'vitest';
import type { KeywordNode } from '../../../shared/content/keywordGraph';
import { getGraphNodeDisplayRadius, getSpherePosition, splitGraphLabel } from './graphGeometry';

const node = (over: Partial<KeywordNode> = {}): KeywordNode => ({
  id: 'n',
  label: 'L',
  x: 0,
  y: 0,
  size: 18,
  category: 'AX',
  score: 0,
  changeRate: 0,
  sourceType: 'raw_articles',
  ...over,
});

describe('getGraphNodeDisplayRadius', () => {
  it('기업 카테고리는 size/3.35', () => {
    expect(getGraphNodeDisplayRadius(node({ category: '기업', size: 33.5 }))).toBeCloseTo(10);
  });
  it('size>=22 는 size/3.65', () => {
    expect(getGraphNodeDisplayRadius(node({ size: 36.5 }))).toBeCloseTo(10);
  });
  it('작은 노드는 size/4.05', () => {
    expect(getGraphNodeDisplayRadius(node({ size: 20.25 }))).toBeCloseTo(5);
  });
  it('active 면 +2.4', () => {
    expect(getGraphNodeDisplayRadius(node({ size: 20.25 }), true)).toBeCloseTo(7.4);
  });
});

describe('splitGraphLabel', () => {
  it('짧으면 한 줄', () => {
    expect(splitGraphLabel('짧다')).toEqual(['짧다']);
  });
  it('7자 초과(공백 없음)는 절반으로', () => {
    expect(splitGraphLabel('12345678')).toEqual(['1234', '5678']);
  });
  it('공백+11자 초과는 단어 기준 절반', () => {
    expect(splitGraphLabel('aa bb cc dd ee')).toEqual(['aa bb cc', 'dd ee']);
  });
});

describe('getSpherePosition', () => {
  it('sk-axis 는 원점', () => {
    const v = getSpherePosition(node({ id: 'sk-axis' }), 10);
    expect([v.x, v.y, v.z]).toEqual([0, 0, 0]);
  });
  it('회사 앵커는 radius*0.98 크기의 벡터', () => {
    const v = getSpherePosition(node({ id: 'lg-cns' }), 10);
    expect(v.length()).toBeCloseTo(9.8);
  });
});
