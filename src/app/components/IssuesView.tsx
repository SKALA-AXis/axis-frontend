import { Download, Link, Plus, Search, X } from 'lucide-react';
import { IssueCard } from './IssueCard';
import { useState } from 'react';

type Issue = {
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

const mockIssues: Issue[] = [
  {
    id: 'IC-20260422-001',
    peer_id: 'samsung_sds',
    peer_name: '삼성SDS',
    title: '생성형 AI 운영 플랫폼을 제조/금융 레퍼런스로 확장',
    summary_lines: [
      '대기업 고객의 업무 프로세스에 생성형 AI를 내재화하는 운영 플랫폼 메시지 강화',
      '제조, 금융 고객 레퍼런스를 전면에 내세워 산업별 AX 사업 경쟁 구도에 영향',
      'SK AX 관점에서는 Agentic AI 시나리오와 산업 특화 레퍼런스 확보 전략 점검 필요',
    ],
    importance: 'urgent',
    event_type: 'partnership',
    review_status: 'pending',
    bookmarked_by_me: false,
    created_at: '2026-04-22T08:30:00Z',
  },
  {
    id: 'IC-20260422-002',
    peer_id: 'lg_cns',
    peer_name: 'LG CNS',
    title: '금융권 대상 AI+클라우드 보안 패키지 출시',
    summary_lines: [
      'AI 기반 위협 탐지, 권한 통제, 감사 로그를 하나의 패키지로 구성',
      '규제 대응 부담이 큰 금융권을 AX 전환의 우선 공략 시장으로 설정',
      'SK AX 금융 고객 제안서에 보안/거버넌스 메시지를 강화할 필요',
    ],
    importance: 'notable',
    event_type: 'tech',
    review_status: 'pending',
    bookmarked_by_me: false,
    created_at: '2026-04-22T07:15:00Z',
  },
  {
    id: 'IC-20260422-003',
    peer_id: 'hyundai_autoever',
    peer_name: '현대오토에버',
    title: 'SDV 데이터 플랫폼 외부 고객 적용 사례 공개',
    summary_lines: [
      '차량 데이터 수집, 분석, OTA 운영을 통합한 플랫폼 사례 공개',
      '자동차 SW 역량을 제조 데이터 플랫폼 사업으로 확장하는 흐름',
      'SK AX의 제조/모빌리티 AX 포트폴리오와 차별화 포인트 비교 필요',
    ],
    importance: 'notable',
    event_type: 'new_biz',
    review_status: 'approved',
    bookmarked_by_me: true,
    created_at: '2026-04-21T16:45:00Z',
  },
  {
    id: 'IC-20260422-004',
    peer_id: 'naver_cloud',
    peer_name: '네이버클라우드',
    title: '공공기관 전용 Sovereign AI 인프라 패키지 확대',
    summary_lines: [
      '공공 데이터 반출 제한과 보안 요건을 반영한 전용 클라우드 상품 강화',
      '국내 AI 모델, 검색, 클라우드 인프라를 결합해 공공 AX 수요 공략',
    ],
    importance: 'reference',
    event_type: 'tech',
    review_status: 'approved',
    bookmarked_by_me: false,
    created_at: '2026-04-20T14:20:00Z',
  },
  {
    id: 'IC-20260422-005',
    peer_id: 'kakao_enterprise',
    peer_name: 'Kakao Enterprise',
    title: '업무 협업툴 내 AI 비서 기능 베타 서비스 시작',
    summary_lines: [
      '사내 문서 검색, 회의록 요약, 일정 추천을 협업툴 안에서 제공',
      '중견/중소기업의 빠른 AI 도입 수요를 낮은 진입 비용으로 공략',
      'SK AX는 대기업/그룹사 업무 혁신 영역에서 고도화된 통합 운영 메시지 필요',
    ],
    importance: 'notable',
    event_type: 'tech',
    review_status: 'pending',
    bookmarked_by_me: false,
    created_at: '2026-04-20T11:30:00Z',
  },
];

interface IssuesViewProps {
  onNavigate: (view: string) => void;
}

export function IssuesView({ onNavigate }: IssuesViewProps) {
  const [issues, setIssues] = useState(mockIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeer, setSelectedPeer] = useState('all');
  const [selectedImportance, setSelectedImportance] = useState('all');
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');

  const filteredIssues = issues.filter((issue) => {
    const matchesPeer = selectedPeer === 'all' || issue.peer_id === selectedPeer;
    const matchesImportance = selectedImportance === 'all' || issue.importance === selectedImportance;
    const matchesSearch = searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary_lines.some(line => line.toLowerCase().includes(searchQuery.toLowerCase()));
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
    { value: 'urgent', label: '긴급' },
    { value: 'notable', label: '주목' },
    { value: 'reference', label: '참고' },
  ];

  const handleAddIssue = () => {
    const trimmedUrl = sourceUrl.trim();

    if (!trimmedUrl) {
      return;
    }

    const newIssue: Issue = {
      id: `IC-MANUAL-${Date.now()}`,
      peer_id: 'manual',
      peer_name: '사용자 추가',
      title: '원문 링크 기반 이슈 분석 대기',
      summary_lines: [
        '사용자가 직접 추가한 원문 링크입니다.',
        'AI 분석이 완료되면 Peer사, 중요도, 요약 내용이 자동으로 업데이트됩니다.',
        trimmedUrl,
      ],
      importance: 'reference',
      event_type: 'tech',
      review_status: 'pending',
      bookmarked_by_me: false,
      created_at: new Date().toISOString(),
    };

    setIssues((currentIssues) => [newIssue, ...currentIssues]);
    setSourceUrl('');
    setIsAddPanelOpen(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">이슈 카드</h1>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="이슈 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2 text-neutral-700 font-medium"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={() => setIsAddPanelOpen(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              이슈 추가
            </button>
          </div>

          {isAddPanelOpen && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-black">이슈 추가</h2>
                </div>
                <button
                  onClick={() => setIsAddPanelOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-white hover:text-black"
                  aria-label="이슈 추가 패널 닫기"
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
                    placeholder="https://example.com/news/original-source"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-11 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <Link size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
                <button
                  onClick={handleAddIssue}
                  disabled={!sourceUrl.trim()}
                  className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex gap-2">
              <span className="text-sm text-neutral-600 py-2">Peer사:</span>
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
              <span className="text-sm text-neutral-600 py-2">중요도:</span>
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
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onDelete={
                  issue.peer_id === 'manual'
                    ? () => setIssues((currentIssues) => currentIssues.filter((currentIssue) => currentIssue.id !== issue.id))
                    : undefined
                }
              />
            ))
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
              <p className="text-neutral-500">필터 조건에 맞는 이슈가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
