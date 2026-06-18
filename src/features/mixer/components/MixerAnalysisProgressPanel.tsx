import { Box, Filter, Network, Sparkles } from 'lucide-react';
import type { MixerAnalysisMode, MixerStageEvent } from '../model/mixer';

// Mixer 분석 진행(단계 애니메이션) 표현 컴포넌트 (refactoring P2/stage3). MixerView 에서 그대로 옮긴 것.

const MIXER_RUN_STEPS: { stage: MixerStageEvent['stage']; title: string; description: string; icon: JSX.Element }[] = [
  { stage: 'prepare', title: '재료 정리', description: '선택한 카드와 연결된 통합 이슈·분석·시사점을 불러옵니다.', icon: <Box size={16} /> },
  { stage: 'analyze', title: '패턴 분석', description: '카드들의 공통 패턴·비교 포인트·숨은 결론을 LLM으로 도출합니다.', icon: <Filter size={16} /> },
  { stage: 'synthesize', title: '대응 방향', description: 'SK AX 관점의 대응 방향과 실행 제언을 만듭니다.', icon: <Network size={16} /> },
  { stage: 'finalize', title: '추론 정리', description: '추론 흐름과 근거 카드를 정리해 결과로 압축합니다.', icon: <Sparkles size={16} /> },
];

export function MixerAnalysisProgressPanel({
  stage,
  analysisMode,
}: {
  stage: MixerStageEvent | null;
  analysisMode: MixerAnalysisMode;
}) {
  const loadingSteps = MIXER_RUN_STEPS;
  // stage 미수신(요청 직후) 시 0단계 활성. 수신 시 실제 index 사용.
  const activeStep = stage ? Math.min(Math.max(stage.index, 0), loadingSteps.length - 1) : 0;
  const total = stage?.total ?? loadingSteps.length;
  const activeLabel = stage?.label ?? loadingSteps[activeStep]?.description ?? '';
  const modeLabel = analysisMode === 'deep' ? '정확 분석' : '빠른 실행';
  const modeDescription =
    analysisMode === 'deep'
      ? '정확 분석은 대응 방향을 추가로 정제하므로 시간이 더 걸릴 수 있습니다.'
      : '빠른 실행은 결과를 먼저 보여주기 위해 핵심 분석 경로만 사용합니다.';

  return (
    <article className="mb-5 axis-panel-flat mixer-analysis-shell relative overflow-hidden rounded-[var(--axis-radius-lg)] border-[rgba(220,90,36,0.22)] px-5 py-5 shadow-[0_24px_72px_-48px_rgba(26,26,31,0.38)]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,90,36,0.45),transparent)]" />
      <div className="relative grid items-center gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
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
                {modeLabel}으로 카드뉴스를 연결 가능한 인사이트로 재구성하고 있습니다.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--axis-muted)]">
                선택한 카드, Peer, 주제 사이의 반복 문맥을 정리하고 SK AX 관점의 실행 판단으로 압축하는 중입니다.
                {' '}
                {modeDescription}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgba(120,110,96,0.12)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--axis-accent),rgba(220,90,36,0.45))] transition-[width] duration-500"
                  style={{ width: `${((activeStep + 1) / total) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[var(--axis-muted)]">
                {activeStep + 1} / {total} 단계 진행 중
              </p>
              <div className="mt-5 grid gap-2">
                {loadingSteps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isComplete = index < activeStep;
                  return (
                  <div
                    key={step.title}
                    className={`mixer-step-row rounded-[var(--axis-radius-md)] border px-3 py-3 transition ${
                      isActive
                        ? 'border-[rgba(220,90,36,0.34)] bg-[rgba(220,90,36,0.08)] shadow-[0_12px_32px_-28px_rgba(220,90,36,0.62)]'
                        : isComplete
                          ? 'border-[rgba(90,107,87,0.26)] bg-[rgba(90,107,87,0.07)]'
                          : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)]'
                    }`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? 'bg-[rgba(220,90,36,0.14)] text-[var(--axis-accent-strong)]'
                          : isComplete
                            ? 'bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                            : 'bg-[var(--axis-canvas)] text-[var(--axis-muted)]'
                      }`}>
                        {step.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--axis-ink)]">{step.title}</span>
                          {isActive ? <span className="mixer-step-dot" /> : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--axis-body)]">{step.description}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[var(--axis-muted)]">
                          {isActive ? `${activeLabel}...` : isComplete ? '완료' : '대기 중'}
                        </p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
    </article>
  );
}
