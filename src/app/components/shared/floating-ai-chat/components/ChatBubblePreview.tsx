type ChatBubblePreviewProps = {
  isVisible: boolean;
};

export function ChatBubblePreview({ isVisible }: ChatBubblePreviewProps) {
  return (
    <div
      className={`pointer-events-none hidden w-56 rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4 shadow-[0_18px_54px_-34px_rgba(0,0,0,0.52)] transition-all duration-200 sm:block ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-base font-bold text-[var(--axis-ink)]">AXIS</p>
        <span className="text-xl leading-none text-[var(--axis-muted)]">×</span>
      </div>
      <p className="text-sm leading-relaxed text-[var(--axis-body)]">
        안녕하세요. 오늘의 전략 신호를 함께 정리해드릴게요.
      </p>
    </div>
  );
}
