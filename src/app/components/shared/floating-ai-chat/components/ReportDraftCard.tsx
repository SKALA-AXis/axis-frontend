import { useState } from 'react';
import { ChevronDown, FileText, Printer } from 'lucide-react';
import type { AssistantReportDraft } from '../../../../../features/assistant/model/assistant';
import { printReportDraft } from '../reportDraftPrint';

type ReportDraftCardProps = {
  reportDraft: AssistantReportDraft;
  onExportFailure?: () => void;
};

export function ReportDraftCard({ reportDraft, onExportFailure }: ReportDraftCardProps) {
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
