import { useMemo, useState } from 'react';
import type { Issue as DomainIssue } from '../../entities/issue/model';
import { useIssues } from '../../features/issues/hooks/useIssues';
import { uiText } from '../../shared/content/uiText';
import { IssueCard } from './IssueCard';

type IssueCardViewModel = {
  id: string;
  peer_id: string;
  peer_name: string;
  title: string;
  summary_lines: string[];
  importance: 'urgent' | 'notable' | 'reference';
  event_type: 'partnership' | 'ma' | 'personnel' | 'tech' | 'regulation' | 'new_biz';
  review_status: 'pending' | 'approved' | 'needs_revision' | 'dismissed';
  bookmarked_by_me: boolean;
  created_at: string;
};

interface IssuesViewProps {
  onNavigate: (view: string) => void;
}

export function IssuesView({ onNavigate: _onNavigate }: IssuesViewProps) {
  const { issues: fetchedIssues, isLoading, error } = useIssues();
  const [selectedPeer, setSelectedPeer] = useState('all');

  const issues = useMemo(() => fetchedIssues.map(mapDomainIssueToViewModel), [fetchedIssues]);

  const filteredIssues = issues.filter((issue) => {
    const matchesPeer = selectedPeer === 'all' || issue.peer_id === selectedPeer;
    return matchesPeer;
  });

  const peers = [
    { id: 'all', name: '전체' },
    { id: 'samsung_sds', name: '삼성 SDS' },
    { id: 'lg_cns', name: 'LG CNS' },
    { id: 'hyundai_autoever', name: '현대 오토에버' },
    { id: 'posco_dx', name: '포스코 DX' },
  ];

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="axis-page-header">
          <h1 className="axis-page-title">{uiText.issues.pageTitle}</h1>
          <p className="axis-page-subtitle">{uiText.issues.pageSubtitle}</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="flex flex-col gap-2 sm:flex-row">
              <span className="text-sm text-neutral-600 py-2">{uiText.issues.peerFilter}</span>
              <div className="flex flex-wrap gap-2">
                {peers.map((peer) => (
                  <button
                    key={peer.id}
                    onClick={() => setSelectedPeer(peer.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedPeer === peer.id
                        ? 'bg-[#ff7f00] text-white'
                        : 'axis-glass text-black/70 hover:bg-white/80'
                    }`}
                  >
                    {peer.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700">
              {uiText.issues.loadFallback}
            </div>
          )}

          {isLoading && (
            <div className="axis-panel rounded-xl p-4 text-sm text-neutral-500">
              {uiText.issues.loading}
            </div>
          )}

          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
              />
            ))
          ) : (
            <div className="axis-panel rounded-xl p-8 text-center sm:p-12">
              <p className="text-neutral-500">{uiText.issues.empty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapDomainIssueToViewModel(issue: DomainIssue): IssueCardViewModel {
  return {
    id: issue.id,
    peer_id: issue.peerId,
    peer_name: issue.peerName,
    title: issue.title,
    summary_lines: issue.summaryLines,
    importance: issue.importance,
    event_type: 'tech',
    review_status: 'approved',
    bookmarked_by_me: false,
    created_at: issue.createdAt,
  };
}
