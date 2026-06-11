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

function getRevenueTickStep(min: number, max: number) {
  const spread = Math.max(max - min, 1000);
  const roughStep = spread / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function buildRevenueTicks(min: number, max: number) {
  const step = getRevenueTickStep(min, max);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];

  for (let value = start; value <= end; value += step) {
    ticks.push(value);
  }

  return Array.from(new Set([min, ...ticks, max])).sort((left, right) => left - right);
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
  compact?: boolean;
};

export function PositioningPanel({ positioning, isLoading, error, compact = false }: PositioningPanelProps) {
  const validPoints = (positioning?.points ?? []).filter(
    (point): point is PeerPositioningPoint & { revenueKrwBn: number; revenueYoyPct: number } =>
      point.revenueKrwBn != null && point.revenueYoyPct != null,
  );
  const revenueValues = validPoints.map((point) => point.revenueKrwBn);
  const rawRevenueMin = revenueValues.length > 0 ? Math.min(...revenueValues) : 1000;
  const rawRevenueMax = revenueValues.length > 0 ? Math.max(...revenueValues) : 50000;
  const revenueSpread = Math.max(rawRevenueMax - rawRevenueMin, Math.max(rawRevenueMax * 0.18, 2500));
  const paddedRevenueMin = Math.max(0, Math.floor((rawRevenueMin - revenueSpread * 0.18) / 500) * 500);
  const paddedRevenueMax = Math.ceil((rawRevenueMax + revenueSpread * 0.14) / 500) * 500;
  const chartPoints = validPoints.map((point) => ({
    ...point,
    x: point.revenueKrwBn,
    y: point.revenueYoyPct,
    color: colorForPoint(point),
  }));

  const xMin = paddedRevenueMin;
  const xMax = paddedRevenueMax > paddedRevenueMin ? paddedRevenueMax : paddedRevenueMin + 2000;
  const xTicks = buildRevenueTicks(xMin, xMax);

  const rawYMin = chartPoints.length > 0 ? Math.min(...chartPoints.map((point) => point.y)) : -10;
  const rawYMax = chartPoints.length > 0 ? Math.max(...chartPoints.map((point) => point.y)) : 15;
  const ySpread = Math.max(rawYMax - rawYMin, 10);
  const yMin = Math.min(-10, Math.floor((rawYMin - Math.max(3, ySpread * 0.12)) / 5) * 5);
  const yMax = Math.max(15, Math.ceil((rawYMax + Math.max(3, ySpread * 0.12)) / 5) * 5);
  const yTicks = Array.from({ length: Math.round((yMax - yMin) / 5) + 1 }, (_, index) => yMin + index * 5);
  const chartHeight = compact ? 320 : 420;

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
        <div className="flex items-center justify-center rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-sm text-[var(--axis-muted)]" style={{ height: chartHeight }}>
          산점도 데이터를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="flex items-center justify-center rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-6 text-center text-sm leading-6 text-[var(--axis-muted)]" style={{ height: chartHeight }}>
          {error}
        </div>
      ) : chartPoints.length === 0 ? (
        <div className="flex items-center justify-center rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-6 text-center text-sm leading-6 text-[var(--axis-muted)]" style={{ height: chartHeight }}>
          공통 분기 기준으로 그릴 수 있는 사업 규모/매출 성장률 데이터가 아직 없습니다.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart margin={{ top: 24, right: 32, bottom: 36, left: 18 }}>
              <CartesianGrid stroke="rgba(16,24,32,0.06)" />

              <XAxis
                type="number"
                dataKey="x"
                name="사업 규모"
                domain={[xMin, xMax]}
                ticks={xTicks}
                tickFormatter={(value: number) => formatRevenueTick(value)}
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

          <p className="mt-3 rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-[10px] leading-5 text-[var(--axis-muted)]">
            <span className="font-semibold text-[var(--axis-body)]">데이터 출처:</span>{' '}
            {positioning?.financialSourceLabel ?? '각 사 IR·사업보고서 기반'}
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
