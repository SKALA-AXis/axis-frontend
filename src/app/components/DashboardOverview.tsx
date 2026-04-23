import { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Database,
  Download,
  FileText,
  Minus,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

const priorityIssues = [
  {
    peer: '삼성SDS',
    title: 'FabriX 기반 ERP/SCM AI 에이전트 통합 서비스',
    reason: '구매, 물류 등 핵심 비즈니스 프로세스에 AI Agent를 직접 결합하여 운영 효율을 30% 이상 개선하는 실사례를 통해 대형 제조 고객군을 선점 중입니다.',
    importance: '긴급',
    status: '대응 전략 수립',
  },
  {
    peer: 'LG CNS',
    title: 'DAP GenAI 중심의 공공/금융 소버린 AI(Sovereign AI) 패키지',
    reason: '망 분리 환경에서도 작동하는 온프레미스형 LLM 구축 역량을 앞세우고 있습니다.',
    importance: '긴급',
    status: '영업 기회 분석',
  },
  {
    peer: '현대오토에버',
    title: '글로벌 스마트 팩토리 2.0 및 제조 데이터 플랫폼 확장',
    reason: '싱가포르 HMGICS에서 검증된 AI 기반 디지털 트윈 모델을 외부 부품사로 전파하고 있습니다.',
    importance: '주목',
    status: '시사점 도출',
  }
];

const issueAccentClasses: Record<string, string> = {
  긴급: 'border-red-200 border-l-red-600 bg-red-50/70 hover:border-red-400 hover:bg-red-50',
  주목: 'border-amber-200 border-l-amber-500 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50',
};

const issueBadgeClasses: Record<string, string> = {
  긴급: 'bg-red-600 text-white',
  주목: 'bg-amber-400 text-amber-950',
};

const peerSignals = [
  {
    name: '삼성SDS',
    urgent: 5,
    notable: 12,
    latest: 'FabriX ERP 통합',
    trend: '하이퍼오토메이션',
    direction: 'up',
    insight: '핵심 업무(ERP) 내 AI 에이전트 내재화 및 락인 강화',
    keywords: ['Agentic AI', 'ERP'],
  },
  {
    name: 'LG CNS',
    urgent: 3,
    notable: 10,
    latest: '금융 소버린 AI',
    trend: '규제 산업 AX 선점',
    direction: 'up',
    insight: '보안·컴플라이언스 기반 금융/공공 진입장벽 구축',
    keywords: ['Sovereign AI', '보안'],
  },
  {
    name: '현대오토에버',
    urgent: 2,
    notable: 7,
    latest: '스마트팩토리 2.0',
    trend: '제조 플랫폼 대외 확산',
    direction: 'steady',
    insight: '검증된 제조 데이터 기반의 산업 특화 AX 확장',
    keywords: ['제조AX', '디지털트윈'],
  },
];

const stockData = [
  { time: '09:00', skAx: 374000, samsungSds: 176000, lgCns: 66200, hyundaiAutoever: 431000 },
  { time: '10:00', skAx: 376500, samsungSds: 177500, lgCns: 66800, hyundaiAutoever: 434000 },
  { time: '11:00', skAx: 378000, samsungSds: 178200, lgCns: 67100, hyundaiAutoever: 436500 },
  { time: '12:00', skAx: 377000, samsungSds: 179000, lgCns: 67500, hyundaiAutoever: 438000 },
  { time: '13:00', skAx: 379500, samsungSds: 179500, lgCns: 68100, hyundaiAutoever: 441000 },
  { time: '14:00', skAx: 381000, samsungSds: 180500, lgCns: 68400, hyundaiAutoever: 442500 },
  { time: '15:00', skAx: 380000, samsungSds: 180000, lgCns: 68000, hyundaiAutoever: 440000 },
];

const stockPeers = [
  { key: 'skAx', name: 'SK AX', color: '#dc2626', current: '380,000', change: '+1.6%' },
  { key: 'samsungSds', name: '삼성SDS', color: '#2563eb', current: '180,000', change: '+2.3%' },
  { key: 'lgCns', name: 'LG CNS', color: '#14b8a6', current: '68,000', change: '+2.7%' },
  { key: 'hyundaiAutoever', name: '현대오토에버', color: '#f97316', current: '440,000', change: '+2.1%' },
];

const keywords = [
  { text: 'Agentic AI', type: 'tech', size: 'text-2xl', x: '48%', y: '20%' },
  { text: 'SK AX', type: 'org', size: 'text-2xl', x: '33%', y: '34%' },
  { text: '제조 AX', type: 'tech', size: 'text-xl', x: '60%', y: '38%' },
  { text: 'LG CNS', type: 'org', size: 'text-xl', x: '72%', y: '28%' },
  { text: '금융권', type: 'place', size: 'text-lg', x: '30%', y: '50%' },
  { text: '클라우드 보안', type: 'tech', size: 'text-lg', x: '56%', y: '58%' },
  { text: 'SDV', type: 'tech', size: 'text-base', x: '76%', y: '60%' },
  { text: '공공기관', type: 'place', size: 'text-sm', x: '28%', y: '70%' },
  { text: '현대오토에버', type: 'org', size: 'text-base', x: '48%', y: '76%' },
  { text: '데이터 플랫폼', type: 'tech', size: 'text-base', x: '68%', y: '78%' },
  { text: '서울', type: 'place', size: 'text-sm', x: '38%', y: '88%' },
  { text: 'AI 거버넌스', type: 'tech', size: 'text-sm', x: '78%', y: '45%' },
];

const notifications = [
  { title: '전략 검토', detail: '삼성SDS 제조 AX 레퍼런스 시사점 작성 필요', time: '12분 전', tone: 'urgent' },
  { title: '브리핑', detail: '전략기획팀 일간 브리핑 08:30 발송 완료', time: '38분 전', tone: 'info' },
  { title: '영업 공유', detail: '금융권 AI 보안 패키지 관련 알림 전송 대기', time: '1시간 전', tone: 'info' },
];

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  return (
    <div className="relative flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <DashboardHeader onNavigate={onNavigate} />

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-8 rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-orange-600">Action Queue</p>
                <h2 className="mt-1 text-lg font-bold text-black">최근 주요 이슈</h2>
              </div>
              <button
                onClick={() => onNavigate('issues')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                전체 보기
              </button>
            </div>

            <div className="space-y-3">
              {priorityIssues.map((issue) => (
                <button
                  key={issue.title}
                  onClick={() => onNavigate('issues')}
                  className={`w-full rounded-lg border border-l-4 border-neutral-200 p-4 text-left transition-colors ${
                    issueAccentClasses[issue.importance] || 'border-l-blue-500 hover:border-blue-300'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                      {issue.peer}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        issueBadgeClasses[issue.importance] || 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {issue.importance}
                    </span>
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {issue.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-black">{issue.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{issue.reason}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="col-span-4 rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-orange-600">Peer Signals</p>
                <h2 className="mt-1 text-lg font-bold text-black">Peer사 동향 신호</h2>
              </div>
              <button
                onClick={() => onNavigate('peers')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                보기
              </button>
            </div>

            <div className="space-y-3">
              {peerSignals.map((peer) => (
                <button
                  key={peer.name}
                  onClick={() => onNavigate('peers')}
                  className="w-full rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:border-orange-400 hover:bg-orange-50/60"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold text-black">{peer.name}</h3>
                    {peer.direction === 'up' ? (
                      <TrendingUp size={18} className="text-orange-600" />
                    ) : (
                      <Minus size={18} className="text-neutral-500" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-black">{peer.trend}</p>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600">{peer.insight}</p>
                  <div className="mt-3 flex gap-2 text-xs text-neutral-600">
                    <span className="rounded bg-red-50 px-2 py-1 text-red-700">긴급 {peer.urgent}</span>
                    <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">주목 {peer.notable}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-7">
            <KeywordCard onNavigate={onNavigate} />
          </div>
          <div className="col-span-5">
            <PeerStockCard />
          </div>
        </div>
      </div>
      <FloatingAiChat />
    </div>
  );
}

function PeerStockCard() {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-black">Peer사 현재 주가</h2>
          <p className="mt-1 text-xs text-neutral-500">장중 추이 · KRW</p>
        </div>
        <span className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">실시간</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={stockData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="time" stroke="#737373" fontSize={11} />
          <YAxis
            stroke="#737373"
            fontSize={11}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
            width={42}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${Number(value).toLocaleString('ko-KR')}원`,
              stockPeers.find((peer) => peer.key === name)?.name || name,
            ]}
            labelFormatter={(label) => `${label} 기준`}
          />
          {stockPeers.map((peer) => (
            <Line
              key={peer.key}
              type="monotone"
              dataKey={peer.key}
              name={peer.key}
              stroke={peer.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {stockPeers.map((peer) => (
          <div key={peer.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: peer.color }} />
              <span className="font-medium text-neutral-800">{peer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">{peer.current}원</span>
              <span className="font-bold text-green-600">{peer.change}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardHeader({ onNavigate }: DashboardOverviewProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-neutral-600">
          SK AX 전략기획 관점 Peer Intelligence · {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </p>
      </div>

      <div className="flex w-full items-center gap-3 xl:w-auto">
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="relative size-11 rounded-lg border-neutral-200 bg-white"
            onClick={() => setIsNotificationOpen((current) => !current)}
          >
            <Bell className="size-5" />
            <Badge className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
              {notifications.length}
            </Badge>
          </Button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-13 z-50 w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
              <div className="flex items-center justify-between px-1 pb-3">
                <div>
                  <p className="font-bold text-black">알림</p>
                  <p className="mt-1 text-xs text-neutral-500">미확인 {notifications.length}건</p>
                </div>
                <Badge className="bg-red-500 text-white">{notifications.length}</Badge>
              </div>

              <div className="space-y-2 border-t border-neutral-100 pt-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.detail}
                    onClick={() => onNavigate('alerts')}
                    className="flex w-full gap-3 rounded-lg p-3 text-left hover:bg-neutral-50"
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.tone === 'urgent' ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-black">{notification.title}</span>
                      <span className="mt-1 block truncate text-xs text-neutral-600">{notification.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">{notification.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: '안녕하세요. AXIS입니다. Peer사 동향이나 전략 검토 포인트를 질문해 주세요.',
    },
  ]);

  const handleSend = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'user', content: trimmedQuery },
      {
        role: 'assistant',
        content:
          '요청하신 내용을 기준으로 최근 Peer사 이슈, SK AX 영향도, 후속 검토 포인트를 함께 정리해드릴게요.',
      },
    ]);
    setQuery('');
  };

  return (
    <div className="fixed bottom-6 right-10 z-40 flex flex-col items-end gap-3">
      {isOpen ? (
        <section className="mb-2 flex h-[460px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">AXIS AI</h2>
                <p className="text-xs text-neutral-500">대화형 전략 검색</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
              aria-label="AI 채팅 패널 닫기"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder="질문을 입력하세요"
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100"
                aria-label="메시지 전송"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div
          className={`pointer-events-none w-64 rounded-2xl bg-white p-5 shadow-xl transition-all duration-200 ${
            isBubbleVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-bold text-neutral-900">AXIS</p>
            <span className="text-2xl leading-none text-neutral-700">×</span>
          </div>
          <p className="text-base leading-relaxed text-neutral-800">
            안녕하세요! AXIS입니다. 무엇을 도와드릴까요?
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          setIsBubbleVisible(false);
        }}
        onMouseEnter={() => setIsBubbleVisible(true)}
        onMouseLeave={() => setIsBubbleVisible(false)}
        onFocus={() => setIsBubbleVisible(true)}
        onBlur={() => setIsBubbleVisible(false)}
        className={`flex size-16 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-200 ${
          isOpen ? 'bg-orange-600' : 'bg-black'
        }`}
        aria-label={isOpen ? 'AI 채팅 패널 닫기' : 'AI 채팅 패널 열기'}
        aria-expanded={isOpen}
      >
        <span className="relative block size-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600">
          <span className="absolute bottom-0 left-1.5 size-3 -skew-x-12 bg-red-600" />
        </span>
      </button>
    </div>
  );
}

function KeywordCard({ onNavigate }: DashboardOverviewProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-bold text-black">오늘의 키워드</h2>
        <span className="text-xs text-neutral-500">분석 대상뉴스</span>
        <span className="text-base font-bold text-blue-600">11,104</span>
        <span className="text-xs text-neutral-500">건</span>
      </div>
      <div className="mb-3 flex items-center gap-4 text-xs">
        <LegendDot color="bg-orange-500" label="인물" />
        <LegendDot color="bg-teal-500" label="장소" />
        <LegendDot color="bg-blue-600" label="기관" />
        <LegendDot color="bg-violet-600" label="기술" />
      </div>
      <div className="relative h-[300px] overflow-hidden rounded-lg border border-neutral-100 bg-white">
        <div className="absolute inset-0 hidden md:block">
          {keywords.map((keyword) => (
            <button
              key={keyword.text}
              onClick={() => onNavigate('search')}
              className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-bold leading-none transition-transform hover:scale-105 ${keyword.size} ${keywordColor(keyword.type)}`}
              style={{ left: keyword.x, top: keyword.y }}
              title={`${keyword.text} 검색`}
            >
              {keyword.text}
            </button>
          ))}
        </div>

        <div className="grid h-full grid-cols-2 content-center gap-3 p-5 md:hidden">
          {keywords.map((keyword) => (
            <button
              key={keyword.text}
              onClick={() => onNavigate('search')}
              className={`rounded-lg border border-neutral-100 px-3 py-2 text-left font-bold ${keywordColor(keyword.type)}`}
              title={`${keyword.text} 검색`}
            >
              {keyword.text}
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate('rawArticles')}
          className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-medium text-black hover:text-blue-600"
        >
          원문 보기
          <Download className="size-4" />
        </button>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`size-3 rounded-full ${color}`} />
      <span className="font-medium text-neutral-800">{label}</span>
    </span>
  );
}

function keywordColor(type: string) {
  if (type === 'person') {
    return 'text-orange-500';
  }

  if (type === 'org') {
    return 'text-blue-600';
  }

  if (type === 'tech') {
    return 'text-violet-600';
  }

  return 'text-teal-500';
}
