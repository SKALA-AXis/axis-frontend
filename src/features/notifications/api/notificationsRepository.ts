/*
 * 작성일: 2026-05-22
 * 작성자: 박진
 * 변경이력:
 *   2026-05-22 박진 — 알림 설정 기능 추가 시 알림 API 리포지토리 구현, 이후 챗봇 프론트엔드 연동
 *   2026-06-17 최종민 — TopNav 드롭다운 '지우기'가 전체 알림을 지우도록(scope=ALL) 수정
 */
import { getAccessToken } from '../../../shared/api/authSession';
import { env } from '../../../shared/config/env';
import type { NotificationItem, NotificationPreferences } from '../model/notification';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  timestamp?: string;
};

type RawNotification = Record<string, unknown>;

type NotificationListResponse = {
  items?: RawNotification[];
  unread_count?: number;
  unreadCount?: number;
  page?: number;
  limit?: number;
  size?: number;
  total?: number;
  total_count?: number;
  totalCount?: number;
  totalPages?: number;
  total_pages?: number;
  hasNext?: boolean;
  nextCursor?: string | null;
};

class NotificationsRepository {
  private readonly baseUrl = env.apiBaseUrl;

  async list(limit = 10, unreadOnly = false, page = 0) {
    const params = new URLSearchParams({
      limit: String(limit),
      unread_only: String(unreadOnly),
      page: String(page),
    });
    const response = await this.request<NotificationListResponse>(`/api/notifications?${params.toString()}`, { method: 'GET' });
    const items = (response?.items ?? []).map(toNotificationItem);
    const responseLimit = numberValue(response?.limit ?? response?.size, limit);
    const totalCount = numberValue(response?.total_count ?? response?.totalCount ?? response?.total, items.length);

    return {
      items,
      unreadCount: numberValue(response?.unread_count ?? response?.unreadCount, 0),
      page: numberValue(response?.page, page),
      limit: responseLimit,
      totalCount,
      totalPages: numberValue(response?.totalPages ?? response?.total_pages, Math.ceil(totalCount / Math.max(1, responseLimit))),
      hasNext: response?.hasNext === true,
      nextCursor: typeof response?.nextCursor === 'string' ? response.nextCursor : null,
    };
  }

  async listAll(limit = 100, unreadOnly = false) {
    const items: ReturnType<typeof toNotificationItem>[] = [];
    const seenIds = new Set<string>();
    let page = 0;
    let unreadCount = 0;
    let totalCount = 0;
    let totalPages = 1;

    while (true) {
      const result = await this.list(limit, unreadOnly, page);
      if (page === 0) {
        unreadCount = result.unreadCount;
        totalCount = result.totalCount;
        totalPages = Math.max(1, result.totalPages);
      }

      const newItems = result.items.filter((item) => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });
      items.push(...newItems);

      if (!result.hasNext || newItems.length === 0) {
        break;
      }
      page += 1;
    }

    return { items, unreadCount, totalCount, totalPages };
  }

  async unreadCount() {
    const response = await this.request<{ count?: number }>('/api/notifications/unread-count', { method: 'GET' });
    return numberValue(response?.count, 0);
  }

  async markRead(id: string) {
    const response = await this.request<RawNotification>(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
    return toNotificationItem(response);
  }

  async markAllRead() {
    return this.request<{ updated_count?: number; updatedCount?: number }>('/api/notifications/read-all', { method: 'PATCH' });
  }

  async deleteRead() {
    return this.request<{ cleared: boolean; deleted_count?: number; deletedCount?: number }>('/api/notifications?scope=READ', { method: 'DELETE' });
  }

  async clearAll() {
    return this.request<{ cleared: boolean; deleted_count?: number; deletedCount?: number }>('/api/notifications?scope=ALL', { method: 'DELETE' });
  }

  async preferences() {
    const response = await this.request<Partial<NotificationPreferences>>('/api/me/notification-preferences', { method: 'GET' });
    return toPreferences(response);
  }

  async updatePreferences(preferences: NotificationPreferences) {
    const response = await this.request<Partial<NotificationPreferences>>('/api/me/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
    return toPreferences(response);
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

export const notificationsRepository = new NotificationsRepository();

function toNotificationItem(raw: RawNotification): NotificationItem {
  return {
    id: stringValue(raw, ['id']),
    type: stringValue(raw, ['type']),
    severity: stringValue(raw, ['severity']) || 'NORMAL',
    title: stringValue(raw, ['title']),
    message: stringValue(raw, ['message']),
    sourceType: stringValue(raw, ['sourceType', 'source_type']),
    sourceId: stringValue(raw, ['sourceId', 'source_id', 'target_resource_id']),
    sourceUrl: stringValue(raw, ['sourceUrl', 'source_url']),
    companyName: stringValue(raw, ['companyName', 'company_name', 'peer']),
    matchedKeywords: stringList(raw.matchedKeywords ?? raw.matched_keywords),
    target: stringValue(raw, ['target']) || targetFromSource(stringValue(raw, ['sourceType', 'source_type'])),
    read: raw.read === true,
    createdAt: stringValue(raw, ['createdAt', 'created_at']),
  };
}

function toPreferences(raw?: Partial<NotificationPreferences>): NotificationPreferences {
  return {
    enabled: raw?.enabled !== false,
    importantEnabled: raw?.importantEnabled !== false,
    keywords: Array.isArray(raw?.keywords)
      ? raw.keywords.map(String).map((item) => item.trim()).filter(Boolean)
      : [],
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

function stringValue(source: RawNotification, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : [];
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function targetFromSource(sourceType: string) {
  if (sourceType === 'CARD_NEWS') return 'issues';
  if (sourceType === 'BRIEFING') return 'briefings';
  if (sourceType === 'PEER') return 'peerPlus';
  if (sourceType === 'KEYWORD_GRAPH') return 'keywordGraph';
  return 'home';
}

function koreanHttpError(status: number) {
  if (status === 401) return '로그인이 필요하거나 인증 정보가 올바르지 않습니다.';
  if (status === 403) return '접근 권한이 없습니다.';
  if (status === 404) return '알림을 찾을 수 없습니다.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.';
  return `알림 요청 처리에 실패했습니다. (${status})`;
}
