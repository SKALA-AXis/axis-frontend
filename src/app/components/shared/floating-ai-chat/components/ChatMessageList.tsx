import { ChevronDown, Loader2 } from 'lucide-react';
import { assistantErrorCodes } from '../constants';
import type { ChatMessage } from '../types';
import { formatAssistantError } from '../utils';
import { AnswerBlocks } from './AnswerBlocks';
import { EvidenceSourceItem } from './EvidenceSourceItem';
import { ReportDraftCard } from './ReportDraftCard';

type ChatMessageListProps = {
  messages: ChatMessage[];
  expandedEvidenceKeys: Set<string>;
  onAppendMessage: (message: ChatMessage) => void;
  onToggleEvidence: (key: string) => void;
};

export function ChatMessageList({
  messages,
  expandedEvidenceKeys,
  onAppendMessage,
  onToggleEvidence,
}: ChatMessageListProps) {
  return (
    <>
      {messages.map((message, index) => {
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
                    onAppendMessage({
                      role: 'assistant',
                      content: formatAssistantError(assistantErrorCodes.pdfExport),
                    });
                  }}
                />
              ) : null}
              {message.sources && message.sources.length > 0 ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => onToggleEvidence(evidenceKey)}
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
      })}
    </>
  );
}

export function AssistantSendingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-muted)]">
        <Loader2 className="size-4 animate-spin" />
        답변 생성 중
      </div>
    </div>
  );
}
