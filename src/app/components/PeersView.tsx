import { Calendar, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { IssueCard } from './IssueCard';

type Peer = {
  id: string;
  name: string;
  keywords: string[];
  priority: 'high' | 'medium';
  stats: {
    urgent: number;
    notable: number;
    reference: number;
  };
  direction: string;
  implication: string;
};

const mockPeers: Peer[] = [
  {
    id: 'samsung_sds',
    name: '삼성SDS',
    keywords: ['Agentic AI', '제조 AX', '운영 플랫폼'],
    priority: 'high',
    stats: { urgent: 3, notable: 8, reference: 12 },
    direction: '생성형 AI를 산업별 운영 플랫폼으로 패키지화',
    implication: 'SK AX는 컨설팅-구축-운영까지 이어지는 AX 실행력과 산업별 성과 지표를 더 강하게 보여줄 필요가 있습니다.',
  },
  {
    id: 'lg_cns',
    name: 'LG CNS',
    keywords: ['금융', '보안', '클라우드'],
    priority: 'high',
    stats: { urgent: 1, notable: 6, reference: 9 },
    direction: '규제 산업의 보안/컴플라이언스 부담을 AX 진입점으로 활용',
    implication: '금융/공공 제안에서는 AI 거버넌스, 감사 대응, 보안 운영 모델을 핵심 메시지로 끌어올리는 편이 좋습니다.',
  },
  {
    id: 'hyundai_autoever',
    name: '현대오토에버',
    keywords: ['SDV', '제조 데이터', '모빌리티'],
    priority: 'medium',
    stats: { urgent: 2, notable: 5, reference: 7 },
    direction: '자동차 SW 역량을 제조 데이터 플랫폼 사업으로 확장',
    implication: 'SK AX의 제조 AX 메시지는 설비/공정 최적화뿐 아니라 데이터 운영 플랫폼 관점까지 넓힐 필요가 있습니다.',
  },
];

const mockPeerIssues = [
  {
    id: 'IC-001',
    peer_id: 'samsung_sds',
    peer_name: '삼성SDS',
    title: '생성형 AI 운영 플랫폼을 제조/금융 레퍼런스로 확장',
    summary_lines: ['대기업 고객의 업무 프로세스에 AI를 내재화하는 운영 플랫폼 메시지 강화'],
    importance: 'urgent' as const,
    event_type: 'partnership' as const,
    review_status: 'pending' as const,
    bookmarked_by_me: false,
    created_at: '2026-04-22T08:30:00Z',
  },
];

interface PeersViewProps {
  onNavigate: (view: string) => void;
}

export function PeersView({ onNavigate }: PeersViewProps) {
  const [peers, setPeers] = useState<Peer[]>(mockPeers);
  const [selectedPeer, setSelectedPeer] = useState<Peer>(mockPeers[0]);
  const [isAddingPeer, setIsAddingPeer] = useState(false);
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerKeywords, setNewPeerKeywords] = useState('');
  const selectedPeerIssues = mockPeerIssues.filter((issue) => issue.peer_id === selectedPeer.id);

  const handleAddPeer = () => {
    const name = newPeerName.trim();
    if (!name) {
      return;
    }

    const addedPeer: Peer = {
      id: `${name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '_')}_${Date.now()}`,
      name,
      keywords: newPeerKeywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .slice(0, 4),
      priority: 'medium',
      stats: { urgent: 0, notable: 0, reference: 0 },
      direction: 'AI Agent 분석 대기 중입니다. 뉴스 수집이 완료되면 Peer사의 동향이 자동 요약됩니다.',
      implication: 'AI Agent 분석 대기 중입니다. SK AX 관점의 시사점은 수집 데이터와 내부 기준을 바탕으로 생성됩니다.',
    };

    setPeers((current) => [...current, addedPeer]);
    setSelectedPeer(addedPeer);
    setNewPeerName('');
    setNewPeerKeywords('');
    setIsAddingPeer(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Peer사 분석</h1>
          <p className="text-neutral-600">경쟁사별 동향 방향, SK AX 영향도, 후속 모니터링 포인트</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-black">Peer사 목록</h2>
                <button
                  onClick={() => setIsAddingPeer(true)}
                  className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700"
                >
                  <Plus size={14} />
                  추가
                </button>
              </div>

              {isAddingPeer && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-black">Peer사 추가</p>
                    <button
                      onClick={() => setIsAddingPeer(false)}
                      className="rounded p-1 text-neutral-500 hover:bg-white hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      value={newPeerName}
                      onChange={(e) => setNewPeerName(e.target.value)}
                      placeholder="회사명"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      value={newPeerKeywords}
                      onChange={(e) => setNewPeerKeywords(e.target.value)}
                      placeholder="모니터링 키워드, 쉼표로 구분"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={handleAddPeer}
                      disabled={!newPeerName.trim()}
                      className="w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      등록
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {peers.map((peer) => (
                  <button
                    key={peer.id}
                    onClick={() => setSelectedPeer(peer)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPeer.id === peer.id
                        ? 'bg-orange-100 border border-orange-300'
                        : 'border border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-black">{peer.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        peer.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {peer.priority === 'high' ? '높음' : '중간'}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs text-neutral-600">
                      <span>긴급 {peer.stats.urgent}</span>
                      <span>주목 {peer.stats.notable}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-9 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-2">{selectedPeer.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedPeer.keywords.map((keyword) => (
                      <span key={keyword} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('settings')}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm"
                >
                  설정 수정
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-600 mb-1">긴급 이슈</p>
                  <p className="text-2xl font-bold text-black">{selectedPeer.stats.urgent}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-600 mb-1">주목 이슈</p>
                  <p className="text-2xl font-bold text-black">{selectedPeer.stats.notable}</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-600 mb-1">참고 이슈</p>
                  <p className="text-2xl font-bold text-black">{selectedPeer.stats.reference}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="mb-2 text-sm font-bold text-black">관찰된 동향</p>
                  <p className="text-sm leading-relaxed text-neutral-700">{selectedPeer.direction}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="mb-2 text-sm font-bold text-black">SK AX 관점</p>
                  <p className="text-sm leading-relaxed text-neutral-700">{selectedPeer.implication}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar size={20} className="text-orange-600" />
                <h2 className="text-lg font-bold text-black">이슈 타임라인</h2>
              </div>

              <div className="space-y-4">
                {selectedPeerIssues.length > 0 ? (
                  selectedPeerIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
                ) : (
                  <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                    <p className="text-sm font-medium text-black">아직 수집된 이슈가 없습니다.</p>
                    <p className="mt-2 text-sm text-neutral-600">
                      신규 Peer사는 기사 수집과 분석이 완료되면 이슈 타임라인이 채워집니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
