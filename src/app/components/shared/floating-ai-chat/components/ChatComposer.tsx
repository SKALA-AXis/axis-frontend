import { Loader2, Paperclip, Send, X } from 'lucide-react';

type ChatComposerProps = {
  query: string;
  attachment: File | null;
  isSending: boolean;
  placeholder: string;
  onQueryChange: (query: string) => void;
  onSend: () => void;
  onAttachmentChange: (file: File | undefined) => void;
  onRemoveAttachment: () => void;
};

export function ChatComposer({
  query,
  attachment,
  isSending,
  placeholder,
  onQueryChange,
  onSend,
  onAttachmentChange,
  onRemoveAttachment,
}: ChatComposerProps) {
  return (
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
              onAttachmentChange(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSend();
            }
          }}
          placeholder={placeholder}
          disabled={isSending}
          className="min-w-0 flex-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-ink)] outline-none transition placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)]"
        />
        <button
          type="button"
          onClick={onSend}
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
            onClick={onRemoveAttachment}
            className="flex size-6 shrink-0 items-center justify-center rounded-[var(--axis-radius-sm)] text-[var(--axis-muted)] hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
            aria-label="첨부 PDF 제거"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
