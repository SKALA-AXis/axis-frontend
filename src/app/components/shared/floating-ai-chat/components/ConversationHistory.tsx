import { Loader2, Trash2 } from 'lucide-react';
import type { AssistantConversationSummary } from '../../../../../features/assistant/model/assistant';

type ConversationHistoryProps = {
  conversations: AssistantConversationSummary[];
  historyError: string | null;
  deletingConversationId: string | null;
  onLoadConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
};

export function ConversationHistory({
  conversations,
  historyError,
  deletingConversationId,
  onLoadConversation,
  onDeleteConversation,
}: ConversationHistoryProps) {
  return (
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
            onClick={() => onLoadConversation(conversation.conversation_id)}
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
            onClick={() => onDeleteConversation(conversation.conversation_id)}
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
  );
}
