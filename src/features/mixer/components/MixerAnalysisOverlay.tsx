/**
 * Mixer 분석 진행 중 표시 — 카드 정렬/신호 분석/문장 구성의 3단계 로딩 인디케이터.
 * MixerView 가 isGenerating 시 표시.
 */
export function MixerAnalysisOverlay() {
  const loadingSteps = ['카드 조합 정렬 중', '반복 신호 분석 중', '인사이트 문장 구성 중'];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[rgba(250,248,245,0.80)] backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(220,90,36,0.12),transparent_26%),radial-gradient(circle_at_82%_24%,rgba(90,107,87,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.58),rgba(245,238,228,0.72))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,110,96,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,110,96,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55" />

      <div className="absolute inset-0 flex items-center justify-center px-5">
        <div className="axis-panel-flat mixer-analysis-shell relative w-full max-w-[640px] overflow-hidden rounded-[var(--axis-radius-xl)] px-7 py-7 shadow-[0_36px_90px_-44px_rgba(26,26,31,0.38)]">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,90,36,0.45),transparent)]" />
          <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative mx-auto h-[180px] w-[180px]">
              <div className="mixer-ring mixer-ring-outer" />
              <div className="mixer-ring mixer-ring-middle" />
              <div className="mixer-ring mixer-ring-inner" />

              <div className="mixer-signal mixer-signal-one" />
              <div className="mixer-signal mixer-signal-two" />
              <div className="mixer-signal mixer-signal-three" />

              <div className="mixer-card mixer-card-left">
                <div className="mixer-card-chip" />
                <div className="mixer-card-line mixer-card-line-long" />
                <div className="mixer-card-line mixer-card-line-short" />
              </div>
              <div className="mixer-card mixer-card-center">
                <div className="mixer-card-chip" />
                <div className="mixer-card-line mixer-card-line-long" />
                <div className="mixer-card-line mixer-card-line-short" />
              </div>
              <div className="mixer-card mixer-card-right">
                <div className="mixer-card-chip" />
                <div className="mixer-card-line mixer-card-line-long" />
                <div className="mixer-card-line mixer-card-line-short" />
              </div>
            </div>

            <div>
              <p className="axis-kicker">Mixer analysis</p>
              <h3 className="mt-2 text-[1.95rem] font-display font-semibold leading-tight tracking-[-0.04em] text-[var(--axis-ink)]">
                카드뉴스를 연결 가능한 인사이트로 재구성하고 있습니다.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--axis-muted)]">
                선택한 카드, 산업, 키워드 사이의 반복 문맥을 정리하고 SK AX 관점의 제안 문장으로 압축하는 중입니다.
              </p>
              <div className="mt-5 grid gap-2">
                {loadingSteps.map((step, index) => (
                  <div
                    key={step}
                    className="mixer-step-row flex items-center gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-3 py-2"
                    style={{ animationDelay: `${index * 0.36}s` }}
                  >
                    <span className="mixer-step-dot" />
                    <span className="text-sm font-semibold text-[var(--axis-body)]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
