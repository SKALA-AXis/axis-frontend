import type {
  AssistantAnswerBlock,
  AssistantChatResponse,
  AssistantHistoryTurn,
  AssistantReportDraft,
} from '../../../../features/assistant/model/assistant';
import { HttpRequestError } from '../../../../shared/api/httpClient';
import { deviceStorageKey, genericAssistantErrorMessage } from './constants';
import type { ChatMessage } from './types';

export function getAssistantResponseErrorCode(response: AssistantChatResponse) {
  if (typeof response.error_code === 'string' && response.error_code.trim()) {
    return response.error_code.trim();
  }
  const provenanceCode = response.provenance?.error_code;
  if (typeof provenanceCode === 'string' && provenanceCode.trim()) {
    return provenanceCode.trim();
  }
  if (response.blocked && response.intent === 'assistant_error') {
    return 'ASSISTANT_CHAT_RESPONSE_ERROR';
  }
  return null;
}

export function formatAssistantError(code: string, error?: unknown) {
  const upstreamCode = extractErrorCode(error);
  const parts = [`${genericAssistantErrorMessage}`, `에러코드: ${code}`];
  if (upstreamCode && upstreamCode !== code) {
    parts.push(`서버 에러코드: ${upstreamCode}`);
  }
  return parts.join('\n');
}

function extractErrorCode(error?: unknown) {
  if (!error || typeof error !== 'object') return '';
  if (error instanceof HttpRequestError && error.code) {
    return error.code;
  }
  const maybeError = error as { code?: unknown; error_code?: unknown };
  if (typeof maybeError.error_code === 'string' && maybeError.error_code.trim()) {
    return maybeError.error_code.trim();
  }
  if (typeof maybeError.code === 'string' && maybeError.code.trim()) {
    return maybeError.code.trim();
  }
  return '';
}

export function toHistory(messages: ChatMessage[]): AssistantHistoryTurn[] {
  return messages
    .filter((message) => !message.isGreeting)
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.content }));
}

export function normalizeAnswerBlocks(value: unknown): AssistantAnswerBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((block): block is Record<string, unknown> => Boolean(block && typeof block === 'object'))
    .map((block) => ({
      type: typeof block.type === 'string' ? block.type : undefined,
      title: typeof block.title === 'string' ? block.title : undefined,
      items: Array.isArray(block.items)
        ? block.items.map((item) => String(item)).filter(Boolean)
        : [],
    }))
    .filter((block) => block.title || block.items.length > 0)
    .slice(0, 4);
}

export function normalizeReportDraft(value: unknown): AssistantReportDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .filter((section): section is Record<string, unknown> => Boolean(section && typeof section === 'object'))
        .map((section) => ({
          title: typeof section.title === 'string' ? section.title : undefined,
          body: typeof section.body === 'string' ? section.body : undefined,
        }))
        .filter((section) => section.title || section.body)
        .slice(0, 4)
    : [];
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  if (!title && sections.length === 0) return null;
  return { title, sections };
}

export function isHttpUrl(value?: string) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export function formatEvidenceDate(value?: string) {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value.slice(0, 10);
  return `${match[1]}.${match[2]}.${match[3]}`;
}

export function getOrCreateDeviceId() {
  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) return existing;
  const next = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(deviceStorageKey, next);
  return next;
}

export function viewToRoute(view: string) {
  if (view === 'home') return '/dashboard';
  if (view === 'issues') return '/cards';
  return `/${view}`;
}
