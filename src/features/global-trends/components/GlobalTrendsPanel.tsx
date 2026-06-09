import {
  Globe2,
  LineChart,
  RefreshCw,
  Sparkles,
  Tags,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { ExecutiveBadge, ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { PageState } from '../../../app/components/shared/PageState';
import { useGlobalTrendsList } from '../hooks/useGlobalTrendsList';
import type { GlobalTrendItem, TrendDetection } from '../model/globalTrends';
import {
  buildDetectionsFromItems,
  categoryLabel,
  formatLeadingCompanies,
  formatPercent,
  formatTrendDelta,
  intensityLabel,
  rankTrendItems,
  rankTrendShifts,
  trendTitle,
} from './globalTrendsFormatters';

const AUTO_UPDATE_LABEL = '매일 02:30 KST cron 자동 갱신';

export interface GlobalTrendsPanelProps {
  /** Peer+ 탭에 embed 시 page shell 없이 패널만 렌더 */
  embedded?: boolean;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}

export function GlobalTrendsPanel({ embedded = false, onUpdateTimeChange }: GlobalTrendsPanelProps) {
  const { data: listData, isLoading, error, reload } = useGlobalTrendsList(30);

  const topItems = useMemo(() => rankTrendItems(listData?.items ?? []), [listData?.items]);
  const shiftItems = useMemo(() => rankTrendShifts(listData?.items ?? []), [listData?.items]);
  const headline = topItems[0]?.summary ?? '';
  const detections = useMemo(() => buildDetectionsFromItems(listData?.items ?? []), [listData?.items]);
  const headlineConfidence = topItems[0]?.confidence;
  const isMockData = listData?._source === 'mock';

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
        <header className="axis-panel-flat flex flex-wrap items-start justify-between gap-4 p-5">
          <div>
            <p className="axis-kicker">글로벌 IT 동향</p>
            <h2 className="axis-section-heading mt-1">글로벌 산업 · 6사 트렌드</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--axis-body)]">
              엔비디아·애플·마이크로소프트·구글·아마존·메타 newsroom과 SPRi/BCG 리서치에서 추출한 IT 트렌드와
              사업 섹터별 변화를 확인합니다. {AUTO_UPDATE_LABEL}됩니다.
            </p>
            {listData?.latest_trend_date ? (
              <p className="mt-2 text-xs text-[var(--axis-muted)]">
                최근 분석일: {listData.latest_trend_date} · 핵심 키워드 {Math.min(topItems.length, 10)}건
                {listData._source === 'live' ? ' · API 연동' : null}
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--axis-muted)]">{AUTO_UPDATE_LABEL}</p>
            )}
          </div>
          <ExecutiveButton variant="secondary" onClick={() => reload()} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </ExecutiveButton>
        </header>

        {isMockData ? (
          <div className="rounded-[var(--axis-radius-md)] border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.08)] px-4 py-3 text-sm text-[var(--axis-ink)]">
            샘플 데이터입니다. 백엔드 API 연결 및 로그인 후 실제 `global_industry_trends` 분석 결과가 표시됩니다.
          </div>
        ) : null}

        {listData?.warning ? (
          <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm text-[var(--axis-accent-strong)]">
            {listData.warning}
          </div>
        ) : null}

        <section className="axis-panel-flat overflow-hidden p-0">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="axis-kicker">핵심 요약</p>
                  <h3 className="axis-section-heading mt-1">글로벌 IT 동향 한 줄 요약</h3>
                </div>
                <ExecutiveBadge tone="accent">
                  {headlineConfidence != null ? `신뢰도 ${Math.round(headlineConfidence * 100)}%` : '글로벌 신호'}
                </ExecutiveBadge>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--axis-ink)]">
                {headline || '최근 cron 분석 결과가 반영되면 한 줄 요약이 표시됩니다.'}
              </p>
            </div>
            <aside className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-5 xl:border-l xl:border-t-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]">
                  <Globe2 size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--axis-muted)]">분석 범위</p>
                  <h3 className="text-base font-display font-semibold text-[var(--axis-ink)]">글로벌 6사</h3>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm leading-6 text-[var(--axis-body)]">
                <p>엔비디아 · 애플 · 마이크로소프트</p>
                <p>구글 · 아마존 · 메타 newsroom</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="axis-panel-flat p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="axis-kicker">핵심 IT 키워드</p>
              <h3 className="axis-section-heading mt-1">반복되는 글로벌 IT 키워드 (상위 10)</h3>
            </div>
            <Sparkles className="shrink-0 text-[var(--axis-accent-strong)]" size={22} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {detections.map((detection: TrendDetection, index: number) => (
              <article
                key={`${detection.theme}-${index}`}
                className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <ExecutiveBadge tone="accent">{intensityLabel(detection.intensity)}</ExecutiveBadge>
                  <span className="text-xs font-semibold text-[var(--axis-muted)]">
                    {formatPercent(detection.frequency_delta_pct)} · 언급 {detection.mention_count ?? 0}건
                  </span>
                </div>
                <h4 className="mt-3 text-base font-display font-semibold leading-6 text-[var(--axis-ink)]">
                  {detection.theme}
                </h4>
                {formatLeadingCompanies(detection.leading_companies) ? (
                  <p className="mt-2 text-xs leading-5 text-[var(--axis-muted)]">
                    주도 기업: {formatLeadingCompanies(detection.leading_companies)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="axis-panel-flat p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">사업 섹터 · 키워드</p>
                <h3 className="axis-section-heading mt-1">트렌드별 핵심 섹터</h3>
              </div>
              <Tags className="text-[var(--axis-success)]" size={22} />
            </div>
            <div className="mt-5 space-y-4">
              {topItems.length === 0 ? (
                <p className="text-sm text-[var(--axis-muted)]">저장된 섹터 데이터가 없습니다.</p>
              ) : (
                topItems.map((item: GlobalTrendItem) => <TrendSectorCard key={item.id} item={item} />)
              )}
            </div>
          </article>

          <article className="axis-panel-flat p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="axis-kicker">트렌드 변화</p>
                <h3 className="axis-section-heading mt-1">과거 대비 트렌드 이동</h3>
              </div>
              <LineChart className="text-[var(--axis-success)]" size={22} />
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--axis-muted)]">
              이전 분석 기간 대비 언급 빈도와 강도가 어떻게 바뀌었는지 보여줍니다.
            </p>
            <div className="mt-5 space-y-3">
              {shiftItems.length === 0 ? (
                <p className="text-sm text-[var(--axis-muted)]">변화율 데이터가 없습니다.</p>
              ) : (
                shiftItems.map((item: GlobalTrendItem, index: number) => (
                  <section
                    key={item.id}
                    className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[rgba(90,107,87,0.12)] text-sm font-black text-[var(--axis-success)]">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ExecutiveBadge tone="accent">{categoryLabel(item.keyword_category)}</ExecutiveBadge>
                        <ExecutiveBadge tone="neutral">{intensityLabel(item.intensity)}</ExecutiveBadge>
                      </div>
                      <h4 className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{trendTitle(item)}</h4>
                      <p className="mt-2 text-xs font-semibold text-[var(--axis-accent-strong)]">
                        {formatTrendDelta(item.frequency_delta_pct)}
                      </p>
                      {item.summary ? (
                        <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p>
                      ) : null}
                      {formatLeadingCompanies(item.leading_companies) ? (
                        <p className="mt-2 text-xs leading-5 text-[var(--axis-muted)]">
                          변화를 주도: {formatLeadingCompanies(item.leading_companies)}
                        </p>
                      ) : null}
                    </div>
                  </section>
                ))
              )}
            </div>
          </article>
        </section>
      </PageState>
    </div>
  );
}

function TrendSectorCard({ item }: { item: GlobalTrendItem }) {
  const leaders = formatLeadingCompanies(item.leading_companies);

  return (
    <section className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ExecutiveBadge tone="accent">{categoryLabel(item.keyword_category)}</ExecutiveBadge>
        <span className="text-xs text-[var(--axis-muted)]">언급 {item.mention_count ?? 0}건</span>
      </div>
      <h4 className="mt-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{trendTitle(item)}</h4>
      {item.summary ? (
        <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p>
      ) : null}
      {leaders ? (
        <p className="mt-3 text-xs leading-5 text-[var(--axis-muted)]">주도 기업: {leaders}</p>
      ) : null}
    </section>
  );
}
