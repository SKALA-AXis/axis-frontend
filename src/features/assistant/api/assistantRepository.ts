/*
 * 작성일: 2026-06-08
 * 작성자: 박진
 * 변경이력:
 *   2026-06-08 박진 — 플로팅 어시스턴트 챗 API 연동 리포지토리 추가, 이후 PDF·히스토리 제어와 챗봇 플로우 갱신
 */
import { HttpRequestError, httpClient } from '../../../shared/api/httpClient';
import type {
  AssistantChatResponse,
  AssistantConversationDetail,
  AssistantConversationSummary,
  AssistantHistoryTurn,
  AssistantPageContext,
} from '../model/assistant';

export type AssistantChatInput = {
  message: string;
  conversationId?: string | null;
  deviceId: string;
  history?: AssistantHistoryTurn[];
  currentPage?: AssistantPageContext;
};

export interface AssistantRepository {
  chat(input: AssistantChatInput): Promise<AssistantChatResponse>;
  chatWithPdf(input: AssistantChatInput, file: File): Promise<AssistantChatResponse>;
  listConversations(deviceId: string): Promise<AssistantConversationSummary[]>;
  getConversation(conversationId: string, deviceId: string): Promise<AssistantConversationDetail>;
  createConversation(deviceId: string): Promise<{ conversation_id: string; session_id?: string; status?: string }>;
  endConversation(conversationId: string, deviceId: string): Promise<{ conversation_id: string; status: string }>;
  deleteConversation(conversationId: string, deviceId: string): Promise<{ conversation_id: string; status: string; deleted?: boolean; error_code?: string }>;
}

class HttpAssistantRepository implements AssistantRepository {
  async chat(input: AssistantChatInput): Promise<AssistantChatResponse> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_CHAT_API_UNCONFIGURED');
    }
    return httpClient.post<AssistantChatResponse>('/api/assistant/chat', {
      message: input.message,
      conversation_id: input.conversationId,
      session_id: input.conversationId,
      device_id: input.deviceId,
      history: input.history ?? [],
      current_page: input.currentPage,
      client_context: {
        locale: 'ko-KR',
        timezone: 'Asia/Seoul',
        device_id: input.deviceId,
      },
    });
  }

  async chatWithPdf(input: AssistantChatInput, file: File): Promise<AssistantChatResponse> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_PDF_CHAT_API_UNCONFIGURED');
    }
    const formData = new FormData();
    formData.append('request_json', JSON.stringify({
      message: input.message,
      conversation_id: input.conversationId,
      session_id: input.conversationId,
      device_id: input.deviceId,
      history: input.history ?? [],
      current_page: input.currentPage,
      client_context: {
        locale: 'ko-KR',
        timezone: 'Asia/Seoul',
        device_id: input.deviceId,
      },
    }));
    formData.append('file', file);
    return httpClient.post<AssistantChatResponse>('/api/assistant/chat/pdf', formData);
  }

  async listConversations(deviceId: string): Promise<AssistantConversationSummary[]> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_CONVERSATION_LIST_API_UNCONFIGURED');
    }
    return httpClient.get<AssistantConversationSummary[]>(
      `/api/assistant/conversations?device_id=${encodeURIComponent(deviceId)}`,
    );
  }

  async getConversation(conversationId: string, deviceId: string): Promise<AssistantConversationDetail> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_CONVERSATION_LOAD_API_UNCONFIGURED');
    }
    return httpClient.get<AssistantConversationDetail>(
      `/api/assistant/conversations/${encodeURIComponent(conversationId)}?device_id=${encodeURIComponent(deviceId)}`,
    );
  }

  async createConversation(deviceId: string): Promise<{ conversation_id: string; session_id?: string; status?: string }> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_CONVERSATION_CREATE_API_UNCONFIGURED');
    }
    return httpClient.post('/api/assistant/conversations', { device_id: deviceId });
  }

  async endConversation(conversationId: string, deviceId: string): Promise<{ conversation_id: string; status: string }> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_CONVERSATION_END_API_UNCONFIGURED');
    }
    return httpClient.post(`/api/assistant/conversations/${encodeURIComponent(conversationId)}/end`, {
      device_id: deviceId,
    });
  }

  async deleteConversation(
    conversationId: string,
    deviceId: string,
  ): Promise<{ conversation_id: string; status: string; deleted?: boolean; error_code?: string }> {
    if (!httpClient) {
      throw assistantApiNotConfigured('ASSISTANT_CONVERSATION_DELETE_API_UNCONFIGURED');
    }
    return httpClient.delete<{ conversation_id: string; status: string; deleted?: boolean; error_code?: string }>(
      `/api/assistant/conversations/${encodeURIComponent(conversationId)}?device_id=${encodeURIComponent(deviceId)}`,
    );
  }
}

function assistantApiNotConfigured(code: string) {
  return new HttpRequestError('챗봇 API 주소가 설정되어 있지 않습니다.', { code });
}

export const assistantRepository: AssistantRepository = new HttpAssistantRepository();
