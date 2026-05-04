import { useState } from 'react';
import { Bell, FileText, Info } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import { uiText } from '../../shared/content/uiText';
import { FloatingAiChat } from './FloatingAiChat';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { dashboard, isLoading, error } = useDashboard();

  return (
    <div className="axis-page relative flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        <DashboardHeader onNavigate={onNavigate} notificationsCount={dashboard?.notifications.length ?? 0} notifications={dashboard?.notifications ?? []} />

        {error && (
          <div className="mb-4 rounded-xl border border-[#E1002A]/18 bg-[#E1002A]/8 p-3 text-sm text-[#E1002A]">
            {uiText.common.loadError}
          </div>
        )}

        {isLoading && !dashboard ? (
          <div className="axis-panel rounded-xl p-5 text-sm text-neutral-500">
            {uiText.common.loading}
          </div>
        ) : null}

        {dashboard ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <KeywordNetworkCard keywords={dashboard.keywords} />
            <StockChartCard points={dashboard.stockPoints} />
            <KeywordCard onNavigate={onNavigate} keywords={dashboard.keywords} keywordNewsCount={dashboard.keywordNewsCount} />
            <KeywordSearchVolumeCard points={dashboard.keywordSearchPoints} series={dashboard.keywordSeries} />
          </div>
        ) : null}
      </div>
      <FloatingAiChat />
    </div>
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
    <div className="axis-page-header flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="axis-page-title">{uiText.dashboard.pageTitle}</h1>
        <p className="axis-page-subtitle">
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
            className="relative size-10 rounded-xl border-black/10 bg-white/88"
            onClick={() => setIsNotificationOpen((current) => !current)}
          >
            <Bell className="size-4.5" />
            <Badge className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#E1002A] p-0 text-xs text-white">
              {notificationsCount}
            </Badge>
          </Button>

          {isNotificationOpen && (
            <div className="axis-glass absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-72 rounded-2xl bg-white/88 p-3 shadow-xl">
              <div className="flex items-center justify-between px-1 pb-3">
                <div>
                  <p className="font-bold text-black/90">알림</p>
                  <p className="mt-1 text-xs text-black/48">미확인 {notificationsCount}건</p>
                </div>
                <Badge className="bg-[#E1002A] text-white">{notificationsCount}</Badge>
              </div>

              <div className="space-y-2 border-t border-black/8 pt-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.detail}
                    onClick={() => onNavigate('alerts')}
                    className="flex w-full gap-3 rounded-xl p-3 text-left hover:bg-[#F6F6F6]"
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.tone === 'urgent' ? 'bg-[#E1002A]' : 'bg-[#EE7501]'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-black/90">{notification.title}</span>
                      <span className="mt-1 block truncate text-xs text-black/56">{notification.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs text-black/44">{notification.time}</span>
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

function KeywordNetworkCard({
  keywords,
}: {
  keywords: Array<{ text: string; type: 'tech' | 'org' | 'place'; size: string; x: string; y: string }>;
}) {
  const techKeywords = keywords.filter((keyword) => keyword.type === 'tech').slice(0, 4);
  const companyKeywords = keywords.filter((keyword) => keyword.type === 'org').slice(0, 5);

  return (
    <section className="axis-glass rounded-[1.25rem] bg-white/82 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="axis-section-title">오늘의 키워드</h2>
            <Info size={15} className="text-black/42" />
          </div>
          <p className="mt-1 text-xs text-black/52">주요 키워드와 기업 간 연관성 지도</p>
        </div>
        <div className="axis-soft-card rounded-full bg-white/72 px-3 py-1 text-xs font-medium text-black/54">1 / 3</div>
      </div>

      <div className="relative min-h-[16rem] overflow-hidden rounded-[1rem] border border-black/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(246,246,246,0.94))]">
        <div className="absolute inset-[16%_18%_18%_18%] rounded-full border border-dashed border-black/12" />
        {techKeywords.map((keyword, index) => (
          <div
            key={keyword.text}
            className={`absolute flex items-center justify-center rounded-full border text-center font-semibold shadow-[0_8px_25px_rgba(146,122,107,0.12)] ${
              index === 0
                ? 'left-[39%] top-[12%] h-24 w-24 border-[#E1002A]/16 bg-[#fff2ef] text-[#E1002A]'
                : index === 1
                  ? 'left-[22%] top-[40%] h-24 w-24 border-[#EE7501]/16 bg-[#fff6ee] text-[#EE7501]'
                  : index === 2
                    ? 'left-[56%] top-[34%] h-24 w-24 border-[#EE7501]/16 bg-[#EE7501]/6 text-[#E1002A]'
                    : 'left-[32%] top-[66%] h-22 w-22 border-black/10 bg-[#faf7f4] text-black/82'
            }`}
          >
            <span className="px-2 text-[0.78rem] leading-5">{keyword.text}</span>
          </div>
        ))}

        {companyKeywords.map((keyword, index) => (
          <div
            key={keyword.text}
            className={`axis-soft-card absolute rounded-full bg-white/94 px-4 py-2 text-xs font-medium text-black/68 shadow-sm ${
              index === 0
                ? 'left-[3%] top-[19%]'
                : index === 1
                  ? 'left-[3%] top-[44%]'
                  : index === 2
                    ? 'left-[3%] top-[69%]'
                    : index === 3
                      ? 'right-[3%] top-[19%]'
                      : 'right-[3%] top-[44%]'
            }`}
          >
            {keyword.text}
          </div>
        ))}

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M20 27 L44 24" stroke="rgba(17,17,17,0.14)" strokeWidth="0.6" />
          <path d="M21 49 L34 48" stroke="rgba(17,17,17,0.14)" strokeWidth="0.6" />
          <path d="M21 71 L41 72" stroke="rgba(17,17,17,0.14)" strokeWidth="0.6" />
          <path d="M58 29 L80 27" stroke="rgba(17,17,17,0.14)" strokeWidth="0.6" />
          <path d="M67 49 L84 49" stroke="rgba(17,17,17,0.14)" strokeWidth="0.6" />
          <circle cx="30" cy="36" r="1.2" fill="#E1002A" />
          <circle cx="62" cy="35" r="1.2" fill="#EE7501" />
          <circle cx="67" cy="59" r="1.2" fill="#E1002A" />
          <circle cx="27" cy="62" r="1.2" fill="#111111" />
        </svg>
      </div>
    </section>
  );
}

function StockChartCard({
  points,
}: {
  points: Array<{ date: string; samsungSds: number; lgCns: number; hyundaiAutoever: number; poscoDx: number }>;
}) {
  return (
    <section className="axis-glass rounded-[1.25rem] bg-white/82 p-4">
      <div className="mb-3">
        <h2 className="axis-section-title">Peer사 주가 추이</h2>
        <p className="mt-1 text-xs text-black/52">최근 7거래일 기준 대표 4사 종가 흐름</p>
      </div>

      <ResponsiveContainer width="100%" height={255}>
        <LineChart data={points} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.1)" />
          <XAxis dataKey="date" stroke="rgba(17,17,17,0.46)" fontSize={11} />
          <YAxis
            stroke="rgba(17,17,17,0.46)"
            fontSize={11}
            width={48}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
          />
          <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '종가']} />
          <Line type="monotone" dataKey="samsungSds" name="삼성 SDS" stroke="#EE7501" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="lgCns" name="LG CNS" stroke="#111111" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="hyundaiAutoever" name="현대 오토에버" stroke="#E1002A" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="poscoDx" name="포스코 DX" stroke="#1A3A91" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-black/64">
        <LegendDot color="bg-[#EE7501]" label="삼성 SDS" />
        <LegendDot color="bg-[#111111]" label="LG CNS" />
        <LegendDot color="bg-[#E1002A]" label="현대 오토에버" />
        <LegendDot color="bg-[#1A3A91]" label="포스코 DX" />
      </div>
    </section>
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
    <section className="axis-glass rounded-[1.2rem] bg-white/82 p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-bold text-[#211c18]">{uiText.dashboard.keywordsTitle}</h2>
        <span className="text-xs text-[#8b8078]">{uiText.dashboard.keywordsNewsCountLabel}</span>
        <span className="text-base font-bold text-[#EE7501]">{keywordNewsCount}</span>
        <span className="text-xs text-black/52">건</span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <LegendDot color="bg-[#EE7501]" label="인물" />
        <LegendDot color="bg-[#E1002A]" label="장소" />
        <LegendDot color="bg-[#111111]" label="기관" />
        <LegendDot color="bg-[#E1002A]" label="기술" />
      </div>
      <div className="relative h-[230px] overflow-hidden rounded-xl border border-black/8 bg-white/92">
        <div className="absolute inset-0 hidden md:block">
          {keywords.map((keyword) => (
            <button
              key={`${keyword.text}-${keyword.x}-${keyword.y}`}
              onClick={() => onNavigate('search')}
              className={`absolute -translate-x-1/2 -translate-y-1/2 font-bold transition-transform hover:scale-110 ${
                keyword.type === 'tech'
                  ? 'text-[#E1002A]'
                  : keyword.type === 'org'
                    ? 'text-black'
                    : keyword.type === 'place'
                      ? 'text-[#EE7501]'
                      : 'text-[#E1002A]'
              } ${keyword.size}`}
              style={{ left: keyword.x, top: keyword.y }}
            >
              {keyword.text}
            </button>
          ))}
        </div>
        <div className="flex h-full flex-wrap content-start gap-2.5 p-4 md:hidden">
          {keywords.map((keyword) => (
            <button
              key={keyword.text}
              onClick={() => onNavigate('search')}
              className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium text-black/68"
            >
              {keyword.text}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-black/48">{uiText.dashboard.keywordsGuide}</p>
        <button
          onClick={() => onNavigate('search')}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-black/70 hover:bg-[#F6F6F6]"
        >
          <FileText size={13} />
          {uiText.dashboard.openSearch}
        </button>
      </div>
    </section>
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
    <section className="axis-glass rounded-[1.2rem] bg-white/82 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-black/90">{uiText.dashboard.keywordVolumeTitle}</h2>
          <p className="mt-1 text-xs text-black/52">{uiText.dashboard.keywordVolumeSubtitle}</p>
        </div>
        <span className="rounded bg-[#EE7501]/10 px-2 py-1 text-xs font-medium text-[#EE7501]">{uiText.dashboard.realtime}</span>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.1)" />
          <XAxis dataKey="time" stroke="rgba(17,17,17,0.46)" fontSize={11} />
          <YAxis stroke="rgba(17,17,17,0.46)" fontSize={11} width={36} />
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

      <div className="mt-3 space-y-1.5">
        {series.map((keyword) => (
          <div key={keyword.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: keyword.color }} />
              <span className="font-medium text-black/82">{keyword.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-black/46">{uiText.dashboard.current}</span>
              <span className="font-bold text-black/90">{keyword.total}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-black/62">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
