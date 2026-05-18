import { useMemo, useState } from 'react';
import { CircleDot, Sparkles } from 'lucide-react';
import { useCardNews } from '../../card-news/hooks/useCardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getPeerLabel,
  getSummaryLines,
} from '../../card-news/mappers/cardNewsExecutive';
import { FloatingCardNewsOverlay } from '../../card-news/components/FloatingCardNewsOverlay';
import { useInsightGeneration } from '../hooks/useInsightGeneration';
import { mockInsightResult } from '../../../shared/mocks/insight';
import { useContentViewMode } from '../../../shared/hooks/useContentViewMode';
import { EmptyBlock } from '../../../shared/ui/page-state';
import { InsightRevealBubble } from '../../../shared/ui/insight-reveal-bubble';
import {
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../../app/components/executive/ExecutiveSystem';

export function InsightResultView({
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: (view: string) => void;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { cards } = useCardNews();
  const contentViewMode = useContentViewMode();
  const insightEvidenceCards = useMemo(() => getExecutiveRank(cards).slice(0, 6), [cards]);
  const insightCardIds = useMemo(
    () => insightEvidenceCards.map((card) => card.id),
    [insightEvidenceCards],
  );
  const { result: generated, raw, isLoading: isGenerating, error: generateError, regenerate } =
    useInsightGeneration({ cardIds: insightCardIds });
  const insightResult = generated ?? mockInsightResult;
  const isAiGenerated = generated !== null;
  const confidence = raw?.confidence ?? null;
  const lowConfidence = confidence !== null && confidence < 0.6;
  const [showReasoningSteps, setShowReasoningSteps] = useState(false);
  const [insightDetailCardId, setInsightDetailCardId] = useState<string | null>(null);
  const [insightDetailSlideIndex, setInsightDetailSlideIndex] = useState(0);
  const [activeInsightStep, setActiveInsightStep] = useState(0);
  const insightDetailCard = insightDetailCardId ? cards.find((card) => card.id === insightDetailCardId) ?? null : null;
  const isVisualMode = contentViewMode === 'visual';
  const activeFlowStep = insightResult.flowSteps[activeInsightStep] ?? insightResult.flowSteps[0];

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Insight result"
          title={insightResult.title}
          subtitle="원인, 변화, 영향, 대응을 한 화면에서 연결해 읽을 수 있도록 재배치했습니다."
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {isAiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.10)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
              <Sparkles size={14} />
              AI 초안
              {confidence !== null ? (
                <span className="ml-1 text-[var(--axis-muted)]">신뢰도 {Math.round(confidence * 100)}%</span>
              ) : null}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--axis-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--axis-muted)]">
              샘플 데이터
            </span>
          )}
          {isGenerating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.06)] px-3 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">
              분석 생성 중…
            </span>
          ) : null}
          {lowConfidence ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
              ⚠️ 근거 불충분 — 결과를 참고용으로만 사용
            </span>
          ) : null}
          {raw?.warning ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
              ⚠️ {raw.warning}
            </span>
          ) : null}
          {generateError ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              생성 실패: {generateError}
            </span>
          ) : null}
          <button
            type="button"
            onClick={regenerate}
            disabled={isGenerating || insightCardIds.length === 0}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1 text-xs font-semibold text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            다시 분석
          </button>
        </div>

        <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-5">
            {isVisualMode ? (
              <>
                <section data-guide="insight-summary" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
                        <Sparkles size={18} />
                      </span>
                      <h2 className="axis-section-heading">핵심 판단</h2>
                    </div>
                  </div>
                  <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="flex min-h-[300px] flex-col justify-center rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.28)] bg-[radial-gradient(circle_at_12%_20%,rgba(220,90,36,0.12),transparent_34%),var(--axis-canvas)] p-6">
                      <p className="text-2xl font-semibold leading-9 text-[var(--axis-ink)]">{insightResult.summary}</p>
                      <p className="mt-4 text-sm font-semibold text-[var(--axis-muted)]">단계 카드를 누르면 오른쪽 도형 보드의 상세 해석이 바뀝니다.</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {insightResult.flowSteps.map((step, index) => (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => setActiveInsightStep(index)}
                            className={`group relative min-h-24 overflow-hidden rounded-[var(--axis-radius-md)] border p-3 text-left transition hover:border-[var(--axis-accent)] ${
                              activeInsightStep === index
                                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.11)]'
                                : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)]'
                            }`}
                            aria-pressed={activeInsightStep === index}
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--axis-canvas)] text-xs font-black text-[var(--axis-accent-strong)]">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <span className="text-sm font-bold text-[var(--axis-ink)]">{step.label}</span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[var(--axis-body)]">{step.description}</p>
                            <InsightRevealBubble text={step.description} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-h-[300px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] p-5">
                      <div className="absolute left-1/2 top-10 h-[calc(100%-80px)] w-px -translate-x-1/2 bg-[var(--axis-hairline)]" aria-hidden="true" />
                      <div className="absolute left-10 right-10 top-1/2 h-px -translate-y-1/2 bg-[var(--axis-hairline)]" aria-hidden="true" />
                      <div className="relative z-10 flex h-full min-h-[260px] items-center justify-center">
                        <div className="max-w-sm rounded-[var(--axis-radius-lg)] border border-[rgba(220,90,36,0.32)] bg-[var(--axis-canvas)] p-5 text-center shadow-[0_18px_48px_-34px_rgba(0,0,0,0.38)]">
                          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--axis-accent)] text-lg font-black text-white">
                            {String(activeInsightStep + 1).padStart(2, '0')}
                          </span>
                          <p className="mt-4 axis-kicker">{activeFlowStep?.label}</p>
                          <p className="mt-2 text-lg font-semibold leading-7 text-[var(--axis-ink)]">{activeFlowStep?.description}</p>
                        </div>
                        {insightResult.flowSteps.map((step, index) => {
                          const positions = [
                            'left-[8%] top-[10%]',
                            'right-[8%] top-[12%]',
                            'left-[9%] bottom-[10%]',
                            'right-[9%] bottom-[12%]',
                          ];
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => setActiveInsightStep(index)}
                              className={`absolute ${positions[index] ?? 'left-4 top-4'} flex h-20 w-20 items-center justify-center rounded-full border text-xs font-black transition hover:scale-105 ${
                                activeInsightStep === index
                                  ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                                  : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                              }`}
                              aria-label={`${step.label} 상세 보기`}
                              aria-pressed={activeInsightStep === index}
                            >
                              {step.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
                <section data-guide="insight-analysis" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  {[
                    { title: '판단 근거', label: 'Evidence', items: insightResult.evidence, tone: 'success' },
                    { title: '시사점', label: 'Implications', items: insightResult.implications, tone: 'accent' },
                  ].map((group) => (
                    <section key={group.title} className="axis-panel-flat overflow-hidden">
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                        <p className="axis-kicker">{group.label}</p>
                        <h2 className="axis-section-heading mt-1">{group.title}</h2>
                      </div>
                      <div className="grid gap-3 p-5 sm:grid-cols-2">
                        {group.items.map((item, index) => (
                          <article
                            key={item}
                            tabIndex={0}
                            className={`group relative min-h-32 overflow-hidden rounded-[var(--axis-radius-lg)] border p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--axis-accent)] focus-visible:border-[var(--axis-accent)] focus-visible:outline-none ${
                              group.tone === 'success'
                                ? 'border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)]'
                                : 'border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.07)]'
                            }`}
                          >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--axis-canvas)] text-xs font-bold text-[var(--axis-muted)]">{index + 1}</span>
                            <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item}</p>
                            <InsightRevealBubble text={item} />
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </section>
              </>
            ) : (
              <>
                <section data-guide="insight-summary" className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.26)]">
                  <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.08)] px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-canvas)] text-[var(--axis-accent)]">
                        <Sparkles size={18} />
                      </span>
                      <h2 className="axis-section-heading">핵심 판단</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-2xl font-semibold leading-9 text-[var(--axis-ink)]">{insightResult.summary}</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {insightResult.flowSteps.map((step, index) => (
                        <article key={step.id} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_14px_36px_-34px_rgba(0,0,0,0.32)]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-[rgba(220,90,36,0.10)] px-2 py-1 text-xs font-semibold text-[var(--axis-accent-strong)]">{String(index + 1).padStart(2, '0')}</span>
                            <CircleDot size={18} className="text-[var(--axis-accent)]" />
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-[var(--axis-ink)]">{step.label}</h3>
                          <p className="mt-2 text-base leading-7 text-[var(--axis-body)]">{step.description}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
                <section data-guide="insight-analysis" className="grid gap-5 lg:grid-cols-2">
                  <div className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                    <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                      <p className="axis-kicker">Evidence</p>
                      <h2 className="axis-section-heading mt-1">판단 근거</h2>
                    </div>
                    <ul className="space-y-2 p-5">
                      {insightResult.evidence.map((item, index) => (
                        <li key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-base leading-7 text-[var(--axis-body)]">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-semibold text-[var(--axis-success)]">{index + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.28)]">
                    <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.07)] px-5 py-4">
                      <p className="axis-kicker">Implications</p>
                      <h2 className="axis-section-heading mt-1">시사점</h2>
                    </div>
                    <ul className="space-y-2 p-5">
                      {insightResult.implications.map((item, index) => (
                        <li key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-base leading-7 text-[var(--axis-body)]">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,90,36,0.11)] text-xs font-semibold text-[var(--axis-accent-strong)]">{index + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </>
            )}

            {raw && raw.reasoning_trail.length > 0 ? (
              <section data-guide="insight-reasoning-trail" className="axis-panel-flat overflow-hidden">
                <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                  <p className="axis-kicker">Reasoning trail</p>
                  <h2 className="axis-section-heading mt-1">AI 판단 흐름</h2>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
                    InsightCascade 4-phase 가 어떤 순서로 결론을 도출했는지 한 줄씩 보여줍니다.
                  </p>
                </div>
                <ol className="space-y-2 p-5">
                  {raw.reasoning_trail.map((item) => (
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
                          <p className="mt-2 text-xs text-[var(--axis-muted)]">
                            근거: {item.evidence_refs.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                {raw.reasoning_steps.length > 0 ? (
                  <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setShowReasoningSteps((prev) => !prev)}
                      className="text-xs font-semibold text-[var(--axis-accent-strong)] underline-offset-2 hover:underline"
                      aria-expanded={showReasoningSteps}
                    >
                      {showReasoningSteps ? '상세 단계 닫기 ▲' : '상세 단계 더 보기 ▼'}
                    </button>
                    {showReasoningSteps ? (
                      <ol className="mt-3 space-y-3">
                        {raw.reasoning_steps.map((step) => (
                          <li
                            key={step.step_idx}
                            className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[var(--axis-accent-strong)]">
                                Step {step.step_idx} · {step.phase}
                              </p>
                              <span className="text-xs text-[var(--axis-muted)]">
                                conf {step.confidence.toFixed(2)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[var(--axis-ink)]">Q. {step.question}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">A. {step.answer}</p>
                            <p className="mt-2 text-xs italic leading-5 text-[var(--axis-muted)]">
                              중간 결론: {step.intermediate_conclusion}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ) : null}
                {raw.langfuse_trace_id ? (
                  <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-2 text-right">
                    <span className="text-[10px] font-mono text-[var(--axis-muted)]">
                      trace: {raw.langfuse_trace_id}
                    </span>
                  </div>
                ) : null}
              </section>
            ) : null}

            {raw && raw.follow_up_questions.length > 0 ? (
              <section className="axis-panel-flat overflow-hidden">
                <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                  <p className="axis-kicker">Follow up</p>
                  <h2 className="axis-section-heading mt-1">후속 질문</h2>
                </div>
                <ul className="space-y-2 p-5">
                  {raw.follow_up_questions.map((question, index) => (
                    <li
                      key={`${index}-${question}`}
                      className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-3 text-sm leading-6 text-[var(--axis-body)]"
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </main>

          <aside data-guide="insight-sources" className="2xl:sticky 2xl:top-4 2xl:self-start">
            {insightEvidenceCards.length > 0 ? (
              <section className="axis-panel-flat p-5">
                <p className="axis-kicker">Evidence queue</p>
                <h2 className="axis-section-heading mt-1">근거 카드뉴스</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
                  브리핑에서 쓰는 근거 카드뉴스 형식으로, 인사이트 판단 근거를 바로 확인합니다.
                </p>
                <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {insightEvidenceCards.map((card, index) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setInsightDetailCardId(card.id)}
                      className="group relative block w-full overflow-hidden rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-canvas)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(220,90,36,0.10)] text-xs font-black text-[var(--axis-accent-strong)]">
                          {index + 1}
                        </span>
                        <span className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
                      <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-[var(--axis-muted)]">{getSummaryLines(card)[0]}</p>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <EmptyBlock label="관련 콘텐츠 카드가 없습니다." />
            )}
          </aside>
        </section>
      </ExecutiveContainer>
      {insightDetailCard ? (
        <FloatingCardNewsOverlay
          card={insightDetailCard}
          cards={insightEvidenceCards}
          bookmarked={bookmarkedIds.includes(insightDetailCard.id)}
          slideIndex={insightDetailSlideIndex}
          onSlideChange={setInsightDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(insightDetailCard.id)}
          onCardChange={(cardId) => {
            setInsightDetailCardId(cardId);
            setInsightDetailSlideIndex(0);
          }}
          onClose={() => {
            setInsightDetailCardId(null);
            setInsightDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}

