import { useMemo, useState } from 'react';
import { GitMerge, Share2, Wand2 } from 'lucide-react';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import {
  getExecutiveRank,
  getExposureScore,
  getPeerLabel,
  getSuggestedActions,
  getSummaryLines,
} from '../../../../features/card-news/mappers/cardNewsExecutive';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveCard,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { PageProcessLoading, PageState } from '../../shared/PageState';

interface RawArticlesViewProps {
  bookmarkedIds: string[];
}

type MixerResultView = {
  mixId: string;
  sourceCardIds: string[];
  summary: string;
  connections: string[];
  skAxPerspective: string;
  confidence: number;
};

export function RawArticlesView({ bookmarkedIds }: RawArticlesViewProps) {
  const { cards, isLoading, error, reload } = useCardNews();
  const bookmarkedCards = useMemo(() => getExecutiveRank(cards).filter((card) => bookmarkedIds.includes(card.id)), [bookmarkedIds, cards]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<MixerResultView | null>(null);

  const selectedCards = bookmarkedCards.filter((card) => selectedIds.includes(card.id));
  const canGenerate = selectedCards.length >= 2 && selectedCards.length <= 20;

  const toggleSelection = (cardId: string) => {
    setSelectedIds((current) => (current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId]));
  };

  const generateMixerResult = () => {
    if (!canGenerate) {
      return;
    }

    const topCard = selectedCards.reduce((best, card) => (getExposureScore(card) > getExposureScore(best) ? card : best), selectedCards[0]);
    const actionPool = selectedCards.flatMap((card) => getSuggestedActions(card));
    const peers = Array.from(new Set(selectedCards.map((card) => getPeerLabel(card))));
    const connections = Array.from(
      new Set(
        selectedCards.flatMap((card) =>
          [...getSummaryLines(card), ...getSuggestedActions(card)]
            .join(' ')
            .split(/\s+/)
            .filter((token) => ['AX', '보안', '운영', 'AI', '레퍼런스', '고객', '데이터', '패키지'].includes(token)),
        ),
      ),
    ).slice(0, 5);

    setResult({
      mixId: `MX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${selectedCards.length}`,
      sourceCardIds: selectedIds,
      summary: `${peers.join(', ')} 관련 카드 ${selectedCards.length}건은 "${topCard.subtitle ?? topCard.category}" 흐름으로 연결됩니다.`,
      connections: connections.length > 0 ? connections : ['AX 운영 자동화', '보안 내재화', '재무 성과 연결'],
      skAxPerspective: actionPool[0] ?? '산업별 운영 자동화 패키지 제안으로 전환 여지가 있습니다.',
      confidence: Math.min(0.94, Math.max(0.62, selectedCards.reduce((total, card) => total + getExposureScore(card), 0) / selectedCards.length / 100)),
    });
  };

  if (isLoading || error) {
    return (
      <PageState
        loading={isLoading}
        error={error}
        loadingLabel="믹서기 후보 카드를 불러오는 중입니다."
        loadingFallback={(
          <PageProcessLoading
            eyebrow="Bookmarked mixer"
            title="북마크 후보 카드를 불러오는 중"
            description="북마크된 카드만 추려 조합 가능한 후보와 결과 초안을 만들 수 있게 준비합니다."
            steps={[
              { label: '카드 목록 요청', detail: '/api/cards 응답 대기' },
              { label: '북마크 매칭', detail: '저장된 카드 ID와 후보 카드 연결' },
              { label: '작업대 구성', detail: '선택 목록과 결과 패널 준비' },
            ]}
            meta={['source: bookmarked card news', 'endpoint: /api/cards']}
          />
        )}
        onRetry={reload}
      >
        {null}
      </PageState>
    );
  }

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="Mixer workbench"
          title="믹서기"
          subtitle="북마크한 카드뉴스 2~20개를 조합해 반복 신호, 연결 관계, SK AX 관점의 실행 문장을 생성합니다."
          actions={
            <>
              <ExecutiveButton variant="secondary" icon={<Share2 size={16} />} disabled={!result}>
                결과 공유
              </ExecutiveButton>
              <ExecutiveButton icon={<Wand2 size={16} />} disabled={!canGenerate} onClick={generateMixerResult}>
                New 인사이트 생성
              </ExecutiveButton>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-4 mb-12">
          <ExecutiveMetric label="Bookmarked cards" value={bookmarkedCards.length} helper="믹서 입력 후보" />
          <ExecutiveMetric label="Selected" value={selectedCards.length} helper="2~20개 필요" tone={canGenerate ? 'success' : 'warning'} />
          <ExecutiveMetric label="Average exposure" value={selectedCards.length ? Math.round(selectedCards.reduce((total, card) => total + getExposureScore(card), 0) / selectedCards.length) : 0} helper="선택 카드 평균" tone="accent" />
          <ExecutiveMetric label="Result" value={result ? 'Ready' : 'Draft'} helper={result?.mixId ?? '아직 생성 전'} />
        </section>

        <section className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1fr)_30rem]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="axis-kicker">Source cards</p>
                <h2 className="axis-section-heading mt-1">북마크 기반 후보</h2>
              </div>
              <ExecutiveBadge tone={canGenerate ? 'success' : 'warning'}>
                {canGenerate ? '생성 가능' : '2개 이상 선택'}
              </ExecutiveBadge>
            </div>

            {bookmarkedCards.length === 0 ? (
              <div className="axis-panel-flat p-10 text-center text-sm text-[var(--axis-muted)]">
                홈 또는 카드뉴스 화면에서 북마크한 카드가 아직 없습니다.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {bookmarkedCards.map((card) => (
                  <ExecutiveCard
                    key={card.id}
                    card={card}
                    selected={selectedIds.includes(card.id)}
                    bookmarked
                    onSelect={() => toggleSelection(card.id)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <section className="axis-panel-flat p-4">
              <div className="flex items-center gap-2">
                <GitMerge size={17} className="text-[var(--axis-accent)]" />
                <h3 className="axis-section-heading">Generated implication</h3>
              </div>

              {!result ? (
                <div className="mt-4 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] p-6 text-sm leading-6 text-[var(--axis-muted)]">
                  카드 2개 이상을 선택하면 OpenAPI `MixerResult.generated_implication` 구조에 맞춰 요약, 연결점, SK AX 관점을 생성합니다.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="axis-kicker">Summary</p>
                    <p className="mt-2 text-lg font-semibold leading-7 tracking-[-0.02em] text-[var(--axis-ink)]">{result.summary}</p>
                  </div>
                  <div>
                    <p className="axis-kicker">Connections</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.connections.map((connection) => (
                        <ExecutiveBadge key={connection} tone="accent">{connection}</ExecutiveBadge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] p-4 text-white">
                    <p className="text-[11px] font-semibold  text-ink">SK AX perspective</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-ink">{result.skAxPerspective}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--axis-hairline)] pt-3 text-sm">
                    <span className="text-[var(--axis-muted)]">Confidence</span>
                    <span className="font-semibold text-[var(--axis-ink)]">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
              )}
            </section>

            <section className="axis-panel-flat p-4">
              <p className="axis-kicker">Selected source ids</p>
              <div className="mt-3 space-y-2">
                {selectedCards.length === 0 ? (
                  <p className="text-sm text-[var(--axis-muted)]">선택된 카드가 없습니다.</p>
                ) : (
                  selectedCards.map((card) => (
                    <div key={card.id} className="rounded-[var(--axis-radius-md)] bg-white px-3 py-2 text-sm text-[var(--axis-body)]">
                      {card.id} · {getPeerLabel(card)}
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}
