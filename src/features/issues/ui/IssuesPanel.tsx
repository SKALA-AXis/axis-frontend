import type { Issue } from '../../../entities/issue/model';
import { useIssues } from '../hooks/useIssues';

const badgeTone: Record<Issue['importance'], string> = {
  urgent: 'bg-red-100 text-red-700',
  notable: 'bg-orange-100 text-orange-700',
  reference: 'bg-neutral-200 text-neutral-700',
};

const badgeLabel: Record<Issue['importance'], string> = {
  urgent: '긴급',
  notable: '주목',
  reference: '참고',
};

export function IssuesPanel() {
  const { issues, isLoading, error } = useIssues();

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Feature</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-950">Issue Feed</h2>
        </div>
        <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
          repository to hook to ui
        </div>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">이슈를 불러오는 중입니다.</p>}
      {error && <p className="text-sm text-red-600">불러오기에 실패했습니다: {error}</p>}

      <div className="space-y-4">
        {issues.map((issue) => (
          <article key={issue.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-600">
                {issue.peerName}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeTone[issue.importance]}`}>
                {badgeLabel[issue.importance]}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-950">{issue.title}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
              {issue.summaryLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
