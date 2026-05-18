import { useState } from 'react';
import { CircleDot, Sparkles } from 'lucide-react';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { mockInsightResult } from '../../../../shared/mocks/insight';
import { useContentViewMode } from '../../../../shared/hooks/useContentViewMode';
import { ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { EmptyBlock } from './AxisPlanningShared';

type NavigateHandler = (view: string) => void;

const insightResult = mockInsightResult;

export function InsightResultView({
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { cards } = useCardNews();
  const contentViewMode = useContentViewMode();
  const insightEvidenceCards = getExecutiveRank(cards).slice(0, 6);
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
          subtitle="브리핑이 오늘의 변화를 정리한다면, 인사이트는 그 변화들을 함께 놓고 봤을 때 시장이 무엇을 더 신뢰하는지 읽는 화면입니다."
        />

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
                  <div className="p-6">
                    <div className="overflow-hidden rounded-[calc(var(--axis-radius-xl)+2px)] border border-[rgba(220,90,36,0.24)] bg-[linear-gradient(145deg,rgba(255,249,241,0.98),rgba(248,242,233,0.92))] p-6">
                      <p className="text-2xl font-semibold leading-9 text-[var(--axis-ink)]">{insightResult.summary}</p>
                      <p className="mt-4 text-base leading-7 text-[var(--axis-body)]">{insightResult.focusQuestion}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        {insightResult.flowSteps.map((step, index) => (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => setActiveInsightStep(index)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left transition hover:border-[var(--axis-accent)] ${
                              activeInsightStep === index
                                ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                                : 'border-[var(--axis-hairline)] bg-white/82 text-[var(--axis-body)]'
                            }`}
                            aria-pressed={activeInsightStep === index}
                          >
                            <span className="text-[11px] font-black">{String(index + 1).padStart(2, '0')}</span>
                            <span className="text-sm font-semibold">{step.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 grid gap-5 xl:grid-cols-[148px_minmax(0,1fr)]">
                        <div className="flex items-start xl:justify-center">
                          <div className="rounded-[28px] bg-[rgba(220,90,36,0.12)] px-5 py-6 text-center">
                            <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">Step</span>
                            <span className="mt-2 block text-[2rem] font-display font-semibold text-[var(--axis-ink)]">
                              {String(activeInsightStep + 1).padStart(2, '0')}
                            </span>
                            <span className="mt-2 block text-sm font-semibold text-[var(--axis-body)]">{activeFlowStep.label}</span>
                          </div>
                        </div>
                        <article className="relative overflow-hidden rounded-[var(--axis-radius-xl)] bg-white/72 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
                          <div className="absolute inset-y-6 left-0 w-1 rounded-full bg-[linear-gradient(180deg,var(--axis-accent),rgba(220,90,36,0.18))]" />
                          <p className="axis-kicker">{activeFlowStep.label}</p>
                          <h3 className="mt-2 text-[1.2rem] font-semibold leading-8 text-[var(--axis-ink)]">{activeFlowStep.headline}</h3>
                          <p className="mt-4 text-base leading-7 text-[var(--axis-body)]">{activeFlowStep.description}</p>
                        </article>
                      </div>
                    </div>
                  </div>
                </section>
                <section data-guide="insight-analysis" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  {[
                    { title: '시장 해석 포인트', label: 'Market reading', items: insightResult.problemChain, tone: 'success' },
                    { title: 'SK AX 시사점', label: 'SK AX view', items: insightResult.solutionChain, tone: 'accent' },
                  ].map((group) => (
                    <section key={group.title} className="axis-panel-flat overflow-hidden">
                      <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                        <p className="axis-kicker">{group.label}</p>
                        <h2 className="axis-section-heading mt-1">{group.title}</h2>
                      </div>
                      <div className="space-y-5 p-5">
                        {group.items.map((item, index) => (
                          <article
                            key={item.title}
                            className="grid gap-3 border-b border-[rgba(26,26,31,0.08)] pb-5 last:border-b-0 last:pb-0 md:grid-cols-[52px_minmax(0,1fr)]"
                          >
                            <div className="flex items-start">
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                                  group.tone === 'success'
                                    ? 'bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                                    : 'bg-[rgba(220,90,36,0.12)] text-[var(--axis-accent-strong)]'
                                }`}
                              >
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-[1.02rem] font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
                              <p className="mt-3 text-[12px] leading-5 text-[var(--axis-muted)]">이렇게 읽는 이유: {item.reason}</p>
                            </div>
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
                    <p className="mt-4 text-base leading-7 text-[var(--axis-body)]">{insightResult.focusQuestion}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      {insightResult.flowSteps.map((step, index) => (
                        <article
                          key={step.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-2"
                        >
                          <span className="text-[11px] font-black text-[var(--axis-accent-strong)]">{String(index + 1).padStart(2, '0')}</span>
                          <CircleDot size={15} className="text-[var(--axis-accent)]" />
                          <span className="text-sm font-semibold text-[var(--axis-ink)]">{step.label}</span>
                        </article>
                      ))}
                    </div>
                    <div className="mt-6 rounded-[var(--axis-radius-xl)] bg-[linear-gradient(135deg,rgba(255,250,243,0.9),rgba(247,240,229,0.82))] px-6 py-5">
                      <p className="axis-kicker">{activeFlowStep.label}</p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--axis-ink)]">{activeFlowStep.headline}</h3>
                      <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{activeFlowStep.description}</p>
                    </div>
                  </div>
                </section>
                <section data-guide="insight-analysis" className="grid gap-5 lg:grid-cols-2">
                  <div className="axis-panel-flat overflow-hidden border-[rgba(90,107,87,0.28)]">
                    <div className="border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
                      <p className="axis-kicker">Market reading</p>
                      <h2 className="axis-section-heading mt-1">시장 해석 포인트</h2>
                    </div>
                    <ul className="space-y-4 p-5">
                      {insightResult.problemChain.map((item, index) => (
                        <li key={item.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-[rgba(26,26,31,0.08)] pb-4 last:border-b-0 last:pb-0">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-semibold text-[var(--axis-success)]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</p>
                            <p className="mt-1 text-base leading-7 text-[var(--axis-body)]">{item.body}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">이렇게 읽는 이유: {item.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="axis-panel-flat overflow-hidden border-[rgba(220,90,36,0.28)]">
                    <div className="border-b border-[var(--axis-hairline)] bg-[rgba(220,90,36,0.07)] px-5 py-4">
                      <p className="axis-kicker">SK AX view</p>
                      <h2 className="axis-section-heading mt-1">SK AX 시사점</h2>
                    </div>
                    <ul className="space-y-4 p-5">
                      {insightResult.solutionChain.map((item, index) => (
                        <li key={item.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-[rgba(26,26,31,0.08)] pb-4 last:border-b-0 last:pb-0">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(220,90,36,0.11)] text-xs font-semibold text-[var(--axis-accent-strong)]">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-base font-semibold leading-7 text-[var(--axis-ink)]">{item.title}</p>
                            <p className="mt-1 text-base leading-7 text-[var(--axis-body)]">{item.body}</p>
                            <p className="mt-2 text-sm leading-6 text-[var(--axis-muted)]">이렇게 읽는 이유: {item.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </>
            )}
          </main>

          <aside data-guide="insight-sources" className="2xl:sticky 2xl:top-4 2xl:self-start">
            {insightEvidenceCards.length > 0 ? (
              <section className="axis-panel-flat p-5">
                <p className="axis-kicker">Evidence queue</p>
                <h2 className="axis-section-heading mt-1">근거 카드뉴스</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-muted)]">
                  이 인사이트가 어떤 기사 묶음과 경쟁 신호에서 출발했는지 바로 되짚어 볼 수 있습니다.
                </p>
                <div className="mt-4 max-h-[248px] space-y-3 overflow-y-auto pr-1">
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
                {insightEvidenceCards.length > 2 ? (
                  <p className="mt-3 text-[11px] font-semibold text-[var(--axis-muted)]">아래로 스크롤해 더 보기</p>
                ) : null}
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
