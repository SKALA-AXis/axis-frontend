import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
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
  AssistantConversationSummary,
  AssistantHandoff,
  AssistantHistoryTurn,
  AssistantReportDraft,
  AssistantSource,
} from '../../../features/assistant/model/assistant';
import { uiText } from '../../../shared/content/uiText';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  handoff?: AssistantHandoff | null;
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

export function FloatingAiChat({ activeView, onNavigate, scrollToTopControl }: FloatingAiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
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
    assistantRepository.listConversations(deviceId)
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [deviceId, isOpen]);

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
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: response.reply || response.message?.content || '답변을 생성하지 못했습니다.',
          handoff: response.handoff ?? null,
          sources: response.sources ?? [],
          answerBlocks: normalizeAnswerBlocks(response.answer_blocks),
          reportDraft: normalizeReportDraft(response.report_draft),
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
    setExpandedEvidenceKeys(new Set());
    assistantRepository.listConversations(deviceId)
      .then(setConversations)
      .catch(() => setConversations([]));
  };

  const handleDeleteConversation = async (nextConversationId: string) => {
    if (!window.confirm('이 대화 기록을 삭제할까요?')) {
      return;
    }
    await assistantRepository.deleteConversation(nextConversationId, deviceId);
    setConversations((current) => current.filter((item) => item.conversation_id !== nextConversationId));
    if (conversationId === nextConversationId) {
      setConversationId(null);
      setMessages([{ role: 'assistant', content: greetingMessage, isGreeting: true }]);
      setExpandedEvidenceKeys(new Set());
    }
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
              answerBlocks: normalizeAnswerBlocks(message.answer_blocks ?? message.answer_payload?.answer_blocks),
              reportDraft: normalizeReportDraft(message.report_draft ?? message.answer_payload?.report_draft),
            }))
        : [{ role: 'assistant', content: greetingMessage, isGreeting: true }],
    );
    setExpandedEvidenceKeys(new Set());
    setIsHistoryOpen(false);
  };

  const handleHandoff = (handoff: AssistantHandoff) => {
    onNavigate(routeToView(handoff.target_route));
    setIsOpen(false);
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
                      className="flex size-8 shrink-0 items-center justify-center rounded-[var(--axis-radius-sm)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-accent-strong)]"
                      aria-label="대화 기록 삭제"
                    >
                      <Trash2 className="size-3.5" />
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
                        <ReportDraftCard reportDraft={message.reportDraft} />
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

function ReportDraftCard({ reportDraft }: { reportDraft: AssistantReportDraft }) {
  const sections = (reportDraft.sections ?? [])
    .filter((section) => section.title || section.body)
    .slice(0, 4);
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
          onClick={() => printReportDraft(reportDraft)}
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
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-4 text-[var(--axis-body)]">
                  {section.body}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function printReportDraft(reportDraft: AssistantReportDraft) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    window.alert('인쇄 창을 열지 못했습니다.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildReportDraftPrintHtml(reportDraft));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 180);
}

function buildReportDraftPrintHtml(reportDraft: AssistantReportDraft) {
  const title = reportDraft.title || 'AXIS 보고서 초안';
  const sections = (reportDraft.sections ?? []).filter((section) => section.title || section.body);
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 40px; color: #1f1f24; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 24px; font-size: 28px; line-height: 1.25; }
    section { border-top: 1px solid #e7ded4; padding: 20px 0; }
    h2 { margin: 0 0 10px; font-size: 16px; color: #c2411d; }
    p { margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.7; }
    @media print { body { margin: 24mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${sections.map((section) => `
    <section>
      ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ''}
      ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ''}
    </section>
  `).join('')}
</body>
</html>`;
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
