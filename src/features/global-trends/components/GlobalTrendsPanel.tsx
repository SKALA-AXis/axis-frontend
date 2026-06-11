import {
  Globe2,
  LineChart,
  Minus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { ExecutiveBadge, ExecutiveButton } from '../../../app/components/executive/ExecutiveSystem';
import { PageState } from '../../../app/components/shared/PageState';
import { useGlobalTrendsList } from '../hooks/useGlobalTrendsList';
import type { GlobalTrendItem, PeerAlignmentRow } from '../model/globalTrends';
import {
  ALIGNMENT_META,
  categoryLabel,
  deltaTone,
  formatLeadingCompanies,
  formatPercent,
  intensityLabel,
  peerLabel,
  rankTrendItems,
  rankTrendShifts,
  sortPeerAlignment,
  trendTitle,
} from './globalTrendsFormatters';

const AUTO_UPDATE_LABEL = '매일 07:40 KST cron 자동 갱신';

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
  const headlineImplication = topItems[0]?.sk_ax_implication ?? null;
  const headlineConfidence = topItems[0]?.confidence;

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
              엔비디아·애플·마이크로소프트·구글·아마존·메타 newsroom과 SPRi/BCG 리서치에서 추출한 IT 트렌드를
              SK AX 관점으로 해석합니다. {AUTO_UPDATE_LABEL}됩니다.
            </p>
            {listData?.latest_trend_date ? (
              <p className="mt-2 text-xs text-[var(--axis-muted)]">
                최근 분석일: {listData.latest_trend_date} · 핵심 트렌드 {Math.min(topItems.length, 10)}건
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
              {headlineImplication ? (
                <div className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(198,106,74,0.22)] bg-[rgba(198,106,74,0.06)] p-4">
                  <p className="text-caption-bold text-[var(--axis-accent-strong)]">✨ SK AX 시사점 (AI 초안)</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{headlineImplication}</p>
                </div>
              ) : null}
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
              <p className="axis-kicker">핵심 트렌드</p>
              <h3 className="axis-section-heading mt-1">지금 무엇이 움직이고, SK AX에 어떤 의미인가</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">
                영향도 순 정렬 · 각 카드는 트렌드 요약 → SK AX 시사점 → 국내 Peer 대응 현황 순서입니다.
              </p>
            </div>
            <Sparkles className="shrink-0 text-[var(--axis-accent-strong)]" size={22} />
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {topItems.map((item: GlobalTrendItem, index: number) => (
              <TrendCard key={item.id} item={item} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="axis-panel-flat p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="axis-kicker">트렌드 변화</p>
              <h3 className="axis-section-heading mt-1">이전 분석 대비 언급량 변화</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">
                변화폭이 큰 순서입니다. 상승(▲)은 가속 중인 신호, 하락(▼)은 식고 있는 신호입니다.
              </p>
            </div>
            <LineChart className="shrink-0 text-[var(--axis-success)]" size={22} />
          </div>
          <div className="mt-4 divide-y divide-[var(--axis-hairline)] rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
            {shiftItems.length === 0 ? (
              <p className="p-4 text-sm text-[var(--axis-muted)]">변화율 데이터가 없습니다.</p>
            ) : (
              shiftItems.map((item: GlobalTrendItem) => <TrendShiftRow key={item.id} item={item} />)
            )}
          </div>
        </section>
      </PageState>
    </div>
  );
}

/** 통합 트렌드 카드 — 숫자(언급·변화) + 해석(요약·시사점) + Peer 대응을 한 카드에 */
function TrendCard({ item, rank }: { item: GlobalTrendItem; rank: number }) {
  const leaders = formatLeadingCompanies(item.leading_companies);
  const peers = sortPeerAlignment(item.peer_alignment ?? []);

  return (
    <article className="flex flex-col rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[rgba(90,107,87,0.12)] text-xs font-black text-[var(--axis-success)]">
          {rank}
        </span>
        <ExecutiveBadge tone="accent">{categoryLabel(item.keyword_category)}</ExecutiveBadge>
        <ExecutiveBadge tone="neutral">{intensityLabel(item.intensity)}</ExecutiveBadge>
        <span className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-[var(--axis-muted)]">
          언급 {item.mention_count ?? 0}건
          <DeltaStat value={item.frequency_delta_pct} />
        </span>
      </div>

      <h4 className="mt-3 text-base font-display font-semibold leading-6 text-[var(--axis-ink)]">{trendTitle(item)}</h4>
      {item.summary ? <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.summary}</p> : null}

      {item.sk_ax_implication ? (
        <div className="mt-3 rounded-[var(--axis-radius-md)] border border-[rgba(198,106,74,0.22)] bg-[rgba(198,106,74,0.06)] p-3">
          <p className="text-caption-bold text-[var(--axis-accent-strong)]">✨ SK AX 시사점 (AI 초안)</p>
          <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.sk_ax_implication}</p>
        </div>
      ) : null}

      {peers.length > 0 ? (
        <div className="mt-3">
          <p className="text-caption-bold text-[var(--axis-muted)]">국내 Peer 대응</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {peers.map((peer: PeerAlignmentRow) => (
              <PeerChip key={peer.peer_id} peer={peer} />
            ))}
          </div>
        </div>
      ) : null}

      {leaders ? (
        <p className="mt-3 text-xs leading-5 text-[var(--axis-muted)]">글로벌 주도: {leaders}</p>
      ) : null}
    </article>
  );
}

/** Peer 1사의 대응 상태 칩 — hover 시 strategic_note 전문 표시 */
function PeerChip({ peer }: { peer: PeerAlignmentRow }) {
  const meta = ALIGNMENT_META[peer.alignment_type] ?? { label: peer.alignment_type, tone: 'neutral' as const };
  return (
    <span title={peer.strategic_note ?? undefined} className={peer.strategic_note ? 'cursor-help' : undefined}>
      <ExecutiveBadge tone={meta.tone}>
        {peerLabel(peer.peer_id)} · {meta.label}
        {peer.recency_gap_days != null && peer.recency_gap_days > 0 ? ` (+${peer.recency_gap_days}일)` : ''}
      </ExecutiveBadge>
    </span>
  );
}

/** 변화율을 방향 아이콘 + 색상으로 — 문장 대신 스캔 가능한 숫자 우선 */
function DeltaStat({ value }: { value?: number | null }) {
  const tone = deltaTone(value);
  if (tone === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--axis-muted)]">
        <Minus size={14} />
        유지
      </span>
    );
  }
  const isUp = tone === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${
        isUp ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'
      }`}
    >
      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {formatPercent(value)}
    </span>
  );
}

/** 변화 보드 한 줄 — 순위 매기던 장문 카드를 스캔 가능한 행으로 압축 */
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
