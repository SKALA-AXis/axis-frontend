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
  listConversations(deviceId: string): Promise<AssistantConversationSummary[]>;
  getConversation(conversationId: string, deviceId: string): Promise<AssistantConversationDetail>;
  createConversation(deviceId: string): Promise<{ conversation_id: string; session_id?: string; status?: string }>;
  endConversation(conversationId: string, deviceId: string): Promise<{ conversation_id: string; status: string }>;
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
}

export const assistantRepository: AssistantRepository = new HttpAssistantRepository();
