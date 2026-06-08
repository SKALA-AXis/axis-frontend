import { httpClient } from '../../../shared/api/httpClient';
import { mockGlobalTrendList, mockGlobalTrendsRunResult } from '../../../shared/mocks/globalTrends';
import type {
  GlobalTrendDataSource,
  GlobalTrendListResponse,
  GlobalTrendsRunRequest,
  GlobalTrendsRunResult,
} from '../model/globalTrends';

export interface GlobalTrendsListParams {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface GlobalTrendsRepository {
  list(params?: GlobalTrendsListParams): Promise<GlobalTrendListResponse>;
  run(request?: GlobalTrendsRunRequest): Promise<GlobalTrendsRunResult>;
}

function withSource<T extends GlobalTrendListResponse>(data: T, source: GlobalTrendDataSource): T {
  return { ...data, _source: source };
}

function withRunSource<T extends GlobalTrendsRunResult>(data: T, source: GlobalTrendDataSource): T {
  return { ...data, _source: source };
}

class MockGlobalTrendsRepository implements GlobalTrendsRepository {
  async list(): Promise<GlobalTrendListResponse> {
    return withSource(mockGlobalTrendList, 'mock');
  }

  async run(): Promise<GlobalTrendsRunResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return withRunSource(mockGlobalTrendsRunResult, 'mock');
  }
}

class HttpGlobalTrendsRepository implements GlobalTrendsRepository {
  async list(params: GlobalTrendsListParams = {}): Promise<GlobalTrendListResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const search = new URLSearchParams();
    if (params.from) search.set('from', params.from);
    if (params.to) search.set('to', params.to);
    if (params.limit != null) search.set('limit', String(params.limit));
    if (params.offset != null) search.set('offset', String(params.offset));
    const query = search.toString();
    const data = await httpClient.get<GlobalTrendListResponse>(`/api/global/trends${query ? `?${query}` : ''}`);
    return withSource(data, 'live');
  }

  async run(request: GlobalTrendsRunRequest = {}): Promise<GlobalTrendsRunResult> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const data = await httpClient.post<GlobalTrendsRunResult>('/api/global/trends/run', {
      window_days: request.window_days ?? 30,
      include_peer_alignment: request.include_peer_alignment ?? true,
      max_trend_count: request.max_trend_count ?? 8,
      min_mention_count: request.min_mention_count ?? 3,
      ...(request.company_ids ? { company_ids: request.company_ids } : {}),
      ...(request.focus_themes ? { focus_themes: request.focus_themes } : {}),
      ...(request.sk_ax_business_lines ? { sk_ax_business_lines: request.sk_ax_business_lines } : {}),
    });
    return withRunSource(data, 'live');
  }
}

class HybridGlobalTrendsRepository implements GlobalTrendsRepository {
  constructor(
    private readonly remoteRepository: GlobalTrendsRepository,
    private readonly fallbackRepository: GlobalTrendsRepository,
  ) {}

  async list(params?: GlobalTrendsListParams): Promise<GlobalTrendListResponse> {
    try {
      return await this.remoteRepository.list(params);
    } catch {
      return this.fallbackRepository.list(params);
    }
  }

  async run(request?: GlobalTrendsRunRequest): Promise<GlobalTrendsRunResult> {
    try {
      return await this.remoteRepository.run(request);
    } catch {
      return this.fallbackRepository.run(request);
    }
  }
}

const fallbackRepository = new MockGlobalTrendsRepository();

export const globalTrendsRepository: GlobalTrendsRepository = httpClient
  ? new HybridGlobalTrendsRepository(new HttpGlobalTrendsRepository(), fallbackRepository)
  : fallbackRepository;
