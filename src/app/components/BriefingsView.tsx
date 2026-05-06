import { useState } from 'react';
import { Calendar, FileText, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useBriefings } from '../../features/briefings/hooks/useBriefings';
import type { BriefingHistoryItem, BriefingSnapshot } from '../../features/briefings/model/briefing';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
} from './executive/ExecutiveSystem';

interface BriefingsViewProps {
  onNavigate: (view: string) => void;
}

export function BriefingsView({ onNavigate }: BriefingsViewProps) {
  const { briefings, isLoading, error } = useBriefings();
  const [briefingType, setBriefingType] = useState<'daily' | 'weekly'>('daily');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const activeSnapshot = briefingType === 'daily' ? briefings?.dailySnapshot : briefings?.weeklySnapshot;
  const selectedHistoryItem = briefings?.history.find((item) => item.id === selectedHistoryId) ?? null;
  const filteredHistory =
    briefings?.history.filter((item) => {
      const q = query.trim().toLowerCase();
      return !q || [item.title, item.summary, item.evidence.join(' ')].join(' ').toLowerCase().includes(q);
    }) ?? [];

  if (isLoading) {
    return <ExecutivePage className="p-6 text-sm text-[var(--axis-muted)]">브리핑을 불러오는 중입니다.</ExecutivePage>;
  }

  if (error || !briefings || !activeSnapshot) {
    return <ExecutivePage className="p-6 text-sm text-[var(--axis-muted)]">{error ?? '브리핑을 표시할 수 없습니다.'}</ExecutivePage>;
  }

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="Executive briefing"
          title="브리핑"
          subtitle="카드뉴스 묶음에서 반복 신호, 근거, SK AX 시사점을 추출해 임원 보고용 리포트 흐름으로 정리합니다."
          actions={
            <>
              <ExecutiveButton variant="secondary" icon={<Search size={16} />} onClick={() => onNavigate('issues')}>
                카드 검색
              </ExecutiveButton>
              <ExecutiveButton icon={<RefreshCw size={16} />}>브리핑 생성</ExecutiveButton>
            </>
          }
        />

        <section className="grid gap-3 md:grid-cols-4">
          <ExecutiveMetric label="Briefing type" value={briefingType === 'daily' ? 'Daily' : 'Weekly'} helper="현재 읽는 리포트" tone="accent" />
          <ExecutiveMetric label="Sections" value={activeSnapshot.sections.length} helper="요약 섹션 수" />
          <ExecutiveMetric label="Evidence sources" value={briefings.evidenceSources.length} helper="출처 묶음" tone="success" />
          <ExecutiveMetric label="History" value={briefings.history.length} helper="전달 완료 리포트" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <main className="space-y-5">
            <div className="axis-panel-flat overflow-hidden">
              <div className="border-b border-[var(--axis-hairline)] bg-white px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="axis-kicker">Current report</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--axis-ink)]">{activeSnapshot.title}</h2>
                  </div>
                  <div className="inline-flex rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-1">
                    {(['daily', 'weekly'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBriefingType(type)}
                        className={`rounded-[var(--axis-radius-sm)] px-3 py-2 text-sm font-semibold transition ${
                          briefingType === type ? 'bg-white text-[var(--axis-accent-strong)]' : 'text-[var(--axis-muted)]'
                        }`}
                      >
                        {type === 'daily' ? '일간' : '주간'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--axis-body)]">{activeSnapshot.summary}</p>
              </div>

              <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                <BriefingNarrative snapshot={activeSnapshot} />
                <EvidenceLedger sources={briefings.evidenceSources} />
              </div>
            </div>

            {selectedHistoryItem ? <HistoryBriefing item={selectedHistoryItem} /> : null}
          </main>

          <aside className="space-y-4">
            <section className="axis-panel-flat p-4">
              <div className="flex items-center gap-2">
                <Calendar size={17} className="text-[var(--axis-accent)]" />
                <h3 className="axis-section-heading">History</h3>
              </div>
              <label className="mt-4 flex h-10 items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white px-3">
                <Search size={15} className="text-[var(--axis-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="브리핑 검색"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <div className="mt-4 space-y-2">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedHistoryId((current) => (current === item.id ? null : item.id))}
                    className={`block w-full rounded-[var(--axis-radius-md)] border p-3 text-left transition ${
                      selectedHistoryId === item.id ? 'border-[var(--axis-accent)] bg-white' : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--axis-accent-strong)]">{item.date}</span>
                      <ExecutiveBadge tone="success">delivered</ExecutiveBadge>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--axis-muted)]">{item.summary}</p>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function BriefingNarrative({ snapshot }: { snapshot: BriefingSnapshot }) {
  return (
    <section className="border-b border-[var(--axis-hairline)] p-5 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2">
        <Sparkles size={17} className="text-[var(--axis-accent)]" />
        <h3 className="axis-section-heading">Executive narrative</h3>
      </div>
      <div className="mt-4 space-y-4">
        {snapshot.sections.map((section, sectionIndex) => (
          <article key={section.title} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white p-4">
            <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">{String(sectionIndex + 1).padStart(2, '0')}</span>
            <h4 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--axis-ink)]">{section.title}</h4>
            <div className="mt-3 space-y-3">
              {section.items.map((item) => (
                <div key={item.headline} className="border-l-2 border-[var(--axis-accent)] pl-3">
                  <p className="text-sm font-medium leading-6 text-[var(--axis-ink)]">{item.headline}</p>
                  <p className="mt-1 text-xs text-[var(--axis-muted)]">{item.source}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceLedger({ sources }: { sources: string[] }) {
  return (
    <section className="p-5">
      <div className="flex items-center gap-2">
        <FileText size={17} className="text-[var(--axis-accent)]" />
        <h3 className="axis-section-heading">Evidence ledger</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
        브리핑은 카드뉴스 원문을 반복하지 않고, 카드 묶음에서 추출한 반복 신호와 근거 요약을 제공합니다.
      </p>
      <div className="mt-4 space-y-2">
        {sources.map((source, index) => (
          <div key={source} className="flex items-center gap-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] px-3 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-[var(--axis-radius-sm)] bg-white text-xs font-semibold text-[var(--axis-accent-strong)]">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-[var(--axis-body)]">{source}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoryBriefing({ item }: { item: BriefingHistoryItem }) {
  return (
    <section className="axis-panel-flat p-5">
      <p className="axis-kicker">Selected history</p>
      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--axis-ink)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ExecutiveMetric label="Primary" value={item.primaryCount} helper="우선 검토" tone="danger" />
        <ExecutiveMetric label="Watch" value={item.watchCount} helper="지속 관찰" tone="warning" />
        <ExecutiveMetric label="Evidence" value={item.evidence.length} helper={item.evidence.join(', ')} tone="success" />
      </div>
    </section>
  );
}
