import { env } from '../config/env';
import { getAccessToken } from './authSession';

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
    const headers: Record<string, string> = { Accept: 'application/json' };
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = isApiErrorResponse(payload) ? payload.error.message : `Request failed: ${response.status}`;
      throw new Error(message);
    }
    if (isApiResponse(payload)) {
      return payload.data as T;
    }

    return payload as T;
  }
}

export const httpClient: HttpClient | null = env.apiBaseUrl
  ? new FetchHttpClient(env.apiBaseUrl)
  : null;

function isApiResponse(value: unknown): value is { success: boolean; data: unknown; timestamp: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeResponse = value as Record<string, unknown>;
  return typeof maybeResponse.success === 'boolean' && 'data' in maybeResponse && typeof maybeResponse.timestamp === 'string';
}

function isApiErrorResponse(value: unknown): value is { success: boolean; error: { message: string }; timestamp: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeResponse = value as Record<string, unknown>;
  const maybeError = maybeResponse.error as Record<string, unknown> | undefined;
  return typeof maybeResponse.success === 'boolean' && typeof maybeError?.message === 'string';
}
