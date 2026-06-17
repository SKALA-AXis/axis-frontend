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
  deriveMentionDelta,
  formatPercent,
  formatTrendDelta,
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
            <p className="text-[13px] font-bold uppercase tracking-[1px] text-[var(--axis-accent-strong)]">최신 트렌드</p>
            <ExecutiveButton variant="secondary" onClick={() => reload()} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              새로고침
            </ExecutiveButton>
          </div>
          <p className="mt-4 max-w-6xl text-[2.25rem] font-display font-semibold leading-[1.3] text-[var(--axis-ink)]">
            {trendBrief.headline}
          </p>
          {trendBrief.supporting ? (
            <p className="mt-4 max-w-6xl text-xl leading-[1.55] text-[var(--axis-body)]">{trendBrief.supporting}</p>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="axis-panel-flat bg-[var(--axis-surface-soft)] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[1px] text-[var(--axis-accent-strong)]">글로벌 피어사별 최신 움직임</p>
                <p className="mt-1 text-caption text-[var(--axis-muted)]">포착 트렌드를 회사별로 묶어 확인합니다.</p>
              </div>
              <ExecutiveBadge tone="neutral">최근 30일</ExecutiveBadge>
            </div>
            <div className="mt-4 divide-y divide-[var(--axis-hairline)] border-t border-[var(--axis-hairline)]">
              {peerMovements.map((movement) => (
                <div key={movement.companyId} className="grid min-h-[88px] grid-cols-[104px_minmax(0,1fr)] items-start gap-3 py-3">
                  <div className="space-y-1 pt-0.5">
                    <strong className="block text-sm font-bold text-[var(--axis-ink)]">{movement.company}</strong>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <p className="text-[15px] font-semibold leading-6 text-[var(--axis-ink)]">{movement.summary}</p>
                    {movement.note ? (
                      <p className="text-sm leading-6 text-[var(--axis-muted)]">{movement.note}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="axis-panel-flat p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[1px] text-[var(--axis-accent-strong)]">트렌드 모멘텀</p>
              </div>
              <LineChart className="shrink-0 text-[var(--axis-success)]" size={22} />
            </div>
            <div className="mt-4 divide-y divide-[var(--axis-hairline)] rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
              {shiftItems.length === 0 ? (
                <p className="p-4 text-sm text-[var(--axis-muted)]">표시할 변화 신호가 없습니다.</p>
              ) : (
                shiftItems.slice(0, 5).map((item: GlobalTrendItem) => <TrendShiftRow key={item.id} item={item} />)
              )}
            </div>
          </section>
        </section>

        <section className="axis-panel-flat p-5">
          <p className="text-[13px] font-bold uppercase tracking-[1px] text-[var(--axis-accent-strong)]">근거 뉴스</p>
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
  return rankTrendItems(items);
}

function TrendShiftRow({ item }: { item: GlobalTrendItem }) {
  const delta = deriveMentionDelta(item.mention_count, item.frequency_delta_pct);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-20 shrink-0 text-right" title={formatTrendDelta(item.frequency_delta_pct)}>
        <DeltaStat delta={delta} pct={item.frequency_delta_pct} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[var(--axis-ink)]">{trendTitle(item)}</span>
      <span className="hidden text-[13px] text-[var(--axis-muted)] sm:inline">
        {delta?.kind === 'changed'
          ? `${delta.previous}건 → ${delta.current}건`
          : `언급 ${item.mention_count ?? 0}건`}
      </span>
      <ExecutiveBadge tone="neutral">{categoryLabel(item.keyword_category)}</ExecutiveBadge>
    </div>
  );
}

/** 언급 건수 변화 우선 표기 — 역산 불가(delta null)일 때만 % 폴백 */
function DeltaStat({ delta, pct }: { delta: ReturnType<typeof deriveMentionDelta>; pct?: number | null }) {
  if (delta?.kind === 'new') {
    return (
      <span
        className="inline-flex items-center rounded-full bg-[rgba(220,90,36,0.12)] px-2 py-0.5 text-[11px] font-black tracking-wide text-[var(--axis-accent-strong)]"
        title="이번 분석에서 처음 포착된 키워드"
      >
        NEW
      </span>
    );
  }
  if (delta?.kind === 'changed') {
    const isUp = delta.diff > 0;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-bold ${
          isUp ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'
        }`}
      >
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isUp ? '+' : '−'}
        {Math.abs(delta.diff)}건
      </span>
    );
  }
  if (delta?.kind === 'flat' || deltaTone(pct) === 'flat') {
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--axis-muted)]">유지</span>;
  }
  const isUp = deltaTone(pct) === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold ${
        isUp ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'
      }`}
    >
      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {formatPercent(pct)}
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
        <div className="space-y-2">
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
  const agentHeadline = items.find((item) => item.final_one_liner?.trim())?.final_one_liner?.trim();
  const agentSupporting = items.find((item) => item.overall_summary?.trim())?.overall_summary?.trim();
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
  const headline =
    agentHeadline ??
    `글로벌 피어사들은 AI를 ${selectedAxes.join(', ')}의 기본 레이어로 확장하고 있습니다.`;
  const supporting = agentSupporting ?? '';

  return { headline, supporting };
}

function buildPeerMovements(items: GlobalTrendItem[]) {
  const companyMovements = collectCompanyMovements(items);
  return GLOBAL_COMPANY_IDS.map((companyId) => {
    const companyMovement = companyMovements.get(companyId);
    const matched = items.filter((item) => item.leading_companies?.some((company) => company.toLowerCase() === companyId));

    return {
      companyId,
      company: companyLabel(companyId),
      summary: companyMovement?.headline || buildCompanyMovementSummary(matched),
      note: companyMovement?.summary || buildPeerMovementNote(matched),
    };
  });
}

function collectCompanyMovements(items: GlobalTrendItem[]) {
  const movements = new Map<string, NonNullable<GlobalTrendItem['company_movements']>[number]>();
  for (const item of items) {
    for (const movement of item.company_movements ?? []) {
      const companyId = movement.company_id?.trim().toLowerCase();
      if (!companyId || movements.has(companyId)) continue;
      if (!movement.headline && !movement.summary) continue;
      movements.set(companyId, movement);
    }
  }
  return movements;
}

function buildPeerMovementNote(items: GlobalTrendItem[]) {
  const primary = items[0];
  if (!primary) return '';

  const summary = displayableKoreanSummary(primary.summary);
  if (summary) return summary;

  return '';
}

function buildCompanyMovementSummary(items: GlobalTrendItem[]) {
  const trendTitles = items.slice(0, 2).map((item) => trendTitle(item));
  if (trendTitles.length > 0) return trendTitles.join(' · ');
  return '상위 트렌드 매칭 없음';
}

function displayableKoreanSummary(value?: string | null) {
  const summary = value?.trim();
  if (!summary) return '';
  if (!/[가-힣]/.test(summary)) return '';
  if (/global\s*6사\s*newsroom/i.test(summary)) return '';
  if (/intensity\s*=/i.test(summary)) return '';
  if (/(?:strong|moderate|weak)\s*강도\s*글로벌\s*트렌드/i.test(summary)) return '';

  return summary;
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
