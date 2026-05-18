/**
 * 카드/노드 위에 호버 시 펼쳐지는 작은 인사이트 텍스트 버블.
 *
 * 부모 요소가 `group` 클래스를 가져야 hover/focus 동작 함.
 * 카드 본문 위에 absolute 로 떠 있는 형태 — inset-x-3 bottom-3 기준.
 */
export function InsightRevealBubble({ text }: { text: string }) {
  return (
    <span
      data-hover-reveal
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 max-h-24 translate-y-2 overflow-y-auto rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--axis-ink)] opacity-0 shadow-[0_18px_48px_-30px_rgba(0,0,0,0.45)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      {text}
    </span>
  );
}
