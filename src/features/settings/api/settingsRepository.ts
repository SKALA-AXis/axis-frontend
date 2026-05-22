import { getAccessToken } from '../../../shared/api/authSession';
import { env } from '../../../shared/config/env';
import type { AccessLogItem } from '../model/accessLog';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  timestamp?: string;
};

type AccessLogsResponse = {
  items?: RawAccessLog[];
};

type RawAccessLog = Record<string, unknown>;

class SettingsRepository {
  private readonly baseUrl = env.apiBaseUrl;

  async accessLogs(): Promise<AccessLogItem[]> {
    const response = await this.request<AccessLogsResponse>('/api/settings/access-logs');
    return (response?.items ?? []).map(toAccessLogItem);
  }

  private async request<T>(path: string): Promise<T> {
    const accessToken = getAccessToken();
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

function stringValue(source: RawAccessLog, keys: string[]) {
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

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function inferCountryFromIp(value: string) {
  const ip = value.trim().toLowerCase();
  if (!ip) return '알 수 없음';
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip === '0:0:0:0:0:0:0:1') {
    return '로컬';
  }
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) {
    return '내부망';
  }
  if (ip.startsWith('172.')) {
    const secondOctet = Number(ip.split('.')[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return '내부망';
    }
  }
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) {
    return '내부망';
  }
  return '알 수 없음';
}

function koreanHttpError(status: number) {
  if (status === 401) return '로그인이 필요하거나 인증 정보가 올바르지 않습니다.';
  if (status === 403) return '접근 권한이 없습니다. 로그인 상태를 초기화한 뒤 다시 시도하세요.';
  if (status === 404) return '접속 로그 API를 찾을 수 없습니다. 백엔드 서버 주소를 확인하세요.';
  if (status === 503) return '백엔드 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.';
  return `접속 로그 조회에 실패했습니다. (${status})`;
}
