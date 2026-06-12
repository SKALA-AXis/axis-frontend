import { ChevronDown, ExternalLink, LineChart, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { ExecutiveBadge, ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { PageState } from '../../../app/components/shared/PageState';
import { useGlobalTrendsList } from '../hooks/useGlobalTrendsList';
import type { GlobalTrendEvidenceLink, GlobalTrendItem } from '../model/globalTrends';
import {
  categoryLabel,
  companyLabel,
  deltaTone,
  formatPercent,
  rankTrendItems,
  rankTrendShifts,
  trendTitle,
} from './globalTrendsFormatters';

const AUTO_UPDATE_LABEL = '매일 07:40 KST cron 자동 갱신';
const GLOBAL_COMPANY_IDS = ['nvidia', 'microsoft', 'google', 'amazon', 'meta', 'apple'];

export interface GlobalTrendsPanelProps {
  /** Peer+ 탭에 embed 시 page shell 없이 패널만 렌더 */
  embedded?: boolean;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}

export function GlobalTrendsPanel({ embedded = false, onUpdateTimeChange }: GlobalTrendsPanelProps) {
  const { data: listData, isLoading, error, reload } = useGlobalTrendsList(30);

  const topItems = useMemo(() => rankTrendItems(listData?.items ?? []), [listData?.items]);
  const shiftItems = useMemo(() => rankRisingTrendShifts(listData?.items ?? []), [listData?.items]);
  const peerMovements = useMemo(() => buildPeerMovements(topItems), [topItems]);
  const evidenceGroups = useMemo(() => buildEvidenceGroups(topItems), [topItems]);
  const trendBrief = useMemo(() => buildTrendBrief(topItems), [topItems]);

  useEffect(() => {
    const latest = topItems[0]?.updated_at ?? topItems[0]?.created_at ?? listData?.latest_trend_date ?? null;
    onUpdateTimeChange?.(latest);
  }, [topItems, listData?.latest_trend_date, onUpdateTimeChange]);

  if (isLoading && !listData) {
    return (
      <PageState loading loadingLabel="글로벌 트렌드를 불러오는 중..." variant={embedded ? 'panel' : 'page'}>
        {null}
      </PageState>
    );
  }

  return (
    <div className={embedded ? 'space-y-5' : 'space-y-5 pb-12 pt-3'}>
      <PageState
        error={error}
        empty={!isLoading && topItems.length === 0}
        emptyLabel={`저장된 글로벌 트렌드가 없습니다. ${AUTO_UPDATE_LABEL} 후 다시 확인하세요.`}
        onRetry={reload}
        variant="panel"
      >
        {listData?.warning ? (
          <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm text-[var(--axis-accent-strong)]">
            {listData.warning}
          </div>
        ) : null}

        <section className="axis-panel-flat p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="axis-kicker">최신 트렌드</p>
            <ExecutiveButton variant="secondary" onClick={() => reload()} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              새로고침
            </ExecutiveButton>
          </div>
          <p className="mt-4 max-w-5xl text-[2rem] font-display font-semibold leading-[1.32] text-[var(--axis-ink)]">
            {trendBrief.headline}
          </p>
          <p className="mt-3 max-w-6xl text-lg leading-[1.55] text-[var(--axis-body)]">{trendBrief.supporting}</p>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="axis-panel-flat bg-[var(--axis-surface-soft)] p-5">
            <p className="axis-kicker">피어사별 최신 움직임</p>
            <div className="mt-4 divide-y divide-[var(--axis-hairline)] border-t border-[var(--axis-hairline)]">
              {peerMovements.map((movement) => (
                <div key={movement.companyId} className="grid min-h-12 grid-cols-[104px_minmax(0,1fr)] items-center gap-3 py-3">
                  <strong className="text-caption-bold text-[var(--axis-ink)]">{movement.company}</strong>
                  <span className="text-sm leading-6 text-[var(--axis-body)]">{movement.summary}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="axis-panel-flat p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">변화 신호</p>
                <h3 className="axis-section-heading mt-1">새롭게 힘을 받는 신호</h3>
              </div>
              <LineChart className="shrink-0 text-[var(--axis-success)]" size={22} />
            </div>
            <div className="mt-4 divide-y divide-[var(--axis-hairline)] rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
              {shiftItems.length === 0 ? (
                <p className="p-4 text-sm text-[var(--axis-muted)]">새롭게 강해진 신호가 없습니다.</p>
              ) : (
                shiftItems.slice(0, 5).map((item: GlobalTrendItem) => <TrendShiftRow key={item.id} item={item} />)
              )}
            </div>
          </section>
        </section>

        <section className="axis-panel-flat p-5">
          <p className="axis-kicker">근거 뉴스</p>
          <h3 className="axis-section-heading mt-1">클릭하면 원문 기사와 판단 근거를 확인</h3>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {evidenceGroups.length === 0 ? (
              <p className="text-sm text-[var(--axis-muted)]">연결된 원문 링크가 없습니다.</p>
            ) : (
              evidenceGroups.map((item) => <EvidenceDetails key={item.id} item={item} />)
            )}
          </div>
        </section>
      </PageState>
    </div>
  );
}

function rankRisingTrendShifts(items: GlobalTrendItem[]) {
  return rankTrendShifts(items).filter((item) => (item.frequency_delta_pct ?? 0) > 0);
}

function TrendShiftRow({ item }: { item: GlobalTrendItem }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-20 shrink-0 text-right">
        <DeltaStat value={item.frequency_delta_pct} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--axis-ink)]">{trendTitle(item)}</span>
      <span className="hidden text-xs text-[var(--axis-muted)] sm:inline">언급 {item.mention_count ?? 0}건</span>
      <ExecutiveBadge tone="neutral">{categoryLabel(item.keyword_category)}</ExecutiveBadge>
    </div>
  );
}

function DeltaStat({ value }: { value?: number | null }) {
  const tone = deltaTone(value);
  if (tone === 'flat') {
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--axis-muted)]">유지</span>;
  }
  const isUp = tone === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold ${
        isUp ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'
      }`}
    >
      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {formatPercent(value)}
    </span>
  );
}

function EvidenceDetails({ item }: { item: EvidenceGroup }) {
  return (
    <details className="group overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
      <summary className="grid min-h-[76px] cursor-pointer list-none grid-cols-[minmax(0,1fr)_32px] items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <strong className="block truncate text-sm font-semibold text-[var(--axis-ink)]">{item.title}</strong>
          <span className="mt-1 block text-caption text-[var(--axis-muted)]">{item.sources}</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-accent-strong)] transition group-open:rotate-180">
          <ChevronDown size={16} />
        </span>
      </summary>
      <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
        {item.summary ? <p className="text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p> : null}
        <div className="mt-3 space-y-2">
          {item.links.map((link) => (
            <a
              key={`${item.id}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-caption-bold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
            >
              <span className="min-w-0 truncate">{link.title || '원문 기사'}</span>
              <ExternalLink size={14} className="shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}

function buildTrendBrief(items: GlobalTrendItem[]) {
  const categories = new Set(items.map((item) => item.keyword_category).filter(Boolean));
  const keywords = new Set(items.map((item) => item.keyword.toLowerCase()));
  const axes: string[] = [];

  if (hasAny(keywords, ['copilot', 'ai agent', 'edge ai', 'llm', 'generative ai'])) {
    axes.push('제품 경험');
  }
  if (categories.has('ai_infra') || categories.has('cloud') || hasAny(keywords, ['gpu', 'inference', 'cloud'])) {
    axes.push('AI 인프라 운영');
  }
  if (hasAny(keywords, ['robotics', 'security', 'partnership'])) {
    axes.push('산업 적용');
  }

  const selectedAxes = axes.length > 0 ? axes : ['제품 경험', 'AI 인프라 운영', '산업 적용'];
  const headline = `글로벌 피어사들은 AI를 별도 기능이 아니라 ${selectedAxes.join(', ')}의 기본 레이어로 확장하고 있습니다.`;
  const topKeywords = items.slice(0, 3).map((item) => trendTitle(item));
  const supporting =
    topKeywords.length > 0
      ? `${topKeywords.join(', ')} 신호가 함께 나타나며 기업 AI의 관심이 구축보다 실제 운영과 적용으로 이동하고 있습니다.`
      : '기업 AI의 관심이 구축보다 실제 운영과 적용으로 이동하고 있습니다.';

  return { headline, supporting };
}

function buildPeerMovements(items: GlobalTrendItem[]) {
  return GLOBAL_COMPANY_IDS.map((companyId) => {
    const matched = items
      .filter((item) => item.leading_companies?.some((company) => company.toLowerCase() === companyId))
      .slice(0, 2)
      .map((item) => trendTitle(item));

    return {
      companyId,
      company: companyLabel(companyId),
      summary: matched.length > 0 ? matched.join(' · ') : fallbackPeerMovement(companyId),
    };
  });
}

function fallbackPeerMovement(companyId: string) {
  const fallbacks: Record<string, string> = {
    nvidia: 'AI 인프라 · 제조 · 로보틱스',
    microsoft: 'Copilot · Azure AI · 업무 자동화',
    google: 'Gemini · Workspace · Cloud',
    amazon: 'AWS · 생성형 AI · 산업 사례',
    meta: '오픈 모델 · AI Agent',
    apple: '온디바이스 AI · 개인정보 보호',
  };
  return fallbacks[companyId] ?? '글로벌 IT 신호 관찰 중';
}

type EvidenceGroup = {
  id: string;
  title: string;
  summary: string;
  sources: string;
  links: Required<Pick<GlobalTrendEvidenceLink, 'title' | 'url'>>[];
};

function buildEvidenceGroups(items: GlobalTrendItem[]): EvidenceGroup[] {
  return items
    .map((item) => {
      const links = (item.evidence_source_links ?? [])
        .filter((link): link is GlobalTrendEvidenceLink & { url: string } => Boolean(link.url))
        .slice(0, 3)
        .map((link) => ({
          title: link.title || link.source_name || '원문 기사',
          url: link.url,
        }));

      return {
        id: item.id,
        title: trendTitle(item),
        summary: item.summary ?? '',
        sources: formatEvidenceSources(item.evidence_source_links),
        links,
      };
    })
    .filter((item) => item.links.length > 0)
    .slice(0, 3);
}

function formatEvidenceSources(links?: GlobalTrendEvidenceLink[]) {
  const sources = Array.from(
    new Set((links ?? []).map((link) => link.source_name).filter((source): source is string => Boolean(source))),
  ).slice(0, 3);
  return sources.length > 0 ? sources.join(' · ') : '원문 기사';
}

function hasAny(values: Set<string>, targets: string[]) {
  return targets.some((target) => values.has(target));
}
