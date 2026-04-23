import { Bookmark, ExternalLink, ChevronRight, AlertCircle, Info, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';

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

  const importanceConfig = {
    urgent: {
      label: '긴급',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
    },
    notable: {
      label: '주목',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Info,
    },
    reference: {
      label: '참고',
      color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      icon: FileText,
    },
  };

  const eventTypeLabels = {
    partnership: '파트너십',
    ma: 'M&A',
    personnel: '인사',
    tech: '기술',
    regulation: '규제',
    new_biz: '신규사업',
  };

  const config = importanceConfig[issue.importance];
  const ImportanceIcon = config.icon;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 이슈를 삭제하시겠습니까?')) {
      onDelete?.();
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.color}`}>
                <ImportanceIcon size={12} />
                {config.label}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                {eventTypeLabels[issue.event_type]}
              </span>
              <span className="text-xs text-neutral-500">
                {issue.peer_name || issue.peer_id}
              </span>
              <span className="text-xs text-neutral-400">
                · {new Date(issue.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>

            <h3 className="text-base font-bold text-black mb-3 hover:text-orange-600 cursor-pointer">
              {issue.title}
            </h3>

            <ul className="space-y-2 mb-4">
              {issue.summary_lines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="text-orange-600 mt-1.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                {isExpanded ? '간략히' : '상세보기'}
                <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
              >
                <ExternalLink size={14} />
                출처 보기
              </button>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="이슈 삭제"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
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
                <h4 className="text-sm font-bold text-black mb-3">상세 내용</h4>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    해당 이슈는 단순한 기술 발표가 아니라, 대기업 고객의 업무 프로세스 안에 AI를 상시 운영 체계로 넣으려는 움직임입니다.
                    특히 제조, 금융처럼 업무 복잡도와 보안 요구가 높은 산업을 중심으로 레퍼런스를 확보하려는 신호로 분류됩니다.
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    AI 선별 기준은 ① SK AX 핵심 사업과의 연관성, ② 고객군 중복 가능성, ③ 가격/파트너십/레퍼런스 변화,
                    ④ 단기 영업 대응 필요성입니다. 현재 건은 사업전략과 영업 조직 모두에 공유할 가치가 있는 이슈로 판단됩니다.
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    원문 기사, 기업 보도자료, 관련 후속 기사 간 표현 차이가 있어 실제 계약 규모와 고객 적용 범위는 담당자 검수가 필요합니다.
                    다만 경쟁사의 포지셔닝 변화 자체는 명확해 선제 대응 메시지를 준비할 필요가 있습니다.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">SK AX 관점 시사점</h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-neutral-700">
                    <strong>전략적 중요도:</strong> SK AX가 강조하는 AI Transformation, Agentic AI, 산업별 실행 시나리오와
                    직접 비교될 수 있는 경쟁 메시지입니다.
                  </p>
                  <p className="text-sm text-neutral-700">
                    <strong>시장 영향:</strong> 고객은 단순 AI 기능보다 보안, 운영, 변화관리까지 묶인 패키지를 요구할 가능성이 높습니다.
                    제안서에서 기술보다 운영 성과와 적용 속도를 더 분명히 보여줘야 합니다.
                  </p>
                  <p className="text-sm text-neutral-700">
                    <strong>검토 질문:</strong> 이 경쟁사가 확보한 레퍼런스가 SK AX의 타깃 계정과 겹치는지,
                    그리고 SK AX가 더 강하게 말할 수 있는 산업별 차별점이 무엇인지 확인해야 합니다.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">AI 판단 근거</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-medium text-black">사업 연관성</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">SK AX의 Agentic AI 및 산업 AX 메시지와 직접 비교 가능</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-medium text-black">고객군 중복</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">제조, 금융, 공공 고객군에서 제안 경쟁 가능성 높음</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-sm font-medium text-black">확산 신호</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">후속 기사와 유사 키워드가 함께 증가해 단기 모니터링 필요</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">제안 액션</h4>
                <div className="space-y-2">
                  <div className="bg-white border border-neutral-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-black mb-1">1. 타깃 계정 영향도 확인</p>
                    <p className="text-sm text-neutral-600">제조, 금융, 공공 고객 중 해당 경쟁 메시지와 겹치는 계정 목록 점검</p>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-black mb-1">2. SK AX 차별화 메시지 보강</p>
                    <p className="text-sm text-neutral-600">Agentic AI 적용 시나리오, 운영 거버넌스, 산업 특화 성과 지표를 제안 자료에 반영</p>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-black mb-1">3. 후속 기사 모니터링</p>
                    <p className="text-sm text-neutral-600">실제 고객명, 구축 범위, 투자 규모가 확인되는 기사 발생 시 즉시 알림</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-black mb-3">관련 출처</h4>
                <div className="space-y-2">
                  <a href="https://example.com/samsung-sds-openai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-white border border-neutral-200 rounded-lg hover:border-orange-500 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">삼성SDS, 제조/금융 생성형 AI 운영 플랫폼 레퍼런스 확대</p>
                      <p className="text-xs text-neutral-500 mt-1">연합뉴스 · 2026.04.22</p>
                    </div>
                  </a>
                  <a href="https://example.com/samsung-sds-gpt4-enterprise" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-white border border-neutral-200 rounded-lg hover:border-orange-500 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">대기업 AX 운영 플랫폼 경쟁 심화 분석</p>
                      <p className="text-xs text-neutral-500 mt-1">전자신문 · 2026.04.22</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
