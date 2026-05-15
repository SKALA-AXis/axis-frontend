import { httpClient } from '../../../shared/api/httpClient';
import type { ChatHistoryTurn, ChatTurnResponse } from '../model/chat';

export interface ChatTurnInput {
  message: string;
  sessionId?: string | null;
  history?: ChatHistoryTurn[];
}

export interface ChatRepository {
  send(input: ChatTurnInput): Promise<ChatTurnResponse>;
}

class HttpChatRepository implements ChatRepository {
  async send({ message, sessionId, history }: ChatTurnInput): Promise<ChatTurnResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    const body: Record<string, unknown> = { message };
    if (sessionId) body.session_id = sessionId;
    if (history && history.length > 0) body.history = history;
    return httpClient.post<ChatTurnResponse>('/api/assistant/chat', body);
  }
}

export const chatRepository: ChatRepository = new HttpChatRepository();
