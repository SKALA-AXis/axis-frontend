import { httpClient } from '../../../shared/api/httpClient';
import { normalizeCardNewsItem } from '../../card-news/api/cardNewsRepository';
import type { CardNewsItem } from '../../card-news/model/cardNews';
import type { KeywordGraphCardsPayload, KeywordGraphPayload } from '../model/keywordGraph';

/**
 * httpClient(=env.apiBaseUrl) 설정 여부. 컴포넌트가 요청 전에 미구성 상태를
 * 우회(가드)하던 `!httpClient` 체크를 repository 경유로 옮긴 것.
 */
export function isKeywordGraphApiConfigured(): boolean {
  return httpClient !== null;
}

/** 키워드 그래프 전체(노드/엣지) 조회. */
export async function fetchKeywordGraph(): Promise<KeywordGraphPayload> {
  if (!httpClient) {
    throw new Error('API client is not configured.');
  }
  return httpClient.get<KeywordGraphPayload>('/api/keyword-graph');
}

/** 특정 노드의 관련 카드뉴스 조회(정규화된 CardNewsItem 배열). */
export async function fetchKeywordGraphCards(nodeId: string): Promise<CardNewsItem[]> {
  if (!httpClient) {
    throw new Error('API client is not configured.');
  }
  const payload = await httpClient.get<KeywordGraphCardsPayload>(
    `/api/keyword-graph/${encodeURIComponent(nodeId)}/cards?limit=30`,
  );
  return (payload.items ?? []).map(normalizeCardNewsItem);
}
