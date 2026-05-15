import { useCallback, useState } from 'react';
import { chatRepository } from '../api/chatRepository';
import type { ChatHistoryTurn, ChatTurnResponse } from '../model/chat';

const SESSION_STORAGE_KEY = 'axis.chat.sessionId';

function loadSessionId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSessionId(id: string): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

interface UseChatResult {
  isLoading: boolean;
  error: string | null;
  lastResponse: ChatTurnResponse | null;
  send: (message: string, history: ChatHistoryTurn[]) => Promise<ChatTurnResponse | null>;
}

export function useChat(): UseChatResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ChatTurnResponse | null>(null);

  const send = useCallback(async (message: string, history: ChatHistoryTurn[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = loadSessionId();
      const result = await chatRepository.send({ message, sessionId, history });
      if (result.session_id) {
        saveSessionId(result.session_id);
      }
      setLastResponse(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat 요청 실패');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, lastResponse, send };
}
