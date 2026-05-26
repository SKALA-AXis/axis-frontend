/**
 * PositioningPanels — Peer+ 페이지 산점도.
 *   • PositioningPanel: 사업 규모 × 매출 성장률 (백엔드 positioning payload 기반)
 */
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { PeerPositioningData, PeerPositioningPoint } from '../../../../features/peers/model/peerPositioning';

const SEG_POS_END = 8000;
const SEG_CLUSTER_START = 30000;
const AXIS_SEG_POS_END = 0.22;
const AXIS_SEG_CLUSTER_START = 0.26;

const X_MIN = 0;
const X_MAX = 1;

type RevenueScale = {
  revenueMin: number;
  revenueMax: number;
};

function revToX(rev: number, scale: RevenueScale): number {
  if (rev <= SEG_POS_END) {
    return ((rev - scale.revenueMin) / (SEG_POS_END - scale.revenueMin)) * AXIS_SEG_POS_END;
  }
  if (rev <= SEG_CLUSTER_START) {
    return (
      AXIS_SEG_POS_END +
      ((rev - SEG_POS_END) / (SEG_CLUSTER_START - SEG_POS_END)) *
        (AXIS_SEG_CLUSTER_START - AXIS_SEG_POS_END)
    );
  }
  return (
    AXIS_SEG_CLUSTER_START +
    ((rev - SEG_CLUSTER_START) / (scale.revenueMax - SEG_CLUSTER_START)) *
      (1 - AXIS_SEG_CLUSTER_START)
  );
}

function xToRev(x: number, scale: RevenueScale): number {
  if (x <= AXIS_SEG_POS_END) {
    return scale.revenueMin + (x / AXIS_SEG_POS_END) * (SEG_POS_END - scale.revenueMin);
  }
  if (x <= AXIS_SEG_CLUSTER_START) {
    return (
      SEG_POS_END +
      ((x - AXIS_SEG_POS_END) / (AXIS_SEG_CLUSTER_START - AXIS_SEG_POS_END)) *
        (SEG_CLUSTER_START - SEG_POS_END)
    );
  }
  return (
    SEG_CLUSTER_START +
    ((x - AXIS_SEG_CLUSTER_START) / (1 - AXIS_SEG_CLUSTER_START)) *
      (scale.revenueMax - SEG_CLUSTER_START)
  );
}

function formatRevenueTick(value: number) {
  const revenue = Math.round(value);
  if (revenue >= 10000) {
    return `${(revenue / 10000).toFixed(revenue % 10000 === 0 ? 0 : 1)}조`;
  }
  return `${revenue.toLocaleString()}억`;
}

function colorForPoint(point: PeerPositioningPoint) {
  if (point.isSelf) return '#DC5A24';
  switch (point.id) {
    case 'samsung_sds':
      return '#3B4DC5';
    case 'lg_cns':
      return '#A85F00';
    case 'hyundai_autoever':
      return '#5A6B57';
    case 'posco_dx':
      return '#E0822F';
    default:
      return '#6B6B73';
  }
}

type PositioningPanelProps = {
  positioning: PeerPositioningData | null;
  isLoading: boolean;
  error: string | null;
};

export function PositioningPanel({ positioning, isLoading, error }: PositioningPanelProps) {
  const validPoints = (positioning?.points ?? []).filter(
    (point): point is PeerPositioningPoint & { revenueKrwBn: number; revenueYoyPct: number } =>
      point.revenueKrwBn != null && point.revenueYoyPct != null,
  );
  const revenueValues = validPoints.map((point) => point.revenueKrwBn);
  const revenueMin = revenueValues.length > 0 ? Math.min(...revenueValues) : 1000;
  const revenueMax = revenueValues.length > 0 ? Math.max(...revenueValues) : 50000;
  const revenueSpread = Math.max(revenueMax - revenueMin, 5000);
  const paddedRevenueMin = Math.max(
    500,
    Math.min(
      Math.floor((revenueMin - revenueSpread * 0.18) / 100) * 100,
      SEG_POS_END - 700,
    ),
  );
  const paddedRevenueMax = Math.max(
    SEG_CLUSTER_START + 5000,
    Math.ceil((revenueMax + revenueSpread * 0.12) / 1000) * 1000,
  );
  const revenueScale: RevenueScale = {
    revenueMin: paddedRevenueMin,
    revenueMax: paddedRevenueMax,
  };
  const chartPoints = validPoints.map((point) => ({
    ...point,
    x: revToX(point.revenueKrwBn, revenueScale),
    y: point.revenueYoyPct,
    color: colorForPoint(point),
  }));

  const revenueTickValues = Array.from(
    new Set([
      revenueScale.revenueMin,
      ...validPoints.map((point) => point.revenueKrwBn),
      revenueScale.revenueMax,
    ]),
  )
    .sort((left, right) => left - right)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) >= 1500);
  const xTicks = revenueTickValues.map((value) => revToX(value, revenueScale));

  const rawYMin = chartPoints.length > 0 ? Math.min(...chartPoints.map((point) => point.y)) : -10;
  const rawYMax = chartPoints.length > 0 ? Math.max(...chartPoints.map((point) => point.y)) : 15;
  const ySpread = Math.max(rawYMax - rawYMin, 10);
  const yMin = Math.min(-10, Math.floor((rawYMin - Math.max(3, ySpread * 0.12)) / 5) * 5);
  const yMax = Math.max(15, Math.ceil((rawYMax + Math.max(3, ySpread * 0.12)) / 5) * 5);
  const yTicks = Array.from({ length: Math.round((yMax - yMin) / 5) + 1 }, (_, index) => yMin + index * 5);
  const skAxMirrorLine = buildSkAxMirrorLine(chartPoints);

  return (
    <section className="axis-panel-flat p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Peer fundamentals positioning</p>
          <h2 className="axis-section-heading mt-1">사업 규모 × 매출 성장률</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">
            X = 매출 규모, Y = 매출 YoY 성장률. 같은 분기 기준으로 Peer 5개의 상대 위치를 한 화면에서 비교합니다.
          </p>
          {positioning?.periodLabel ? (
            <p className="mt-1 text-[11px] font-semibold text-[var(--axis-body)]">
              기준 분기: {positioning.periodLabel}
            </p>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[420px] items-center justify-center rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-sm text-[var(--axis-muted)]">
          산점도 데이터를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="flex h-[420px] items-center justify-center rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-6 text-center text-sm leading-6 text-[var(--axis-muted)]">
          {error}
        </div>
      ) : chartPoints.length === 0 ? (
        <div className="flex h-[420px] items-center justify-center rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-6 text-center text-sm leading-6 text-[var(--axis-muted)]">
          공통 분기 기준으로 그릴 수 있는 사업 규모/매출 성장률 데이터가 아직 없습니다.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 24, right: 32, bottom: 36, left: 18 }}>
              <CartesianGrid stroke="rgba(16,24,32,0.06)" />

              <XAxis
                type="number"
                dataKey="x"
                name="사업 규모"
                domain={[X_MIN, X_MAX]}
                ticks={xTicks}
                tickFormatter={(value: number) => formatRevenueTick(xToRev(value, revenueScale))}
                tick={{ fontSize: 10, fill: '#6B6B73' }}
                label={{
                  value: positioning?.xAxisLabel ?? '사업 규모',
                  position: 'insideBottom',
                  offset: -18,
                  fontSize: 12,
                  fill: '#333',
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="YoY 성장률"
                domain={[yMin, yMax]}
                ticks={yTicks}
                tickFormatter={(value: number) => `${value > 0 ? '+' : ''}${value}%`}
                tick={{ fontSize: 11, fill: '#6B6B73' }}
                label={{
                  value: positioning?.yAxisLabel ?? '매출 성장률',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  fontSize: 12,
                  fill: '#333',
                  fontWeight: 600,
                }}
              />
              <Tooltip
                cursor={false}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const point = payload[0].payload as typeof chartPoints[number];
                  return (
                    <div className="rounded-md border border-[var(--axis-hairline)] bg-white px-3 py-2 text-xs leading-5 shadow-md">
                      <p className="font-semibold text-[var(--axis-ink)]">{point.label}</p>
                      <p className="mt-1 text-[var(--axis-muted)]">
                        매출 규모:{' '}
                        <span className="font-semibold text-[var(--axis-ink)]">
                          {point.revenueKrwBn.toLocaleString()}억
                        </span>
                      </p>
                      <p className="text-[var(--axis-muted)]">
                        매출 YoY:{' '}
                        <span className={`font-semibold ${point.revenueYoyPct >= 0 ? 'text-[var(--axis-success)]' : 'text-[var(--axis-accent-strong)]'}`}>
                          {point.revenueYoyPct > 0 ? '+' : ''}
                          {point.revenueYoyPct.toFixed(2)}%
                        </span>
                      </p>
                      <p className="text-[var(--axis-muted)]">
                        source: {point.revenueSourceType ?? '-'} / {point.revenueYoySourceType ?? '-'}
                      </p>
                    </div>
                  );
                }}
              />

              {chartPoints.map((point) => (
                <Scatter
                  key={point.id}
                  name={point.label}
                  data={[point]}
                  shape={(props: { cx?: number; cy?: number }) => {
                    const radius = 22;
                    return (
                      <g>
                        <circle cx={props.cx} cy={props.cy} r={radius + 8} fill={point.color} fillOpacity={0.18} />
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={radius}
                          fill={point.color}
                          fillOpacity={0.92}
                          stroke="#fff"
                          strokeWidth={point.isSelf ? 3 : 1.5}
                        />
                        <text
                          x={props.cx}
                          y={(props.cy ?? 0) + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#fff"
                        >
                          {compactPeerLabel(point.label)}
                        </text>
                      </g>
                    );
                  }}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>

          {skAxMirrorLine ? (
            <p className="mt-3 rounded-md border border-[rgba(220,90,36,0.18)] bg-[rgba(220,90,36,0.05)] px-3 py-2 text-[11px] leading-5 text-[var(--axis-body)]">
              <span className="font-semibold text-[var(--axis-accent-strong)]">SK AX 시사점:</span>{' '}
              {skAxMirrorLine}
            </p>
          ) : null}

          <p className="mt-3 rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-[10px] leading-5 text-[var(--axis-muted)]">
            <span className="font-semibold text-[var(--axis-body)]">데이터 출처:</span>{' '}
            {positioning?.financialSourceLabel ?? 'raw_article_financial_metrics 기준'}
            {positioning?.coverageLabel ? ` / ${positioning.coverageLabel}` : ''}
          </p>
        </>
      )}
    </section>
  );
}

function compactPeerLabel(label: string) {
  if (label === '삼성 SDS') return 'SDS';
  if (label === 'LG CNS') return 'LGC';
  if (label === '현대 오토에버') return 'HAE';
  if (label === '포스코 DX') return 'POS';
  if (label === 'SK AX') return 'SK';
  return label.length > 6 ? label.slice(0, 6) : label;
}

function buildSkAxMirrorLine(
  chartPoints: Array<
    PeerPositioningPoint & {
      revenueKrwBn: number;
      revenueYoyPct: number;
      x: number;
      y: number;
      color: string;
    }
  >,
) {
  const skAxPoint = chartPoints.find((point) => point.isSelf);
  if (!skAxPoint) {
    return null;
  }

  const peers = chartPoints.filter((point) => !point.isSelf);
  if (peers.length === 0) {
    return `지금은 비교 Peer 데이터보다 SK AX 자신의 매출 규모와 성장률 좌표를 먼저 기준점으로 읽는 것이 좋습니다.`;
  }

  const largerPeers = peers.filter((point) => point.revenueKrwBn > skAxPoint.revenueKrwBn);
  const fasterPeers = peers.filter((point) => point.revenueYoyPct > skAxPoint.revenueYoyPct);
  const slowerPeers = peers.filter((point) => point.revenueYoyPct < skAxPoint.revenueYoyPct);

  const largestPeer = [...peers].sort((left, right) => right.revenueKrwBn - left.revenueKrwBn)[0];
  const fastestPeer = [...peers].sort((left, right) => right.revenueYoyPct - left.revenueYoyPct)[0];

  if (largerPeers.length === peers.length && fasterPeers.length >= 2) {
    return `SK AX는 현재 주요 Peer 대비 사업 규모가 작고 성장률도 ${compactPeerLabel(fastestPeer.label)}·${compactPeerLabel(largestPeer.label)}보다 낮아, “얼마나 큰가”보다 “어디서 더 빨리 커지고 있는가”를 설명해야 하는 위치로 보입니다.`;
  }

  if (largerPeers.length === peers.length && slowerPeers.length === 0) {
    return `SK AX는 사업 규모는 작지만 성장률은 주요 Peer 상단권에 있어, 지금은 절대 규모보다 성장의 질과 그 지속 가능성을 증명하는 단계로 읽는 게 좋습니다.`;
  }

  if (largerPeers.length >= 3) {
    return `SK AX는 대형 Peer 대비 왼쪽에 위치해 규모 격차가 분명하지만, 성장률은 일부 Peer보다 앞서 있어 “작지만 더 빠르게 움직이는가”를 보는 거울로 해석하는 것이 좋습니다.`;
  }

  if (fasterPeers.length === peers.length) {
    return `SK AX는 현재 성장률이 Peer 하단에 있어, 이 차트에서는 규모보다도 성장 회복이 가장 먼저 읽히는 신호로 보입니다.`;
  }

  return `SK AX는 규모와 성장률 모두 중간 구간에 있어, 이 차트에서는 절대 우위보다 Peer 사이에서 어떤 방향으로 이동하고 있는지를 읽는 거울로 보는 편이 좋습니다.`;
}
