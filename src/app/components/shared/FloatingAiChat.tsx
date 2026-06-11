import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  FileText,
  History,
  Link2,
  Loader2,
  LogOut,
  MessageSquarePlus,
  Paperclip,
  Printer,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { assistantRepository } from '../../../features/assistant/api/assistantRepository';
import type {
  AssistantAnswerBlock,
  AssistantChatResponse,
  AssistantConversationSummary,
  AssistantHistoryTurn,
  AssistantReportDraft,
  AssistantSource,
} from '../../../features/assistant/model/assistant';
import { HttpRequestError } from '../../../shared/api/httpClient';
import { uiText } from '../../../shared/content/uiText';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  sources?: AssistantSource[];
  answerBlocks?: AssistantAnswerBlock[];
  reportDraft?: AssistantReportDraft | null;
  isGreeting?: boolean;
};

type FloatingAiChatProps = {
  activeView: string;
  onNavigate: (view: string) => void;
  scrollToTopControl?: ReactNode;
};

const deviceStorageKey = 'axis:assistant-device-id';
const greetingMessage = `${uiText.dashboard.chatGreeting} `;
const genericAssistantErrorMessage = '기능에 문제가 생겼습니다.';
const assistantErrorCodes = {
  chatSend: 'ASSISTANT_CHAT_SEND_FAILED',
  chatEmptyReply: 'ASSISTANT_CHAT_EMPTY_REPLY',
  pdfChat: 'ASSISTANT_PDF_CHAT_FAILED',
  conversationList: 'ASSISTANT_CONVERSATION_LIST_FAILED',
  conversationLoad: 'ASSISTANT_CONVERSATION_LOAD_FAILED',
  conversationCreate: 'ASSISTANT_CONVERSATION_CREATE_FAILED',
  conversationEnd: 'ASSISTANT_CONVERSATION_END_FAILED',
  conversationDelete: 'ASSISTANT_CONVERSATION_DELETE_FAILED',
  pdfExport: 'ASSISTANT_PDF_EXPORT_FAILED',
} as const;

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
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: formatAssistantError(
            selectedAttachment ? assistantErrorCodes.pdfChat : assistantErrorCodes.chatSend,
            error,
          ),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentChange = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: 'PDF 파일만 첨부할 수 있습니다.' },
      ]);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: 'PDF 파일은 15MB 이하만 첨부할 수 있습니다.' },
      ]);
      return;
    }
    setAttachment(file);
  };

  const handleNewChat = async () => {
    setMessages([{ role: 'assistant', content: greetingMessage, isGreeting: true }]);
    setQuery('');
    setIsHistoryOpen(false);
    setExpandedEvidenceKeys(new Set());
    try {
      const response = await assistantRepository.createConversation(deviceId);
      setConversationId(response.conversation_id);
      setHistoryError(null);
    } catch (error) {
      setConversationId(null);
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: formatAssistantError(assistantErrorCodes.conversationCreate, error) },
      ]);
    }
  };

  const handleEndChat = async () => {
    try {
      if (conversationId) {
        await assistantRepository.endConversation(conversationId, deviceId);
      }
      setConversationId(null);
      setMessages([{ role: 'assistant', content: greetingMessage, isGreeting: true }]);
      setIsHistoryOpen(true);
      setExpandedEvidenceKeys(new Set());
      void refreshConversations();
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: formatAssistantError(assistantErrorCodes.conversationEnd, error) },
      ]);
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
        setMessages([{ role: 'assistant', content: greetingMessage, isGreeting: true }]);
        setExpandedEvidenceKeys(new Set());
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
          : [{ role: 'assistant', content: greetingMessage, isGreeting: true }],
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
    <div className="fixed bottom-20 right-4 z-[90] flex flex-col items-end gap-3 md:bottom-5 md:right-6">
      {isOpen ? (
        <section className="mb-2 flex h-[420px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.62)]">
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
              <div className="space-y-2">
                {historyError ? (
                  <p className="whitespace-pre-wrap rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.30)] bg-[var(--axis-surface)] px-3 py-2 text-xs leading-5 text-[var(--axis-accent-strong)]">
                    {historyError}
                  </p>
                ) : null}
                {conversations.map((conversation) => (
                  <div
                    key={conversation.conversation_id}
                    className="flex items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-2 py-2 transition-colors hover:border-[var(--axis-accent)]"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadConversation(conversation.conversation_id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-[var(--axis-ink)]">
                        {conversation.title || '새 대화'}
                      </p>
                      <p className="text-xs text-[var(--axis-muted)]">
                        {conversation.message_count ?? 0} messages
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteConversation(conversation.conversation_id)}
                      disabled={deletingConversationId === conversation.conversation_id}
                      className="flex size-8 shrink-0 items-center justify-center rounded-[var(--axis-radius-sm)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="대화 기록 삭제"
                    >
                      {deletingConversationId === conversation.conversation_id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                ))}
                {conversations.length === 0 ? (
                  <p className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-3 py-2 text-sm text-[var(--axis-muted)]">
                    저장된 대화가 없습니다.
                  </p>
                ) : null}
              </div>
            ) : (
              messages.map((message, index) => {
                const evidenceKey = `${message.role}-${index}`;
                const isEvidenceExpanded = expandedEvidenceKeys.has(evidenceKey);
                const hasRichContent = Boolean(message.answerBlocks?.length || message.reportDraft);
                return (
                  <div
                    key={evidenceKey}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`${hasRichContent ? 'max-w-[92%]' : 'max-w-[78%]'} rounded-[var(--axis-radius-lg)] px-3 py-2 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-[var(--axis-navy)] text-white'
                          : 'border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.answerBlocks && message.answerBlocks.length > 0 ? (
                        <AnswerBlocks blocks={message.answerBlocks} />
                      ) : null}
                      {message.reportDraft ? (
                        <ReportDraftCard
                          reportDraft={message.reportDraft}
                          onExportFailure={() => {
                            setMessages((currentMessages) => [
                              ...currentMessages,
                              { role: 'assistant', content: formatAssistantError(assistantErrorCodes.pdfExport) },
                            ]);
                          }}
                        />
                      ) : null}
                      {message.sources && message.sources.length > 0 ? (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toggleEvidence(evidenceKey)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--axis-accent-strong)] transition-colors hover:text-[var(--axis-accent)]"
                            aria-expanded={isEvidenceExpanded}
                          >
                            <span>근거 {message.sources.length}건</span>
                            <ChevronDown
                              className={`size-3 transition-transform ${isEvidenceExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isEvidenceExpanded ? (
                            <div className="mt-2 space-y-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-2">
                              {message.sources.map((source, sourceIndex) => (
                                <EvidenceSourceItem
                                  key={`${source.type}-${source.id}-${sourceIndex}`}
                                  source={source}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
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
              <label
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] transition-colors hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
                aria-label="PDF 첨부"
                title="PDF 첨부"
              >
                <Paperclip className="size-4" />
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={isSending}
                  onChange={(event) => {
                    handleAttachmentChange(event.currentTarget.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
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
            {attachment ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-1.5">
                <p className="min-w-0 truncate text-xs font-semibold text-[var(--axis-body)]">
                  {attachment.name}
                </p>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-[var(--axis-radius-sm)] text-[var(--axis-muted)] hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
                  aria-label="첨부 PDF 제거"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : null}
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

function AnswerBlocks({ blocks }: { blocks: AssistantAnswerBlock[] }) {
  const normalized = blocks
    .map((block) => ({
      title: block.title?.trim(),
      items: Array.isArray(block.items) ? block.items.filter(Boolean).slice(0, 4) : [],
    }))
    .filter((block) => block.title || block.items.length > 0);
  if (normalized.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {normalized.map((block, index) => (
        <div
          key={`${block.title ?? 'block'}-${index}`}
          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-2.5 py-2"
        >
          {block.title ? (
            <p className="text-[11px] font-bold text-[var(--axis-ink)]">{block.title}</p>
          ) : null}
          {block.items.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {block.items.map((item) => (
                <li key={item} className="break-words text-[11px] leading-4 text-[var(--axis-body)]">
                  - {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ReportDraftCard({
  reportDraft,
  onExportFailure,
}: {
  reportDraft: AssistantReportDraft;
  onExportFailure?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sections = (reportDraft.sections ?? [])
    .filter((section) => section.title || section.body)
    .slice(0, 6);
  if (!reportDraft.title && sections.length === 0) return null;

  return (
    <div className="mt-2 rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.30)] bg-[var(--axis-surface)] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <FileText className="size-3.5 text-[var(--axis-accent)]" />
          <p className="text-[11px] font-bold text-[var(--axis-accent-strong)]">보고서 초안</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!printReportDraft(reportDraft)) {
              onExportFailure?.();
            }
          }}
          className="inline-flex items-center gap-1 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] px-1.5 py-1 text-[10px] font-semibold text-[var(--axis-muted)] transition-colors hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
          aria-label="보고서 초안 PDF 저장 또는 출력"
          title="PDF 저장 또는 출력"
        >
          <Printer className="size-3" />
          PDF 저장/출력
        </button>
      </div>
      {reportDraft.title ? (
        <p className="mt-1 break-words text-sm font-semibold text-[var(--axis-ink)]">
          {reportDraft.title}
        </p>
      ) : null}
      {sections.length > 0 ? (
        <div className="mt-2 space-y-2">
          {sections.map((section, index) => (
            <section key={`${section.title ?? 'section'}-${index}`}>
              {section.title ? (
                <h3 className="text-[11px] font-bold text-[var(--axis-ink)]">{section.title}</h3>
              ) : null}
              {section.body ? (
                <p
                  className={`mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-4 text-[var(--axis-body)] ${
                    isExpanded ? '' : 'line-clamp-2'
                  }`}
                >
                  {section.body}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
      {sections.some((section) => Boolean(section.body && section.body.length > 90)) ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--axis-accent-strong)] transition-colors hover:text-[var(--axis-accent)]"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? '접기' : '자세히 보기'}</span>
          <ChevronDown className={`size-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      ) : null}
    </div>
  );
}

function printReportDraft(reportDraft: AssistantReportDraft) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(buildReportDraftPrintHtml(reportDraft));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 180);
  return true;
}

function buildReportDraftPrintHtml(reportDraft: AssistantReportDraft) {
  const title = reportDraft.title || 'AXIS 보고서 초안';
  const sections = (reportDraft.sections ?? []).filter((section) => section.title || section.body);
  const printableSections = sections.filter((section) => !/목차|구성/.test(section.title ?? ''));
  const summarySection = printableSections[0] ?? sections[0];
  const generatedAt = new Date().toLocaleString('ko-KR');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm 15mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1f1f24;
      background: #f4f1ed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 18mm 18mm;
      background: #fffdfb;
    }
    .eyebrow {
      margin: 0 0 8px;
      color: #c2411d;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: #1f1f24;
      font-size: 25px;
      line-height: 1.25;
    }
    .meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 12px;
      padding-bottom: 18px;
      border-bottom: 2px solid #e7ded4;
      color: #6f6a66;
      font-size: 11px;
    }
    .overview {
      display: grid;
      grid-template-columns: 0.9fr 1.4fr;
      gap: 14px;
      margin: 18px 0 16px;
    }
    .panel {
      border: 1px solid #e7ded4;
      background: #fff8f2;
      padding: 12px;
      page-break-inside: avoid;
    }
    .panel h2,
    .section h2 {
      margin: 0 0 8px;
      color: #c2411d;
      font-size: 14px;
      line-height: 1.35;
    }
    .toc {
      margin: 0;
      padding-left: 18px;
      color: #3f3b38;
      font-size: 11px;
      line-height: 1.7;
    }
    .summary {
      margin: 0;
      white-space: pre-wrap;
      color: #33302e;
      font-size: 12px;
      line-height: 1.65;
    }
    .section {
      border-top: 1px solid #e7ded4;
      padding: 13px 0 12px;
      page-break-inside: avoid;
    }
    .section-number {
      display: inline-block;
      min-width: 24px;
      margin-right: 6px;
      color: #8f8176;
      font-size: 11px;
      font-weight: 800;
    }
    .section-body {
      margin: 0;
      white-space: pre-wrap;
      color: #292725;
      font-size: 12.5px;
      line-height: 1.62;
    }
    .footer {
      margin-top: 18px;
      border-top: 1px solid #e7ded4;
      padding-top: 9px;
      color: #8f8176;
      font-size: 10px;
    }
    @media print {
      body { background: #fff; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <article class="page">
    <header>
      <p class="eyebrow">AXIS Report Draft</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        <span>생성 시각: ${escapeHtml(generatedAt)}</span>
        <span>본문 섹션: ${printableSections.length}개</span>
        <span>출처: AXIS 챗봇 응답</span>
      </div>
    </header>
    <div class="overview">
      <section class="panel">
        <h2>목차</h2>
        ${reportTocHtml(printableSections)}
      </section>
      <section class="panel">
        <h2>요약</h2>
        <p class="summary">${escapeHtml(summarySection?.body || '보고서 요약을 생성하지 못했습니다.')}</p>
      </section>
    </div>
    <main>
      ${printableSections.map((section, index) => reportSectionHtml(section, index)).join('')}
    </main>
    <footer class="footer">본 문서는 AXIS 챗봇이 생성한 보고서 초안입니다. 외부 공유 전 원문 근거와 수치를 확인하세요.</footer>
  </article>
</body>
</html>`;
}

function reportTocHtml(sections: Array<{ title?: string; body?: string }>) {
  if (sections.length === 0) {
    return '<p class="summary">목차를 생성하지 못했습니다.</p>';
  }
  return `
    <ol class="toc">
      ${sections.map((section) => `<li>${escapeHtml(section.title || '본문')}</li>`).join('')}
    </ol>
  `;
}

function reportSectionHtml(section: { title?: string; body?: string }, index: number) {
  return `
    <section class="section">
      <h2><span class="section-number">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(section.title || '본문')}</h2>
      <p class="section-body">${escapeHtml(section.body || '')}</p>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function EvidenceSourceItem({ source }: { source: AssistantSource }) {
  const title = source.source_title || source.title || `${source.type} ${source.id}`;
  const url = isHttpUrl(source.url) ? source.url : null;
  const meta = [
    source.source_name,
    formatEvidenceDate(source.published_at || source.report_date || source.created_at || source.updated_at),
    source.peer_id,
    source.event_type,
  ].filter(Boolean).join(' · ');

  return (
    <div className="rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-2">
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 size-3.5 shrink-0 text-[var(--axis-muted)]" />
        <div className="min-w-0 flex-1">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-2 break-words text-xs font-semibold text-[var(--axis-ink)] hover:text-[var(--axis-accent)]"
            >
              {title}
            </a>
          ) : (
            <p className="line-clamp-2 break-words text-xs font-semibold text-[var(--axis-ink)]">{title}</p>
          )}
          {meta ? (
            <p className="mt-0.5 line-clamp-1 break-words text-[10px] text-[var(--axis-muted)]">{meta}</p>
          ) : null}
          {source.snippet ? (
            <p className="mt-1 line-clamp-3 break-words text-[11px] leading-4 text-[var(--axis-body)]">
              {source.snippet}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getAssistantResponseErrorCode(response: AssistantChatResponse) {
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

function formatAssistantError(code: string, error?: unknown) {
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

function toHistory(messages: ChatMessage[]): AssistantHistoryTurn[] {
  return messages
    .filter((message) => !message.isGreeting)
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.content }));
}

function normalizeAnswerBlocks(value: unknown): AssistantAnswerBlock[] {
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

function normalizeReportDraft(value: unknown): AssistantReportDraft | null {
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

function isHttpUrl(value?: string) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function formatEvidenceDate(value?: string) {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value.slice(0, 10);
  return `${match[1]}.${match[2]}.${match[3]}`;
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
