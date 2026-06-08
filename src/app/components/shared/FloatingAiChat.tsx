import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ExternalLink, History, Loader2, LogOut, MessageSquarePlus, Send, Sparkles, X } from 'lucide-react';
import { assistantRepository } from '../../../features/assistant/api/assistantRepository';
import type {
  AssistantConversationSummary,
  AssistantHandoff,
  AssistantHistoryTurn,
  AssistantSource,
} from '../../../features/assistant/model/assistant';
import { uiText } from '../../../shared/content/uiText';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  handoff?: AssistantHandoff | null;
  sources?: AssistantSource[];
  isGreeting?: boolean;
};

type FloatingAiChatProps = {
  activeView: string;
  onNavigate: (view: string) => void;
  scrollToTopControl?: ReactNode;
};

const deviceStorageKey = 'axis:assistant-device-id';
const greetingMessage = `${uiText.dashboard.chatGreeting} `;

export function FloatingAiChat({ activeView, onNavigate, scrollToTopControl }: FloatingAiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: greetingMessage,
      isGreeting: true,
    },
  ]);
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  useEffect(() => {
    if (!isOpen) return;
    assistantRepository.listConversations(deviceId)
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [deviceId, isOpen]);

  const handleSend = async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || isSending) {
      return;
    }

    const history = toHistory(messages);
    setMessages((currentMessages) => [...currentMessages, { role: 'user', content: trimmedQuery }]);
    setQuery('');
    setIsSending(true);

    try {
      const response = await assistantRepository.chat({
        message: trimmedQuery,
        conversationId,
        deviceId,
        history,
        currentPage: {
          route: viewToRoute(activeView),
          title: activeView,
          visible_item_ids: {},
          filters: {},
        },
      });
      setConversationId(response.conversation_id ?? conversationId);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: response.reply || response.message?.content || '답변을 생성하지 못했습니다.',
          handoff: response.handoff ?? null,
          sources: response.sources ?? [],
        },
      ]);
      assistantRepository.listConversations(deviceId)
        .then(setConversations)
        .catch(() => undefined);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : '챗봇 요청에 실패했습니다.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([{ role: 'assistant', content: greetingMessage, isGreeting: true }]);
    setQuery('');
    setIsHistoryOpen(false);
    try {
      const response = await assistantRepository.createConversation(deviceId);
      setConversationId(response.conversation_id);
    } catch {
      setConversationId(null);
    }
  };

  const handleEndChat = async () => {
    if (conversationId) {
      await assistantRepository.endConversation(conversationId, deviceId).catch(() => undefined);
    }
    setConversationId(null);
    setMessages([{ role: 'assistant', content: greetingMessage, isGreeting: true }]);
    setIsHistoryOpen(true);
    assistantRepository.listConversations(deviceId)
      .then(setConversations)
      .catch(() => setConversations([]));
  };

  const handleLoadConversation = async (nextConversationId: string) => {
    const detail = await assistantRepository.getConversation(nextConversationId, deviceId);
    setConversationId(nextConversationId);
    setMessages(
      detail.messages.length > 0
        ? detail.messages
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .map((message) => ({
              role: message.role === 'user' ? 'user' : 'assistant',
              content: message.content,
              handoff: isHandoff(message.handoff) ? message.handoff : null,
              sources: message.sources ?? [],
            }))
        : [{ role: 'assistant', content: greetingMessage, isGreeting: true }],
    );
    setIsHistoryOpen(false);
  };

  const handleHandoff = (handoff: AssistantHandoff) => {
    onNavigate(routeToView(handoff.target_route));
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-[90] flex flex-col items-end gap-3 md:bottom-5 md:right-6">
      {isOpen ? (
        <section className="mb-2 flex h-[420px] w-[330px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.62)]">
          <div className="flex items-center justify-between border-b border-[var(--axis-hairline)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--axis-ink)]">{uiText.dashboard.chatTitle}</h2>
                <p className="text-xs text-[var(--axis-muted)]">{uiText.dashboard.chatSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                className="flex size-8 items-center justify-center rounded-[var(--axis-radius-md)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
                aria-label="새 대화"
              >
                <MessageSquarePlus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen((current) => !current)}
                className="flex size-8 items-center justify-center rounded-[var(--axis-radius-md)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
                aria-label="대화 내역"
              >
                <History className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleEndChat}
                className="flex size-8 items-center justify-center rounded-[var(--axis-radius-md)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
                aria-label="대화 종료"
              >
                <LogOut className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-[var(--axis-radius-md)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
                aria-label="AI 채팅 패널 닫기"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--axis-canvas)] px-4 py-4">
            {isHistoryOpen ? (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    type="button"
                    onClick={() => handleLoadConversation(conversation.conversation_id)}
                    className="w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-3 py-2 text-left transition-colors hover:border-[var(--axis-accent)]"
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-[var(--axis-ink)]">
                      {conversation.title || '새 대화'}
                    </p>
                    <p className="text-xs text-[var(--axis-muted)]">
                      {conversation.message_count ?? 0} messages
                    </p>
                  </button>
                ))}
                {conversations.length === 0 ? (
                  <p className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-3 py-2 text-sm text-[var(--axis-muted)]">
                    저장된 대화가 없습니다.
                  </p>
                ) : null}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-[var(--axis-radius-lg)] px-3 py-2 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-[var(--axis-navy)] text-white'
                        : 'border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 ? (
                      <p className="mt-2 text-xs text-[var(--axis-muted)]">근거 {message.sources.length}건</p>
                    ) : null}
                    {message.handoff ? (
                      <button
                        type="button"
                        onClick={() => handleHandoff(message.handoff as AssistantHandoff)}
                        className="mt-3 inline-flex items-center gap-1 rounded-[var(--axis-radius-md)] bg-[var(--axis-accent)] px-2 py-1 text-xs font-semibold text-white"
                      >
                        <ExternalLink className="size-3" />
                        {message.handoff.label}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {isSending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-muted)]">
                  <Loader2 className="size-4 animate-spin" />
                  답변 생성 중
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSend();
                  }
                }}
                placeholder={uiText.dashboard.chatPlaceholder}
                disabled={isSending}
                className="min-w-0 flex-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-ink)] outline-none transition placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)]"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isSending}
                className="flex size-10 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-white transition-colors hover:bg-[var(--axis-ink)] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none"
                aria-label="메시지 전송"
              >
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div
          className={`pointer-events-none hidden w-56 rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4 shadow-[0_18px_54px_-34px_rgba(0,0,0,0.52)] transition-all duration-200 sm:block ${
            isBubbleVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-base font-bold text-[var(--axis-ink)]">AXIS</p>
            <span className="text-xl leading-none text-[var(--axis-muted)]">×</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--axis-body)]">안녕하세요. 오늘의 전략 신호를 함께 정리해드릴게요.</p>
        </div>
      )}

      {scrollToTopControl}

      <button
        data-guide="ai-chat"
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          setIsBubbleVisible(false);
        }}
        onMouseEnter={() => setIsBubbleVisible(true)}
        onMouseLeave={() => setIsBubbleVisible(false)}
        onFocus={() => setIsBubbleVisible(true)}
        onBlur={() => setIsBubbleVisible(false)}
        className={`flex size-14 items-center justify-center rounded-[var(--axis-radius-xl)] border border-white/20 text-white shadow-[0_18px_54px_-28px_rgba(220,90,36,0.82)] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--axis-canvas)] ${
          isOpen ? 'bg-[var(--axis-accent-strong)]' : 'bg-[var(--axis-accent)]'
        }`}
        aria-label={isOpen ? 'AI 채팅 패널 닫기' : 'AI 채팅 패널 열기'}
        aria-expanded={isOpen}
      >
        <Sparkles className="size-6" />
      </button>
    </div>
  );
}

function toHistory(messages: ChatMessage[]): AssistantHistoryTurn[] {
  return messages
    .filter((message) => !message.isGreeting)
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.content }));
}

function getOrCreateDeviceId() {
  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) return existing;
  const next = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(deviceStorageKey, next);
  return next;
}

function viewToRoute(view: string) {
  if (view === 'home') return '/dashboard';
  if (view === 'issues') return '/cards';
  return `/${view}`;
}

function routeToView(route: string) {
  if (route === '/mixer') return 'mixer';
  if (route === '/briefings') return 'briefings';
  if (route === '/dashboard') return 'home';
  if (route === '/cards') return 'issues';
  return route.replace(/^\//, '') || 'home';
}

function isHandoff(value: unknown): value is AssistantHandoff {
  return Boolean(value && typeof value === 'object' && 'target_route' in value && 'label' in value);
}
