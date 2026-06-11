import { env } from '../config/env';
import { getAccessToken } from './authSession';

export interface HttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export class HttpRequestError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, options: { code?: string; status?: number } = {}) {
    super(formatApiErrorMessage(message, options.code));
    this.name = 'HttpRequestError';
    this.code = options.code;
    this.status = options.status;
  }
}

class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
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
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      });
    } catch {
      throw new HttpRequestError('호출에 실패했다', {
        code: 'NETWORK_REQUEST_FAILED',
      });
    }

    const payload = await parseJsonResponse(response);
    if (isApiErrorResponse(payload)) {
      throw new HttpRequestError(payload.error.message, {
        code: payload.error.code ?? `HTTP_${response.status}`,
        status: response.status,
      });
    }
    if (!response.ok) {
      throw new HttpRequestError(koreanHttpError(response.status), {
        code: `HTTP_${response.status}`,
        status: response.status,
      });
    }
    if (isApiResponse(payload)) {
      if (!payload.success) {
        throw new HttpRequestError('호출에 실패했다', {
          code: 'API_RESPONSE_FAILED',
          status: response.status,
        });
      }
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

function isApiErrorResponse(value: unknown): value is { success: boolean; error: { code?: string; message: string }; timestamp: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeResponse = value as Record<string, unknown>;
  const maybeError = maybeResponse.error as Record<string, unknown> | undefined;
  return typeof maybeResponse.success === 'boolean' && typeof maybeError?.message === 'string';
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return response.ok
      ? { success: true, data: undefined, timestamp: new Date().toISOString() }
      : {
          success: false,
          error: { code: `HTTP_${response.status}`, message: koreanHttpError(response.status) },
          timestamp: new Date().toISOString(),
        };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: {
        code: response.ok ? 'INVALID_JSON_RESPONSE' : `HTTP_${response.status}`,
        message: response.ok ? '서버 응답 형식이 올바르지 않습니다.' : koreanHttpError(response.status),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export function formatApiErrorMessage(message: string, code?: string | null) {
  const safeMessage = message?.trim() || '호출에 실패했다';
  return code ? `${safeMessage} (에러코드: ${code})` : safeMessage;
}

function koreanHttpError(status: number) {
  if (status === 400) return '요청 값이 올바르지 않습니다.';
  if (status === 401) return '로그인이 필요하거나 인증 정보가 올바르지 않습니다.';
  if (status === 403) return '접근 권한이 없습니다. 로그인 상태를 초기화한 뒤 다시 시도하세요.';
  if (status === 404) return '요청한 API를 찾을 수 없습니다. 백엔드 서버 주소를 확인하세요.';
  if (status === 503) return '외부 서비스 또는 메일 발송 시스템에 연결할 수 없습니다. 잠시 후 다시 시도하세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.';
  return `요청 처리에 실패했습니다. (${status})`;
}
