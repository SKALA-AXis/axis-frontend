import { Download, Save, Eye, CheckSquare } from 'lucide-react';
import { useState } from 'react';

const mockPeers = [
  { id: 'samsung_sds', name: '삼성SDS' },
  { id: 'lg_cns', name: 'LG CNS' },
  { id: 'hyundai_autoever', name: '현대오토에버' },
  { id: 'naver_cloud', name: '네이버클라우드' },
  { id: 'kakao_enterprise', name: 'Kakao Enterprise' },
];

const mockIssuesForReport = [
  {
    id: 'IC-001',
    title: '삼성SDS - 제조/금융 생성형 AI 운영 플랫폼 확대',
    peer: '삼성SDS',
    selected: false,
    reportSummary:
      '삼성SDS는 제조·금융 고객 레퍼런스를 기반으로 생성형 AI 운영 플랫폼의 산업 적용 범위를 넓히고 있습니다. 단일 기능 출시보다 고객 업무 프로세스에 AI를 내재화하는 운영 모델을 강조하는 흐름입니다.',
  },
  {
    id: 'IC-002',
    title: 'LG CNS - 금융권 AI+클라우드 보안 패키지 출시',
    peer: 'LG CNS',
    selected: false,
    reportSummary:
      'LG CNS는 금융권의 보안·컴플라이언스 요구를 클라우드와 AI 거버넌스 패키지로 묶어 제안하고 있습니다. 규제 산업에서 AI 도입 장벽을 낮추는 통합 운영 메시지가 강화되고 있습니다.',
  },
  {
    id: 'IC-003',
    title: '현대오토에버 - SDV 데이터 플랫폼 외부 고객 적용',
    peer: '현대오토에버',
    selected: false,
    reportSummary:
      '현대오토에버는 SDV와 제조 데이터를 연결한 플랫폼 역량을 외부 고객 사례로 확장하고 있습니다. 자동차 SW 경험을 제조 데이터 운영과 디지털 전환 사업으로 넓히는 움직임입니다.',
  },
];

interface ReportsViewProps {
  onNavigate: (view: string) => void;
}

export function ReportsView({ onNavigate }: ReportsViewProps) {
  const [reportTitle, setReportTitle] = useState('Peer사 동향 보고서');
  const [reportType, setReportType] = useState('weekly_monitoring');
  const [selectedPeers, setSelectedPeers] = useState<string[]>(['samsung_sds', 'lg_cns']);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState('본 보고서는 2026년 4월 3주차 주요 Peer사의 AX 사업화, 산업별 레퍼런스, 보안/거버넌스 메시지 변화를 SK AX 전략기획 관점에서 분석합니다.');
  const [keyFindings, setKeyFindings] = useState('• 삼성SDS는 생성형 AI를 산업별 운영 플랫폼으로 포지셔닝하며 제조/금융 레퍼런스를 강화\n• LG CNS는 금융권 보안/컴플라이언스를 AX 진입 포인트로 활용\n• SK AX는 Agentic AI 적용 시나리오와 운영 성과 지표를 제안 메시지에 더 명확히 반영할 필요');
  const [reportState, setReportState] = useState<'editing' | 'saved' | 'exported'>('editing');

  const togglePeer = (peerId: string) => {
    setSelectedPeers((prev) =>
      prev.includes(peerId) ? prev.filter((id) => id !== peerId) : [...prev, peerId]
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="h-full flex">
        {/* Editor Panel - Left */}
        <div className="w-1/2 bg-white border-r border-neutral-200 flex flex-col">
          <div className="border-b border-neutral-200 p-4">
            <h2 className="text-lg font-bold text-black">보고서 편집</h2>
            <p className="text-sm text-neutral-600">내용을 수정하면 오른쪽에 실시간으로 반영됩니다</p>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-2">보고서 제목</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">보고서 유형</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily_briefing">일간 브리핑</option>
                <option value="weekly_monitoring">주간 모니터링</option>
                <option value="deep_dive">심층 분석</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">대상 Peer사</label>
              <div className="space-y-2">
                {mockPeers.map((peer) => (
                  <label key={peer.id} className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPeers.includes(peer.id)}
                      onChange={() => togglePeer(peer.id)}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-black">{peer.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">주요 이슈 선택</label>
              <div className="space-y-2">
                {mockIssuesForReport.map((issue) => (
                  <label key={issue.id} className="flex items-start gap-2 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIssues.includes(issue.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIssues([...selectedIssues, issue.id]);
                        } else {
                          setSelectedIssues(selectedIssues.filter((id) => id !== issue.id));
                        }
                      }}
                      className="w-4 h-4 mt-0.5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-black">{issue.title}</p>
                      <p className="text-xs text-neutral-500">{issue.peer}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">요약</label>
              <textarea
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">참고 사항</label>
              <textarea
                value={keyFindings}
                onChange={(e) => setKeyFindings(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="border-t border-neutral-200 p-4 flex gap-3">
            <button
              onClick={() => setReportState('saved')}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              저장
            </button>
            <button
              onClick={() => setReportState('exported')}
              className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2"
            >
              <Download size={18} />
              PDF
            </button>
          </div>
        </div>

        {/* Preview Panel - Right */}
        <div className="w-1/2 bg-neutral-100 flex flex-col">
          <div className="border-b border-neutral-200 p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={20} className="text-neutral-600" />
                <h2 className="text-lg font-bold text-black">미리보기</h2>
              </div>
              <button
                onClick={() => onNavigate('briefings')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                브리핑으로 이동
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {reportState !== 'editing' && (
              <div className="mx-auto mb-4 max-w-3xl rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {reportState === 'saved' ? '보고서가 저장되었습니다.' : 'PDF 내보내기 준비가 완료되었습니다.'}
              </div>
            )}
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-12">
              {/* Report Header */}
              <div className="border-b-2 border-black pb-6 mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600">AXIS Monitoring Report</p>
                    <p className="text-sm text-neutral-600">{new Date().toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-black mb-2">{reportTitle}</h1>
                <p className="text-sm text-neutral-600">
                  Report Type: {reportType === 'weekly_monitoring' ? '주간 모니터링' : reportType}
                </p>
              </div>

              {/* Target Peers */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-black mb-3">분석 대상</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedPeers.map((peerId) => {
                    const peer = mockPeers.find((p) => p.id === peerId);
                    return (
                      <span key={peerId} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm">
                        {peer?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              {/* Selected Issues */}
              {selectedIssues.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-black mb-3">이슈 사항</h2>
                  <div className="space-y-2">
                    {selectedIssues.map((issueId) => {
                      const issue = mockIssuesForReport.find((i) => i.id === issueId);
                      return (
                        <div key={issueId} className="flex items-start gap-2 p-3 bg-neutral-50 rounded-lg">
                          <CheckSquare size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium leading-relaxed text-black">{issue?.reportSummary}</p>
                            <p className="text-xs text-neutral-500">{issue?.peer}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            

              {/* Executive Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-black mb-3">요약</h2>
                <p className="text-neutral-700 leading-relaxed">{executiveSummary}</p>
              </div>

              {/* Key Findings */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-black mb-3">참고 사항</h2>
                <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">{keyFindings}</div>
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-200 pt-6 mt-12">
                <p className="text-xs text-neutral-500 text-center">
                  본 보고서는 AXIS AI 모니터링 시스템에 의해 자동 생성되었습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
