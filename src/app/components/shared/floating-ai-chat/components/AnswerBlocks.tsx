/*
 * 작성일: 2026-06-11
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-11 안가은 — 채팅 구조 정리 리팩터링으로 답변 블록 컴포넌트 추가
 */
import type { AssistantAnswerBlock } from '../../../../../features/assistant/model/assistant';

type AnswerBlocksProps = {
  blocks: AssistantAnswerBlock[];
};

export function AnswerBlocks({ blocks }: AnswerBlocksProps) {
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
