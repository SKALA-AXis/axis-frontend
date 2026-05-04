import { BarChart3, CalendarDays, Check, RefreshCcw, Sparkles } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { cardNewsItems, type CardNewsItem } from '../../shared/mocks/cardNews';

interface RawArticlesViewProps {
  bookmarkedIds: string[];
}

type SortOrder = 'latest' | 'oldest' | 'title';

const periodOptions = ['최근 7일', '최근 30일', '최근 90일'] as const;
const sectorOptions = ['전체', '섹터', 'AI', 'Peer'] as const;
const sortOptions: Array<{ value: SortOrder; label: string }> = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'title', label: '제목순' },
];

export function RawArticlesView({ bookmarkedIds }: RawArticlesViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<(typeof periodOptions)[number]>('최근 30일');
  const [selectedSector, setSelectedSector] = useState<(typeof sectorOptions)[number]>('전체');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const bookmarkedCards = useMemo(() => {
    const cards = cardNewsItems.filter((card) => bookmarkedIds.includes(card.id));

    const sorted = [...cards].sort((a, b) => {
      if (sortOrder === 'title') {
        return a.title.localeCompare(b.title, 'ko');
      }

      const left = a.date.replace(/\./g, '');
      const right = b.date.replace(/\./g, '');
      return sortOrder === 'latest' ? right.localeCompare(left) : left.localeCompare(right);
    });

    if (selectedSector === '전체') {
      return sorted;
    }

    return sorted.filter((card) => card.category === selectedSector);
  }, [bookmarkedIds, selectedSector, sortOrder]);

  const selectedCards = useMemo(
    () => bookmarkedCards.filter((card) => selectedIds.includes(card.id)),
    [bookmarkedCards, selectedIds],
  );

  const insightSummary = useMemo(() => buildInsightSummary(selectedCards), [selectedCards]);

  const toggleSelection = (cardId: string) => {
    setSelectedIds((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId],
    );
    setShowResult(false);
  };

  const resetFilters = () => {
    setSelectedPeriod('최근 30일');
    setSelectedSector('전체');
    setSortOrder('latest');
  };

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        {!showResult ? (
          <section className="axis-panel bg-white/78 p-4">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="flex items-center gap-2 text-[#E1002A]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E1002A] text-xs text-white">1</span>
                  카드 선택
                </span>
                <span className="h-px w-8 bg-black/12" />
                <span className={`${showResult ? 'text-[#E1002A]' : 'text-black/42'}`}>
                  <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${showResult ? 'bg-[#E1002A] text-white' : 'bg-black/6 text-black/48'}`}>2</span>
                  인사이트 결과
                </span>
              </div>
            </div>

            <h1 className="axis-page-title">분석할 카드뉴스를 선택하세요</h1>
            <p className="axis-page-subtitle">
              기간, 섹터, 조회순서를 설정하고 북마크한 카드뉴스를 선택하면 통합 인사이트를 도출합니다.
            </p>

            <div className="axis-soft-card mt-5 rounded-[1rem] bg-white/78 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-black/88">분석 조건 필터</h2>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-black/48 hover:text-[#d96200]"
                >
                  <RefreshCcw size={13} />
                  필터 초기화
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FilterSelect
                  label="기간"
                  value={selectedPeriod}
                  onChange={(value) => setSelectedPeriod(value as (typeof periodOptions)[number])}
                  options={[...periodOptions]}
                  icon={<CalendarDays size={14} />}
                />
                <FilterSelect
                  label="섹터"
                  value={selectedSector}
                  onChange={(value) => setSelectedSector(value as (typeof sectorOptions)[number])}
                  options={[...sectorOptions]}
                  icon={<BarChart3 size={14} />}
                />
                <FilterSelect
                  label="조회순서"
                  value={sortOrder}
                  onChange={(value) => setSortOrder(value as SortOrder)}
                  options={sortOptions.map((option) => option.value)}
                  labels={Object.fromEntries(sortOptions.map((option) => [option.value, option.label]))}
                  icon={<Sparkles size={14} />}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-black/90">북마크한 카드뉴스 {bookmarkedCards.length}</h2>
              <span className="text-xs text-black/48">선택한 카드 {selectedIds.length}개</span>
            </div>

            {bookmarkedCards.length === 0 ? (
              <div className="axis-soft-card mt-4 rounded-[1rem] bg-white/84 p-6 text-center text-sm text-black/54">
                북마크된 카드뉴스가 없습니다. 홈에서 북마크를 저장해 주세요.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {bookmarkedCards.map((card) => {
                  const selected = selectedIds.includes(card.id);

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => toggleSelection(card.id)}
                      className={`rounded-[1rem] border p-4 text-left transition ${
                        selected ? 'border-[#ff7f00]/24 bg-[#ff7f00]/6 shadow-sm' : 'border-black/8 bg-white/88 hover:border-[#ff7f00]/28'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-md bg-[#ff7f00]/10 px-2 py-1 text-[11px] font-semibold text-[#d96200]">
                            {card.category}
                          </span>
                          <h3 className="mt-3 text-[0.98rem] font-semibold leading-snug text-black/90">{card.title}</h3>
                          <p className="mt-2 text-xs text-black/46">{card.source} · {card.date}</p>
                        </div>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${selected ? 'border-[#ff7f00] bg-[#ff7f00] text-white' : 'border-black/14 bg-white text-transparent'}`}>
                          <Check size={12} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedCards.map((card) => (
                <span key={card.id} className="inline-flex items-center rounded-full bg-black/5 px-3 py-1.5 text-xs text-black/68">
                  {card.title}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowResult(true)}
              disabled={selectedIds.length === 0}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[0.9rem] bg-[#ff7f00] px-5 text-sm font-semibold text-white transition hover:bg-[#db6c01] disabled:cursor-not-allowed disabled:opacity-45"
            >
              선택한 카드로 인사이트 생성하기
            </button>
          </section>
        ) : (
          <section className="axis-panel bg-white/78 p-4">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="flex items-center gap-2 text-black/42">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/6 text-xs text-black/48">1</span>
                  카드 선택
                </span>
                <span className="h-px w-8 bg-black/12" />
                <span className="flex items-center gap-2 text-[#E1002A]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E1002A] text-xs text-white">2</span>
                  인사이트 결과
                </span>
              </div>

            </div>

            <h2 className="axis-page-title">
              {selectedCards.length > 0 ? `${selectedCards.length}개의 카드뉴스로 도출한 통합 인사이트` : '선택한 카드 기반 인사이트'}
            </h2>
            <p className="axis-page-subtitle">
              선택한 카드뉴스를 종합 분석하여 핵심 인사이트와 시사점을 제공합니다.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {selectedCards.map((card) => (
                <div key={card.id} className="axis-soft-card rounded-[1rem] bg-white/9 p-4">
                  <span className="inline-flex rounded-md bg-[#ff7f00]/10 px-2 py-1 text-[11px] font-semibold text-[#d96200]">
                    {card.category}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold leading-snug text-black/90">{card.title}</h3>
                  <p className="mt-2 text-xs text-black/46">{card.source} · {card.date}</p>
                </div>
              ))}
            </div>

            <div className="axis-soft-card mt-4 rounded-[1rem] bg-white/88 p-4">
              <h3 className="text-base font-semibold text-black/90">핵심 인사이트 요약</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {insightSummary.summaryCards.map((item) => (
                  <div key={item.title} className="axis-soft-card rounded-[0.9rem] bg-white/92 p-4">
                    <p className="text-sm font-semibold text-black/90">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-black/62">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="axis-soft-card rounded-[1rem] bg-white/9 p-4">
                <h3 className="text-base font-semibold text-black/90">통합 분석 결과</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InsightList title="주요 트렌드" items={insightSummary.trends} />
                  <InsightList title="시사점 및 방향성" items={insightSummary.directions} />
                </div>
              </div>

              <div className="axis-soft-card rounded-[1rem] bg-white/9 p-4">
                <h3 className="text-base font-semibold text-black/90">데이터 기반 시각화</h3>
                <div className="mt-4 space-y-4">
                  <MetricPanel title="관련 섹터 분포" items={insightSummary.sectorBreakdown} />
                  <MetricPanel title="주요 키워드 빈도" items={insightSummary.keywordBreakdown} />
                  <MetricPanel title="감성 분석" items={insightSummary.sentimentBreakdown} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-start gap-3">
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-black/12 px-4 text-sm font-medium text-black/72 hover:bg-[#f5f6fa]"
              >
                다시 선택하기
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  icon,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon: ReactNode;
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#7d736b]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8178]">{icon}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="axis-input h-10 w-full appearance-none rounded-[0.8rem] bg-white pl-9 pr-9 text-sm outline-none transition"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {labels?.[option] ?? option}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#221d19]">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-5 text-[#5f554e]">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#E1002A]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricPanel({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-[0.9rem] bg-[#fbf8f6] p-3">
      <h4 className="text-xs font-semibold text-[#221d19]">{title}</h4>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs text-[#625852]">
            <span>{item.label}</span>
            <span className="font-medium text-[#2e2824]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildInsightSummary(selectedCards: CardNewsItem[]) {
  const titles = selectedCards.map((card) => card.title);
  const categories = selectedCards.reduce<Record<string, number>>((acc, card) => {
    acc[card.category] = (acc[card.category] ?? 0) + 1;
    return acc;
  }, {});

  const allKeywords = selectedCards.flatMap((card) => extractKeywords(card));
  const keywordCounts = allKeywords.reduce<Record<string, number>>((acc, keyword) => {
    acc[keyword] = (acc[keyword] ?? 0) + 1;
    return acc;
  }, {});

  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const trendSeed = selectedCards.flatMap((card) => card.summary).slice(0, 5);
  const directionSeed = selectedCards.flatMap((card) => card.insights).slice(0, 5);

  return {
    summaryCards: [
      {
        title: '경쟁 심화',
        body: `${selectedCards.length}개 카드에서 공통적으로 드러나는 흐름은 경쟁사의 ${topKeywords[0]?.[0] ?? '핵심 영역'} 투자 확대입니다.`,
      },
      {
        title: '시장 확대',
        body: `${titles.length > 0 ? titles[0] : '선택 카드'}를 포함한 이슈는 시장 확장과 사업 재편이 동시에 일어나고 있음을 보여줍니다.`,
      },
      {
        title: '도입 가속',
        body: `선택 카드 전반에서 실제 도입과 운영 전환 속도가 빨라지고 있으며, 실행 체계 확보가 중요해지고 있습니다.`,
      },
    ],
    trends: trendSeed.length > 0 ? trendSeed : ['선택 카드가 아직 없습니다.'],
    directions: directionSeed.length > 0 ? directionSeed : ['선택 카드가 아직 없습니다.'],
    sectorBreakdown: Object.entries(categories).map(([label, count]) => ({ label, value: `${count}건` })),
    keywordBreakdown: topKeywords.map(([label, count]) => ({ label, value: `${count}회` })),
    sentimentBreakdown: [
      { label: '긍정', value: `${Math.max(52, selectedCards.length * 18)}%` },
      { label: '중립', value: `${Math.max(18, selectedCards.length * 6)}%` },
      { label: '부정', value: `${Math.max(4, selectedCards.length * 2)}%` },
    ],
  };
}

function extractKeywords(card: CardNewsItem) {
  const candidates = [card.category, ...card.title.split(/[ ,/()]+/), ...card.insights.flatMap((line) => line.split(/[ ,/()]+/))];

  return candidates
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 12);
}
