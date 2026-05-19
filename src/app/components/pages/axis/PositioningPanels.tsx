/**
 * PositioningPanels — Peer+ 페이지에 통합되는 두 차트.
 *   • PositioningPanel  : 사업 규모 × 매출 성장률 (펀더멘털 두 축)
 *   • MediaExposurePanel: 미디어 노출 추적 (자사 보도자료 vs 외부)
 *
 * 6 라운드 리뷰 후 다듬은 최종 버전. designing 베이스 + Peer+ 통합 시 분리.
 */
import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExecutiveBadge } from '../../executive/ExecutiveSystem';

const positioningData = [
  // SDS IT서비스: 2024 64,014 → 2025 65,435 / +2.2% / 마진 12.6%
  { name: 'SDS',  rev_2025_krwbn: 65435, rev_2024_krwbn: 64014, yoy_pct: 2.2,
    op_profit: 8231, margin: 12.6, label: '삼성SDS',  color: '#3B4DC5', isSelf: false,
    rev_full_krwbn: 139299, segment_note: 'IT서비스 부문 (물류 73,864억 제외)' },
  // LGC: 2024 59,826 → 2025 61,295 / +2.5% / 마진 9.0%
  { name: 'LGC',  rev_2025_krwbn: 61295, rev_2024_krwbn: 59826, yoy_pct: 2.5,
    op_profit: 5518, margin: 9.0, label: 'LG CNS',  color: '#A85F00', isSelf: false,
    rev_full_krwbn: 61295, segment_note: 'IT서비스 단일 사업부 (K-IFRS 1108)' },
  // HAE ITO+SI: 2024 29,093 → 2025 34,244 / +17.7%
  { name: 'HAE',  rev_2025_krwbn: 34244, rev_2024_krwbn: 29093, yoy_pct: 17.7,
    op_profit: 2553, margin: 7.5, label: '현대오토에버', color: '#5A6B57', isSelf: false,
    rev_full_krwbn: 42521, segment_note: 'ITO + SI 부문 (차량용 SW 8,277억 제외)' },
  // SK AX (별도): 2024 37,067 → 2025 36,122 / -2.5% / 마진 22.5% (브랜드료 포함)
  { name: 'SK',   rev_2025_krwbn: 36122, rev_2024_krwbn: 37067, yoy_pct: -2.5,
    op_profit: 8131, margin: 22.5, label: 'SK AX (자사·별도)', color: '#DC5A24', isSelf: true,
    rev_full_krwbn: 36122, segment_note: 'SK주식회사 별도재무 = AX 사업 + 일부 본사 기능 (브랜드 사용료 등)' },
  // POS IT사업실: 2024 5,901 → 2025 5,490 / -7.0% / 마진 5.5%
  { name: 'POS',  rev_2025_krwbn: 5490, rev_2024_krwbn: 5901, yoy_pct: -7.0,
    op_profit: 304, margin: 5.5, label: 'POSCO DX', color: '#E0822F', isSelf: false,
    rev_full_krwbn: 10752, segment_note: 'IT사업실만 (EIC사업실 5,329억 제외)' },
];

// Piecewise X-scale — POS(~5천억대) 와 cluster(3~7조) 사이 빈 구간을 단일 break line 으로 단축.
// 3,500~8,000억 (POS 영역) → 축의 0~22% (POS 인입, 좌측 패딩 확보) /
// 8,000~30,000억 (단일 break 영역) → 22~26% (4%만 차지 — 사실상 line) /
// 30,000~70,000억 (cluster) → 26~100% (cluster 가 horizontal 74% 차지).
const X_REV_MIN = 3500;
const X_REV_MAX = 70000;
const SEG_POS_END = 8000;          // POS 영역 끝 = break 시작
const SEG_CLUSTER_START = 30000;   // break 끝 = cluster 시작 (= 메이저 SI 기준)
const AXIS_SEG_POS_END = 0.22;
const AXIS_SEG_CLUSTER_START = 0.26;
const AXIS_BREAK_MARK = (AXIS_SEG_POS_END + AXIS_SEG_CLUSTER_START) / 2; // = 0.24

function revToX(rev: number): number {
  if (rev <= SEG_POS_END) {
    return ((rev - X_REV_MIN) / (SEG_POS_END - X_REV_MIN)) * AXIS_SEG_POS_END;
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
    ((rev - SEG_CLUSTER_START) / (X_REV_MAX - SEG_CLUSTER_START)) *
      (1 - AXIS_SEG_CLUSTER_START)
  );
}

function xToRev(x: number): number {
  if (x <= AXIS_SEG_POS_END) {
    return X_REV_MIN + (x / AXIS_SEG_POS_END) * (SEG_POS_END - X_REV_MIN);
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
      (X_REV_MAX - SEG_CLUSTER_START)
  );
}

const positioningPoints = positioningData.map((p) => ({
  ...p,
  x: revToX(p.rev_2025_krwbn),
  y: p.yoy_pct,
}));

// 고정 기준선 — 표본 평균이 아니라 산업 임계값
const REF_X_REVENUE = 30000;       // 3조 — "메이저 SI" 기준 = 압축 끝 = cluster 시작
const REF_Y_GROWTH = 5;            // 5% — SI 업계 평균 성장률
const REF_X = revToX(REF_X_REVENUE);  // = AXIS_SEG_CLUSTER_START = 0.25
const REF_Y = REF_Y_GROWTH;

const X_MIN = 0;
const X_MAX = 1;
const Y_MIN = -10;
const Y_MAX = 25;

// X 축 tick 위치 — 축 좌표. tickFormatter 가 역변환해서 매출 라벨 표시.
const X_TICKS = [revToX(5500), revToX(SEG_CLUSTER_START), revToX(40000), revToX(50000), revToX(60000), revToX(70000)];

export function PositioningPanel() {
  return (
    <section className="axis-panel-flat p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">IT services positioning · 2025 fundamentals</p>
          <h2 className="axis-section-heading mt-1">사업 규모 × 매출 성장률</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">
            X = 2025 IT서비스 부문 매출. Y = <strong>2024 → 2025 단년</strong> YoY 성장률.
            DART K-IFRS 1108 영업부문 공시. 자사 편향 없는 펀더멘털 두 축.
            <span className="ml-1 italic">단년 성장률은 일시 요인 영향 가능 — 추세는 별도 확인 권장.</span>
          </p>
        </div>
        <ExecutiveBadge>preview</ExecutiveBadge>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 24, right: 32, bottom: 36, left: 18 }}>
          <CartesianGrid stroke="rgba(16,24,32,0.06)" />

          {/* 4 사분면 배경 — 고정 기준선 (산업 임계값, 표본 평균 X) */}
          <ReferenceArea x1={REF_X} x2={X_MAX} y1={REF_Y} y2={Y_MAX} fill="#DC5A24" fillOpacity={0.05} />
          <ReferenceArea x1={X_MIN} x2={REF_X} y1={REF_Y} y2={Y_MAX} fill="#888" fillOpacity={0.03} />
          <ReferenceArea x1={X_MIN} x2={REF_X} y1={Y_MIN} y2={REF_Y} fill="#888" fillOpacity={0.03} />
          <ReferenceArea x1={REF_X} x2={X_MAX} y1={Y_MIN} y2={REF_Y} fill="#888" fillOpacity={0.03} />

          {/* Axis break marker — POS 영역과 cluster 사이 단일 선 (8천억~3조 사이는 데이터 없음) */}
          <ReferenceLine
            x={AXIS_BREAK_MARK}
            stroke="#999"
            strokeDasharray="2 3"
            strokeOpacity={0.55}
          />

          <ReferenceLine x={REF_X} stroke="#DC5A24" strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: `메이저 SI 기준 ${(REF_X_REVENUE / 10000).toFixed(0)}조`,
                     position: 'top', fontSize: 10, fill: '#A85F00' }}
          />
          <ReferenceLine y={REF_Y} stroke="#DC5A24" strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: `업계 평균 성장률 ${REF_Y_GROWTH}%`, position: 'right', fontSize: 10, fill: '#A85F00' }}
          />
          {/* 0% 성장선 */}
          <ReferenceLine y={0} stroke="#888" strokeDasharray="2 4" strokeOpacity={0.4} />

          <XAxis
            type="number"
            dataKey="x"
            name="사업 규모"
            domain={[X_MIN, X_MAX]}
            ticks={X_TICKS}
            tickFormatter={(v: number) => {
              const rev = Math.round(xToRev(v));
              if (rev >= 10000) return `${(rev / 10000).toFixed(0)}조`;
              return `${rev.toLocaleString()}억`;
            }}
            tick={{ fontSize: 10, fill: '#6B6B73' }}
            label={{ value: '사업 규모 — 2025 IT서비스 부문 매출',
                     position: 'insideBottom', offset: -18, fontSize: 12, fill: '#333', fontWeight: 600 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="YoY 성장률"
            domain={[Y_MIN, Y_MAX]}
            ticks={[-10, -5, 0, 5, 10, 15, 20, 25]}
            tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
            tick={{ fontSize: 11, fill: '#6B6B73' }}
            label={{ value: '매출 YoY 성장률',
                     angle: -90, position: 'insideLeft', offset: 0, fontSize: 12, fill: '#333', fontWeight: 600 }}
          />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const p = payload[0].payload as (typeof positioningPoints)[number];
              return (
                <div className="rounded-md border border-[var(--axis-hairline)] bg-white px-3 py-2 text-xs leading-5 shadow-md">
                  <p className="font-semibold text-[var(--axis-ink)]">{p.label}</p>
                  <p className="mt-1 text-[var(--axis-muted)]">
                    2025 IT서비스 매출: <span className="font-semibold text-[var(--axis-ink)]">
                      {p.rev_2025_krwbn.toLocaleString()} 억
                    </span>
                  </p>
                  <p className="text-[var(--axis-muted)]">
                    2024 → 2025 YoY: <span className={`font-semibold ${p.yoy_pct >= 0 ? 'text-[var(--axis-success)]' : 'text-[var(--axis-accent-strong)]'}`}>
                      {p.yoy_pct > 0 ? '+' : ''}{p.yoy_pct.toFixed(1)}%
                    </span>
                    <span className="ml-1 text-[10px] italic">(단년)</span>
                  </p>
                  {p.rev_full_krwbn > p.rev_2025_krwbn ? (
                    <p className="text-[var(--axis-muted)]">
                      전사 매출: {p.rev_full_krwbn.toLocaleString()} 억
                    </p>
                  ) : null}
                  <p className="mt-1 border-t border-dashed border-[var(--axis-hairline)] pt-1 text-[10px] italic text-[var(--axis-muted)]">
                    {p.segment_note}
                  </p>
                </div>
              );
            }}
          />

          {/* 5 peer 모두 동일 산식, 동일 크기 — bubble 변동성 노이즈 제거 */}
          {positioningPoints.map((item) => (
            <Scatter
              key={item.name}
              name={item.label}
              data={[item]}
              shape={(props: { cx?: number; cy?: number }) => {
                const r = 22;
                const strokeWidth = item.isSelf ? 3 : 1.5;
                return (
                  <g>
                    <circle cx={props.cx} cy={props.cy} r={r + 8} fill={item.color} fillOpacity={0.18} />
                    <circle cx={props.cx} cy={props.cy} r={r} fill={item.color} fillOpacity={0.92}
                            stroke={item.isSelf ? '#fff' : '#fff'} strokeWidth={strokeWidth} />
                    <text x={props.cx} y={(props.cy ?? 0) + 4} textAnchor="middle"
                          fontSize="11" fontWeight="700" fill="#fff">
                      {item.name}
                    </text>
                  </g>
                );
              }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* HAE 경계 민감성 — 차트 바로 아래 한 줄 */}
      <p className="mt-2 rounded-md border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-[10px] italic text-[var(--axis-muted)]">
        ⓘ HAE 는 메이저 SI 임계 (3조) 거의 정확히 걸침 — 부문 매출 추출이 조금 달라지거나 다음 해 숫자가 바뀌면 사분면 분류 (↗ ↔ ↖) 가 변할 수 있음.
      </p>

      {/* 사분면 라벨 — 중립 위치 기술 (처방 X, 판단은 사람이) */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2">
          <p className="font-semibold text-[var(--axis-muted)]">↖ 소규모 · 고성장</p>
          <p className="mt-0.5 text-[var(--axis-muted)]">매출 3조 미만 + 성장률 5%↑</p>
        </div>
        <div className="rounded-md border border-[var(--axis-accent)] bg-[rgba(220,90,36,0.05)] px-3 py-2">
          <p className="font-semibold text-[var(--axis-accent-strong)]">↗ 대규모 · 고성장</p>
          <p className="mt-0.5 text-[var(--axis-muted)]">매출 3조↑ + 성장률 5%↑</p>
        </div>
        <div className="rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2">
          <p className="font-semibold text-[var(--axis-muted)]">↙ 소규모 · 저성장</p>
          <p className="mt-0.5 text-[var(--axis-muted)]">매출 3조 미만 + 성장률 5% 미만</p>
        </div>
        <div className="rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2">
          <p className="font-semibold text-[var(--axis-muted)]">↘ 대규모 · 저성장</p>
          <p className="mt-0.5 text-[var(--axis-muted)]">매출 3조↑ + 성장률 5% 미만</p>
        </div>
      </div>

      {/* 데이터 출처 + 한계 */}
      <p className="mt-3 rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2 text-[10px] leading-5 text-[var(--axis-muted)]">
        <span className="font-semibold text-[var(--axis-body)]">데이터 출처:</span>{' '}
        DART OpenAPI <strong>2025 사업보고서 K-IFRS 1108 영업부문 공시</strong> (재무제표 주석 직접 추출).
        SDS = IT서비스 부문 (물류 73,864억 제외), LGC = 단일 사업부, HAE = ITO+SI (차량 SW 제외),
        POS = IT사업실만, SK = 별도재무 (= AX 사업 + 일부 본사 기능).
      </p>
      <p className="mt-2 rounded-md border border-[#E0822F] bg-[rgba(220,90,36,0.05)] px-3 py-2 text-[10px] leading-5 text-[var(--axis-muted)]">
        <span className="font-semibold text-[var(--axis-accent-strong)]">한계:</span>{' '}
        (1) Y축은 <strong>단년 (2024→2025) 성장률</strong> — 대형 프로젝트 종료/시작 같은 일시 요인에 ±5% 출렁임.
        참고: LGC 의 경우 단년 +2.5% 인데 3개년 CAGR 은 +4.6% — 단년과 추세는 다를 수 있음.
        SDS/HAE/POS/SK 의 2023 IT서비스 부문 매출은 추가 추출 필요. 추세 판단은 2~3년 CAGR 별도 검토.
        (2) SK 별도재무 영업이익에 본사 브랜드 사용료 등 비AX 수익 포함 — <strong>AX 사업 단독 마진은 부문 공시 부재로 불명</strong>.
        본 차트는 마진 차원을 의도적으로 미포함 (자사 편향 방지).
        (3) 임계 3조/5% 는 SI 업계 통념 기준 참조선 — 절대값 아님. <strong>위치는 차트가, 진단·처방은 전략팀이 직접</strong>.
        (4) 미디어 인지도 / sentiment 는 self-peer bias 격리를 위해 별도 위젯에서 검토.
      </p>
    </section>
  );
}


type ExposureRow = {
  peer: string;
  label: string;
  color: string;
  isSelf: boolean;
  external: number;      // 외부 출처 tier1
  selfPress: number;     // 자사 보도자료 tier1
  total: number;
  selfRatio: number;     // %
};

const exposureData: ExposureRow[] = [
  // 데이터: article_peer_companies × raw_articles WHERE credibility ≥ 0.8, 30일
  // self-press = source ILIKE '%press%' OR '%newsroom%' OR '%site%' OR 'ir_pdf' OR '%blog%'
  { peer: 'SK',  label: 'SK AX (자사)', color: '#DC5A24', isSelf: true,
    external: 219, selfPress: 176, total: 395, selfRatio: 44.6 },
  { peer: 'SDS', label: '삼성SDS',      color: '#3B4DC5', isSelf: false,
    external: 172, selfPress: 16,  total: 188, selfRatio: 8.5 },
  { peer: 'HAE', label: '현대오토에버',  color: '#5A6B57', isSelf: false,
    external: 145, selfPress: 21,  total: 166, selfRatio: 12.7 },
  { peer: 'LGC', label: 'LG CNS',       color: '#A85F00', isSelf: false,
    external: 53,  selfPress: 105, total: 158, selfRatio: 66.5 },
  { peer: 'POS', label: 'POSCO DX',     color: '#E0822F', isSelf: false,
    external: 37,  selfPress: 48,  total: 85,  selfRatio: 56.5 },
];

export function MediaExposurePanel() {
  const maxTotal = Math.max(...exposureData.map((d) => d.total));

  return (
    <section className="axis-panel-flat flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Auxiliary · 외부 인식 모니터링 (30일)</p>
          <h2 className="axis-section-heading mt-1">미디어 노출 추적 — 자사 보도자료 vs 외부 출처</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">
            tier1 매칭 기사 (credibility ≥ 0.8) 를 자사 보도자료/IR 과 외부 출처 (증권사·언론) 로 분리.
            이 위젯은 <strong>"사업 위상" 이 아니라 "PR·IR 활동의 외부 도달"</strong> 을 추적하는 운영 도구.
          </p>
        </div>
        <ExecutiveBadge>preview</ExecutiveBadge>
      </div>

      {/* Vertical column chart — 5 peer 가 column 으로 서서 height 가 total exposure.
          column 내부: 외부 (top, 밝은 색) + 자사 (bottom, 어두운 색) stacked. */}
      <div className="mt-4 flex flex-1 flex-col">
        {/* Columns row — flex-1 로 가용 vertical 공간 채움, items-end 로 막대 바닥 정렬 */}
        <div className="flex flex-1 items-end gap-4 px-2 pb-1">
          {exposureData.map((d) => {
            const totalPct = (d.total / maxTotal) * 100;
            const selfPct = d.selfRatio;
            const extPct = 100 - d.selfRatio;
            return (
              <div key={d.peer} className="flex h-full flex-1 flex-col items-center justify-end">
                <div
                  className="flex w-full max-w-[72px] flex-col overflow-hidden rounded-md"
                  style={{
                    height: `${totalPct}%`,
                    outline: d.isSelf ? '2px dashed #DC5A24' : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {/* 외부 (top, 밝은 색) */}
                  <div
                    className="flex items-center justify-center text-[11px] font-semibold"
                    style={{
                      height: `${extPct}%`,
                      background: `${d.color}55`,
                      color: '#222',
                    }}
                    title={`외부 ${d.external}건`}
                  >
                    {extPct >= 18 ? d.external : null}
                  </div>
                  {/* 자사 (bottom, 어두운 색) */}
                  <div
                    className="flex items-center justify-center text-[11px] font-semibold text-white"
                    style={{
                      height: `${selfPct}%`,
                      background: d.color,
                    }}
                    title={`자사 ${d.selfPress}건`}
                  >
                    {selfPct >= 18 ? d.selfPress : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Labels row — column 아래 peer 라벨 + 총 건수 + 자사 비율 */}
        <div className="mt-2 flex gap-4 border-t border-[var(--axis-hairline)] px-2 pt-2">
          {exposureData.map((d) => (
            <div key={d.peer} className="flex-1 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px]">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                <span className={d.isSelf ? 'font-semibold text-[var(--axis-accent-strong)]' : 'text-[var(--axis-body)]'}>{d.label}</span>
              </p>
              <p className="mt-1 text-[11px] text-[var(--axis-muted)] tabular-nums">
                총 <strong className="text-[var(--axis-ink)]">{d.total}</strong>건
              </p>
              <p className="text-[10px] text-[var(--axis-muted)]">자사 {d.selfRatio.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* 외부 출처만 기준으로 다시 본 순위 */}
      <div className="mt-4 rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2">
        <p className="text-[11px] font-semibold text-[var(--axis-body)]">자사 보도자료 제거 후 — 외부 출처만 본 tier1 노출 순위</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          {[...exposureData].sort((a, b) => b.external - a.external).map((d, idx) => (
            <span key={d.peer} className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-canvas)] px-2 py-1">
              <span className="font-bold text-[var(--axis-muted)]">#{idx + 1}</span>
              <span className={d.isSelf ? 'font-semibold text-[var(--axis-accent-strong)]' : 'text-[var(--axis-ink)]'}>
                {d.peer}
              </span>
              <span className="text-[var(--axis-muted)]">{d.external}</span>
            </span>
          ))}
        </div>
      </div>

      {/* self-peer bias caveat — 이 위젯에도 별도 명시 (메인 footer 미독자 보호) */}
      <p className="mt-3 rounded-md border border-[#E0822F] bg-[rgba(220,90,36,0.05)] px-3 py-2 text-[10px] leading-5 text-[var(--axis-muted)]">
        <span className="font-semibold text-[var(--axis-accent-strong)]">⚠️ 해석 주의 — self-peer bias:</span>{' '}
        자사는 보도자료·IR 을 직접 발행하므로 자사 출처가 자동으로 많아짐. 이는 회사가 잘하고 있다는 신호가 아니라
        PR 부서의 활동량 신호. raw count 로는 외부에서도 SK 가 1위 (219건) 지만,{' '}
        <strong>자사 1건당 외부 픽업 효율 (leverage) 로 보면 SDS 10.75× / HAE 6.90× / SK 1.24× / POS 0.77× / LGC 0.50×</strong>{' '}
        — SDS 의 PR 메시지가 외부에서 가장 잘 받아 적힘. 본 위젯은 사업 위상 비교가 아니라 PR/IR 도달 효율 추적 용도. 사업 위상은 좌측 메인 차트 (매출 × 성장률) 참조.
        <br />
        <span className="mt-1 inline-block italic">
          SK 는 점선 테두리 = "자사 — 다른 4 peer 와 같은 자로 재지 않음" 표기.
          sentiment 분류는 LLM 분류 정확도 검증 후 다음 버전에 색상 차원으로 추가 예정.
        </span>
      </p>
    </section>
  );
}
