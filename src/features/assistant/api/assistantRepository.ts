import { httpClient } from '../../../shared/api/httpClient';
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
  deleteConversation(conversationId: string, deviceId: string): Promise<{ conversation_id: string; status: string; deleted?: boolean }>;
}

class HttpAssistantRepository implements AssistantRepository {
  async chat(input: AssistantChatInput): Promise<AssistantChatResponse> {
    if (!httpClient) {
      throw new Error('챗봇 API 주소가 설정되어 있지 않습니다.');
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
      throw new Error('챗봇 API 주소가 설정되어 있지 않습니다.');
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
      return [];
    }
    return httpClient.get<AssistantConversationSummary[]>(
      `/api/assistant/conversations?device_id=${encodeURIComponent(deviceId)}`,
    );
  }

  async getConversation(conversationId: string, deviceId: string): Promise<AssistantConversationDetail> {
    if (!httpClient) {
      return { conversation_id: conversationId, messages: [] };
    }
    return httpClient.get<AssistantConversationDetail>(
      `/api/assistant/conversations/${encodeURIComponent(conversationId)}?device_id=${encodeURIComponent(deviceId)}`,
    );
  }

  async createConversation(deviceId: string): Promise<{ conversation_id: string; session_id?: string; status?: string }> {
    if (!httpClient) {
      return { conversation_id: crypto.randomUUID(), status: 'active' };
    }
    return httpClient.post('/api/assistant/conversations', { device_id: deviceId });
  }

  async endConversation(conversationId: string, deviceId: string): Promise<{ conversation_id: string; status: string }> {
    if (!httpClient) {
      return { conversation_id: conversationId, status: 'ended' };
    }
    return httpClient.post(`/api/assistant/conversations/${encodeURIComponent(conversationId)}/end`, {
      device_id: deviceId,
    });
  }

  async deleteConversation(
    conversationId: string,
    deviceId: string,
  ): Promise<{ conversation_id: string; status: string; deleted?: boolean }> {
    if (!httpClient) {
      return { conversation_id: conversationId, status: 'deleted', deleted: true };
    }
    return httpClient.delete(
      `/api/assistant/conversations/${encodeURIComponent(conversationId)}?device_id=${encodeURIComponent(deviceId)}`,
    );
  }
}

export const assistantRepository: AssistantRepository = new HttpAssistantRepository();
