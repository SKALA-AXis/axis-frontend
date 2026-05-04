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
    <div className="axis-page flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="axis-page-header">
          <h1 className="axis-page-title">{uiText.briefings.pageTitle}</h1>
          <p className="axis-page-subtitle">{uiText.briefings.pageSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {uiText.common.loadError}
          </div>
        )}

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setBriefingType('daily')}
            className={`axis-tab ${
              briefingType === 'daily'
                ? 'bg-[#ff7f00] text-white'
                : ''
            }`}
          >
            {uiText.briefings.dailyTab}
          </button>
          <button
            onClick={() => setBriefingType('weekly')}
            className={`axis-tab ${
              briefingType === 'weekly'
                ? 'bg-[#ff7f00] text-white'
                : ''
            }`}
          >
            {uiText.briefings.weeklyTab}
          </button>
        </div>

        {isLoading && !briefings ? (
          <div className="axis-panel rounded-xl p-6 text-sm text-neutral-500">
            {uiText.common.loading}
          </div>
        ) : null}

        {briefings && activeSnapshot ? (
          <>
            <div className="axis-glass mb-6 rounded-xl bg-white/82 p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="axis-section-title">
                  {briefingType === 'daily' ? uiText.briefings.todayDailyTitle : uiText.briefings.thisWeekTitle}
                </h2>
              </div>

              <div className="axis-soft-card rounded-lg bg-white/90 p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{activeSnapshot.title}</h3>
                    <p className="text-sm text-neutral-600">{activeSnapshot.summary}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
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

                    <div className="axis-soft-card rounded-xl bg-white/92 p-4 lg:col-span-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[#d96200]" />
                      <h4 className="text-sm font-bold text-black">{uiText.briefings.evidenceTitle}</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-neutral-700">
                      {briefings.evidenceSources.map((source) => (
                          <li key={source} className="axis-soft-card rounded-lg bg-white/82 px-3 py-2">
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-12">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="axis-section-title">{uiText.briefings.historyTitle}</h2>
                    <button
                      onClick={() => setIsFilterOpen((current) => !current)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isFilterOpen
                          ? 'border-[#ff7f00]/20 bg-[#ff7f00]/8 text-[#d96200]'
                          : 'axis-glass text-neutral-600 hover:bg-white/82'
                      }`}
                      aria-expanded={isFilterOpen}
                    >
                      {uiText.briefings.filter}
                    </button>
                  </div>

                  {isFilterOpen && (
                    <div className="axis-panel p-5">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.briefings.peerFilter}</label>
                          <select
                            value={peerFilter}
                            onChange={(event) => setPeerFilter(event.target.value)}
                            className="axis-input w-full rounded-lg bg-white/92 px-3 py-2 text-sm outline-none"
                          >
                            <option value="all">전체 Peer사</option>
                            <option value="samsung_sds">삼성 SDS</option>
                            <option value="lg_cns">LG CNS</option>
                            <option value="hyundai_autoever">현대 오토에버</option>
                            <option value="posco_dx">포스코 DX</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.briefings.keywordFilter}</label>
                          <input
                            type="text"
                            value={keywordFilter}
                            onChange={(event) => setKeywordFilter(event.target.value)}
                            placeholder="예: Agentic AI, 금융, SDV"
                            className="axis-input w-full rounded-lg bg-white/92 px-3 py-2 text-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.briefings.dateFilter}</label>
                          <select
                            value={dateRange}
                            onChange={(event) => setDateRange(event.target.value)}
                            className="axis-input w-full rounded-lg bg-white/92 px-3 py-2 text-sm outline-none"
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
                    <div key={briefing.id} className="axis-panel p-4 transition-colors hover:border-[#ff7f00]/20 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <Calendar size={16} className="text-neutral-500" />
                            <span className="text-sm text-neutral-500">{briefing.date}</span>
                            <span className="rounded bg-[#ff7f00]/10 px-2 py-1 text-xs text-[#d96200]">
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
