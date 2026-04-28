import { useState } from 'react';
import { Bell, FileText, Send, Sparkles, X } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import { uiText } from '../../shared/content/uiText';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

const trendAccentClasses: Record<string, string> = {
  primary: 'border-red-200 border-l-red-600 bg-red-50/70 hover:border-red-400 hover:bg-red-50',
  watch: 'border-amber-200 border-l-amber-500 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50',
};

const trendBadgeClasses: Record<string, string> = {
  primary: 'bg-red-600 text-white',
  watch: 'bg-amber-400 text-amber-950',
};

const trendBadgeLabels: Record<string, string> = {
  primary: '우선 검토',
  watch: '관찰 필요',
};

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { dashboard, isLoading, error } = useDashboard();

  return (
    <div className="relative flex-1 overflow-auto bg-neutral-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <DashboardHeader onNavigate={onNavigate} notificationsCount={dashboard?.notifications.length ?? 0} notifications={dashboard?.notifications ?? []} />

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {uiText.common.loadError}
          </div>
        )}

        {isLoading && !dashboard ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            {uiText.common.loading}
          </div>
        ) : null}

        {dashboard ? (
          <>
            <div className="grid gap-6 xl:grid-cols-12">
              <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 xl:col-span-8">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-orange-600">{uiText.dashboard.trendQueueLabel}</p>
                    <h2 className="mt-1 text-lg font-bold text-black">{uiText.dashboard.trendSectionTitle}</h2>
                  </div>
                  <button
                    onClick={() => onNavigate('issues')}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    {uiText.common.viewAll}
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboard.trends.map((trend) => (
                    <button
                      key={trend.title}
                      onClick={() => onNavigate('issues')}
                      className={`w-full rounded-lg border border-l-4 border-neutral-200 p-4 text-left transition-colors ${
                        trendAccentClasses[trend.reviewLevel] || 'border-l-blue-500 hover:border-blue-300'
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                          {trend.peer}
                        </span>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            trendBadgeClasses[trend.reviewLevel] || 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {trendBadgeLabels[trend.reviewLevel]}
                        </span>
                        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {trend.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-black">{trend.title}</h3>
                      <p className="mt-2 text-sm text-neutral-600">{trend.reason}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 xl:col-span-4">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-orange-600">{uiText.dashboard.topArticlesLabel}</p>
                    <h2 className="mt-1 text-lg font-bold text-black">{uiText.dashboard.topArticlesTitle}</h2>
                  </div>
                  <button
                    onClick={() => onNavigate('rawArticles')}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    보기
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboard.articles.map((article) => (
                    <button
                      key={article.title}
                      onClick={() => onNavigate('rawArticles')}
                      className="w-full rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:border-orange-400 hover:bg-orange-50/60"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                          {article.peer}
                        </span>
                        <span className="text-xs text-neutral-500">{article.publishedAt}</span>
                      </div>
                      <p className="text-sm font-bold leading-relaxed text-black">{article.title}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                        <span>{article.source}</span>
                        <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">{article.note}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <KeywordCard onNavigate={onNavigate} keywords={dashboard.keywords} keywordNewsCount={dashboard.keywordNewsCount} />
              </div>
              <div className="xl:col-span-5">
                <KeywordSearchVolumeCard points={dashboard.keywordSearchPoints} series={dashboard.keywordSeries} />
              </div>
            </div>
          </>
        ) : null}
      </div>
      <FloatingAiChat />
    </div>
  );
}

function KeywordSearchVolumeCard({
  points,
  series,
}: {
  points: Array<Record<string, string | number>>;
  series: Array<{ key: string; name: string; color: string; total: string }>;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-black">{uiText.dashboard.keywordVolumeTitle}</h2>
          <p className="mt-1 text-xs text-neutral-500">{uiText.dashboard.keywordVolumeSubtitle}</p>
        </div>
        <span className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">{uiText.dashboard.realtime}</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="time" stroke="#737373" fontSize={11} />
          <YAxis stroke="#737373" fontSize={11} width={36} />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}회`,
              series.find((keyword) => keyword.key === name)?.name || name,
            ]}
            labelFormatter={(label) => `${label} 기준`}
          />
          {series.map((keyword) => (
            <Line
              key={keyword.key}
              type="monotone"
              dataKey={keyword.key}
              name={keyword.key}
              stroke={keyword.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {series.map((keyword) => (
          <div key={keyword.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: keyword.color }} />
              <span className="font-medium text-neutral-800">{keyword.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">{uiText.dashboard.current}</span>
              <span className="font-bold text-neutral-900">{keyword.total}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardHeader({
  onNavigate,
  notificationsCount,
  notifications,
}: DashboardOverviewProps & {
  notificationsCount: number;
  notifications: Array<{ title: string; detail: string; time: string; tone: 'urgent' | 'info' }>;
}) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-black sm:text-3xl">{uiText.dashboard.pageTitle}</h1>
        <p className="text-neutral-600">
          {uiText.dashboard.pageSubtitle} ·{' '}
          {new Date().toLocaleDateString('ko-KR', {
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
              {notificationsCount}
            </Badge>
          </Button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-13 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
              <div className="flex items-center justify-between px-1 pb-3">
                <div>
                  <p className="font-bold text-black">알림</p>
                  <p className="mt-1 text-xs text-neutral-500">미확인 {notificationsCount}건</p>
                </div>
                <Badge className="bg-red-500 text-white">{notificationsCount}</Badge>
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
      content: uiText.dashboard.chatGreeting,
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
        content: uiText.dashboard.chatResponse,
      },
    ]);
    setQuery('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-10">
      {isOpen ? (
        <section className="mb-2 flex h-[460px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black">{uiText.dashboard.chatTitle}</h2>
                <p className="text-xs text-neutral-500">{uiText.dashboard.chatSubtitle}</p>
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
                placeholder={uiText.dashboard.chatPlaceholder}
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
          className={`pointer-events-none hidden w-64 rounded-2xl bg-white p-5 shadow-xl transition-all duration-200 sm:block ${
            isBubbleVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-bold text-neutral-900">AXIS</p>
            <span className="text-2xl leading-none text-neutral-700">×</span>
          </div>
          <p className="text-base leading-relaxed text-neutral-800">안녕하세요! AXIS입니다. 무엇을 도와드릴까요?</p>
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

function KeywordCard({
  onNavigate,
  keywords,
  keywordNewsCount,
}: DashboardOverviewProps & {
  keywords: Array<{ text: string; type: 'tech' | 'org' | 'place'; size: string; x: string; y: string }>;
  keywordNewsCount: string;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-bold text-black">{uiText.dashboard.keywordsTitle}</h2>
        <span className="text-xs text-neutral-500">{uiText.dashboard.keywordsNewsCountLabel}</span>
        <span className="text-base font-bold text-blue-600">{keywordNewsCount}</span>
        <span className="text-xs text-neutral-500">건</span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <LegendDot color="bg-orange-500" label="인물" />
        <LegendDot color="bg-teal-500" label="장소" />
        <LegendDot color="bg-blue-600" label="기관" />
        <LegendDot color="bg-violet-600" label="기술" />
      </div>
      <div className="relative h-[300px] overflow-hidden rounded-lg border border-neutral-100 bg-white">
        <div className="absolute inset-0 hidden md:block">
          {keywords.map((keyword) => (
            <button
              key={`${keyword.text}-${keyword.x}-${keyword.y}`}
              onClick={() => onNavigate('search')}
              className={`absolute -translate-x-1/2 -translate-y-1/2 font-bold transition-transform hover:scale-110 ${
                keyword.type === 'tech'
                  ? 'text-violet-600'
                  : keyword.type === 'org'
                    ? 'text-blue-600'
                    : keyword.type === 'place'
                      ? 'text-teal-600'
                      : 'text-orange-500'
              } ${keyword.size}`}
              style={{ left: keyword.x, top: keyword.y }}
            >
              {keyword.text}
            </button>
          ))}
        </div>
        <div className="flex h-full flex-wrap content-start gap-3 p-4 md:hidden">
          {keywords.map((keyword) => (
            <button
              key={keyword.text}
              onClick={() => onNavigate('search')}
              className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700"
            >
              {keyword.text}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500">{uiText.dashboard.keywordsGuide}</p>
        <button
          onClick={() => onNavigate('search')}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <FileText size={14} />
          {uiText.dashboard.openSearch}
        </button>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-neutral-600">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
