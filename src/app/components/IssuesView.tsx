import { useMemo, useState } from 'react';
import { Filter, Search, Share2, X } from 'lucide-react';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import type { CardNewsItem, ExposureBand, PeerId, SectorId } from '../../features/card-news/model/cardNews';
import {
  getEvidenceCompleteness,
  getExecutiveRank,
  getExposureScore,
  getPeerLabel,
  getSectorLabel,
  getSuggestedActions,
  getTrustScore,
} from '../../features/card-news/mappers/cardNewsExecutive';
import {
  CardDecisionPanel,
  EvidenceChainPanel,
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveCard,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
  InsightActionStrip,
} from './executive/ExecutiveSystem';

interface IssuesViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

const peerFilters: Array<'all' | PeerId> = ['all', 'samsung_sds', 'lg_cns', 'hyundai_autoever', 'posco_dx'];
const sectorFilters: Array<'all' | SectorId> = ['all', 'ax', 'security', 'infra', 'biz_area', 'other'];
const exposureFilters: Array<'all' | ExposureBand> = ['all', 'high', 'medium', 'low'];

const peerLabels: Record<(typeof peerFilters)[number], string> = {
  all: '전체 Peer',
  samsung_sds: '삼성SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대오토에버',
  posco_dx: '포스코DX',
};

const sectorLabels: Record<(typeof sectorFilters)[number], string> = {
  all: '전체 섹터',
  ax: 'AX',
  security: '보안',
  infra: '인프라',
  biz_area: '사업영역',
  other: '기타',
};

const exposureLabels: Record<(typeof exposureFilters)[number], string> = {
  all: '전체 중요도',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function IssuesView({ bookmarkedIds, onToggleBookmark }: IssuesViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const [peerFilter, setPeerFilter] = useState<(typeof peerFilters)[number]>('all');
  const [sectorFilter, setSectorFilter] = useState<(typeof sectorFilters)[number]>('all');
  const [exposureFilter, setExposureFilter] = useState<(typeof exposureFilters)[number]>('all');
  const [query, setQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardNewsItem | null>(null);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return getExecutiveRank(cards).filter((card) => {
      const peerMatches = peerFilter === 'all' || card.peer_id === peerFilter || getPeerLabel(card) === peerLabels[peerFilter];
      const sectorMatches = sectorFilter === 'all' || card.sector === sectorFilter || getSectorLabel(card) === sectorLabels[sectorFilter];
      const exposureMatches = exposureFilter === 'all' || card.exposure_band === exposureFilter;
      const queryMatches =
        normalizedQuery.length === 0 ||
        [card.title, ...card.summary, ...(card.summary_lines ?? []), ...getSuggestedActions(card)]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return peerMatches && sectorMatches && exposureMatches && queryMatches;
    });
  }, [cards, exposureFilter, peerFilter, query, sectorFilter]);

  const bookmarkedCards = filteredCards.filter((card) => bookmarkedIds.includes(card.id));
  const highCards = filteredCards.filter((card) => card.exposure_band === 'high' || getExposureScore(card) >= 80);
  const verifiedCards = filteredCards.filter((card) => card.validation_pass || getEvidenceCompleteness(card) >= 75);

  if (isLoading) {
    return <ExecutivePage className="p-6 text-sm text-[var(--axis-muted)]">카드뉴스를 불러오는 중입니다.</ExecutivePage>;
  }

  if (error) {
    return <ExecutivePage className="p-6 text-sm text-[var(--axis-muted)]">{error}</ExecutivePage>;
  }

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="Card intelligence"
          title="카드뉴스 라이브러리"
          subtitle="카드뉴스를 Peer, 섹터, 노출도 기준으로 재정렬하고 브리핑·믹서기·공유로 이어지는 의사결정 재료를 선별합니다."
          actions={<ExecutiveButton variant="secondary" icon={<Share2 size={16} />}>선택 공유</ExecutiveButton>}
        />

        <section className="grid gap-3 md:grid-cols-4">
          <ExecutiveMetric label="Filtered cards" value={filteredCards.length} helper="현재 조건 기준" />
          <ExecutiveMetric label="High exposure" value={highCards.length} helper="우선 검토 후보" tone="danger" />
          <ExecutiveMetric label="Verified" value={verifiedCards.length} helper="근거 75% 이상" tone="success" />
          <ExecutiveMetric label="Bookmarked" value={bookmarkedCards.length} helper="임원 보고 후보" tone="accent" />
        </section>

        <section className="axis-panel-flat mt-5 p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
            <label className="flex min-h-11 items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white px-3">
              <Search size={16} className="text-[var(--axis-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="제목, 요약, 액션 검색"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--axis-subtle)]"
              />
            </label>
            <FilterGroup label="Peer" value={peerFilter} items={peerFilters} labels={peerLabels} onChange={setPeerFilter} />
            <FilterGroup label="Sector" value={sectorFilter} items={sectorFilters} labels={sectorLabels} onChange={setSectorFilter} />
            <FilterGroup label="Exposure" value={exposureFilter} items={exposureFilters} labels={exposureLabels} onChange={setExposureFilter} />
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card) => (
            <ExecutiveCard
              key={card.id}
              card={card}
              bookmarked={bookmarkedIds.includes(card.id)}
              onOpen={() => setSelectedCard(card)}
              onBookmark={() => onToggleBookmark(card.id)}
            />
          ))}
        </section>

        {filteredCards.length === 0 ? (
          <div className="axis-panel-flat mt-5 p-10 text-center text-sm text-[var(--axis-muted)]">
            조건에 맞는 카드뉴스가 없습니다.
          </div>
        ) : null}
      </ExecutiveContainer>

      {selectedCard ? (
        <CardDetailPanel
          card={selectedCard}
          bookmarked={bookmarkedIds.includes(selectedCard.id)}
          onBookmark={() => onToggleBookmark(selectedCard.id)}
          onClose={() => setSelectedCard(null)}
        />
      ) : null}
    </ExecutivePage>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  items,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  items: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white px-2">
      <Filter size={15} className="text-[var(--axis-muted)]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="bg-transparent text-sm font-semibold text-[var(--axis-ink)] outline-none"
      >
        {items.map((item) => (
          <option key={item} value={item}>
            {labels[item]}
          </option>
        ))}
      </select>
    </div>
  );
}

function CardDetailPanel({
  card,
  bookmarked,
  onBookmark,
  onClose,
}: {
  card: CardNewsItem;
  bookmarked: boolean;
  onBookmark: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(16,24,32,0.38)] backdrop-blur-sm">
      <button type="button" aria-label="상세 닫기" className="absolute inset-0" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-[880px] flex-col overflow-hidden border-l border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--axis-hairline)] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <ExecutiveBadge tone="accent">{getPeerLabel(card)}</ExecutiveBadge>
              <ExecutiveBadge>Exposure {getExposureScore(card)}</ExecutiveBadge>
              <ExecutiveBadge tone="success">Trust {getTrustScore(card)}</ExecutiveBadge>
            </div>
            <h2 className="mt-3 text-xl font-semibold leading-7 tracking-[-0.03em] text-[var(--axis-ink)]">{card.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] transition hover:text-[var(--axis-ink)]"
            aria-label="닫기"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <CardDecisionPanel card={card} />
          <InsightActionStrip card={card} />
          <EvidenceChainPanel card={card} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--axis-hairline)] bg-white px-5 py-4">
          <ExecutiveButton variant={bookmarked ? 'primary' : 'secondary'} onClick={onBookmark}>
            {bookmarked ? '북마크 해제' : '북마크 저장'}
          </ExecutiveButton>
          <ExecutiveButton variant="primary">브리핑에 추가</ExecutiveButton>
        </div>
      </aside>
    </div>
  );
}
