import { getAccessToken } from '../../../shared/api/authSession';
import { env } from '../../../shared/config/env';
import type { AccessLogItem, AccessLogPage } from '../model/accessLog';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  timestamp?: string;
};

type AccessLogsResponse = {
  items?: RawAccessLog[];
  page?: number;
  size?: number;
  total?: number;
  totalPages?: number;
  total_pages?: number;
};

type RawAccessLog = Record<string, unknown>;
type RawStrategyContext = Record<string, unknown>;

export type StrategyContextSourceType = 'manual_text' | 'uploaded_file';

export type StrategyContextItem = {
  id: string;
  content: string;
  rawText: string;
  sourceType: StrategyContextSourceType;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
};

export type StrategyContextInput = {
  rawText: string;
  sourceType: StrategyContextSourceType;
  fileName?: string;
  fileSize?: number;
};

export type StrategyContextFileExtraction = {
  fileName: string;
  fileSize: number;
  contentType?: string;
  extractedText: string;
  truncated: boolean;
  extractionMethod?: string;
  ocrUsed?: boolean;
};

class SettingsRepository {
  private readonly baseUrl = env.apiBaseUrl;

  async accessLogs(page = 0, size = 5): Promise<AccessLogPage> {
    const response = await this.request<AccessLogsResponse>(`/api/settings/access-logs?page=${page}&size=${size}`);
    const items = (response?.items ?? []).map(toAccessLogItem);
    const responseSize = numberValue(response, ['size'], size);
    const total = numberValue(response, ['total'], items.length);

    return {
      items,
      page: numberValue(response, ['page'], page),
      size: responseSize,
      total,
      totalPages: numberValue(response, ['totalPages', 'total_pages'], Math.ceil(total / Math.max(1, responseSize))),
    };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request<unknown>('/api/settings/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async strategyContexts(): Promise<StrategyContextItem[]> {
    const response = await this.request<{ items?: RawStrategyContext[] }>('/api/settings/strategy-contexts');
    return (response?.items ?? []).map(toStrategyContextItem);
  }

  async createStrategyContext(input: StrategyContextInput): Promise<StrategyContextItem> {
    const response = await this.request<RawStrategyContext>('/api/settings/strategy-contexts', {
      method: 'POST',
      body: JSON.stringify(toStrategyContextPayload(input)),
    });
    return toStrategyContextItem(response);
  }

  async updateStrategyContext(id: string, input: StrategyContextInput): Promise<StrategyContextItem> {
    const response = await this.request<RawStrategyContext>(`/api/settings/strategy-contexts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toStrategyContextPayload(input)),
    });
    return toStrategyContextItem(response);
  }

  async deleteStrategyContext(id: string): Promise<void> {
    await this.request<unknown>(`/api/settings/strategy-contexts/${id}`, {
      method: 'DELETE',
    });
  }

  async extractStrategyContextFile(file: File): Promise<StrategyContextFileExtraction> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.request<Record<string, unknown>>('/api/settings/strategy-context-files', {
      method: 'POST',
      body: formData,
    });
    return {
      fileName: stringValue(response, ['fileName', 'file_name']) || file.name,
      fileSize: scalarNumberValue(response.fileSize, file.size),
      contentType: stringValue(response, ['contentType', 'content_type']),
      extractedText: stringValue(response, ['extractedText', 'extracted_text']),
      truncated: booleanValue(response.truncated, false),
      extractionMethod: stringValue(response, ['extractionMethod', 'extraction_method']) || undefined,
      ocrUsed: booleanValue(response.ocrUsed ?? response.ocr_used, false),
    };
  }

  private async request<T>(path: string, init: RequestInit = { method: 'GET' }): Promise<T> {
    const accessToken = getAccessToken();
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        method: init.method ?? 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(init.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
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

export const settingsRepository = new SettingsRepository();

function toStrategyContextPayload(input: StrategyContextInput) {
  return {
    rawText: input.rawText,
    sourceType: input.sourceType,
    fileName: input.fileName,
    fileSize: input.fileSize,
  };
}

function toStrategyContextItem(raw: RawStrategyContext): StrategyContextItem {
  const rawText = stringValue(raw, ['rawText', 'raw_text', 'content']);
  const sourceType = stringValue(raw, ['sourceType', 'source_type']) === 'uploaded_file'
    ? 'uploaded_file'
    : 'manual_text';
  return {
    id: stringValue(raw, ['id']),
    content: rawText,
    rawText,
    sourceType,
    fileName: stringValue(raw, ['fileName', 'file_name']) || undefined,
    fileSize: optionalNumberValue(raw.fileSize ?? raw.file_size),
    createdAt: stringValue(raw, ['createdAt', 'created_at']),
    updatedAt: stringValue(raw, ['updatedAt', 'updated_at']),
  };
}

function toAccessLogItem(raw: RawAccessLog): AccessLogItem {
  const ipAddress = stringValue(raw, ['ipAddress', 'ip_address']);
  return {
    id: String(raw.id ?? `${stringValue(raw, ['occurredAt', 'occurred_at', 'created_at'])}-${stringValue(raw, ['action', 'action_type'])}`),
    action: stringValue(raw, ['action', 'action_type']),
    success: booleanValue(raw.success, true),
    country: stringValue(raw, ['country', 'countryName', 'country_name']) || inferCountryFromIp(ipAddress),
    ipAddress,
    userAgent: stringValue(raw, ['userAgent', 'user_agent']),
    occurredAt: stringValue(raw, ['occurredAt', 'occurred_at', 'createdAt', 'created_at']),
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

function stringValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return '';
}

function numberValue(source: Record<string, unknown> | undefined, keys: string[], fallback: number) {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function scalarNumberValue(value: unknown, fallback: number) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function optionalNumberValue(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function inferCountryFromIp(value: string) {
  const ip = value.trim().toLowerCase();
  if (!ip) return '알 수 없음';
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip === '0:0:0:0:0:0:0:1') {
    return '로컬 개발환경';
  }
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) {
    return '사내/내부망';
  }
  if (ip.startsWith('172.')) {
    const secondOctet = Number(ip.split('.')[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return '사내/내부망';
    }
  }
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) {
    return '사내/내부망';
  }
  return '알 수 없음';
}

function koreanHttpError(status: number) {
  if (status === 400) return '요청 값이 올바르지 않습니다.';
  if (status === 401) return '로그인이 필요하거나 인증 정보가 올바르지 않습니다.';
  if (status === 403) return '접근 권한이 없습니다. 로그인 상태를 초기화한 뒤 다시 시도하세요.';
  if (status === 404) return '설정 API를 찾을 수 없습니다. 백엔드 서버 주소를 확인하세요.';
  if (status === 503) return '백엔드 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.';
  return `설정 요청 처리에 실패했습니다. (${status})`;
}
