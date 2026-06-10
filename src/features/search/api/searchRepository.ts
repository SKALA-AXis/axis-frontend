import { getAccessToken } from '../../../shared/api/authSession';
import { env } from '../../../shared/config/env';
import type { SearchRequest, SearchResponse, SearchResultItem, SearchScope } from '../model/search';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  timestamp?: string;
};

type RawSearchItem = Record<string, unknown>;
type SearchResultType = Exclude<SearchScope, 'ALL'>;

const allSearchScopes: SearchResultType[] = ['BRIEFING', 'PEER_PLUS', 'CARD_NEWS', 'KEYWORD_GRAPH'];

class SearchRepository {
  private readonly baseUrl = env.apiBaseUrl;

  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const response = await this.request<RawSearchItem>('/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query: request.query,
          scopes: requestedScopes(request),
          period: request.period,
          startDate: request.period === 'custom' ? request.startDate : undefined,
          endDate: request.period === 'custom' ? request.endDate : undefined,
          limit: request.limit ?? 12,
        }),
      });
      return normalizeSearchResponse(response, request);
    } catch (error) {
      throw error;
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const accessToken = getAccessToken();
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
    }

    const payload = await parseApiResponse<T>(response);
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error?.message ?? koreanHttpError(response.status));
    }
    return payload.data as T;
  }
}

export const searchRepository = new SearchRepository();

function normalizeSearchResponse(raw: RawSearchItem | undefined, request: SearchRequest): SearchResponse {
  const items = [
    ...arrayValue(raw?.items)
      .filter((item): item is RawSearchItem => isRecord(item))
      .map((item) => toSearchResultItem(item)),
    ...legacyCards(raw).map(toLegacyCardResultItem),
    ...legacyPeers(raw).map(toLegacyPeerResultItem),
    ...legacyKeywords(raw).map(toLegacyKeywordResultItem),
  ]
    .filter((item) => requestedScopes(request).includes(item.type))
    .slice(0, request.limit ?? 12);
  const counts = buildCounts(items);

  return {
    query: stringValue(raw?.query) || request.query,
    items,
    counts: isRecord(raw?.counts) ? numericRecord(raw.counts) : counts,
    total: typeof raw?.total === 'number' ? raw.total : items.length,
    hasMore: raw?.hasMore === true || items.length >= (request.limit ?? 12),
  };
}

function toSearchResultItem(raw: RawSearchItem): SearchResultItem {
  return {
    id: stringValue(raw.id),
    type: normalizeType(raw.type),
    title: stringValue(raw.title),
    snippet: stringValue(raw.snippet),
    badge: stringValue(raw.badge),
    target: stringValue(raw.target) || 'home',
    targetId: stringValue(raw.targetId),
    date: stringValue(raw.date),
    score: numberValue(raw.score),
    metadata: isRecord(raw.metadata) ? raw.metadata : {},
  };
}

function toLegacyCardResultItem(raw: RawSearchItem): SearchResultItem {
  return {
    id: stringValue(raw.id),
    type: 'CARD_NEWS',
    title: stringValue(raw.title) || '카드뉴스',
    snippet: stringValue(raw.summary),
    badge: stringValue(raw.peerName) || '카드뉴스',
    target: 'issues',
    targetId: stringValue(raw.id),
    date: stringValue(raw.date),
    score: 70,
    metadata: { source: 'api_legacy' },
  };
}

function toLegacyPeerResultItem(raw: RawSearchItem): SearchResultItem {
  const id = stringValue(raw.id);
  const keywords = arrayValue(raw.matchedKeywords).map(stringValue).filter(Boolean);
  return {
    id,
    type: 'PEER_PLUS',
    title: stringValue(raw.name) || id,
    snippet: keywords.length > 0 ? `매칭 키워드: ${keywords.join(', ')}` : 'Peer+ 비교 화면으로 이동합니다.',
    badge: 'Peer+',
    target: 'peerPlus',
    targetId: id,
    date: '',
    score: 64,
    metadata: { peerId: id, source: 'api_legacy' },
  };
}

function toLegacyKeywordResultItem(raw: RawSearchItem): SearchResultItem {
  const text = stringValue(raw.text);
  return {
    id: text,
    type: 'KEYWORD_GRAPH',
    title: text,
    snippet: stringValue(raw.type) || '키워드 그래프에서 관계 노드를 확인합니다.',
    badge: '키워드 그래프',
    target: 'keywordGraph',
    targetId: text,
    date: '',
    score: numberValue(raw.score) || 60,
    metadata: { source: 'api_legacy' },
  };
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text.trim()) {
    return response.ok
      ? { success: true, data: undefined as T, timestamp: new Date().toISOString() }
      : { success: false, error: { message: koreanHttpError(response.status) }, timestamp: new Date().toISOString() };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { message: response.ok ? '서버 응답 형식이 올바르지 않습니다.' : koreanHttpError(response.status) },
      timestamp: new Date().toISOString(),
    };
  }
}

function normalizeType(value: unknown): Exclude<SearchScope, 'ALL'> {
  const type = stringValue(value);
  if (type === 'BRIEFING' || type === 'CARD_NEWS' || type === 'KEYWORD_GRAPH' || type === 'PEER_PLUS') {
    return type;
  }
  return 'CARD_NEWS';
}

function requestedScopes(request: SearchRequest): SearchResultType[] {
  return request.scope === 'ALL' ? allSearchScopes : [request.scope];
}

function legacyCards(raw: RawSearchItem | undefined): RawSearchItem[] {
  return arrayValue(raw?.cards).filter(isRecord);
}

function legacyPeers(raw: RawSearchItem | undefined): RawSearchItem[] {
  return arrayValue(raw?.peers).filter(isRecord);
}

function legacyKeywords(raw: RawSearchItem | undefined): RawSearchItem[] {
  return arrayValue(raw?.keywords).filter(isRecord);
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function numericRecord(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, raw]) => [key, numberValue(raw)]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildCounts(items: SearchResultItem[]) {
  return allSearchScopes.reduce<Record<string, number>>((counts, scope) => {
    counts[scope] = items.filter((item) => item.type === scope).length;
    return counts;
  }, {});
}

function koreanHttpError(status: number) {
  if (status === 401) return '로그인이 필요하거나 인증 정보가 올바르지 않습니다.';
  if (status === 403) return '검색 권한이 없습니다.';
  if (status === 404) return '검색 API를 찾을 수 없습니다.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.';
  return `검색 요청 처리에 실패했습니다. (${status})`;
}
