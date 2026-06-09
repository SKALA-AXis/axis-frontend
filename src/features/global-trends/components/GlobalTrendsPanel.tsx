import {
  BrainCircuit,
  Globe2,
  LineChart,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { ExecutiveBadge, ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { PageProcessLoading, PageState } from '../../../app/components/shared/PageState';
import { useGlobalTrendsAnalysis } from '../hooks/useGlobalTrendsAnalysis';
import { useGlobalTrendsList } from '../hooks/useGlobalTrendsList';
import type {
  GlobalForecastRow,
  GlobalTrendItem,
  GlobalTrendSnapshot,
  ImpactMatrixCell,
  TrendDetection,
  PeerAlignmentRow,
  PeerAlignmentType,
} from '../model/globalTrends';

const PEER_LABELS: Record<string, string> = {
  sk_ax: 'SK AX',
  samsung_sds: '삼성 SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대 오토에버',
  posco_dx: '포스코 DX',
};

const ALIGNMENT_LABELS: Record<PeerAlignmentType, string> = {
  aligned: 'Aligned',
  lagging: 'Lagging',
  missing: 'Missing',
  diverging: 'Diverging',
};

const ALIGNMENT_TONE: Record<PeerAlignmentType, 'success' | 'accent' | 'neutral' | 'danger'> = {
  aligned: 'success',
  lagging: 'accent',
  missing: 'neutral',
  diverging: 'danger',
};

function peerLabel(peerId: string) {
  return PEER_LABELS[peerId] ?? peerId;
}

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}%`;
}

function intensityLabel(intensity?: string | null) {
  if (!intensity) return 'Moderate';
  return intensity.charAt(0).toUpperCase() + intensity.slice(1);
}

export interface GlobalTrendsPanelProps {
  /** Peer+ 탭에 embed 시 page shell 없이 패널만 렌더 */
  embedded?: boolean;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}

export function GlobalTrendsPanel({ embedded = false, onUpdateTimeChange }: GlobalTrendsPanelProps) {
  const { data: listData, isLoading, error, reload } = useGlobalTrendsList(30);
  const { data: runData, isLoading: isRunning, error: runError, activeStep, steps, run, reset } = useGlobalTrendsAnalysis();

  const displayItems = useMemo(() => listData?.items ?? [], [listData]);
  const headline = runData?.final_one_liner || displayItems[0]?.summary || '';
  const implication = runData?.sk_ax_implication || displayItems[0]?.sk_ax_implication || '';
  const snapshots = runData?.snapshots ?? [];
  const detections = runData?.trend_detections ?? buildDetectionsFromItems(displayItems);
  const forecasts = runData?.forecasts ?? displayItems.flatMap((item: GlobalTrendItem) => item.forecasts ?? []);
  const impactMatrix = runData?.impact_matrix ?? displayItems.flatMap((item: GlobalTrendItem) => item.impact_matrix ?? []);
  const isMockData = listData?._source === 'mock' || runData?._source === 'mock';

  useEffect(() => {
    const latest = displayItems[0]?.updated_at ?? displayItems[0]?.created_at ?? listData?.latest_trend_date ?? null;
    onUpdateTimeChange?.(latest);
  }, [displayItems, listData?.latest_trend_date, onUpdateTimeChange]);

  const handleRun = async () => {
    const result = await run({ window_days: 30 });
    if (result) {
      await reload();
    }
  };

  if (isLoading && !listData) {
    return (
      <PageState loading loadingLabel="글로벌 트렌드를 불러오는 중..." variant={embedded ? 'panel' : 'page'}>
        {null}
      </PageState>
    );
  }

  const content = (
    <PageState
      error={error}
      empty={!isLoading && displayItems.length === 0 && !runData}
      emptyLabel="저장된 글로벌 트렌드가 없습니다. 아래 버튼으로 분석을 실행하세요."
      onRetry={reload}
      variant="panel"
    >
      <header className="axis-panel-flat flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <p className="axis-kicker">Global IT Trends</p>
          <h2 className="axis-section-heading mt-1">
            {embedded ? '글로벌 산업 · Peer Alignment' : '글로벌 동향 · Peer Alignment'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--axis-body)]">
            글로벌 6사 newsroom + SPRi/BCG 리서치에서 추출한 IT 트렌드와 SK AX·4 Peer alignment를 확인합니다.
          </p>
          {listData?.latest_trend_date ? (
            <p className="mt-2 text-xs text-[var(--axis-muted)]">
              최근 분석일: {listData.latest_trend_date} · 저장된 keyword {listData.total}건
              {listData._source === 'live' ? ' · API 연동' : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExecutiveButton variant="secondary" onClick={() => reload()} disabled={isLoading || isRunning}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </ExecutiveButton>
          <ExecutiveButton onClick={handleRun} disabled={isRunning}>
            {isRunning ? '분석 중…' : '최신 분석 실행'}
          </ExecutiveButton>
          {runData ? (
            <ExecutiveButton variant="secondary" onClick={reset}>
              결과 초기화
            </ExecutiveButton>
          ) : null}
        </div>
      </header>

      {isMockData ? (
        <div className="rounded-[var(--axis-radius-md)] border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.08)] px-4 py-3 text-sm text-[var(--axis-ink)]">
          샘플 데이터입니다. 백엔드 API 연결 및 로그인 후 실제 `global_industry_trends` 분석 결과가 표시됩니다.
        </div>
      ) : null}

      {(runError || listData?.warning) ? (
        <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm text-[var(--axis-accent-strong)]">
          {runError ?? listData?.warning}
        </div>
      ) : null}

      {runData?.warning ? (
        <div className="rounded-[var(--axis-radius-md)] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.08)] px-4 py-3 text-sm text-[var(--axis-accent-strong)]">
          {runData.warning}
        </div>
      ) : null}

      <section className="axis-panel-flat overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="axis-kicker">Executive summary</p>
                <h3 className="axis-section-heading mt-1">글로벌 신호 → SK AX 의사결정</h3>
              </div>
              <ExecutiveBadge tone="accent">
                {runData?.confidence != null ? `신뢰도 ${Math.round(runData.confidence * 100)}%` : 'Global Signals'}
              </ExecutiveBadge>
            </div>
            <p className="mt-4 text-sm font-semibold leading-7 text-[var(--axis-ink)]">
              {headline || '분석 실행 후 한 줄 요약이 표시됩니다.'}
            </p>
            {implication ? (
              <div className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.22)] bg-[rgba(90,107,87,0.08)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-success)]">SK AX 시사점</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{implication}</p>
              </div>
            ) : null}
          </div>
          <aside className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]">
                <Globe2 size={20} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">Coverage</p>
                <h3 className="text-base font-display font-semibold text-[var(--axis-ink)]">글로벌 6사 + 4 Peer</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--axis-body)]">
              <p>NVIDIA · Apple · Microsoft · Google · Amazon · Meta newsroom</p>
              <p>SK AX · 삼성SDS · LG CNS · 현대오토에버 · 포스코DX alignment</p>
            </div>
          </aside>
        </div>
      </section>

      {snapshots.length > 0 ? <SnapshotSection snapshots={snapshots} /> : null}

      <section className="axis-panel-flat p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="axis-kicker">Trend detection</p>
            <h3 className="axis-section-heading mt-1">반복되는 글로벌 IT 키워드</h3>
          </div>
          <Sparkles className="shrink-0 text-[var(--axis-accent-strong)]" size={22} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {(detections.length > 0 ? detections : buildDetectionsFromItems(displayItems)).map((detection: TrendDetection, index: number) => (
            <article
              key={`${detection.theme}-${index}`}
              className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <ExecutiveBadge tone="accent">{intensityLabel(detection.intensity)}</ExecutiveBadge>
                <span className="text-xs font-semibold text-[var(--axis-muted)]">
                  {formatPercent(detection.frequency_delta_pct)} · mention {detection.mention_count ?? 0}
                </span>
              </div>
              <h4 className="mt-3 text-base font-display font-semibold leading-6 text-[var(--axis-ink)]">
                {detection.theme}
              </h4>
              {detection.leading_companies && detection.leading_companies.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-[var(--axis-muted)]">
                  Leading: {detection.leading_companies.join(', ')}
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
              <p className="axis-kicker">Peer alignment</p>
              <h3 className="axis-section-heading mt-1">트렌드별 SK AX · Peer 정렬</h3>
            </div>
            <Users className="text-[var(--axis-success)]" size={22} />
          </div>
          <div className="mt-5 space-y-4">
            {displayItems.length === 0 ? (
              <p className="text-sm text-[var(--axis-muted)]">저장된 alignment 데이터가 없습니다.</p>
            ) : (
              displayItems.map((item: GlobalTrendItem) => <PeerAlignmentCard key={item.id} item={item} />)
            )}
          </div>
        </article>

        <article className="axis-panel-flat p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="axis-kicker">Trend shift</p>
              <h3 className="axis-section-heading mt-1">시장이 바꾸는 구매 기준</h3>
            </div>
            <LineChart className="text-[var(--axis-success)]" size={22} />
          </div>
          <div className="mt-5 space-y-3">
            {displayItems.map((item: GlobalTrendItem, index: number) => (
              <section
                key={item.id}
                className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[rgba(90,107,87,0.12)] text-sm font-black text-[var(--axis-success)]">
                  {index + 1}
                </span>
                <div>
                  <ExecutiveBadge tone="accent">{item.keyword_category ?? 'Trend'}</ExecutiveBadge>
                  <h4 className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.title ?? item.keyword}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p>
                  {item.sk_ax_implication ? (
                    <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-accent-strong)]">
                      SK AX 판단: {item.sk_ax_implication}
                    </p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>

      {impactMatrix.length > 0 ? (
        <section className="axis-panel-flat p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="axis-kicker">Impact matrix</p>
              <h3 className="axis-section-heading mt-1">트렌드 × SK AX 사업라인</h3>
            </div>
            <BrainCircuit className="text-[var(--axis-accent-strong)]" size={23} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {impactMatrix.map((cell: ImpactMatrixCell, index: number) => (
              <article key={`${cell.trend_theme}-${cell.sk_ax_line}-${index}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ExecutiveBadge tone={cell.direction === 'negative' ? 'danger' : cell.direction === 'positive' ? 'success' : 'neutral'}>
                    {cell.direction ?? 'neutral'} · {cell.magnitude ?? 'low'}
                  </ExecutiveBadge>
                  <span className="text-xs text-[var(--axis-muted)]">{cell.sk_ax_line}</span>
                </div>
                <h4 className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">{cell.trend_theme}</h4>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{cell.channel}</p>
                {cell.quant_hint ? <p className="mt-2 text-xs text-[var(--axis-muted)]">{cell.quant_hint}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {forecasts.length > 0 ? (
        <section className="axis-panel-flat p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="axis-kicker">Forecast</p>
              <h3 className="axis-section-heading mt-1">1Q / 6M / 1Y 전망</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {forecasts.map((forecast: GlobalForecastRow, index: number) => (
              <article key={`${forecast.horizon}-${index}`} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                <ExecutiveBadge tone="accent">{forecast.horizon ?? 'Horizon'}</ExecutiveBadge>
                <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{forecast.narrative}</p>
                {forecast.sk_ax_impact ? (
                  <p className="mt-3 text-xs font-semibold leading-5 text-[var(--axis-accent-strong)]">{forecast.sk_ax_impact}</p>
                ) : null}
                {forecast.recommended_response ? (
                  <p className="mt-2 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--axis-ink)]">
                    권장 대응: {forecast.recommended_response}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PageState>
  );

  return (
    <>
      <div className={embedded ? 'space-y-5' : 'space-y-5 pb-12 pt-3'}>{content}</div>
      {isRunning ? (
        <PageProcessLoading
          eyebrow="GlobalTrendsAgent"
          title="글로벌 IT 트렌드 분석 중"
          description="5-phase pipeline (Snapshot → Detection → Alignment → Impact → Synthesis)을 실행하고 있습니다."
          steps={steps.map((step: { label: string; detail: string }, index: number) => ({
            label: step.label,
            detail: index === activeStep ? step.detail : step.label,
          }))}
          meta={['LLM 3회 호출 · 약 1~3분 소요']}
        />
      ) : null}
    </>
  );
}

function SnapshotSection({ snapshots }: { snapshots: GlobalTrendSnapshot[] }) {
  return (
    <section className="axis-panel-flat p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="axis-kicker">Snapshot</p>
          <h3 className="axis-section-heading mt-1">글로벌 6사 newsroom 분포</h3>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {snapshots.map((snapshot) => (
          <article key={snapshot.company_id} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--axis-ink)]">{snapshot.company_id}</p>
            <p className="mt-2 text-2xl font-display font-bold text-[var(--axis-accent-strong)]">{snapshot.card_count}</p>
            <p className="text-xs text-[var(--axis-muted)]">cards</p>
            {snapshot.top_themes && snapshot.top_themes.length > 0 ? (
              <p className="mt-3 text-xs leading-5 text-[var(--axis-body)]">{snapshot.top_themes.slice(0, 4).join(' · ')}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function PeerAlignmentCard({ item }: { item: GlobalTrendItem }) {
  const rows = item.peer_alignment ?? [];
  return (
    <section className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--axis-ink)]">{item.title ?? item.keyword}</h4>
        <span className="text-xs text-[var(--axis-muted)]">impact {item.impact_score ?? '—'}</span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-xs text-[var(--axis-muted)]">alignment 데이터 없음</p>
        ) : (
          rows.map((row: PeerAlignmentRow) => <PeerAlignmentRowView key={`${item.id}-${row.peer_id}`} row={row} />)
        )}
      </div>
    </section>
  );
}

function PeerAlignmentRowView({ row }: { row: PeerAlignmentRow }) {
  const type = row.alignment_type ?? 'missing';
  return (
    <div className="flex items-start justify-between gap-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-[var(--axis-ink)]">{peerLabel(row.peer_id)}</p>
        {row.strategic_note ? <p className="mt-1 text-xs leading-5 text-[var(--axis-body)]">{row.strategic_note}</p> : null}
      </div>
      <ExecutiveBadge tone={ALIGNMENT_TONE[type]}>{ALIGNMENT_LABELS[type]}</ExecutiveBadge>
    </div>
  );
}

function buildDetectionsFromItems(items: GlobalTrendItem[]): TrendDetection[] {
  return items.map((item) => ({
    theme: item.keyword,
    mention_count: item.mention_count,
    intensity: (item.intensity as TrendDetection['intensity']) ?? 'moderate',
    leading_companies: item.leading_companies ?? [],
    frequency_delta_pct: item.frequency_delta_pct ?? 0,
  }));
}
