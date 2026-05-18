import { useEffect, useMemo, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarShape, ResponsiveContainer, Tooltip } from 'recharts';
import { X } from 'lucide-react';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { useDashboard } from '../../../../features/dashboard/hooks/useDashboard';
import { mockPeerPlusIrProfiles, mockPeerPlusKeywordCloud, mockPeerPlusOptions, peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../../../shared/mocks/peerPlus';
import { ExecutiveBadge, ExecutiveButton, ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { LoadingBlock } from './AxisPlanningShared';
import { MediaExposurePanel, PositioningPanel } from './PositioningPanels';

type NavigateHandler = (view: string) => void;

function normalizeGraphTerm(value: string) {
  return value.replace(/\s/g, '').toLowerCase();
}

export function PeerPlusView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
  selectedPeerId: externalSelectedPeerId,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  selectedPeerId?: PeerPlusPeerId;
}) {
  const { dashboard } = useDashboard();
  const { cards, isLoading, error } = useCardNews();
  const peerOptions = mockPeerPlusOptions;
  const [selectedPeerId, setSelectedPeerId] = useState<'all' | PeerPlusPeerId>(externalSelectedPeerId ?? 'all');
  const [peerDetailCardId, setPeerDetailCardId] = useState<string | null>(null);
  const [peerDetailSlideIndex, setPeerDetailSlideIndex] = useState(0);
  const [peerKeywordMatches, setPeerKeywordMatches] = useState<{ keyword: string; cards: CardNewsItem[] } | null>(null);
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);

  useEffect(() => {
    if (externalSelectedPeerId) {
      window.localStorage.setItem(peerPlusSelectionStorageKey, externalSelectedPeerId);
      setSelectedPeerId(externalSelectedPeerId);
      return;
    }
    window.localStorage.setItem(peerPlusSelectionStorageKey, 'all');
    setSelectedPeerId('all');
  }, [externalSelectedPeerId]);
  const isAllFilter = selectedPeerId === 'all';
  const selectedPeer = !isAllFilter ? peerOptions.find((peer) => peer.id === selectedPeerId) ?? peerOptions[0] : null;
  const relevantPeerIds = isAllFilter ? peerOptions.map((peer) => peer.id) : [selectedPeer!.id];
  const peerCards = rankedCards.filter((card) => isAllFilter ? relevantPeerIds.includes(card.peer_id as PeerPlusPeerId) : card.peer_id === selectedPeer!.id);
  const companyNews = (peerCards.length > 0 ? peerCards : rankedCards).slice(0, 4);
  const peerDetailCard = peerDetailCardId ? cards.find((card) => card.id === peerDetailCardId) ?? null : null;
  const peerOrderCountMap: Record<'sk_ax' | PeerPlusPeerId, { label: string; orderCount: string }> = {
    sk_ax: { label: 'SK AX', orderCount: '내부 기준' },
    samsung_sds: { label: '삼성 SDS', orderCount: '공시 미기재' },
    lg_cns: { label: 'LG CNS', orderCount: '공시 미기재' },
    hyundai_autoever: { label: '현대 오토에버', orderCount: '공시 미기재' },
    posco_dx: { label: '포스코 DX', orderCount: '공시 미기재' },
  };
  const skAxProfile = {
    id: 'sk_ax',
    label: 'SK AX',
    revenue: '1.22조',
    operatingProfit: '910억',
    margin: '7.4%',
    axRatio: '34%',
    topKeyword: '운영형 AX',
    orderCount: peerOrderCountMap.sk_ax.orderCount,
  };
  const peerInsightCatalog: Record<'all' | PeerPlusPeerId, Array<{ label: '포지셔닝' | '사업 신호' | '기술 신호' | '리스크'; body: string }>> = {
    all: [
      { label: '포지셔닝', body: '전체 비교에서는 SK AX를 기준축으로 두고, 삼성 SDS는 ITS·클라우드·AI, LG CNS는 금융·공공·클라우드, 현대 오토에버는 모빌리티·운영, 포스코 DX는 산업DX·이차전지 문맥으로 나뉘어 보입니다.' },
      { label: '사업 신호', body: '공시 수치 기준 2025Q4 매출은 삼성 SDS 3.54조, LG CNS 1.94조, 현대 오토에버 1.32조, 포스코 DX 2,608억 수준으로 읽히며, 기업별로 규모 차이가 크게 나타납니다.' },
      { label: '기술 신호', body: '키워드 기준으로는 FabriX·Brity, 금융·공공 AI/DX, 커넥티드카·OTA, 산업DX·LLM처럼 각사가 반복적으로 내세우는 기술 문맥이 분명하게 갈립니다.' },
      { label: '리스크', body: 'AX 비중과 수주 수처럼 공시에서 직접 확인되지 않는 값은 비교 해석에 한계가 있어, 현재 화면은 실수치와 키워드 중심의 1차 비교로 읽는 편이 안전합니다.' },
    ],
    samsung_sds: [
      { label: '포지셔닝', body: '삼성 SDS는 2025Q4 기준 매출 3.54조, 영업이익 2,261억원 수준으로 규모 우위가 크고, SK AX와 비교할 때 ITS·클라우드·AI가 동시에 보이는 복합 신호 축으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로는 분기 매출이 3조원대 중반을 유지하고 있어 사업 규모 자체가 비교 기준점으로 작동합니다.' },
      { label: '기술 신호', body: 'FabriX, Brity, 에이전틱 AI, ITS, 클라우드 같은 키워드가 함께 나타나 기술 메시지가 운영형 AI와 서비스 축으로 묶여 보입니다.' },
      { label: '리스크', body: 'AX 비중이나 수주 수는 공시에서 직접 확인되지 않기 때문에, 현재 단계에서는 규모와 키워드 강도 중심으로만 비교하는 편이 적절합니다.' },
    ],
    lg_cns: [
      { label: '포지셔닝', body: 'LG CNS는 2025Q4 기준 매출 1.94조, 영업이익 2,119억원 수준이며 금융·공공·클라우드/MSP·AI/DX가 함께 보이는 다축형 경쟁군으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로 영업이익률이 10%대를 보여 수익성 측면에서는 네 곳 중 상대적으로 안정적으로 읽히는 편입니다.' },
      { label: '기술 신호', body: '금융, 공공, 클라우드 MSP, AI/DX, 스마트물류 키워드가 반복돼 기술 신호가 특정 산업보다 플랫폼형 문맥으로 넓게 퍼져 있습니다.' },
      { label: '리스크', body: '실수치는 강하지만 AX 비중, 수주 수 등 직접 비교 지표는 공시 미기재라서, 현재 화면만으로는 확장 속도까지 단정하기 어렵습니다.' },
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
      { label: '리스크', body: '분기 이익 변동성이 크고 세부 부문 매출과 AX 비중이 공시 미기재라서, 현재 단계에서는 산업 키워드 강도와 총실적만 우선 비교하는 편이 적절합니다.' },
    ],
  };
  const swotCatalog: Record<'all' | PeerPlusPeerId, Array<{ label: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat'; body: string }>> = {
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
  const peerRadarData = [
    { subject: '수익성', sk_ax: 72, samsung_sds: 63, lg_cns: 68, hyundai_autoever: 67, posco_dx: 59 },
    { subject: '성장성', sk_ax: 70, samsung_sds: 82, lg_cns: 78, hyundai_autoever: 66, posco_dx: 71 },
    { subject: 'AX 집중도', sk_ax: 78, samsung_sds: 79, lg_cns: 85, hyundai_autoever: 72, posco_dx: 76 },
    { subject: '수주 모멘텀', sk_ax: 73, samsung_sds: 81, lg_cns: 87, hyundai_autoever: 69, posco_dx: 75 },
    { subject: '운영 효율', sk_ax: 74, samsung_sds: 67, lg_cns: 70, hyundai_autoever: 69, posco_dx: 61 },
    { subject: '시장 노출', sk_ax: 69, samsung_sds: 88, lg_cns: 80, hyundai_autoever: 65, posco_dx: 72 },
  ] as const;
  const radarLegendConfig: Record<'sk_ax' | PeerPlusPeerId, { label: string; color: string }> = {
    sk_ax: { label: 'SK AX', color: 'var(--axis-accent)' },
    samsung_sds: { label: '삼성 SDS', color: 'var(--axis-graph-company)' },
    lg_cns: { label: 'LG CNS', color: 'var(--axis-graph-infra)' },
    hyundai_autoever: { label: '현대 오토에버', color: 'var(--axis-graph-security)' },
    posco_dx: { label: '포스코 DX', color: 'var(--axis-graph-deal)' },
  };
  const radarKeys = (isAllFilter
    ? (['sk_ax', ...peerOptions.map((peer) => peer.id)] as Array<'sk_ax' | PeerPlusPeerId>)
    : (['sk_ax', selectedPeer!.id] as Array<'sk_ax' | PeerPlusPeerId>));
  const peerInsightItems = peerInsightCatalog[isAllFilter ? 'all' : selectedPeer!.id];
  const swotItems = swotCatalog[isAllFilter ? 'all' : selectedPeer!.id];
  const allKeywordCloud = Object.values(mockPeerPlusKeywordCloud)
    .flat()
    .reduce<Array<{ label: string; weight: number; tone: 'accent' | 'success' | 'neutral' }>>((acc, item) => {
      const existing = acc.find((entry) => entry.label === item.label);
      if (!existing) {
        acc.push({ ...item });
      } else {
        existing.weight = Math.max(existing.weight, item.weight);
      }
      return acc;
    }, [])
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);
  const selectedKeywordCloud = isAllFilter ? allKeywordCloud : mockPeerPlusKeywordCloud[selectedPeer!.id];
  const peerOverviewRows = peerOptions.map((peer) => {
    const profile = mockPeerPlusIrProfiles[peer.id];
    const topKeyword = mockPeerPlusKeywordCloud[peer.id][0]?.label ?? '-';
    return {
      id: peer.id,
      label: peer.label,
      revenue: profile.revenue,
      operatingProfit: profile.operatingProfit,
      margin: profile.margin,
      axRatio: profile.axRatio,
      orderCount: peerOrderCountMap[peer.id].orderCount,
      topKeyword,
    };
  });
  const wordCloudLayout = [
    { left: '50%', top: '50%', rotate: 0 },
    { left: '23%', top: '35%', rotate: -6 },
    { left: '75%', top: '35%', rotate: 5 },
    { left: '26%', top: '72%', rotate: 0 },
    { left: '74%', top: '72%', rotate: -4 },
    { left: '50%', top: '20%', rotate: 0 },
    { left: '18%', top: '55%', rotate: -8 },
    { left: '82%', top: '56%', rotate: 7 },
    { left: '38%', top: '16%', rotate: 0 },
    { left: '62%', top: '84%', rotate: -3 },
  ];
  const openKeywordCard = (keyword: string) => {
    const normalizedKeyword = normalizeGraphTerm(keyword);
    const keywordTerms = Array.from(new Set([normalizedKeyword, ...normalizedKeyword.split(/[\s/·-]+/)])).filter(Boolean);
    const matchedCards = rankedCards.filter((card) => {
      const haystack = normalizeGraphTerm([
        card.title,
        getPeerLabel(card),
        card.category,
        card.category_label,
        card.subtitle,
        card.sector,
        ...(card.summary_lines ?? card.summary),
        ...(card.insights ?? []),
        ...(card.actionItems ?? []),
      ].filter(Boolean).join(' '));
      return keywordTerms.some((term) => term.length > 1 && haystack.includes(term));
    }).slice(0, 6);
    setPeerKeywordMatches({ keyword, cards: matchedCards.length > 0 ? matchedCards : companyNews });
  };

  if (isLoading) return <LoadingBlock label="Peer+ 분석 데이터를 불러오는 중입니다." />;
  if (error) return <LoadingBlock label={error} />;

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Peer+ analysis"
          title="Peer+"
          subtitle="전체 모드에서는 시장 전반 비교를, 기업별 모드에서는 SK AX와 선택 기업의 신호·재무·키워드 차이를 바로 읽을 수 있도록 정리한 화면입니다."
          actions={
            <div data-guide="peer-selector" className="flex flex-wrap justify-end gap-1.5">
              {[{ id: 'all' as const, label: '전체' }, ...peerOptions].map((peer) => (
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
                  {peer.label}
                </button>
              ))}
            </div>
          }
        />

        {/* 산업 포지셔닝 (메인) + 미디어 노출도 (보조 AUXILIARY) — Peer 비교의 두 축.
            메인은 매출×성장률 사업 위상, 보조는 PR/IR 도달량 (self-peer bias 격리). */}
        <section className="mb-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <PositioningPanel />
          <MediaExposurePanel />
        </section>

        <section className="mb-5">
          <article data-guide="peer-overview" className="axis-panel-flat p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="axis-kicker">Overview</p>
                <h2 className="axis-section-heading mt-1">Peer 한눈 비교</h2>
              </div>
              <ExecutiveBadge tone="accent">목업</ExecutiveBadge>
            </div>
            <div className="mt-4 overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)]">
              <div className="grid grid-cols-[1.08fr_0.98fr_0.98fr_0.88fr_0.82fr_0.88fr_1fr] gap-px bg-[var(--axis-hairline)] text-xs font-semibold text-[var(--axis-muted)]">
                {['기업', '매출', '영업이익', '영업이익률', 'AX 비중', '수주 수', '핵심 키워드'].map((label) => (
                  <div key={label} className="bg-[var(--axis-surface-soft)] px-3 py-3">{label}</div>
                ))}
                {[skAxProfile, ...peerOverviewRows].filter((row) => isAllFilter || row.id === 'sk_ax' || row.id === selectedPeer!.id).map((row) => (
                  <div key={row.id} className="contents">
                    <div
                      className={`px-3 py-3 text-left text-sm font-semibold ${
                        row.id === 'sk_ax' || row.id === selectedPeerId ? 'bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]' : 'bg-[var(--axis-canvas)] text-[var(--axis-ink)]'
                      }`}
                    >
                      {row.label}
                    </div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.revenue}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.operatingProfit}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.margin}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.axRatio}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.orderCount}</div>
                    <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.topKeyword}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] px-4 py-3 text-sm text-[var(--axis-muted)]">
              비교 기준: IR 자료 및 DART 기반 목업 값. 전체 모드에서는 SK AX를 포함한 시장 비교, 기업별 모드에서는 SK AX와 선택 기업만 남겨 바로 읽을 수 있게 구성했습니다.
            </div>
          </article>
        </section>

        <section>
          <article data-guide="peer-insight" className="axis-panel-flat min-h-[360px] p-5">
            <p className="axis-kicker">Comparison summary</p>
            <h2 className="mt-2 text-lg font-display font-semibold leading-tight text-ink">
              경쟁 메시지 차이와 SK AX 대응 포인트
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
              왼쪽은 실무 비교에 바로 쓰는 핵심 신호만, 오른쪽은 포지셔닝 관점까지 포함한 SWOT 해석만 따로 분리해 읽도록 구성했습니다.
            </p>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">핵심 비교 포인트</h3>
                  <span className="text-xs font-semibold text-[var(--axis-muted)]">SK AX vs {isAllFilter ? 'Peer 전체' : selectedPeer!.label}</span>
                </div>
                <p className="mb-4 text-xs leading-5 text-[var(--axis-muted)]">
                  사업 신호, 기술 신호, 리스크만 남겨 실제 제안이나 내부 브리핑에서 바로 비교 가능한 축으로 압축했습니다.
                </p>
                <div className="grid gap-3">
                  {peerInsightItems.filter((item) => item.label !== '포지셔닝').map((item, index) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{item.label}</span>
                        <span className="text-xs font-semibold text-[var(--axis-muted)]">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <p className={`${index === 0 ? 'text-base leading-7' : 'text-sm leading-6'} font-semibold text-[var(--axis-ink)]`}>{item.body}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--axis-success)]">SWOT 분석</h3>
                  <span className="text-xs font-semibold text-[var(--axis-muted)]">전략 해석</span>
                </div>
                <p className="mb-4 text-xs leading-5 text-[var(--axis-muted)]">
                  포지셔닝은 SWOT 안에서 해석하고, 각 항목이 SK AX의 대응 방향에 어떤 의미를 갖는지 한 번에 보이도록 정리했습니다.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {swotItems.map((item) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className={`overflow-hidden rounded-[var(--axis-radius-lg)] border p-4 shadow-[0_16px_32px_-28px_rgba(26,26,31,0.24)] ${
                        item.label === 'Strength'
                          ? 'border-[rgba(220,90,36,0.28)] bg-[linear-gradient(180deg,rgba(220,90,36,0.14),rgba(255,255,255,0.92))]'
                          : item.label === 'Weakness'
                            ? 'border-[rgba(107,107,115,0.22)] bg-[linear-gradient(180deg,rgba(107,107,115,0.10),rgba(255,255,255,0.94))]'
                            : item.label === 'Opportunity'
                              ? 'border-[rgba(90,107,87,0.28)] bg-[linear-gradient(180deg,rgba(90,107,87,0.14),rgba(255,255,255,0.92))]'
                              : 'border-[rgba(30,41,59,0.18)] bg-[linear-gradient(180deg,rgba(30,41,59,0.10),rgba(255,255,255,0.94))]'
                      }`}
                    >
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
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
          <article data-guide="peer-wordcloud" className="axis-panel-flat p-5">
            <p className="axis-kicker">Issue theme cloud</p>
            <h3 className="axis-section-heading mt-1">최근 도입·협력 핵심 키워드</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
              {isAllFilter
                ? '전체 모드에서는 모든 Peer사에서 반복되는 키워드를 한 화면에 합쳐 시장 전체의 신호를 먼저 읽게 했습니다.'
                : `${selectedPeer!.label} 기준 키워드만 남겨 해당 기업의 최근 사업·기술 문맥을 더 직접적으로 볼 수 있게 했습니다.`}
            </p>
            <div className="relative mt-4 h-[250px] overflow-hidden rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]">
              <div className="absolute inset-5 rounded-full border border-dashed border-[var(--axis-hairline)] opacity-55" />
              {selectedKeywordCloud.map((item, index) => {
                const position = wordCloudLayout[index % wordCloudLayout.length];
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => openKeywordCard(item.label)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1.5 font-display font-semibold leading-none transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--axis-accent)] ${
                      item.weight === 3 ? 'text-3xl' : item.weight === 2 ? 'text-xl' : 'text-sm'
                    } ${
                      item.tone === 'accent'
                        ? 'text-[var(--axis-accent-strong)]'
                        : item.tone === 'success'
                          ? 'text-[var(--axis-success)]'
                          : 'text-[var(--axis-body)]'
                    }`}
                    style={{
                      left: position.left,
                      top: position.top,
                      transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--axis-muted)]">
              {isAllFilter
                ? '키워드를 클릭하면 전체 모드에서도 관련 카드뉴스를 통해 어떤 문맥에서 반복됐는지 바로 확인할 수 있습니다.'
                : '키워드를 클릭하면 해당 기업 관련 카드뉴스와 연결해 실제 이슈 맥락을 같이 볼 수 있습니다.'}
            </p>
          </article>

          <article data-guide="peer-radar" className="axis-panel-flat p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="axis-kicker">DART balance</p>
                <h2 className="axis-section-heading mt-1">
                  {isAllFilter ? 'Peer 재무 체질 레이더 비교' : `${selectedPeer!.label} vs SK AX 재무 체질 레이더`}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
                  {isAllFilter
                    ? '전체 모드에서는 SK AX와 주요 Peer를 한 번에 겹쳐 시장 평균 대비 어디가 두드러지는지 보는 용도입니다.'
                    : '기업별 모드에서는 SK AX와 선택 기업만 겹쳐 재무 체질 차이를 빠르게 읽는 비교 레이어로 사용합니다.'}
                </p>
              </div>
              <ExecutiveBadge tone="accent">Radar</ExecutiveBadge>
            </div>
            <div className="mt-4 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[rgba(255,255,255,0.88)] p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {radarKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-1.5 text-xs font-semibold text-[var(--axis-body)]"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: radarLegendConfig[key].color }} />
                    {radarLegendConfig[key].label}
                  </span>
                ))}
              </div>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[...peerRadarData]} outerRadius={122} margin={{ top: 10, right: 34, bottom: 10, left: 34 }}>
                  <PolarGrid stroke="rgba(117,117,128,0.22)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: 'var(--axis-body)', fontWeight: 700 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  {radarKeys.map((key) => (
                    <RadarShape
                      key={key}
                      name={radarLegendConfig[key].label}
                      dataKey={key}
                      stroke={radarLegendConfig[key].color}
                      fill={radarLegendConfig[key].color}
                      fillOpacity={key === 'sk_ax' ? 0.2 : 0.1}
                      strokeWidth={key === 'sk_ax' ? 2.6 : 2}
                    />
                  ))}
                  <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--axis-muted)]">축 기준은 수익성, 성장성, AX 집중도, 수주 모멘텀, 운영 효율, 시장 노출이며, 수치 자체보다 상대적 모양과 벌어진 구간을 읽는 비교용 목업입니다.</p>
          </article>
        </section>

        {!isAllFilter ? (
        <section data-guide="peer-related-cardnews" className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="axis-kicker">Related card news</p>
              <h2 className="axis-section-heading mt-1">{selectedPeer!.label} 관련 카드뉴스</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">선택 기업의 최근 카드뉴스를 함께 보며 위 비교 결과가 어떤 공개 신호에서 나왔는지 바로 연결해 확인할 수 있습니다.</p>
            </div>
            <ExecutiveBadge tone="accent">{companyNews.length}건</ExecutiveBadge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {companyNews.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setPeerDetailCardId(card.id)}
                className="relative aspect-[4/5] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[#081324] text-left transition hover:border-[var(--axis-accent)]"
              >
                {card.coverImageUrl ? (
                  <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/34 via-[#081324]/48 to-black/92" />
                <div className="relative flex h-full flex-col justify-between p-4 text-white">
                  <div className="flex items-start justify-between gap-2 text-xs font-semibold">
                    <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{getDisplayDate(card)}</span>
                    <span className="rounded-sm border border-white/25 bg-white/10 px-2 py-1">{card.category_label ?? card.category}</span>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">{getPeerLabel(card)}</p>
                    <h3 className="line-clamp-4 text-lg font-semibold leading-tight text-white">{card.title}</h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
        ) : null}
      </ExecutiveContainer>
      {peerKeywordMatches ? (
        <div
          className="fixed inset-0 z-40 bg-[rgba(250,248,244,0.62)] p-5 backdrop-blur-sm dark:bg-[rgba(17,18,22,0.70)]"
          onClick={() => setPeerKeywordMatches(null)}
        >
          <section
            className="ml-auto h-full w-full max-w-[520px] overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--axis-hairline)] p-5">
              <div>
                <p className="axis-kicker">Keyword card news</p>
                <h2 className="axis-section-heading mt-1">‘{peerKeywordMatches.keyword}’ 관련 카드뉴스</h2>
              </div>
              <button
                type="button"
                aria-label="관련 카드뉴스 목록 닫기"
                onClick={() => setPeerKeywordMatches(null)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
              >
                <X size={16} />
              </button>
            </header>
            <div className="h-[calc(100%-82px)] overflow-y-auto p-5">
              <div className="space-y-3">
                {peerKeywordMatches.cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setPeerDetailCardId(card.id);
                      setPeerDetailSlideIndex(0);
                    }}
                    className="grid w-full grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)] hover:bg-[var(--axis-canvas)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--axis-radius-sm)] bg-[#081324]">
                      {card.coverImageUrl ? (
                        <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--axis-accent-strong)]">{getPeerLabel(card)}</span>
                        <span className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</span>
                      </div>
                      <h3 className="mt-2 line-clamp-3 text-base font-semibold leading-6 text-[var(--axis-ink)]">{card.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--axis-muted)]">{getSummaryLines(card)[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {peerDetailCard ? (
        <FloatingCardNewsOverlay
          card={peerDetailCard}
          cards={companyNews}
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

