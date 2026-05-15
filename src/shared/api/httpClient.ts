import { env } from '../config/env';

export interface HttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (isApiResponse(payload)) {
      return payload.data as T;
    }

    return payload as T;
  }
}

// Always create the client. Empty baseUrl → relative URLs (same origin) which
// nginx + ALB ingress routes /api/* 를 backend 로 proxy. 빌드 시 VITE_API_BASE_URL
// 가 없어도 (cluster CI checkout) "API client not configured" 에러 안 남.
//
// 타입 `| null` 은 호환을 위해 유지 (기존 repository 들의 `if (!httpClient)` guard
// 는 dead code 가 되지만 정상 통과).
export const httpClient: HttpClient | null = new FetchHttpClient(env.apiBaseUrl);

function isApiResponse(value: unknown): value is { success: boolean; data: unknown; timestamp: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeResponse = value as Record<string, unknown>;
  return typeof maybeResponse.success === 'boolean' && 'data' in maybeResponse && typeof maybeResponse.timestamp === 'string';
}
