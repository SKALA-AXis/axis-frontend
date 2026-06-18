/*
 * 작성일: 2026-06-11
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-11 안가은 — 채팅 구조 정리 리팩터링으로 근거 출처 항목 컴포넌트 추가
 */
import { Link2 } from 'lucide-react';
import type { AssistantSource } from '../../../../../features/assistant/model/assistant';
import { formatEvidenceDate, isHttpUrl } from '../utils';

type EvidenceSourceItemProps = {
  source: AssistantSource;
};

export function EvidenceSourceItem({ source }: EvidenceSourceItemProps) {
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
