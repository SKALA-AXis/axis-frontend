import { Globe, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGlobalTrends } from '../../features/global-trends/hooks/useGlobalTrends';
import type { GlobalTrendsResponse } from '../../features/global-trends/model/globalTrends';

const COMPANY_LABEL: Record<string, string> = {
  nvidia: 'NVIDIA',
  apple: 'Apple',
  microsoft: 'Microsoft',
  google: 'Google',
  amazon: 'Amazon',
  meta: 'Meta',
};

const SK_AX_LINE_LABEL: Record<string, string> = {
  ai_managed: 'AI 매니지드',
  cloud_msp: 'Cloud MSP',
  security: 'Security',
  smart_factory: '스마트 팩토리',
  data_platform: '데이터 플랫폼',
};

const DIRECTION_BADGE: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800',
  neutral: 'bg-gray-100 text-gray-700',
  negative: 'bg-rose-100 text-rose-800',
};

const INTENSITY_BADGE: Record<string, string> = {
  weak: 'bg-gray-100 text-gray-700',
  moderate: 'bg-amber-100 text-amber-800',
  strong: 'bg-rose-100 text-rose-800',
};

const RISK_BADGE: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-rose-100 text-rose-800',
};

export function GlobalTrendsView() {
  const { data, isLoading, error, run } = useGlobalTrends();
  const [windowDays, setWindowDays] = useState<number>(30);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    run({ windowDays });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = () => {
    run({ windowDays });
  };

  return (
    <div className="space-y-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="axis-kicker flex items-center gap-2">
            <Globe size={14} /> Global trends
          </p>
          <h1 className="mt-1 text-2xl font-display font-semibold text-[var(--axis-ink)]">
            글로벌 빅테크 6사 동향이 SK AX 에 미치는 영향
          </h1>
          <p className="mt-2 text-sm text-[var(--axis-muted)]">
            NVIDIA · Apple · Microsoft · Google · Amazon · Meta — 5-phase CoT (스냅샷 / 트렌드 / 영향 매트릭스 / 전망 / 결론)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--axis-muted)]">분석 윈도우</label>
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--axis-ink)]"
          >
            <option value={7}>7일</option>
            <option value={14}>14일</option>
            <option value={30}>30일</option>
            <option value={60}>60일</option>
            <option value={90}>90일</option>
          </select>
          <button
            type="button"
            onClick={handleRun}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-accent)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isLoading ? '분석 중…' : '분석 실행'}
          </button>
        </div>
      </header>

      <StatusBar data={data} isLoading={isLoading} error={error} />

      {data ? (
        <div className="space-y-5">
          {data.final_one_liner ? (
            <section className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
              <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-5 py-3">
                <p className="axis-kicker">Final synthesis</p>
              </div>
              <div className="p-5">
                <p className="text-xl font-semibold leading-9 text-[var(--axis-ink)]">{data.final_one_liner}</p>
                {data.sk_ax_implication ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{data.sk_ax_implication}</p>
                ) : null}
              </div>
            </section>
          ) : null}

          <SnapshotsPanel snapshots={data.snapshots} />
          <TrendDetectionsPanel detections={data.trend_detections} />
          <ImpactMatrixPanel matrix={data.impact_matrix} />
          <ForecastsPanel forecasts={data.forecasts} />
          <ReasoningTrailPanel
            data={data}
            showSteps={showSteps}
            onToggleSteps={() => setShowSteps((prev) => !prev)}
          />
          <FollowUpPanel data={data} />
        </div>
      ) : null}
    </div>
  );
}

function StatusBar({
  data,
  isLoading,
  error,
}: {
  data: GlobalTrendsResponse | null;
  isLoading: boolean;
  error: string | null;
}) {
  const confidence = data?.confidence ?? null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {data ? (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.10)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
            <Sparkles size={14} /> AI 초안
            {confidence !== null ? (
              <span className="ml-1 text-[var(--axis-muted)]">신뢰도 {Math.round(confidence * 100)}%</span>
            ) : null}
          </span>
          {data.analysis_period ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
              기간 {(data.analysis_period as Record<string, unknown>).since as string} ~ {(data.analysis_period as Record<string, unknown>).until as string}
            </span>
          ) : null}
        </>
      ) : null}
      {isLoading ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.06)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
          분석 중…
        </span>
      ) : null}
      {data && (data.confidence ?? 0) < 0.6 && (data.snapshots.some((s) => s.card_count > 0)) ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
          ⚠️ 근거 불충분 — 참고용
        </span>
      ) : null}
      {data?.warning ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
          ⚠️ {data.warning}
        </span>
      ) : null}
      {error ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          분석 실패: {error}
        </span>
      ) : null}
    </div>
  );
}

function SnapshotsPanel({ snapshots }: { snapshots: GlobalTrendsResponse['snapshots'] }) {
  return (
    <section className="axis-panel-flat overflow-hidden">
      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
        <p className="axis-kicker">Phase 1 · Global snapshots</p>
        <h2 className="axis-section-heading mt-1">글로벌 6사 스냅샷</h2>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
        {snapshots.map((s) => (
          <article
            key={s.company_id}
            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--axis-ink)]">{COMPANY_LABEL[s.company_id] ?? s.company_id}</h3>
              <span className="rounded-full bg-[rgba(220,90,36,0.10)] px-2 py-0.5 text-[10px] font-bold text-[var(--axis-accent-strong)]">
                {s.card_count} cards
              </span>
            </div>
            {s.top_themes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {s.top_themes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[var(--axis-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--axis-muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {s.headline_announcements.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs leading-5 text-[var(--axis-body)]">
                {s.headline_announcements.slice(0, 3).map((h, idx) => (
                  <li key={`${idx}-${h.title}`} className="line-clamp-2">
                    · {h.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs italic text-[var(--axis-muted)]">데이터 없음 (글로벌 ingestion 미커버)</p>
            )}
            <p className="mt-2 text-[10px] text-[var(--axis-muted)]">{s.source_marker}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendDetectionsPanel({ detections }: { detections: GlobalTrendsResponse['trend_detections'] }) {
  if (detections.length === 0) {
    return (
      <section className="axis-panel-flat overflow-hidden">
        <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
          <p className="axis-kicker">Phase 2 · Trend detection</p>
          <h2 className="axis-section-heading mt-1">트렌드 감지 (산식 — frequency delta)</h2>
        </div>
        <p className="p-5 text-sm italic text-[var(--axis-muted)]">감지된 트렌드 없음 (직전 윈도우 대비 |Δ| ≥ 20% theme 없음).</p>
      </section>
    );
  }
  return (
    <section className="axis-panel-flat overflow-hidden">
      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
        <p className="axis-kicker">Phase 2 · Trend detection</p>
        <h2 className="axis-section-heading mt-1">트렌드 감지 (산식)</h2>
      </div>
      <ul className="space-y-2 p-5">
        {detections.map((d, idx) => (
          <li
            key={`${idx}-${d.theme}`}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
          >
            <div>
              <p className="text-sm font-bold text-[var(--axis-ink)]">{d.theme}</p>
              <p className="mt-1 text-xs text-[var(--axis-muted)]">
                Leading: {d.leading_companies.map((c) => COMPANY_LABEL[c] ?? c).join(', ') || 'N/A'}
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-[var(--axis-accent-strong)]">
              {d.frequency_delta_pct > 0 ? '+' : ''}{d.frequency_delta_pct}%
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${INTENSITY_BADGE[d.intensity]}`}>
              {d.intensity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ImpactMatrixPanel({ matrix }: { matrix: GlobalTrendsResponse['impact_matrix'] }) {
  if (matrix.length === 0) return null;
  return (
    <section className="axis-panel-flat overflow-hidden">
      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
        <p className="axis-kicker">Phase 3 · Impact mapping (LLM)</p>
        <h2 className="axis-section-heading mt-1">SK AX 영향 매트릭스</h2>
      </div>
      <div className="grid gap-2 p-5 md:grid-cols-2">
        {matrix.map((cell, idx) => (
          <article
            key={`${idx}-${cell.trend_theme}-${cell.sk_ax_line}`}
            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[var(--axis-muted)]">{cell.trend_theme}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIRECTION_BADGE[cell.direction]}`}>
                {cell.direction} · {cell.magnitude}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">
              → {SK_AX_LINE_LABEL[cell.sk_ax_line] ?? cell.sk_ax_line}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--axis-body)]">{cell.channel}</p>
            {cell.quant_hint ? (
              <p className="mt-1 text-[10px] font-mono text-[var(--axis-accent-strong)]">{cell.quant_hint}</p>
            ) : null}
            <p className="mt-1 text-[10px] text-[var(--axis-muted)]">{cell.source_marker}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ForecastsPanel({ forecasts }: { forecasts: GlobalTrendsResponse['forecasts'] }) {
  if (forecasts.length === 0) return null;
  return (
    <section className="axis-panel-flat overflow-hidden">
      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
        <p className="axis-kicker">Phase 4 · Forecast</p>
        <h2 className="axis-section-heading mt-1">전망 시나리오 (1Q / 6M / 1Y)</h2>
      </div>
      <div className="grid gap-3 p-5 lg:grid-cols-3">
        {forecasts.map((f, idx) => (
          <article
            key={`${idx}-${f.horizon}-${f.scenario}`}
            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[var(--axis-accent-strong)]">
                {f.horizon} · {f.scenario}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RISK_BADGE[f.risk_level]}`}>
                risk: {f.risk_level}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-ink)]">{f.narrative}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--axis-body)]">{f.sk_ax_impact}</p>
            {f.drivers.length > 0 ? (
              <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[var(--axis-muted)]">
                {f.drivers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 rounded-[var(--axis-radius-sm)] bg-[var(--axis-surface-muted)] p-2 text-xs italic leading-5 text-[var(--axis-body)]">
              권장 대응: {f.recommended_response}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReasoningTrailPanel({
  data,
  showSteps,
  onToggleSteps,
}: {
  data: GlobalTrendsResponse;
  showSteps: boolean;
  onToggleSteps: () => void;
}) {
  if (data.reasoning_trail.length === 0) return null;
  return (
    <section className="axis-panel-flat overflow-hidden">
      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
        <p className="axis-kicker">Reasoning trail (Tier 1)</p>
        <h2 className="axis-section-heading mt-1">AI 분석 흐름</h2>
      </div>
      <ol className="space-y-2 p-5">
        {data.reasoning_trail.map((item) => (
          <li
            key={item.seq}
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.10)] text-xs font-black text-[var(--axis-accent-strong)]">
              {item.seq}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--axis-ink)]">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.one_liner}</p>
              {item.evidence_refs.length > 0 ? (
                <p className="mt-2 text-xs text-[var(--axis-muted)]">근거: {item.evidence_refs.join(', ')}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {data.reasoning_steps.length > 0 ? (
        <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-3">
          <button
            type="button"
            onClick={onToggleSteps}
            className="text-xs font-semibold text-[var(--axis-accent-strong)] underline-offset-2 hover:underline"
            aria-expanded={showSteps}
          >
            {showSteps ? '상세 단계 닫기 ▲' : '상세 단계 더 보기 ▼ (Tier 2)'}
          </button>
          {showSteps ? (
            <ol className="mt-3 space-y-2">
              {data.reasoning_steps.map((step) => (
                <li
                  key={step.step_idx}
                  className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[var(--axis-accent-strong)]">
                      Step {step.step_idx} · {step.phase}
                    </p>
                    <span className="text-xs text-[var(--axis-muted)]">conf {step.confidence.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">Q. {step.question}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">A. {step.answer}</p>
                  <p className="mt-2 text-xs italic leading-5 text-[var(--axis-muted)]">중간 결론: {step.intermediate_conclusion}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
      {data.langfuse_trace_id ? (
        <p className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-2 text-right text-[10px] font-mono text-[var(--axis-muted)]">
          trace: {data.langfuse_trace_id}
        </p>
      ) : null}
    </section>
  );
}

function FollowUpPanel({ data }: { data: GlobalTrendsResponse }) {
  if (data.follow_up_questions.length === 0 && data.risk_assumptions.length === 0) return null;
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      {data.follow_up_questions.length > 0 ? (
        <article className="axis-panel-flat overflow-hidden">
          <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-3">
            <p className="axis-kicker">Follow up</p>
            <h3 className="axis-section-heading mt-1">후속 질문</h3>
          </div>
          <ul className="space-y-2 p-5">
            {data.follow_up_questions.map((q, idx) => (
              <li
                key={`${idx}-${q}`}
                className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3 text-sm leading-6 text-[var(--axis-body)]"
              >
                {q}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
      {data.risk_assumptions.length > 0 ? (
        <article className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
          <div className="border-b border-[var(--axis-hairline)] bg-yellow-50 px-5 py-3">
            <p className="axis-kicker">Risk assumptions</p>
            <h3 className="axis-section-heading mt-1">분석 전제 (틀릴 가정)</h3>
          </div>
          <ul className="space-y-2 p-5">
            {data.risk_assumptions.map((r, idx) => (
              <li
                key={`${idx}-${r}`}
                className="rounded-[var(--axis-radius-md)] border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm leading-6 text-yellow-900"
              >
                ⚠️ {r}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
