import { ExternalLink, RefreshCw, Filter } from 'lucide-react';
import { useState } from 'react';

const mockRawArticles = [
  {
    id: 1,
    title: '삼성SDS, 제조/금융 생성형 AI 운영 플랫폼 레퍼런스 확대',
    url: 'https://example.com/article1',
    source_name: 'Naver News',
    peer_id: 'samsung_sds',
    published_at: '2026-04-22T08:30:00Z',
    collected_at: '2026-04-22T08:35:00Z',
    processing_status: 'EMBEDDED',
    importance_level: 'urgent',
  },
  {
    id: 2,
    title: 'LG CNS, 금융권 AI+클라우드 보안 패키지 출시',
    url: 'https://example.com/article2',
    source_name: 'E-daily',
    peer_id: 'lg_cns',
    published_at: '2026-04-22T07:15:00Z',
    collected_at: '2026-04-22T07:20:00Z',
    processing_status: 'CLUSTERED_DUPE',
    importance_level: 'notable',
  },
  {
    id: 3,
    title: '현대오토에버, SDV 데이터 플랫폼 외부 고객 적용 사례 공개',
    url: 'https://example.com/article3',
    source_name: 'Chosun Biz',
    peer_id: 'hyundai_autoever',
    published_at: '2026-04-21T16:45:00Z',
    collected_at: '2026-04-21T16:50:00Z',
    processing_status: 'SKIPPED_QUALITY',
    importance_level: null,
  },
];

export function RawArticlesView() {
  const [isFiltered, setIsFiltered] = useState(false);
  const [reprocessedIds, setReprocessedIds] = useState<number[]>([]);

  const statusLabels = {
    RAW: { label: '원문', color: 'bg-neutral-100 text-neutral-700' },
    EMBEDDED: { label: '임베딩 완료', color: 'bg-blue-100 text-blue-700' },
    SKIPPED_QUALITY: { label: '품질 미달', color: 'bg-yellow-100 text-yellow-700' },
    SKIPPED_CREDIBILITY: { label: '신뢰도 낮음', color: 'bg-orange-100 text-orange-700' },
    CLUSTERED_DUPE: { label: '중복', color: 'bg-purple-100 text-purple-700' },
    ERROR: { label: '오류', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">원문 아카이브</h1>
          <p className="text-neutral-600">수집된 원문 기사 및 처리 상태</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-neutral-300 rounded-lg text-sm">
                <option>전체 Peer사</option>
                <option>삼성SDS</option>
                <option>LG CNS</option>
                <option>현대오토에버</option>
              </select>
              <select className="px-4 py-2 border border-neutral-300 rounded-lg text-sm">
                <option>전체 상태</option>
                <option>임베딩 완료</option>
                <option>품질 미달</option>
                <option>중복</option>
              </select>
            </div>
            <button
              onClick={() => setIsFiltered(true)}
              className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2 text-sm"
            >
              <Filter size={16} />
              필터
            </button>
          </div>
          {isFiltered && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
              선택한 조건이 원문 목록에 적용되었습니다.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">제목</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Peer사</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">출처</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">처리 상태</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">수집 시간</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">작업</th>
                </tr>
              </thead>
              <tbody>
                {mockRawArticles.map((article) => {
                  const status = statusLabels[article.processing_status as keyof typeof statusLabels];
                  return (
                    <>
                      <tr key={article.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <p className="text-sm text-black font-medium">{article.title}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600">{article.peer_id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600">{article.source_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-500">
                            {new Date(article.collected_at).toLocaleString('ko-KR')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <ExternalLink size={16} />
                            </a>
                            <button
                              onClick={() => setReprocessedIds((ids) => [...new Set([...ids, article.id])])}
                              className="text-neutral-600 hover:text-black"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {reprocessedIds.includes(article.id) && (
                        <tr className="border-b border-neutral-100 bg-green-50">
                          <td colSpan={6} className="px-4 py-2 text-xs text-green-700">
                            {article.title} 재처리 요청이 대기열에 추가되었습니다.
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
