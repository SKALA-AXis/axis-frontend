import { describe, expect, it } from 'vitest';
import type { KeywordNode } from '../../../shared/content/keywordGraph';
import { allGraphCategories, normalizeKeywordGraphEdge, normalizeKeywordGraphNode } from './graphNodes';

describe('allGraphCategories', () => {
  it('기업 + 4섹터', () => {
    expect(allGraphCategories).toEqual(['기업', 'AX', '보안', '인프라', '수주']);
  });
});

describe('normalizeKeywordGraphNode', () => {
  it('id/label 없으면 null', () => {
    expect(normalizeKeywordGraphNode({ label: 'x' }, 0)).toBeNull();
    expect(normalizeKeywordGraphNode({ id: 'x' }, 0)).toBeNull();
  });
  it('미상 category 는 AX 로 대체', () => {
    const n = normalizeKeywordGraphNode({ id: 'a', label: 'A', category: '없음' as KeywordNode['category'] }, 0);
    expect(n?.category).toBe('AX');
  });
  it('유효 category 유지 + 기본값 채움', () => {
    const n = normalizeKeywordGraphNode({ id: 'a', label: 'A', category: '보안' }, 0);
    expect(n).toMatchObject({
      id: 'a',
      label: 'A',
      category: '보안',
      size: 18,
      score: 0,
      changeRate: 0,
      sourceType: 'raw_articles',
    });
  });
});

describe('normalizeKeywordGraphEdge', () => {
  it('source/target 없으면 null', () => {
    expect(normalizeKeywordGraphEdge({ source: 'a' })).toBeNull();
    expect(normalizeKeywordGraphEdge({ target: 'b' })).toBeNull();
  });
  it('기본값(weight=2, relationType) 채움', () => {
    expect(normalizeKeywordGraphEdge({ source: 'a', target: 'b' })).toEqual({
      source: 'a',
      target: 'b',
      weight: 2,
      relationType: '관련 기사',
    });
  });
});
