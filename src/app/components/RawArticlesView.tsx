import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import {
  buildMixerCards,
  type MixerCardItem,
  type PeerName,
} from '../../features/card-news/mappers/cardNewsPresentation';

interface RawArticlesViewProps {
  bookmarkedIds: string[];
}

type PeerFilter = '전체' | PeerName;
type SectorFilter = '전체' | '섹터' | 'AI' | 'Peer';

const peerFilters: PeerFilter[] = ['전체', '삼성SDS', 'LG CNS', '현대 오토에버', '포스코 DX'];
const sectorFilters: SectorFilter[] = ['전체', '섹터', 'AI', 'Peer'];
const visibleCount = 5;

export function RawArticlesView({ bookmarkedIds }: RawArticlesViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const [peerFilter, setPeerFilter] = useState<PeerFilter>('전체');
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('전체');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<'peer' | 'sector' | null>(null);

  const mixerCards = useMemo<MixerCardItem[]>(() => {
    return buildMixerCards(cards);
  }, [cards]);

  const bookmarkedCards = useMemo(() => {
    return mixerCards.filter((item) => bookmarkedIds.includes(item.card.id));
  }, [bookmarkedIds, mixerCards]);

  const filteredCards = useMemo(() => {
    return bookmarkedCards.filter((item) => {
      const peerMatches = peerFilter === '전체' || item.peer === peerFilter;
      const sectorMatches = sectorFilter === '전체' || item.card.category === sectorFilter;
      return peerMatches && sectorMatches;
    });
  }, [bookmarkedCards, peerFilter, sectorFilter]);

  const selectedCards = useMemo(() => {
    return bookmarkedCards.filter((item) => selectedIds.includes(item.id));
  }, [bookmarkedCards, selectedIds]);

  const generatedCards = useMemo(() => {
    return bookmarkedCards.filter((item) => generatedIds.includes(item.id));
  }, [bookmarkedCards, generatedIds]);

  const insightResult = useMemo(() => buildMixerInsight(generatedCards), [generatedCards]);

  const maxPage = Math.max(0, Math.ceil(filteredCards.length / visibleCount) - 1);
  const currentPage = Math.min(page, maxPage);
  const visibleCards = filteredCards.slice(currentPage * visibleCount, currentPage * visibleCount + visibleCount);
  const placeholders = Math.max(0, visibleCount - visibleCards.length);

  const toggleSelection = (cardId: string) => {
    setSelectedIds((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId],
    );
  };

  const hasGeneratedResult = generatedCards.length > 0;
  const selectionChangedAfterGenerate =
    hasGeneratedResult &&
    (generatedIds.length !== selectedIds.length || generatedIds.some((id) => !selectedIds.includes(id)));

  if (isLoading) {
    return <div className="axis-page flex-1 p-6 text-sm text-black/56">카드뉴스를 불러오는 중입니다.</div>;
  }

  if (error) {
    return <div className="axis-page flex-1 p-6 text-sm text-black/56">{error}</div>;
  }

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div>
            <h1 className="text-[1.55rem] font-black tracking-[-0.045em] text-[#171717]">믹서기</h1>
            <p className="mt-1 text-sm text-black/52">북마크한 카드뉴스를 골라 통합 인사이트를 확인하세요.</p>
          </div>
        </div>

        <section className="rounded-[1.35rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,249,251,0.96))] px-4 py-4 shadow-[0_10px_30px_rgba(17,17,17,0.04)] sm:px-5">
          <div className="mb-5 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="min-w-[4.5rem] text-[0.98rem] font-bold tracking-[-0.03em] text-[#232323]">Peer사</h2>
              <DropdownFilter
                label="Peer사 필터"
                items={peerFilters}
                selected={peerFilter}
                open={openFilter === 'peer'}
                onToggle={() => setOpenFilter((current) => (current === 'peer' ? null : 'peer'))}
                onSelect={(value) => {
                  setPeerFilter(value as PeerFilter);
                  setPage(0);
                  setOpenFilter(null);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="min-w-[4.5rem] text-[0.98rem] font-bold tracking-[-0.03em] text-[#232323]">섹터</h2>
              <DropdownFilter
                label="섹터 필터"
                items={sectorFilters}
                selected={sectorFilter}
                open={openFilter === 'sector'}
                onToggle={() => setOpenFilter((current) => (current === 'sector' ? null : 'sector'))}
                onSelect={(value) => {
                  setSectorFilter(value as SectorFilter);
                  setPage(0);
                  setOpenFilter(null);
                }}
              />
            </div>
          </div>

          {bookmarkedCards.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-black/12 bg-white/84 px-5 py-10 text-center text-sm text-black/46">
              홈 화면에서 북마크한 카드뉴스가 아직 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-black/76">
                  북마크 카드 <span className="text-[#d96200]">{filteredCards.length}</span>
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-black/46">선택한 카드 {selectedCards.length}개</p>
                  <button
                    type="button"
                    onClick={() => setGeneratedIds(selectedIds)}
                    disabled={selectedCards.length === 0}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[#111111] px-4 text-xs font-semibold text-white transition hover:bg-[#ff7f00] disabled:cursor-not-allowed disabled:bg-black/16 disabled:text-white/72"
                  >
                    New 인사이트 생성
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
                <GalleryArrow
                  direction="left"
                  disabled={currentPage === 0}
                  onClick={() => setPage(Math.max(0, currentPage - 1))}
                />

                <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:gap-5">
                  {visibleCards.map((item) => {
                    const selected = selectedIds.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(item.id)}
                        className={`group overflow-hidden rounded-[1rem] border bg-white text-left shadow-[0_8px_18px_rgba(17,17,17,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(17,17,17,0.12)] ${
                          selected ? 'border-[#ff7f00]/30 ring-2 ring-[#ff7f00]/14' : 'border-black/10'
                        }`}
                      >
                        <div className="relative aspect-[0.72] w-full overflow-hidden" style={{ background: item.coverStyle }}>
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.14)_52%,rgba(0,0,0,0.58))]" />
                          <div className="relative z-10 flex h-full flex-col justify-between p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.62rem] font-bold text-white backdrop-blur-sm">
                                {item.accentLabel}
                              </span>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                                  selected
                                    ? 'border-[#ff7f00] bg-[#ff7f00] text-white'
                                    : 'border-white/38 bg-white/10 text-transparent'
                                }`}
                              >
                                <Check size={12} />
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <p className="line-clamp-3 whitespace-pre-line text-[0.84rem] font-semibold leading-[1.4] tracking-[-0.02em] text-white/96">
                                {item.card.title}
                              </p>
                              <div className="flex items-center justify-between gap-2 text-[0.68rem] text-white/70">
                                <span>{item.peer}</span>
                                <span>{item.card.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {Array.from({ length: placeholders }).map((_, index) => (
                    <div
                      key={`placeholder-${index}`}
                      className="aspect-[0.72] rounded-[1rem] border border-dashed border-black/8 bg-white/55"
                    />
                  ))}
                </div>

                <GalleryArrow
                  direction="right"
                  disabled={currentPage >= maxPage}
                  onClick={() => setPage(Math.min(maxPage, currentPage + 1))}
                />
              </div>
            </>
          )}
        </section>

        <section className="mt-6 rounded-[1.35rem] border border-black/6 bg-white px-4 py-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)] sm:px-5">
          <div className="mb-5">
            <div>
              <h2 className="text-[1.1rem] font-bold tracking-[-0.03em] text-[#191919]">선택 카드 기반 결과</h2>
              <p className="mt-1 text-sm text-black/50">선택한 카드뉴스를 조합해 분포와 신규 인사이트를 정리합니다.</p>
            </div>
          </div>

          {!hasGeneratedResult ? (
            <div className="rounded-[1rem] border border-dashed border-black/12 bg-[#fafafa] px-5 py-12 text-center text-sm text-black/46">
              위 카드 갤러리에서 카드뉴스를 선택한 뒤 `New 인사이트 생성` 버튼을 눌러 주세요.
            </div>
          ) : (
            <>
              {selectionChangedAfterGenerate ? (
                <div className="mb-4 rounded-[0.95rem] border border-[#ff7f00]/14 bg-[#fff8f1] px-4 py-3 text-sm text-black/64">
                  카드 선택이 변경되었습니다. 현재 결과는 이전 생성 기준입니다. 새 선택으로 반영하려면 `New 인사이트 생성`을 다시 눌러 주세요.
                </div>
              ) : null}
              <div className="grid gap-4 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
                <DistributionCard title="출처분포" data={insightResult.sourceDistribution} colors={['#ff8a1c', '#ffb35c', '#2f52c6', '#171717']} />
                <DistributionCard title="Peer사 분포" data={insightResult.peerDistribution} colors={['#f97316', '#111111', '#ef4444', '#2563eb']} />
                <InsightCard items={insightResult.newInsights} cards={generatedCards} />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds([]);
                    setGeneratedIds([]);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-black/60 transition hover:border-[#ff7f00]/16 hover:text-[#d96200]"
                >
                  다시 선택하기
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function DropdownFilter({
  label,
  items,
  selected,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  items: readonly string[];
  selected: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={onToggle}
        className="inline-flex min-w-[8.75rem] items-center justify-between gap-3 rounded-full border border-black/10 bg-white px-4 py-2 text-left text-[0.8rem] font-semibold text-black/70 shadow-[0_6px_18px_rgba(17,17,17,0.04)] transition hover:border-[#ff7f00]/20 hover:bg-[#fffaf6]"
      >
        <span>{selected}</span>
        <ChevronDown
          size={16}
          className={`text-black/42 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[10rem] overflow-hidden rounded-[1rem] border border-black/8 bg-white py-1.5 shadow-[0_20px_40px_rgba(17,17,17,0.12)]">
          {items.map((item) => {
            const active = selected === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[0.78rem] font-medium transition ${
                  active ? 'bg-[#fff3e6] text-[#d96a00]' : 'text-black/62 hover:bg-black/[0.035] hover:text-black/82'
                }`}
              >
                <span>{item}</span>
                {active ? <Check size={14} strokeWidth={2.2} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function GalleryArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white/88 text-black/58 shadow-[0_6px_18px_rgba(17,17,17,0.04)] transition hover:bg-white hover:text-black/78 disabled:cursor-not-allowed disabled:border-black/5 disabled:text-black/18"
      aria-label={direction === 'left' ? '이전 카드 보기' : '다음 카드 보기'}
    >
      <Icon size={22} strokeWidth={1.8} />
    </button>
  );
}

function DistributionCard({
  title,
  data,
  colors,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
  colors: string[];
}) {
  return (
    <section className="rounded-[1.1rem] border border-black/6 bg-[#fcfcfd] p-4">
      <h3 className="text-[0.98rem] font-bold tracking-[-0.02em] text-[#1f1f1f]">{title}</h3>

      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`${title}-${entry.name}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}건`, '비중']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 space-y-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between text-xs text-black/64">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold text-black/78">{entry.value}건</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function InsightCard({
  items,
  cards,
}: {
  items: string[];
  cards: MixerCardItem[];
}) {
  return (
    <section className="rounded-[1.1rem] border border-black/6 bg-[linear-gradient(180deg,#fffdfa,#fff7f1)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[0.98rem] font-bold tracking-[-0.02em] text-[#1f1f1f]">New 인사이트</h3>
        <span className="rounded-full bg-[#fff0e3] px-2.5 py-1 text-[11px] font-bold text-[#d96a00]">
          선택 {cards.length}개
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-[0.95rem] border border-[#f6dcc5] bg-white/88 px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff7f00] text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d96a00]">Insight</span>
            </div>
            <p className="text-sm leading-6 text-black/76">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[0.95rem] bg-white/84 px-4 py-3 text-xs leading-5 text-black/54">
        선택 카드의 제목, 요약, 시사점 문장을 결합해 공통 키워드와 반복 메시지를 기준으로 신규 인사이트를 구성했습니다.
      </div>
    </section>
  );
}

function buildMixerInsight(selectedCards: MixerCardItem[]) {
  const sourceCounts = selectedCards.reduce<Record<string, number>>((acc, item) => {
    acc[item.sourceType] = (acc[item.sourceType] ?? 0) + 1;
    return acc;
  }, {});

  const peerCounts = selectedCards.reduce<Record<string, number>>((acc, item) => {
    acc[item.peer] = (acc[item.peer] ?? 0) + 1;
    return acc;
  }, {});

  const topKeywords = selectedCards
    .flatMap((item) => item.card.insights)
    .flatMap((line) => line.split(/[ ,/()·]+/))
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .reduce<Record<string, number>>((acc, token) => {
      acc[token] = (acc[token] ?? 0) + 1;
      return acc;
    }, {});

  const sortedKeywords = Object.entries(topKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([keyword]) => keyword);

  return {
    sourceDistribution: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })),
    peerDistribution: Object.entries(peerCounts).map(([name, value]) => ({ name, value })),
    newInsights: [
      `${selectedCards.length}개 카드 기준으로 ${sortedKeywords[0] ?? '운영'} 관련 메시지가 가장 자주 반복되며, 단발성 PoC보다 실행형 확산 단계가 강조되고 있습니다.`,
      `${Object.keys(peerCounts)[0] ?? '주요 Peer사'} 중심 신호가 두드러지지만, 여러 Peer가 비슷한 서사를 공유하고 있어 시장 내 메시지 동질화가 진행 중입니다.`,
      `${Object.keys(sourceCounts)[0] ?? '뉴스'} 비중이 높게 나타나, 단기 기사 노출보다 IR·증권사 해석을 함께 엮어보는 믹싱 전략이 더 유효합니다.`,
    ],
  };
}
