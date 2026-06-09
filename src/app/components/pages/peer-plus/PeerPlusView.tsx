import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Globe2, Info, ShieldCheck, X } from 'lucide-react';

import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { GlobalTrendsPanel } from '../../../../features/global-trends/components/GlobalTrendsPanel';
import { usePeerPositioning } from '../../../../features/peers/hooks/usePeerPositioning';
import { usePeerOverview } from '../../../../features/peers/hooks/usePeerOverview';
import type { PeerComparisonInsightItem, PeerOverviewRow, PeerSwotInsightItem } from '../../../../features/peers/model/peerOverview';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { mockPeerPlusOptions, peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../../../shared/mocks/peerPlus';
import { ExecutiveBadge, ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { PageProcessLoading, PageState } from '../../shared/PageState';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { PositioningPanel } from './PositioningPanels';

type NavigateHandler = (view: string) => void;
type PeerPlusGlobalIndustryId = 'global_industry';
type PeerPlusFilterId = 'all' | PeerPlusPeerId | PeerPlusGlobalIndustryId;

type PeerReasoningModal = {
  id: string;
  title: string;
  summary: string;
  groups: Array<{
    title: string;
    items: Array<{
      label: string;
      body: string;
    }>;
  }>;
  evidenceTags: string[];
  evidenceCards: CardNewsItem[];
};

const globalIndustryFilterOption = { id: 'global_industry' as const, label: '글로벌 산업' };


function formatKrwBn(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  const absolute = Math.abs(value);
  if (absolute >= 10000) {
    const jo = value / 10000;
    return `${trimDecimal(jo, 2)}조`;
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)}억`;
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${trimDecimal(value, 2)}%`;
}

function formatQoqPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${trimDecimal(value, 2)}%`;
}

function formatQoqPctPoint(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${trimDecimal(value, 2)}%p`;
}

function normalizeEvidenceText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function buildEvidenceReason(source: string, interpretation: string) {
  const cleanInterpretation = normalizeEvidenceText(interpretation);
  if (cleanInterpretation) return cleanInterpretation;

  return normalizeEvidenceText(source);
}

function parseTopKeywordEvidence(evidence: string) {
  if (evidence.includes(' 기준: ') && (evidence.includes('. 카드뉴스 내용: ') || evidence.includes('. 근거 내용: '))) {
    const [contextPart, rest = ''] = evidence.split(' 기준: ');
    const [activityPart, detailRest = ''] = rest.includes('. 근거 내용: ')
      ? rest.split('. 근거 내용: ')
      : rest.split('. 카드뉴스 내용: ');
    const [sourcePart, interpretationPart = ''] = detailRest.includes('. 판단 이유: ')
      ? detailRest.split('. 판단 이유: ')
      : detailRest.split('. 왜 핵심인가: ');
    const [sourceText] = sourcePart.includes('. 원문 확인 문구: ')
      ? sourcePart.split('. 원문 확인 문구: ')
      : [sourcePart, ''];
    const [cleanSourceText] = sourceText.split('. 원문 위치: ');

    return {
      context: `${contextPart.trim()} 기준`,
      activity: activityPart.trim(),
      reason: buildEvidenceReason(cleanSourceText, interpretationPart),
    };
  }

  if (evidence.includes(' 활동: ') && evidence.includes('. 카드뉴스 내용: ')) {
    const [contextPart, rest = ''] = evidence.split(' 활동: ');
    const [activityPart, detailRest = ''] = rest.split('. 카드뉴스 내용: ');
    const [sourcePart, interpretationPart = ''] = detailRest.includes('. 판단 이유: ')
      ? detailRest.split('. 판단 이유: ')
      : detailRest.split('. 왜 핵심인가: ');
    const [cleanSourcePart] = sourcePart.split('. 원문 위치: ');

    return {
      context: `${contextPart.trim()} 활동`,
      activity: activityPart.trim(),
      reason: buildEvidenceReason(cleanSourcePart, interpretationPart),
    };
  }

  const [contextPart, rest = ''] = evidence.split(' 근거: ');
  const [sourcePart, interpretationPart = ''] = rest.includes('. 왜 핵심인가: ')
    ? rest.split('. 왜 핵심인가: ')
    : rest.includes('. 판단 이유: ')
      ? rest.split('. 판단 이유: ')
      : rest.split('. 이 내용은 ');

  return {
    context: contextPart.trim(),
    activity: '',
    reason: buildEvidenceReason(sourcePart.split('. 원문 위치: ')[0], interpretationPart),
  };
}

function splitTopKeyword(topKeyword: string | null | undefined) {
  const [businessKeyword, technologyKeyword] = (topKeyword ?? '')
    .split(/\r?\n/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    businessKeyword: businessKeyword || null,
    technologyKeyword: technologyKeyword || null,
  };
}

function buildAxisFallbackReason(axisLabel: '사업 키워드' | '기술 키워드', keyword: string, row: Pick<PeerOverviewRow, 'label' | 'topKeywordReason'>) {
  if (axisLabel === '사업 키워드') {
    return `${row.label}의 최근 사업 방향으로 '${keyword}'를 표시합니다. 다만 현재 응답에는 이 사업 키워드만을 위한 분리 근거가 없어, 백엔드가 제공한 공통 설명 대신 사업 축 기준으로만 안내합니다. ${row.topKeywordReason ?? ''}`.trim();
  }

  return `${row.label}의 최근 기술 방향으로 '${keyword}'를 표시합니다. 다만 현재 응답에는 이 기술 키워드만을 위한 분리 근거가 없어, 백엔드가 제공한 공통 설명 대신 기술 축 기준으로만 안내합니다. ${row.topKeywordReason ?? ''}`.trim();
}

function KeywordInfoPopover({
  axisLabel,
  keyword,
  row,
}: {
  axisLabel: '사업 키워드' | '기술 키워드';
  keyword: string;
  row: Pick<PeerOverviewRow, 'label' | 'topKeyword' | 'topKeywordReason' | 'topKeywordEvidence' | 'topKeywordEvidenceUrls'>;
}) {
  const axisEvidenceMarker = axisLabel === '사업 키워드' ? ' 사업 키워드 기준: ' : ' 기술 키워드 기준: ';
  const rawEvidenceItems = row.topKeywordEvidence ?? [];
  const evidenceUrls = row.topKeywordEvidenceUrls ?? [];
  const evidenceItems = rawEvidenceItems
    .map((evidence, evidenceIndex) => ({ evidence, evidenceUrl: evidenceUrls[evidenceIndex] }))
    .filter(({ evidence }) => evidence.includes(axisEvidenceMarker));
  const fallbackReason = buildAxisFallbackReason(axisLabel, keyword, row);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] text-[var(--axis-muted)] transition hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--axis-accent)]/30"
          aria-label={`${row.label} ${axisLabel} 선정 근거 보기`}
        >
          <Info size={12} strokeWidth={2.2} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(520px,var(--radix-popover-content-available-height))] w-[360px] overflow-y-auto border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-0 text-[var(--axis-body)] shadow-xl">
        <div className="divide-y divide-[var(--axis-hairline)]">
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--axis-muted)]">{row.label}</p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--axis-accent-strong)]">{axisLabel} 선정 근거</p>
            <p className="mt-1 text-base font-semibold leading-6 text-[var(--axis-ink)]">{keyword}</p>
          </div>
          {evidenceItems.length > 0 ? (
            evidenceItems.map(({ evidence, evidenceUrl }) => {
              const parsedEvidence = parseTopKeywordEvidence(evidence);

              return (
                <div key={`${axisLabel}-${evidence}`} className="space-y-3 px-4 py-3">
                  {parsedEvidence.context ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--axis-muted)]">{parsedEvidence.context}</p>
                      {parsedEvidence.activity ? (
                        <p className="mt-1 text-[12px] font-semibold leading-5 text-[var(--axis-ink)]">{parsedEvidence.activity}</p>
                      ) : (
                        <p className="mt-1 text-[12px] font-semibold leading-5 text-[var(--axis-ink)]">{parsedEvidence.context}</p>
                      )}
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--axis-muted)]">판단 근거</p>
                    <p className="mt-1 whitespace-pre-line break-words text-[12px] leading-5 text-[var(--axis-body)]">{parsedEvidence.reason || normalizeEvidenceText(evidence)}</p>
                  </div>
                  {evidenceUrl ? (
                    <a
                      href={evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--axis-radius-sm)] border border-[var(--axis-hairline)] px-2.5 text-[11px] font-semibold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-surface-soft)]"
                    >
                      원문 보기
                      <ExternalLink size={12} strokeWidth={2.2} />
                    </a>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-3 text-[12px] leading-5 text-[var(--axis-body)]">
              {fallbackReason}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function KeywordCell({
  axisLabel,
  keyword,
  row,
}: {
  axisLabel: '사업 키워드' | '기술 키워드';
  keyword: string | null;
  row: Pick<PeerOverviewRow, 'label' | 'topKeyword' | 'topKeywordReason' | 'topKeywordEvidence' | 'topKeywordEvidenceUrls'>;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2">
      {keyword ? (
        <>
          <span className="min-w-0 flex-1 text-[12px] font-semibold leading-4 text-[var(--axis-ink)]">{keyword}</span>
          <KeywordInfoPopover axisLabel={axisLabel} keyword={keyword} row={row} />
        </>
      ) : (
        <span>-</span>
      )}
    </div>
  );
}

function trendToneClass(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value === 0) return 'text-[var(--axis-muted)]';
  return value > 0 ? 'text-[#d3432b]' : 'text-[#2563eb]';
}

function trimDecimal(value: number, digits: number) {
  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function readStoredPeerPlusFilter(): PeerPlusFilterId {
  const stored = window.localStorage.getItem(peerPlusSelectionStorageKey);
  if (stored === 'global_industry' || stored === 'all') {
    return stored;
  }
  if (stored && mockPeerPlusOptions.some((peer) => peer.id === stored)) {
    return stored as PeerPlusPeerId;
  }
  return 'all';
}

export function PeerPlusView({
  onNavigate: _onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
  selectedPeerId: externalSelectedPeerId,
  onUpdateTimeChange,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  selectedPeerId?: PeerPlusPeerId;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}) {
  const { cards, isLoading, error, reload } = useCardNews();
  const {
    peerOverview,
    isLoading: isPeerOverviewLoading,
    error: peerOverviewError,
    reload: reloadPeerOverview,
  } = usePeerOverview();
  const { peerPositioning, isLoading: isPeerPositioningLoading, error: peerPositioningError } = usePeerPositioning();
  const peerOptions = mockPeerPlusOptions;
  const filterOptions: Array<{ id: PeerPlusFilterId; label: string }> = [{ id: 'all', label: '전체' }, ...peerOptions, globalIndustryFilterOption];
  const [selectedPeerId, setSelectedPeerId] = useState<PeerPlusFilterId>(
    () => externalSelectedPeerId ?? readStoredPeerPlusFilter(),
  );
  const [peerDetailCardId, setPeerDetailCardId] = useState<string | null>(null);
  const [peerDetailSlideIndex, setPeerDetailSlideIndex] = useState(0);
  const [activePeerReasoningId, setActivePeerReasoningId] = useState<'comparison' | 'swot' | null>(null);
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);

  useEffect(() => {
    if (!externalSelectedPeerId) return;
    window.localStorage.setItem(peerPlusSelectionStorageKey, externalSelectedPeerId);
    setSelectedPeerId(externalSelectedPeerId);
  }, [externalSelectedPeerId]);

  useEffect(() => {
    if (isLoading || isPeerOverviewLoading || isPeerPositioningLoading) return;
    onUpdateTimeChange?.(pickLatestCardTimestamp(cards));
  }, [cards, isLoading, isPeerOverviewLoading, isPeerPositioningLoading, onUpdateTimeChange]);

  const isAllFilter = selectedPeerId === 'all';
  const isGlobalIndustry = selectedPeerId === 'global_industry';
  const selectedPeer = !isAllFilter && !isGlobalIndustry ? peerOptions.find((peer) => peer.id === selectedPeerId) ?? peerOptions[0] : null;
  const selectedPeerAnalysisId: 'all' | PeerPlusPeerId = isAllFilter || isGlobalIndustry || !selectedPeer ? 'all' : selectedPeer.id;
  const relevantPeerIds = isAllFilter || isGlobalIndustry || !selectedPeer ? peerOptions.map((peer) => peer.id) : [selectedPeer.id];
  const peerCards = rankedCards.filter((card) => relevantPeerIds.includes(card.peer_id as PeerPlusPeerId));
  const peerEvidenceCards = (peerCards.length > 0 ? peerCards : rankedCards).slice(0, 6);
  const peerDetailCard = peerDetailCardId ? cards.find((card) => card.id === peerDetailCardId) ?? null : null;
  const comparisonLabel = isGlobalIndustry ? '글로벌 산업 IT 동향' : isAllFilter ? 'SK AX vs Peer 전체' : `SK AX vs ${selectedPeer?.label ?? '선택 Peer'}`;
  const peerOverviewApiRows = Array.isArray(peerOverview?.rows) ? peerOverview.rows : [];
  const peerOverviewRows = [
    {
      id: 'sk_ax',
      label: 'SK AX',
      revenueKrwBn: null,
      revenueQoqPct: null,
      operatingProfitKrwBn: null,
      operatingProfitQoqPct: null,
      netIncomeKrwBn: null,
      netIncomeQoqPct: null,
      operatingMarginPct: null,
      operatingMarginQoqDeltaPctp: null,
      axRevenueSharePct: null,
      topKeyword: null,
      businessKeyword: null,
      technologyKeyword: null,
      topKeywordReason: null,
      topKeywordBasis: null,
      topKeywordScore: null,
      topKeywordEvidence: [],
      topKeywordEvidenceUrls: [],
      dartRceptNo: null,
    },
    ...peerOptions.map((peer) => ({
      id: peer.id,
      label: peer.label,
      revenueKrwBn: null,
      revenueQoqPct: null,
      operatingProfitKrwBn: null,
      operatingProfitQoqPct: null,
      netIncomeKrwBn: null,
      netIncomeQoqPct: null,
      operatingMarginPct: null,
      operatingMarginQoqDeltaPctp: null,
      axRevenueSharePct: null,
      topKeyword: null,
      businessKeyword: null,
      technologyKeyword: null,
      topKeywordReason: null,
      topKeywordBasis: null,
      topKeywordScore: null,
      topKeywordEvidence: [],
      topKeywordEvidenceUrls: [],
      dartRceptNo: null,
    })),
  ].map((baseRow) => {
    const hydratedRow = peerOverviewApiRows.find((row) => row.id === baseRow.id);
    return hydratedRow ? { ...baseRow, ...hydratedRow } : baseRow;
  });
  const peerOverviewVisibleRows = peerOverviewRows.filter((row) => isAllFilter || row.id === 'sk_ax' || row.id === selectedPeer?.id);

  const peerInsightCatalog: Record<'all' | PeerPlusPeerId, PeerComparisonInsightItem[]> = {
    all: [
      { label: '포지셔닝', body: '전체 비교에서는 SK AX를 기준축으로 두고, 삼성 SDS는 ITS·클라우드·AI, LG CNS는 금융·공공·클라우드, 현대 오토에버는 모빌리티·운영, 포스코 DX는 산업DX·이차전지 문맥으로 나뉘어 보입니다.' },
      { label: '사업 신호', body: '공시 수치 기준 2025Q4 매출은 삼성 SDS 3.54조, LG CNS 1.94조, 현대 오토에버 1.32조, 포스코 DX 2,608억 수준으로 읽히며, 기업별로 규모 차이가 크게 나타납니다.' },
      { label: '기술 신호', body: '키워드 기준으로는 FabriX·Brity, 금융·공공 AI/DX, 커넥티드카·OTA, 산업DX·LLM처럼 각사가 반복적으로 내세우는 기술 문맥이 분명하게 갈립니다.' },
      { label: '리스크', body: '기업별 세부 부문 공시 범위가 달라, 현재 화면은 실수치와 키워드 중심의 1차 비교로 읽는 편이 안전합니다.' },
    ],
    samsung_sds: [
      { label: '포지셔닝', body: '삼성 SDS는 2025Q4 기준 매출 3.54조, 영업이익 2,261억원 수준으로 규모 우위가 크고, SK AX와 비교할 때 ITS·클라우드·AI가 동시에 보이는 복합 신호 축으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로는 분기 매출이 3조원대 중반을 유지하고 있어 사업 규모 자체가 비교 기준점으로 작동합니다.' },
      { label: '기술 신호', body: 'FabriX, Brity, 에이전틱 AI, ITS, 클라우드 같은 키워드가 함께 나타나 기술 메시지가 운영형 AI와 서비스 축으로 묶여 보입니다.' },
      { label: '리스크', body: '세부 사업 지표는 공시 범위가 달라, 현재 단계에서는 규모와 수익성, 키워드 강도 중심으로만 비교하는 편이 적절합니다.' },
    ],
    lg_cns: [
      { label: '포지셔닝', body: 'LG CNS는 2025Q4 기준 매출 1.94조, 영업이익 2,119억원 수준이며 금융·공공·클라우드/MSP·AI/DX가 함께 보이는 다축형 경쟁군으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로 영업이익률이 10%대를 보여 수익성 측면에서는 네 곳 중 상대적으로 안정적으로 읽히는 편입니다.' },
      { label: '기술 신호', body: '금융, 공공, 클라우드 MSP, AI/DX, 스마트물류 키워드가 반복돼 기술 신호가 특정 산업보다 플랫폼형 문맥으로 넓게 퍼져 있습니다.' },
      { label: '리스크', body: '실수치는 강하지만 세부 사업 지표는 기업별 공시 범위가 달라, 현재 화면만으로는 확장 속도까지 단정하기 어렵습니다.' },
    ],
    hyundai_autoever: [
      { label: '포지셔닝', body: '현대 오토에버는 2025Q4 기준 매출 1.32조, 영업이익 764억원 수준이며 스마트모빌리티, SI, ITES/유지운영 축으로 포지셔닝이 읽힙니다.' },
      { label: '사업 신호', body: '분기별로 2025Q1 8,330억에서 2025Q4 1.32조까지 올라오는 흐름이 보여 하반기 매출 확대 신호는 비교적 분명합니다.' },
      { label: '기술 신호', body: '커넥티드카, OTA, 자율주행, 차량, ERP, 운영 키워드가 반복돼 모빌리티와 운영 유지보수 문맥이 함께 나타납니다.' },
      { label: '리스크', body: 'AI 비중과 세부 부문 매출은 공시에서 직접 확인되지 않아, 현재 해석은 모빌리티·운영 키워드와 총실적 중심 비교에 머물러야 합니다.' },
    ],
    posco_dx: [
      { label: '포지셔닝', body: '포스코 DX는 2025Q4 기준 매출 2,608억원, 영업이익 -13억원 수준이며 산업DX, 이차전지/EV, AI/지능화 키워드가 주된 구분축으로 보입니다.' },
      { label: '사업 신호', body: '2025Q4에는 영업이익이 적자로 전환되어 실적 측면에서는 다른 Peer보다 보수적으로 읽을 필요가 있습니다.' },
      { label: '기술 신호', body: '산업DX, 스마트팩토리, 이차전지, EV, AI, LLM 키워드가 반복돼 산업 현장형 기술 문맥이 강하게 남아 있습니다.' },
      { label: '리스크', body: '분기 이익 변동성이 크고 세부 부문 매출이 공시 미기재라서, 현재 단계에서는 산업 키워드 강도와 총실적만 우선 비교하는 편이 적절합니다.' },
    ],
  };
  const swotCatalog: Record<'all' | PeerPlusPeerId, PeerSwotInsightItem[]> = {
    all: [
      { label: 'Strength', body: 'SK AX는 운영 KPI와 실행 관리 프레임을 기준축으로 세우기 좋아 전체 비교에서 관점 중심을 잡을 수 있습니다.' },
      { label: 'Weakness', body: '전체 모드는 산업별 차이를 압축해 보여주기 때문에 SK AX의 세부 강점이 다소 넓고 추상적으로 보일 수 있습니다.' },
      { label: 'Opportunity', body: '전체 Peer를 함께 보면 어떤 시장 축에서 메시지 공백이 생기는지 빠르게 포착할 수 있습니다.' },
      { label: 'Threat', body: '강한 공개 신호를 가진 경쟁사들이 시장 기준선을 먼저 점유하면 SK AX 제안 메시지가 후행처럼 읽힐 수 있습니다.' },
    ],
    samsung_sds: [
      { label: 'Strength', body: 'SK AX는 운영 전환 이후 KPI 설계와 실행 관리 체계를 차별 포인트로 밀 수 있습니다.' },
      { label: 'Weakness', body: '삼성 SDS 대비 대형 레퍼런스와 공개 검증 근거가 약하게 보이면 직접 경쟁에서 밀릴 수 있습니다.' },
      { label: 'Opportunity', body: '삼성 SDS가 키운 시장 관심을 활용해 SK AX의 운영 중심 후속 대안을 제시할 수 있습니다.' },
      { label: 'Threat', body: '엔터프라이즈 고객군에서는 삼성 SDS의 기준점 효과가 강하게 작동할 가능성이 큽니다.' },
    ],
    lg_cns: [
      { label: 'Strength', body: 'SK AX는 실행 속도와 운영 밀착형 AX 프레임을 더 전면에 내세울 수 있습니다.' },
      { label: 'Weakness', body: 'LG CNS보다 공공·금융 신뢰 신호가 약하면 안정성 인식에서 불리할 수 있습니다.' },
      { label: 'Opportunity', body: '안정성을 중시하는 고객에게는 SK AX의 전환 관리와 운영 민첩성을 추가 가치로 제시할 수 있습니다.' },
      { label: 'Threat', body: '보안·거버넌스 축에서 LG CNS가 기준선을 선점하면 SK AX 메시지가 보조 대안처럼 보일 수 있습니다.' },
    ],
    hyundai_autoever: [
      { label: 'Strength', body: 'SK AX는 제조 외 산업까지 확장 가능한 운영형 AX 서사를 제시할 수 있습니다.' },
      { label: 'Weakness', body: '현장 밀착성과 제조 특화 이미지는 현대 오토에버 쪽이 더 강하게 읽힐 수 있습니다.' },
      { label: 'Opportunity', body: '제조 고객에게는 특화 솔루션 위에 운영 관리 프레임까지 덧붙인 대안으로 포지셔닝할 수 있습니다.' },
      { label: 'Threat', body: '디지털 트윈, 차량 데이터 같은 특화 기술 신호가 강하면 SK AX의 범용 메시지가 흐려질 수 있습니다.' },
    ],
    posco_dx: [
      { label: 'Strength', body: 'SK AX는 산업 자동화 이후 운영 관리 전반까지 연결하는 상위 프레임을 보여줄 수 있습니다.' },
      { label: 'Weakness', body: '현장 실행감과 인프라-운영 연결성은 포스코 DX 대비 약하게 보일 수 있습니다.' },
      { label: 'Opportunity', body: '산업 고객에게는 실행성 위에 확장 가능한 운영 체계까지 포함한 대안으로 접근할 수 있습니다.' },
      { label: 'Threat', body: '대형 프로젝트와 산업 자동화 실적이 부각되면 SK AX가 상대적으로 추상적인 대안으로 읽힐 위험이 있습니다.' },
    ],
  };
  const apiPeerInsightItems = peerOverview?.comparisonInsights?.[selectedPeerAnalysisId];
  const peerInsightItems = apiPeerInsightItems && apiPeerInsightItems.length > 0
    ? apiPeerInsightItems
    : peerInsightCatalog[selectedPeerAnalysisId];
  const apiSwotItems = peerOverview?.swotInsights?.[selectedPeerAnalysisId];
  const swotItems = apiSwotItems && apiSwotItems.length > 0
    ? apiSwotItems
    : swotCatalog[selectedPeerAnalysisId];
  const peerReasoningSections = useMemo<Record<'comparison' | 'swot', PeerReasoningModal>>(() => {
    const getEvidenceSlice = (startIndex: number, count = 3) => {
      if (peerEvidenceCards.length === 0) return [] as CardNewsItem[];
      return Array.from({ length: Math.min(count, peerEvidenceCards.length) }, (_, offset) => peerEvidenceCards[(startIndex + offset) % peerEvidenceCards.length])
        .filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index);
    };
    const buildEvidenceTags = (cardsForEvidence: CardNewsItem[], extraTags: string[]) => (
      Array.from(
        new Set([
          ...extraTags,
          ...cardsForEvidence.map((card) => getPeerLabel(card)),
          ...cardsForEvidence.map((card) => card.category_label ?? card.category).filter(Boolean),
        ].filter(Boolean)),
      ).slice(0, 6)
    );

    const evidenceCards = [0, 1, 2, 3]
      .flatMap((index) => getEvidenceSlice(index, 2))
      .filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index)
      .slice(0, 6);

    return {
      comparison: {
        id: 'comparison',
        title: '핵심 비교 포인트 추론 과정',
        summary: `${comparisonLabel} 비교에서 비교 에이전트가 어떤 공개 신호를 교차 검토해 핵심 차이 축으로 압축했는지 보여줍니다.`,
        groups: [
          {
            title: '비교 에이전트의 차이 축 정리',
            items: peerInsightItems
              .filter((item) => item.label !== '포지셔닝')
              .map((item) => ({
                label: item.label,
                body: `에이전트 판단: ${item.body}`,
              })),
          },
        ],
        evidenceTags: buildEvidenceTags(evidenceCards, [comparisonLabel, '핵심 비교 포인트']),
        evidenceCards,
      },
      swot: {
        id: 'swot',
        title: 'SWOT 분석 추론 과정',
        summary: `${comparisonLabel} 비교에서 전략 에이전트가 강점·약점·기회·위협을 어떤 문장 기준으로 정리했는지 보여줍니다.`,
        groups: [
          {
            title: '전략 에이전트의 SWOT 정리',
            items: swotItems.map((item) => ({
              label: item.label,
              body: `에이전트 해석: ${item.body}`,
            })),
          },
        ],
        evidenceTags: buildEvidenceTags(evidenceCards, [comparisonLabel, 'SWOT']),
        evidenceCards,
      },
    };
  }, [comparisonLabel, peerEvidenceCards, peerInsightItems, swotItems]);
  const activePeerReasoning = activePeerReasoningId ? peerReasoningSections[activePeerReasoningId] : null;

  if (isGlobalIndustry) {
    return (
      <ExecutivePage className="overflow-visible">
        <ExecutiveContainer className="pb-12">
          <ExecutiveHeader
            eyebrow="글로벌 산업 인텔리전스"
            title="글로벌 IT 동향"
            subtitle="글로벌 6사 newsroom과 SPRi/BCG 리서치 기반 IT 트렌드·사업 섹터 변화를 파악합니다."
          />
          <section className="relative z-0 mb-5 flex justify-end">
            <div data-guide="peer-selector" className="flex flex-wrap justify-end gap-1.5">
              {filterOptions.map((peer) => (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => {
                    window.localStorage.setItem(peerPlusSelectionStorageKey, peer.id);
                    setSelectedPeerId(peer.id);
                  }}
                  className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${
                    selectedPeerId === peer.id
                      ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                      : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                  }`}
                >
                  {peer.id === 'global_industry' ? <Globe2 className="mr-1.5 inline-block align-[-2px]" size={13} /> : null}
                  {peer.label}
                </button>
              ))}
            </div>
          </section>
          <GlobalTrendsPanel embedded onUpdateTimeChange={onUpdateTimeChange} />
        </ExecutiveContainer>
      </ExecutivePage>
    );
  }

  if (isLoading || isPeerOverviewLoading || error || (peerOverviewError && !peerOverview)) {
    return (
      <PageState
        loading={isLoading || isPeerOverviewLoading}
        error={error ?? (peerOverviewError && !peerOverview ? peerOverviewError : null)}
        loadingLabel="Peer+ 분석 데이터를 불러오는 중입니다."
        loadingFallback={(
          <PageProcessLoading
            eyebrow="Peer+ analysis"
            title="Peer+ 분석 데이터를 불러오는 중"
            description="경쟁사 개요와 카드뉴스 신호를 함께 불러와 비교 패널과 포지셔닝 화면을 준비합니다."
            steps={[
              { label: 'Peer 개요 요청', detail: '/api/monitoring/overview/peer-table 응답 대기' },
              { label: '카드 신호 연결', detail: '/api/cards 기반 근거 카드 매칭' },
              { label: '분석 패널 구성', detail: '비교, SWOT, 포지셔닝 영역 준비' },
            ]}
            meta={['source: peer overview + card news', 'endpoints: /api/monitoring/overview/peer-table, /api/cards']}
          />
        )}
        onRetry={async () => {
          await Promise.all([reload(), reloadPeerOverview()]);
        }}
      >
        {null}
      </PageState>
    );
  }

  return (
    <ExecutivePage className="overflow-visible">
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Peer+ analysis"
          title="Peer+"
          subtitle="전체 모드에서는 시장 전반 비교를, 기업별 모드에서는 SK AX와 선택 기업의 재무·메시지 차이만 빠르게 읽을 수 있도록 정리한 화면입니다."
        />
        <section className="relative z-0 mb-5 flex justify-end">
          <div data-guide="peer-selector" className="flex flex-wrap justify-end gap-1.5">
            {filterOptions.map((peer) => (
              <button
                key={peer.id}
                type="button"
                onClick={() => {
                  window.localStorage.setItem(peerPlusSelectionStorageKey, peer.id);
                  setSelectedPeerId(peer.id);
                }}
                className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${
                  selectedPeerId === peer.id
                    ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                    : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]'
                  }`}
              >
                {peer.id === 'global_industry' ? <Globe2 className="mr-1.5 inline-block align-[-2px]" size={13} /> : null}
                {peer.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <article data-guide="peer-overview" className="axis-panel-flat p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="axis-kicker">Overview</p>
                <h2 className="axis-section-heading mt-1">Peer 한눈 비교</h2>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)]">
              <div className="grid grid-cols-6 gap-px bg-[var(--axis-hairline)] text-xs font-semibold text-[var(--axis-muted)]">
                {['기업', '매출', '영업이익', '영업이익률', '사업 키워드', '기술 키워드'].map((label) => (
                  <div key={label} className="bg-[var(--axis-surface-soft)] px-3 py-3">{label}</div>
                ))}
                {peerOverviewVisibleRows.map((row) => {
                  const fallbackKeywords = splitTopKeyword(row.topKeyword);
                  const businessKeyword = row.businessKeyword ?? fallbackKeywords.businessKeyword;
                  const technologyKeyword = row.technologyKeyword ?? fallbackKeywords.technologyKeyword;

                  return (
                    <div key={row.id} className="contents">
                      <div
                        className={`px-3 py-3 text-left text-sm font-semibold ${
                          row.id === 'sk_ax' || row.id === selectedPeer?.id
                            ? 'bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]'
                            : 'bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                        }`}
                      >
                        {row.label}
                      </div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">
                        <div>{formatKrwBn(row.revenueKrwBn)}</div>
                        {formatQoqPercent(row.revenueQoqPct) ? <div className={`mt-1 text-[10px] ${trendToneClass(row.revenueQoqPct)}`}>{formatQoqPercent(row.revenueQoqPct)}</div> : null}
                      </div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">
                        <div>{formatKrwBn(row.operatingProfitKrwBn)}</div>
                        {formatQoqPercent(row.operatingProfitQoqPct) ? <div className={`mt-1 text-[10px] ${trendToneClass(row.operatingProfitQoqPct)}`}>{formatQoqPercent(row.operatingProfitQoqPct)}</div> : null}
                      </div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">
                        <div>{formatPercent(row.operatingMarginPct)}</div>
                        {formatQoqPctPoint(row.operatingMarginQoqDeltaPctp) ? <div className={`mt-1 text-[10px] ${trendToneClass(row.operatingMarginQoqDeltaPctp)}`}>{formatQoqPctPoint(row.operatingMarginQoqDeltaPctp)}</div> : null}
                      </div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">
                        <KeywordCell axisLabel="사업 키워드" keyword={businessKeyword} row={row} />
                      </div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">
                        <KeywordCell axisLabel="기술 키워드" keyword={technologyKeyword} row={row} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-3 text-[11px] leading-5 text-[var(--axis-muted)]">
              <p>기준 분기: {peerOverview?.periodLabel ?? '-'} · {peerOverview?.coverageLabel ?? '공통 분기 미확보'}</p>
              <p className="mt-1">표 안의 작은 `+ / -` 수치는 전분기 대비 증감률이며, 영업이익률은 `%p` 기준으로 표기합니다.</p>
              <p className="mt-1">재무 자료: {peerOverview?.financialSourceLabel ?? '미확인'} · 보조 지표: {peerOverview?.supplementalSourceLabel ?? '미확인'} · 미확보 값은 `-` 로 표기합니다.</p>
            </div>
          </article>
        </section>

        <section>
          <article data-guide="peer-insight" className="axis-panel-flat min-h-[360px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="axis-kicker">Comparison summary</p>
                <h2 className="mt-2 text-lg font-display font-semibold leading-tight text-[var(--axis-ink)]">
                  Peer 사업·기술 비교 흐름
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">핵심 비교 포인트</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--axis-muted)]">{comparisonLabel}</span>
                    <button
                      type="button"
                      onClick={() => setActivePeerReasoningId('comparison')}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                      aria-label="핵심 비교 포인트 추론 과정 보기"
                    >
                      !
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  {peerInsightItems.filter((item) => item.label !== '포지셔닝').map((item) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                    >
                      <div className="mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{item.label}</span>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-success)]">SWOT 분석</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--axis-muted)]">전략 해석</span>
                    <button
                      type="button"
                      onClick={() => setActivePeerReasoningId('swot')}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[11px] font-bold text-[var(--axis-accent-strong)] transition hover:border-[var(--axis-accent)] hover:bg-[rgba(220,90,36,0.08)]"
                      aria-label="SWOT 분석 추론 과정 보기"
                    >
                      !
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {swotItems.map((item, index) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className={`overflow-hidden rounded-[var(--axis-radius-lg)] border p-4 shadow-[0_16px_32px_-28px_rgba(26,26,31,0.24)] ${
                        item.label === 'Strength'
                          ? 'border-[rgba(220,90,36,0.32)] bg-[linear-gradient(180deg,rgba(220,90,36,0.16),var(--axis-canvas))]'
                          : item.label === 'Weakness'
                            ? 'border-[rgba(107,107,115,0.26)] bg-[linear-gradient(180deg,rgba(107,107,115,0.14),var(--axis-canvas))]'
                            : item.label === 'Opportunity'
                              ? 'border-[rgba(90,107,87,0.32)] bg-[linear-gradient(180deg,rgba(90,107,87,0.16),var(--axis-canvas))]'
                              : 'border-[rgba(30,41,59,0.24)] bg-[linear-gradient(180deg,rgba(30,41,59,0.12),var(--axis-canvas))] dark:border-[rgba(246,241,232,0.18)] dark:bg-[linear-gradient(180deg,rgba(246,241,232,0.10),var(--axis-canvas))]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
                              item.label === 'Strength'
                                ? 'border-[rgba(220,90,36,0.28)] bg-[rgba(220,90,36,0.14)] text-[var(--axis-accent-strong)]'
                                : item.label === 'Weakness'
                                  ? 'border-[rgba(107,107,115,0.22)] bg-[rgba(107,107,115,0.10)] text-[var(--axis-muted)]'
                                  : item.label === 'Opportunity'
                                    ? 'border-[rgba(90,107,87,0.28)] bg-[rgba(90,107,87,0.14)] text-[var(--axis-success)]'
                                    : 'border-[rgba(30,41,59,0.18)] bg-[rgba(30,41,59,0.08)] text-[var(--axis-ink)]'
                            }`}
                          >
                            {item.label.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                item.label === 'Strength'
                                  ? 'text-[var(--axis-accent-strong)]'
                                  : item.label === 'Weakness'
                                    ? 'text-[var(--axis-muted)]'
                                    : item.label === 'Opportunity'
                                      ? 'text-[var(--axis-success)]'
                                      : 'text-[var(--axis-ink)]'
                              }`}
                            >
                              {item.label}
                            </p>
                            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.body}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </article>
        </section>

        {isAllFilter ? (
          <section className="mt-5">
            <div data-guide="peer-positioning">
              <PositioningPanel
                positioning={peerPositioning}
                isLoading={isPeerPositioningLoading}
                error={peerPositioningError}
              />
            </div>
          </section>
        ) : null}

      </ExecutiveContainer>

      {activePeerReasoning ? (
        <div className="fixed inset-0 z-50 bg-[rgba(8,10,14,0.62)] p-5 backdrop-blur-sm">
          <section className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[var(--axis-radius-lg)] border border-[rgba(255,255,255,0.16)] bg-[var(--axis-surface)] text-[var(--axis-ink)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.72)]">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--axis-accent-strong)]">AI Agent reasoning</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">{activePeerReasoning.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePeerReasoningId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
                aria-label="Peer+ 추론 과정 닫기"
              >
                <X size={17} />
              </button>
            </header>
            <article className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)] p-4">
                <p className="text-sm font-semibold leading-7 text-[var(--axis-ink)]">{activePeerReasoning.summary}</p>
                <div className="mt-4 space-y-4">
                  {activePeerReasoning.groups.map((group) => (
                    <section key={`${activePeerReasoning.id}-${group.title}`} className="rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.18)] bg-[var(--axis-canvas)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-success)]">{group.title}</p>
                      <div className="mt-3 space-y-3">
                        {group.items.map((item, index) => (
                          <div key={`${activePeerReasoning.id}-${group.title}-${item.label}`} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(90,107,87,0.12)] text-xs font-bold text-[var(--axis-success)]">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.label}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activePeerReasoning.evidenceTags.map((item) => (
                    <ExecutiveBadge key={`${activePeerReasoning.id}-${item}`} tone="accent">{item}</ExecutiveBadge>
                  ))}
                </div>
              </div>
              {activePeerReasoning.evidenceCards.length ? (
                <div className="mt-4 grid gap-3">
                  {activePeerReasoning.evidenceCards.map((card) => {
                    const sourceName = card.sources?.[0]?.source_name ?? card.source;
                    return (
                      <button
                        key={`${activePeerReasoning.id}-${card.id}`}
                        type="button"
                        onClick={() => {
                          setActivePeerReasoningId(null);
                          setPeerDetailCardId(card.id);
                          setPeerDetailSlideIndex(0);
                        }}
                        className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-surface-soft)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-success)]">{getPeerLabel(card)}</p>
                          <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
                        </div>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{getSummaryLines(card)[0] ?? card.detailDescription ?? card.title}</p>
                        {sourceName ? (
                          <p className="mt-2 text-[11px] leading-5 text-[var(--axis-muted)]">
                            <span className="font-semibold text-[var(--axis-ink)]">출처:</span> {sourceName}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </article>
          </section>
        </div>
      ) : null}

      {peerDetailCard ? (
        <FloatingCardNewsOverlay
          card={peerDetailCard}
          cards={peerEvidenceCards}
          bookmarked={bookmarkedIds.includes(peerDetailCard.id)}
          slideIndex={peerDetailSlideIndex}
          onSlideChange={setPeerDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(peerDetailCard.id)}
          onCardChange={(cardId) => {
            setPeerDetailCardId(cardId);
            setPeerDetailSlideIndex(0);
          }}
          onClose={() => {
            setPeerDetailCardId(null);
            setPeerDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
