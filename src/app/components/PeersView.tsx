import { BarChart3, Building2, Plus, X } from 'lucide-react';
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

const peerIrAnalyses = {
  samsung_sds: {
    source: '2026 IR 전략 자료',
    title: 'AI Full Stack 중심의 사업 전환',
    summary:
      '삼성SDS는 클라우드/디지털 포워딩 기반에서 AI 인프라, AX·AI 서비스, AI 플랫폼/솔루션, Inorganic 성장/신사업을 축으로 Global AX Company 2031 비전을 제시하고 있습니다.',
    highlightsTitle: '2031 전략 방향',
    highlights: [
      '클라우드와 MSP 역량을 AI 인프라 사업으로 확장',
      '업종 특화 Agent 중심의 AX·AI 서비스 전환',
      'AI Orchestrator, Data Control Plane 등 플랫폼/솔루션 고도화',
      '지역 거점, 로봇, 디지털 자산, AI 데이터 플랫폼 등 신시장 진입',
    ],
    pillars: [
      {
        name: 'AI 인프라',
        headline: 'AI/클라우드 포트폴리오 확장',
        details: ['GPUaaS/NPUaaS', '글로벌 CSP 연계', '소버린 AI 클라우드', '직접 투자 및 DC DBO'],
      },
      {
        name: 'AX·AI 서비스',
        headline: '업종 특화 Agent 중심 AI 전환',
        details: ['Vertical AI Agent', 'AX 전담 조직 고객 AX 리드', '하이테크·금융·공공/기업 공략', 'AI Native 개발 체계'],
      },
      {
        name: 'AI 플랫폼/솔루션',
        headline: '플랫폼 강화와 글로벌 생태계 협력',
        details: ['AI Orchestrator', 'Data Control Plane', 'OpenAI·NVIDIA 협력', 'SAP·Salesforce·Workday 등 솔루션 AX 확대'],
      },
      {
        name: 'Inorganic 성장/신사업',
        headline: '시장 확대와 역량 강화',
        details: ['미주·아시아 지역 거점 구축', '로봇·디지털 자산 포트폴리오', 'AI/데이터 플랫폼', 'AIOps/MLOps 내재화'],
      },
    ],
  },
  lg_cns: {
    source: '2025년 상반기 IR 자료',
    title: '투자 영역과 누적 투자 현황',
    summary:
      'LG CNS는 AI & Enterprise S/W, Bio & Healthcare, Clean Tech & Sustainability를 중심으로 전략 투자를 확대하고 있으며, 2025년 상반기 누적 투자 금액은 6,776억 원으로 제시되어 있습니다.',
    highlightsTitle: '주요 내용',
    highlights: [
      '2025년 상반기 누적 투자 6,776억 원',
      'A영역 70.1%, C영역 21.4%, 기타 4.8%, B영역 3.7% 비중',
      '최근 5개년 누적 투자 추이: 1,082억 → 1,404억 → 2,818억 → 6,310억 → 6,776억',
      'AI 최적화 스토리지, 보안 인식 자동화, 모빌리티, 클린테크 발굴에 투자',
    ],
    pillars: [
      {
        name: 'AI & Enterprise S/W',
        headline: '통신·서비스·전자 중심 투자',
        details: ['Vast Data: AI 최적화 스토리지 S/W', 'Vista Fund: 보안 인식 자동화 S/W 등', '누적 2,332억 원 규모'],
      },
      {
        name: 'Bio & Healthcare',
        headline: '화학·전자 연계 바이오 투자',
        details: ['Cartography Bio: 항체 기반 면역 치료제 개발', 'Medic Life Science: 암 치료제 개발', '누적 144억 원 규모'],
      },
      {
        name: 'Clean Tech & Sustainability',
        headline: '화학·전자·통신서비스 확장',
        details: ['카카오모빌리티: 모빌리티 분야 협력', 'General Atlantic Fund: Cleantech 기업 발굴/투자', '누적 1,451억 원 규모'],
      },
      {
        name: '투자 현황',
        headline: 'A영역 중심 포트폴리오',
        details: ['A영역 70.1%', 'C영역 21.4%', '기타 4.8%', 'B영역 3.7%'],
      },
    ],
  },
  hyundai_autoever: {
    source: '2025년 실적 전망 IR 자료',
    title: '2025년 매출 성장 요인',
    summary:
      '현대오토에버는 2025년 실적 전망에서 SI, ITO, 차량 SW 매출 증가와 환율 상승 효과를 주요 매출 성장 요인으로 제시하고 있습니다.',
    highlightsTitle: '매출 성장률',
    highlights: [
      '2024년 5,051억 원 → 2025년 6,604억 원, +30.7%',
      '2024년 2,067억 원 → 2025년 3,383억 원, +63.6%',
      '2024년 681억 원 → 2025년 975억 원, +43.1%',
      '2024년 576억 원 → 2025년 669억 원, +16.2%',
    ],
    pillars: [
      {
        name: '+30.7% 성장',
        details: ['MS 라이선스 계약 증가', 'Cisco 라이선스 계약 증가', 'CS 가입자 및 OTA 사용량 증가', '내비게이션 SW 직접판매'],
      },
      {
        name: '+63.6% 성장',
        details: ['구독·라이선스 신규 사업 증가', 'EU권역 완성차 판매법인 ERP 인프라 고도화', '보안 운영 신규 계약', 'Google POI 라이선스 공급'],
      },
      {
        name: '+43.1% 성장',
        details: ['HMI Pune 신공장 인프라 공급 증가', 'HMI HW/라이선스 공급 증가', 'CS 운영·유지보수 매출 증가', 'Pune 공장 운영 매출 증가'],
      },
      {
        name: '+16.2% 성장',

        details: ['그룹사 ERP 개선 및 OTA 시스템 구축', 'CIDS 중앙장비 신규 납품', '모비스 5개 법인 인프라 통합 운영', '그룹사 보안 통합 운영 증가'],
      },
    ],
  },
};

interface PeersViewProps {
  onNavigate: (view: string) => void;
}

export function PeersView({ onNavigate }: PeersViewProps) {
  const [peers, setPeers] = useState<Peer[]>(mockPeers);
  const [selectedPeer, setSelectedPeer] = useState<Peer>(mockPeers[0]);
  const [isAddingPeer, setIsAddingPeer] = useState(false);
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerKeywords, setNewPeerKeywords] = useState('');
  

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
            <PeerIrAnalysis peer={selectedPeer} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PeerIrAnalysis({ peer }: { peer: Peer }) {
  const analysis = peerIrAnalyses[peer.id as keyof typeof peerIrAnalyses];

  if (!analysis) {
    return (
      <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-neutral-100">
          <Building2 className="size-6 text-neutral-500" />
        </div>
        <h2 className="text-xl font-bold text-black">{peer.name} IR 자료 분석</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
          아직 등록된 IR 분석 내용이 없습니다. 자료 업로드 또는 분석 완료 후 이 영역에 기업별 전략 방향과
          사업 포트폴리오가 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {analysis.source}
              </span>
              <span className="rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">{peer.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-black">{analysis.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-700">{analysis.summary}</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <BarChart3 className="size-6 text-white" />
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="mb-3 text-sm font-bold text-black">{analysis.highlightsTitle}</p>
          <div className="grid grid-cols-4 gap-3">
            {analysis.highlights.map((item, index) => (
              <div key={item} className="rounded-lg border border-blue-100 bg-white p-3">
                <span className="mb-2 inline-flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-neutral-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {analysis.pillars.map((pillar, index) => (
          <div key={pillar.name} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-bold text-black">{pillar.name}</h3>
                
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pillar.details.map((detail) => (
                <div key={detail} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-700">
                  {detail}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
