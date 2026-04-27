import { Link, Plus, Search, X } from 'lucide-react';
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
  const [manualIssues, setManualIssues] = useState<IssueCardViewModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeer, setSelectedPeer] = useState('all');
  const [selectedImportance, setSelectedImportance] = useState('all');
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');

  const issues = useMemo(
    () => [...manualIssues, ...fetchedIssues.map(mapDomainIssueToViewModel)],
    [fetchedIssues, manualIssues]
  );

  const filteredIssues = issues.filter((issue) => {
    const matchesPeer = selectedPeer === 'all' || issue.peer_id === selectedPeer;
    const matchesImportance = selectedImportance === 'all' || issue.importance === selectedImportance;
    const matchesSearch =
      searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary_lines.some((line) => line.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPeer && matchesImportance && matchesSearch;
  });

  const peers = [
    { id: 'all', name: '전체' },
    { id: 'samsung_sds', name: '삼성SDS' },
    { id: 'lg_cns', name: 'LG CNS' },
    { id: 'hyundai_autoever', name: '현대오토에버' },
    { id: 'naver_cloud', name: '네이버클라우드' },
    { id: 'kakao_enterprise', name: 'Kakao Enterprise' },
  ];

  const importanceOptions = [
    { value: 'all', label: '전체' },
    { value: 'urgent', label: '우선 검토' },
    { value: 'notable', label: '관찰 필요' },
    { value: 'reference', label: '배경 참고' },
  ];

  const handleAddIssue = () => {
    const trimmedUrl = sourceUrl.trim();

    if (!trimmedUrl) {
      return;
    }

    const newIssue: IssueCardViewModel = {
      id: `IC-MANUAL-${Date.now()}`,
      peer_id: 'manual',
      peer_name: uiText.issues.manualPeer,
      title: uiText.issues.manualTitle,
      summary_lines: [
        uiText.issues.manualSummaryOne,
        uiText.issues.manualSummaryTwo,
        trimmedUrl,
      ],
      importance: 'reference',
      event_type: 'tech',
      review_status: 'pending',
      bookmarked_by_me: false,
      created_at: new Date().toISOString(),
    };

    setManualIssues((currentIssues) => [newIssue, ...currentIssues]);
    setSourceUrl('');
    setIsAddPanelOpen(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">{uiText.issues.pageTitle}</h1>
          <p className="text-neutral-600">{uiText.issues.pageSubtitle}</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={uiText.issues.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
            <button
              onClick={() => setIsAddPanelOpen(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              {uiText.issues.addTrend}
            </button>
          </div>

          {isAddPanelOpen && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-black">{uiText.issues.addTrendTitle}</h2>
                </div>
                <button
                  onClick={() => setIsAddPanelOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-white hover:text-black"
                  aria-label="동향 추가 패널 닫기"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleAddIssue();
                      }
                    }}
                    placeholder={uiText.issues.addUrlPlaceholder}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <Link size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
                <button
                  onClick={handleAddIssue}
                  disabled={!sourceUrl.trim()}
                  className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {uiText.issues.addAction}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex gap-2">
              <span className="text-sm text-neutral-600 py-2">{uiText.issues.peerFilter}</span>
              <div className="flex gap-2">
                {peers.map((peer) => (
                  <button
                    key={peer.id}
                    onClick={() => setSelectedPeer(peer.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeer === peer.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {peer.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-neutral-600 py-2">{uiText.issues.reviewLevelFilter}</span>
              <div className="flex gap-2">
                {importanceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedImportance(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedImportance === option.value
                        ? 'bg-orange-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {uiText.issues.loadFallback}
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
              {uiText.issues.loading}
            </div>
          )}

          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onDelete={
                  issue.peer_id === 'manual'
                    ? () => setManualIssues((currentIssues) => currentIssues.filter((currentIssue) => currentIssue.id !== issue.id))
                    : undefined
                }
              />
            ))
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
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
