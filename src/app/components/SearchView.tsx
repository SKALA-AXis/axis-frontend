import { Search, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function SearchView() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const suggestedQueries = [
    '이번 주 SK AX 전략기획팀이 봐야 할 긴급 이슈는?',
    '삼성SDS의 제조 AX 메시지가 SK AX에 주는 영향은?',
    '금융권 AI 보안 패키지 관련 Peer사 동향 정리해줘',
    'Agentic AI 관점에서 경쟁사별 차별 포인트 비교해줘',
  ];

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setMessages([
      ...messages,
      { role: 'user', content: q },
      {
        role: 'assistant',
        content: `**${q}**에 대한 분석 결과입니다.\n\n**요약:**\n최근 Peer사들은 단순 AI 기능 출시보다 산업별 운영 패키지, 보안/거버넌스, 레퍼런스 확보를 전면에 내세우고 있습니다.\n\n**주요 신호:**\n• 삼성SDS: 제조/금융 고객 대상 생성형 AI 운영 플랫폼 메시지 강화\n• LG CNS: 금융권 클라우드 보안과 AI 거버넌스를 묶은 패키지 확대\n• 현대오토에버: SDV와 제조 데이터를 연결한 산업 특화 플랫폼 포지셔닝\n\n**SK AX 관점 시사점:**\nSK AX는 Agentic AI 자체보다 고객 업무에 어떻게 적용되고, 어떤 운영 성과로 이어지는지를 더 구체적으로 보여줘야 합니다. 특히 전략기획팀에는 타깃 계정 영향도, 제안서 메시지 보강 포인트, 후속 모니터링 조건을 함께 제공하는 방식이 유용합니다.`,
      },
    ]);
    setQuery('');
  };

  return (
    <div className="flex-1 overflow-auto bg-white flex flex-col">
      <div className="border-b border-neutral-200 p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">AI 대화형 검색</h1>
            <p className="text-sm text-neutral-600">SK AX 관점에서 Peer사 동향을 질문하고 시사점을 확인하세요</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold text-black mb-2">어떤 정보가 필요하신가요?</h2>
              <p className="text-sm text-neutral-600">
                수집된 뉴스, 보도자료, 후속 기사를 기반으로 전략 검토 포인트를 정리합니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedQueries.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(suggestion)}
                  className="text-left p-4 border border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <p className="text-sm text-neutral-700">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">U</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 p-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Peer사 동향에 대해 질문하세요..."
                className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Send size={18} />
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
