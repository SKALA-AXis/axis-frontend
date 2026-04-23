import { Calendar, FileText } from 'lucide-react';
import { useState } from 'react';

const mockBriefings = [
  {
    id: 'BR-20260422-001',
    date: '2026-04-22',
    title: '2026년 4월 22일 일간 브리핑',
    status: 'delivered' as const,
    summary: '삼성SDS 제조 AX 레퍼런스, LG CNS 금융 보안 패키지 등 전략 검토 이슈 5건',
    urgent_count: 2,
    notable_count: 3,
  },
  {
    id: 'BR-20260421-001',
    date: '2026-04-21',
    title: '2026년 4월 21일 일간 브리핑',
    status: 'delivered' as const,
    summary: '네이버클라우드 공공 Sovereign AI, 현대오토에버 SDV 플랫폼 등 4건',
    urgent_count: 1,
    notable_count: 3,
  },
  {
    id: 'BR-20260420-001',
    date: '2026-04-20',
    title: '2026년 4월 20일 일간 브리핑',
    status: 'delivered' as const,
    summary: '카카오엔터프라이즈 AI 비서, KT 클라우드 사업 재편 등 업무 AX 관련 신호',
    urgent_count: 0,
    notable_count: 4,
  },
];

interface BriefingsViewProps {
  onNavigate: (view: string) => void;
}

export function BriefingsView({ onNavigate }: BriefingsViewProps) {
  const [peerFilter, setPeerFilter] = useState('all');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">일간 브리핑</h1>
          <p className="text-neutral-600">전략기획팀이 매일 아침 확인할 Peer사 핵심 동향과 SK AX 관점 시사점</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">오늘의 브리핑</h2>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('reports')}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <FileText size={16} />
                보고서 열기
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-black mb-2">2026년 4월 22일 Peer Intelligence 브리핑</h3>
                <p className="text-sm text-neutral-600">총 5건의 이슈 (전략 검토 2건, 영업 공유 3건)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-black mb-2">🔴 긴급 이슈</h4>
                <ul className="space-y-2">
                  <li className="text-sm text-neutral-700">• 삼성SDS - 제조/금융 생성형 AI 운영 플랫폼 레퍼런스 확대</li>
                  <li className="text-sm text-neutral-700">• 현대오토에버 - SDV 데이터 플랫폼 외부 고객 적용 사례 공개</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-2">🟠 주목 이슈</h4>
                <ul className="space-y-2">
                  <li className="text-sm text-neutral-700">• LG CNS - 금융권 AI+클라우드 보안 패키지 출시</li>
                  <li className="text-sm text-neutral-700">• Kakao Enterprise - 협업툴 내 AI 비서 베타 서비스</li>
                  <li className="text-sm text-neutral-700">• 네이버클라우드 - 공공기관 Sovereign AI 인프라 패키지 확대</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-black">과거 브리핑</h2>
                <button
                  onClick={() => setIsFilterOpen((current) => !current)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isFilterOpen
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                  aria-expanded={isFilterOpen}
                >
                  필터
                </button>
              </div>

              {isFilterOpen && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black">Peer사</label>
                      <select
                        value={peerFilter}
                        onChange={(event) => setPeerFilter(event.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="all">전체 Peer사</option>
                        <option value="samsung_sds">삼성SDS</option>
                        <option value="lg_cns">LG CNS</option>
                        <option value="hyundai_autoever">현대오토에버</option>
                        <option value="naver_cloud">네이버클라우드</option>
                        <option value="kakao_enterprise">Kakao Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-black">키워드</label>
                      <input
                        type="text"
                        value={keywordFilter}
                        onChange={(event) => setKeywordFilter(event.target.value)}
                        placeholder="예: Agentic AI, 금융, SDV"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-black">기간</label>
                      <select
                        value={dateRange}
                        onChange={(event) => setDateRange(event.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="7d">최근 7일</option>
                        <option value="30d">최근 30일</option>
                        <option value="90d">최근 90일</option>
                        <option value="custom">직접 설정</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {mockBriefings.map((briefing) => (
                <div key={briefing.id} className="bg-white border border-neutral-200 rounded-lg p-6 hover:border-orange-500 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar size={16} className="text-neutral-500" />
                        <span className="text-sm text-neutral-500">{briefing.date}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">전송 완료</span>
                      </div>
                      <h3 className="text-base font-bold text-black mb-2">{briefing.title}</h3>
                      <p className="text-sm text-neutral-600 mb-3">{briefing.summary}</p>
                      <div className="flex gap-4">
                        <span className="text-xs text-neutral-500">긴급 {briefing.urgent_count}건</span>
                        <span className="text-xs text-neutral-500">주목 {briefing.notable_count}건</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('reports')}
                      className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <FileText size={16} />
                      보고서 열기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
