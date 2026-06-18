/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편(designing 통합·차트/routing/브리핑 흡수) 일부로 도입
 *   2026-05-22 안가은 — 홈화면 그래프 데이터 연동 및 관리자 카드뉴스/감사로그 화면, 대시보드·챗 구조 정리
 *   2026-05-22 박진 — 플로팅 어시스턴트 챗 UI 및 챗봇 API 연동 구현, PDF·히스토리 컨트롤 등 반복 수정
 *   2026-06-18 안가은 — 모바일 하단 내비와 겹치지 않도록 플로팅 챗 위치와 크기 조정
 */
import { useEffect, useMemo, useState } from 'react';
import {
  History,
  LogOut,
  MessageSquarePlus,
  Sparkles,
  X,
} from 'lucide-react';
import { assistantRepository } from '../../../features/assistant/api/assistantRepository';
import type { AssistantConversationSummary } from '../../../features/assistant/model/assistant';
import { HttpRequestError } from '../../../shared/api/httpClient';
import { uiText } from '../../../shared/content/uiText';
import { ChatBubblePreview } from './floating-ai-chat/components/ChatBubblePreview';
import { ChatComposer } from './floating-ai-chat/components/ChatComposer';
import {
  AssistantSendingIndicator,
  ChatMessageList,
} from './floating-ai-chat/components/ChatMessageList';
import { ConversationHistory } from './floating-ai-chat/components/ConversationHistory';
import { assistantErrorCodes, greetingMessage } from './floating-ai-chat/constants';
import type { ChatMessage, FloatingAiChatProps } from './floating-ai-chat/types';
import {
  formatAssistantError,
  getAssistantResponseErrorCode,
  getOrCreateDeviceId,
  normalizeAnswerBlocks,
  normalizeReportDraft,
  toHistory,
  viewToRoute,
} from './floating-ai-chat/utils';

export function FloatingAiChat({ activeView, scrollToTopControl }: FloatingAiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [expandedEvidenceKeys, setExpandedEvidenceKeys] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([createGreetingMessage()]);
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  useEffect(() => {
    if (!isOpen) return;
    void refreshConversations();
  }, [deviceId, isOpen]);

  const refreshConversations = async () => {
    try {
      const nextConversations = await assistantRepository.listConversations(deviceId);
      setConversations(nextConversations);
      setHistoryError(null);
    } catch (error) {
      setConversations([]);
      setHistoryError(formatAssistantError(assistantErrorCodes.conversationList, error));
    }
  };

  const appendAssistantMessage = (content: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'assistant', content },
    ]);
  };

  const resetChat = () => {
    setMessages([createGreetingMessage()]);
    setExpandedEvidenceKeys(new Set());
  };

  const handleSend = async () => {
    const selectedAttachment = attachment;
    const trimmedQuery = query.trim();
    const effectiveQuery = trimmedQuery || (selectedAttachment ? '첨부 PDF를 분석해줘' : '');

    if (!effectiveQuery || isSending) {
      return;
    }

    const history = toHistory(messages);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: 'user',
        content: selectedAttachment
          ? `${effectiveQuery}\n첨부 PDF: ${selectedAttachment.name}`
          : effectiveQuery,
      },
    ]);
    setQuery('');
    setAttachment(null);
    setIsSending(true);

    try {
      const chatInput = {
        message: effectiveQuery,
        conversationId,
        deviceId,
        history,
        currentPage: {
          route: viewToRoute(activeView),
          title: activeView,
          visible_item_ids: {},
          filters: {},
        },
      };
      const response = selectedAttachment
        ? await assistantRepository.chatWithPdf(chatInput, selectedAttachment)
        : await assistantRepository.chat(chatInput);
      setConversationId(response.conversation_id ?? conversationId);
      const responseErrorCode = getAssistantResponseErrorCode(response);
      const responseContent = responseErrorCode
        ? formatAssistantError(responseErrorCode)
        : response.reply || response.message?.content || formatAssistantError(assistantErrorCodes.chatEmptyReply);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: responseContent,
          sources: responseErrorCode ? [] : response.sources ?? [],
          answerBlocks: responseErrorCode ? [] : normalizeAnswerBlocks(response.answer_blocks),
          reportDraft: responseErrorCode ? null : normalizeReportDraft(response.report_draft),
        },
      ]);
      void refreshConversations();
    } catch (error) {
      appendAssistantMessage(
        formatAssistantError(
          selectedAttachment ? assistantErrorCodes.pdfChat : assistantErrorCodes.chatSend,
          error,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentChange = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      appendAssistantMessage(formatAssistantError(assistantErrorCodes.pdfUnsupportedType));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      appendAssistantMessage(formatAssistantError(assistantErrorCodes.pdfTooLarge));
      return;
    }
    setAttachment(file);
  };

  const handleNewChat = async () => {
    resetChat();
    setQuery('');
    setIsHistoryOpen(false);
    try {
      const response = await assistantRepository.createConversation(deviceId);
      setConversationId(response.conversation_id);
      setHistoryError(null);
    } catch (error) {
      setConversationId(null);
      appendAssistantMessage(formatAssistantError(assistantErrorCodes.conversationCreate, error));
    }
  };

  const handleEndChat = async () => {
    try {
      if (conversationId) {
        await assistantRepository.endConversation(conversationId, deviceId);
      }
      setConversationId(null);
      resetChat();
      setIsHistoryOpen(true);
      void refreshConversations();
    } catch (error) {
      appendAssistantMessage(formatAssistantError(assistantErrorCodes.conversationEnd, error));
    }
  };

  const handleDeleteConversation = async (nextConversationId: string) => {
    if (!window.confirm('이 대화 기록을 삭제할까요?')) {
      return;
    }
    setDeletingConversationId(nextConversationId);
    try {
      const result = await assistantRepository.deleteConversation(nextConversationId, deviceId);
      if (!result.deleted) {
        throw new HttpRequestError('대화 삭제에 실패했습니다.', {
          code: result.error_code || 'ASSISTANT_CONVERSATION_DELETE_REJECTED',
        });
      }
      setConversations((current) => current.filter((item) => item.conversation_id !== nextConversationId));
      setHistoryError(null);
      if (conversationId === nextConversationId) {
        setConversationId(null);
        resetChat();
      }
      void refreshConversations();
    } catch (error) {
      setHistoryError(formatAssistantError(assistantErrorCodes.conversationDelete, error));
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleLoadConversation = async (nextConversationId: string) => {
    try {
      const detail = await assistantRepository.getConversation(nextConversationId, deviceId);
      setConversationId(nextConversationId);
      setMessages(
        detail.messages.length > 0
          ? detail.messages
              .filter((message) => message.role === 'user' || message.role === 'assistant')
              .map((message) => ({
                role: message.role === 'user' ? 'user' : 'assistant',
                content: message.content,
                sources: message.sources ?? [],
                answerBlocks: normalizeAnswerBlocks(message.answer_blocks ?? message.answer_payload?.answer_blocks),
                reportDraft: normalizeReportDraft(message.report_draft ?? message.answer_payload?.report_draft),
              }))
          : [createGreetingMessage()],
      );
      setExpandedEvidenceKeys(new Set());
      setHistoryError(null);
      setIsHistoryOpen(false);
    } catch (error) {
      setHistoryError(formatAssistantError(assistantErrorCodes.conversationLoad, error));
    }
  };

  const toggleEvidence = (key: string) => {
    setExpandedEvidenceKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="fixed bottom-[8.75rem] right-3 z-[90] flex flex-col items-end gap-3 sm:bottom-32 sm:right-4 md:bottom-5 md:right-6">
      {isOpen ? (
        <section className="mb-2 flex h-[min(72dvh,460px)] w-[calc(100vw-1.5rem)] max-w-[360px] flex-col overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.62)] sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-[var(--axis-hairline)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-[var(--axis-ink)]">{uiText.dashboard.chatTitle}</h2>
                <p className="truncate text-xs text-[var(--axis-muted)]">{uiText.dashboard.chatSubtitle}</p>
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
              <ConversationHistory
                conversations={conversations}
                historyError={historyError}
                deletingConversationId={deletingConversationId}
                onLoadConversation={(nextConversationId) => void handleLoadConversation(nextConversationId)}
                onDeleteConversation={(nextConversationId) => void handleDeleteConversation(nextConversationId)}
              />
            ) : (
              <ChatMessageList
                messages={messages}
                expandedEvidenceKeys={expandedEvidenceKeys}
                onAppendMessage={(message) => setMessages((currentMessages) => [...currentMessages, message])}
                onToggleEvidence={toggleEvidence}
              />
            )}
            {isSending ? <AssistantSendingIndicator /> : null}
          </div>

          {!isHistoryOpen ? (
            <ChatComposer
              query={query}
              attachment={attachment}
              isSending={isSending}
              placeholder={uiText.dashboard.chatPlaceholder}
              onQueryChange={setQuery}
              onSend={() => void handleSend()}
              onAttachmentChange={handleAttachmentChange}
              onRemoveAttachment={() => setAttachment(null)}
            />
          ) : null}
        </section>
      ) : (
        <ChatBubblePreview isVisible={isBubbleVisible} />
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

function createGreetingMessage(): ChatMessage {
  return {
    role: 'assistant',
    content: greetingMessage,
    isGreeting: true,
  };
}
