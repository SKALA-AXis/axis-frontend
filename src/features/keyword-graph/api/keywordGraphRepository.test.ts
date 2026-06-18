import { afterEach, describe, expect, it, vi } from 'vitest';

// httpClient 와 카드 정규화는 모킹 — repository 의 호출 경로/매핑만 검증한다.
const get = vi.fn();
vi.mock('../../../shared/api/httpClient', () => ({
  httpClient: { get: (...args: unknown[]) => get(...args) },
}));
vi.mock('../../card-news/api/cardNewsRepository', () => ({
  normalizeCardNewsItem: (raw: unknown) => ({ normalized: raw }),
}));

import {
  fetchKeywordGraph,
  fetchKeywordGraphCards,
  isKeywordGraphApiConfigured,
} from './keywordGraphRepository';

afterEach(() => {
  get.mockReset();
});

describe('keywordGraphRepository', () => {
  it('httpClient 가 있으면 구성됨으로 본다', () => {
    expect(isKeywordGraphApiConfigured()).toBe(true);
  });

  it('fetchKeywordGraph 는 /api/keyword-graph 를 호출하고 payload 를 그대로 반환', async () => {
    const payload = { selectedId: 'sk-axis', nodes: [], edges: [] };
    get.mockResolvedValueOnce(payload);

    const result = await fetchKeywordGraph();

    expect(get).toHaveBeenCalledWith('/api/keyword-graph');
    expect(result).toBe(payload);
  });

  it('fetchKeywordGraphCards 는 nodeId 인코딩 + limit=30 + items 정규화', async () => {
    get.mockResolvedValueOnce({ items: [{ id: 'a' }, { id: 'b' }] });

    const result = await fetchKeywordGraphCards('기업/AX');

    expect(get).toHaveBeenCalledWith(
      `/api/keyword-graph/${encodeURIComponent('기업/AX')}/cards?limit=30`,
    );
    expect(result).toEqual([{ normalized: { id: 'a' } }, { normalized: { id: 'b' } }]);
  });

  it('fetchKeywordGraphCards 는 items 가 없으면 빈 배열', async () => {
    get.mockResolvedValueOnce({});

    const result = await fetchKeywordGraphCards('x');

    expect(result).toEqual([]);
  });
});
