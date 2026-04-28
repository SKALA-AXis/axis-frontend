import { Calendar, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useBriefings } from '../../features/briefings/hooks/useBriefings';
import { uiText } from '../../shared/content/uiText';

interface BriefingsViewProps {
  onNavigate: (view: string) => void;
}

export function BriefingsView({ onNavigate: _onNavigate }: BriefingsViewProps) {
  const { briefings, isLoading, error } = useBriefings();
  const [peerFilter, setPeerFilter] = useState('all');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [briefingType, setBriefingType] = useState<'daily' | 'weekly'>('daily');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeSnapshot = briefingType === 'daily' ? briefings?.dailySnapshot : briefings?.weeklySnapshot;

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-black sm:text-3xl">{uiText.briefings.pageTitle}</h1>
          <p className="text-neutral-600">{uiText.briefings.pageSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {uiText.common.loadError}
          </div>
        )}

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setBriefingType('daily')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              briefingType === 'daily'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {uiText.briefings.dailyTab}
          </button>
          <button
            onClick={() => setBriefingType('weekly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              briefingType === 'weekly'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {uiText.briefings.weeklyTab}
          </button>
        </div>

        {isLoading && !briefings ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            {uiText.common.loading}
          </div>
        ) : null}

        {briefings && activeSnapshot ? (
          <>
            <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-black">
                  {briefingType === 'daily' ? uiText.briefings.todayDailyTitle : uiText.briefings.thisWeekTitle}
                </h2>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{activeSnapshot.title}</h3>
                    <p className="text-sm text-neutral-600">{activeSnapshot.summary}</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-8">
                    {activeSnapshot.sections.map((section) => (
                      <div key={section.title}>
                        <h4 className="text-sm font-bold text-black mb-2">{section.title}</h4>
                        <ul className="space-y-2">
                          {section.items.map((item) => (
                            <li key={item.headline} className="rounded-lg bg-white/70 px-4 py-3 text-sm text-neutral-700">
                              <p className="font-medium text-black">{item.headline}</p>
                              <p className="mt-1 text-xs text-neutral-500">근거: {item.source}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-orange-200 bg-white p-4 lg:col-span-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="size-4 text-orange-600" />
                      <h4 className="text-sm font-bold text-black">{uiText.briefings.evidenceTitle}</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-neutral-700">
                      {briefings.evidenceSources.map((source) => (
                        <li key={source} className="rounded-lg bg-neutral-50 px-3 py-2">
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-12">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-black">{uiText.briefings.historyTitle}</h2>
                    <button
                      onClick={() => setIsFilterOpen((current) => !current)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isFilterOpen
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                      aria-expanded={isFilterOpen}
                    >
                      {uiText.briefings.filter}
                    </button>
                  </div>

                  {isFilterOpen && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.briefings.peerFilter}</label>
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
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.briefings.keywordFilter}</label>
                          <input
                            type="text"
                            value={keywordFilter}
                            onChange={(event) => setKeywordFilter(event.target.value)}
                            placeholder="예: Agentic AI, 금융, SDV"
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.briefings.dateFilter}</label>
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

                  {briefings.history.map((briefing) => (
                    <div key={briefing.id} className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-orange-500 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <Calendar size={16} className="text-neutral-500" />
                            <span className="text-sm text-neutral-500">{briefing.date}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              {uiText.briefings.delivered}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-black mb-2">{briefing.title}</h3>
                          <p className="text-sm text-neutral-600 mb-3">{briefing.summary}</p>
                          <div className="flex flex-wrap gap-4">
                            <span className="text-xs text-neutral-500">우선 검토 {briefing.primaryCount}건</span>
                            <span className="text-xs text-neutral-500">관찰 필요 {briefing.watchCount}건</span>
                          </div>
                          <p className="mt-2 text-xs text-neutral-500">근거 출처: {briefing.evidence.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
