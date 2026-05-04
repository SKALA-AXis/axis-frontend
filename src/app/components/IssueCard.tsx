import { Bookmark, ExternalLink, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { uiText } from '../../shared/content/uiText';

interface Issue {
  id: string;
  peer_id: string;
  peer_name?: string;
  title: string;
  summary_lines: string[];
  importance: 'urgent' | 'notable' | 'reference';
  event_type: 'partnership' | 'ma' | 'personnel' | 'tech' | 'regulation' | 'new_biz';
  review_status: 'pending' | 'approved' | 'needs_revision' | 'dismissed';
  bookmarked_by_me: boolean;
  created_at: string;
}

interface IssueCardProps {
  issue: Issue;
  onDelete?: () => void;
}

export function IssueCard({ issue, onDelete }: IssueCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(issue.bookmarked_by_me);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(uiText.issueCard.deleteConfirm)) {
      onDelete?.();
    }
  };

  return (
    <div className="axis-panel rounded-lg border-black/10 transition-all hover:border-[#ff7f00]/20 hover:shadow-md">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                {uiText.issueCard.eventTypeLabels[issue.event_type]}
              </span>
              <span className="text-xs text-neutral-500">
                {issue.peer_name || issue.peer_id}
              </span>
              <span className="text-xs text-neutral-400">
                · {new Date(issue.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>

            <h3 className="mb-3 cursor-pointer text-base font-bold text-black hover:text-[#d96200]">
              {issue.title}
            </h3>

            <ul className="space-y-2 mb-4">
              {issue.summary_lines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="mt-1.5 text-[#E1002A]">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm font-medium text-[#d96200] hover:text-[#E1002A]"
              >
                {isExpanded ? uiText.issueCard.collapse : uiText.issueCard.expand}
                <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
              >
                <ExternalLink size={14} />
                {uiText.issueCard.viewSource}
              </button>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 sm:justify-end">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="동향 카드 삭제"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-[#ff7f00]/12 text-[#d96200]'
                  : 'text-neutral-400 hover:bg-[#fff5ea] hover:text-neutral-700'
              }`}
              aria-label="북마크"
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-black mb-3">{uiText.issueCard.detailTitle}</h4>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
                  {uiText.issueCard.detailParagraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm text-neutral-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">{uiText.issueCard.implicationTitle}</h4>
                <div className="rounded-lg border border-[#ff7f00]/18 bg-[#ff7f00]/6 p-4 space-y-2">
                  {uiText.issueCard.implications.map((item) => (
                    <p key={item} className="text-sm text-neutral-700">{item}</p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">{uiText.issueCard.evidenceTitle}</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {uiText.issueCard.evidenceCards.map((card) => (
                    <div key={card.title} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                      <p className="text-sm font-medium text-black">{card.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{card.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">{uiText.issueCard.actionTitle}</h4>
                <div className="space-y-2">
                  {uiText.issueCard.actions.map((action) => (
                    <div key={action.title} className="bg-white border border-neutral-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-black mb-1">{action.title}</p>
                      <p className="text-sm text-neutral-600">{action.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">{uiText.issueCard.sourceTitle}</h4>
                <div className="space-y-2">
                  {uiText.issueCard.sources.map((source) => (
                    <a key={source.title} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-[#ff7f00]">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black">{source.title}</p>
                        <p className="text-xs text-neutral-500 mt-1">{source.meta}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
