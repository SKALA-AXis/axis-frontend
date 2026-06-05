import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Globe2, LineChart, ShieldCheck, Sparkles, X } from 'lucide-react';

import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { usePeerPositioning } from '../../../../features/peers/hooks/usePeerPositioning';
import { usePeerOverview } from '../../../../features/peers/hooks/usePeerOverview';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import { pickLatestCardTimestamp } from '../../../../shared/lib/viewFreshness';
import { mockPeerPlusOptions, peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../../../shared/mocks/peerPlus';
import { ExecutiveBadge, ExecutiveContainer, ExecutiveHeader, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { PageProcessLoading, PageState } from '../../shared/PageState';
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

const globalIndustryTrendSnapshot = {
  whyTitle: '왜 지금 봐야 하나',
  whyBody:
    '글로벌 IT서비스 시장의 경쟁 축이 단순 SI 납품에서 에이전틱 AI를 설계·구축·운영하고 책임지는 모델로 이동하고 있습니다. SK AX가 투자, 제휴, 산업 우선순위, 제안 메시지를 정할 때 이 변화는 Peer 비교보다 한 단계 앞선 기준선이 됩니다.',
  decisionPrinciples: [
    { label: '포트폴리오', body: '산업별 AI 에이전트, AI 인프라, 보안·거버넌스를 따로 팔기보다 하나의 운영 패키지로 묶을지 판단합니다.' },
    { label: '투자 우선순위', body: 'GPU/프라이빗 AI, 데이터 파운데이션, AI 보안 중 어느 영역을 자체 역량으로 둘지 정합니다.' },
    { label: '시장 진입', body: '금융·제조·공공처럼 규제와 운영 복잡도가 높은 산업부터 레퍼런스를 만들지 검토합니다.' },
  ],
  focusTechnologies: [
    {
      label: '제일 관심가는 기술',
      title: '멀티 에이전트 오케스트레이션',
      body: '업무 단위 챗봇을 넘어 여러 에이전트가 계획, 실행, 검증, 예외 처리를 나누는 구조입니다.',
      importance: 'SK AX가 운영형 AX를 차별화하려면 에이전트 설계보다 운영 통제와 성과 책임을 함께 보여줘야 합니다.',
      metric: '자동 처리율, 예외 전환율, 업무 리드타임',
    },
    {
      label: '제일 관심가는 기술',
      title: 'AI 퍼스트 인프라와 프라이빗 AI',
      body: 'AI 워크로드가 늘면서 데이터센터, GPU, 스토리지, 네트워크, 비용 최적화가 제안의 핵심 조건이 됩니다.',
      importance: '고객은 AI 모델보다 안정적인 실행 환경과 비용 예측 가능성을 먼저 묻기 시작합니다.',
      metric: '추론 비용, 지연시간, GPU 활용률',
    },
    {
      label: '제일 관심가는 기술',
      title: 'AI 보안·출처 검증·기밀 컴퓨팅',
      body: 'AI가 내부 데이터와 고객 접점에 들어갈수록 권한, 감사, 데이터 출처, 모델 리스크 관리가 경쟁 기준이 됩니다.',
      importance: '금융·공공·제조 고객에게는 “쓸 수 있는 AI”보다 “감사 가능한 AI”가 채택 조건이 될 가능성이 큽니다.',
      metric: '감사 추적률, 정책 위반 탐지율, 데이터 계보 커버리지',
    },
  ],
  trendShifts: [
    {
      label: '트랜드 변화',
      title: '파일럿 검증에서 전사 확산으로',
      body: '2026년 글로벌 논의의 초점은 PoC 개수보다 실제 업무 프로세스 안에서 에이전트가 얼마나 안정적으로 반복 운영되는지로 이동합니다.',
      decision: 'SK AX 제안서는 데모 화면보다 운영 지표, 책임 범위, 예외 처리 체계를 앞쪽에 배치해야 합니다.',
    },
    {
      label: '트랜드 변화',
      title: '범용 AI에서 산업 특화 AI로',
      body: '수평형 생산성 도구는 빠르게 평준화되고, 금융 KYC, 제조 품질, 공공 민원처럼 도메인 지식이 깊은 영역이 차별화됩니다.',
      decision: '산업별 표준 데이터 모델과 업무 템플릿을 먼저 확보한 뒤 반복 판매 가능한 패키지로 전환해야 합니다.',
    },
    {
      label: '트랜드 변화',
      title: '클라우드 전환에서 AI 주권·하이브리드 운영으로',
      body: 'AI 인프라는 공용 클라우드만의 문제가 아니라 데이터 위치, 규제, 비용, 온프레미스 연계를 함께 푸는 의제가 됩니다.',
      decision: '글로벌 CSP 협력과 동시에 국내 규제 산업용 프라이빗 AI 운영 모델을 준비해야 합니다.',
    },
  ],
  aiCapabilities: [
    {
      label: 'AI 기술',
      title: '도메인 특화 언어모델과 RAG 데이터 파운데이션',
      body: '산업 문서, 운영 로그, 계약·규정 데이터를 신뢰 가능한 지식 자산으로 바꾸는 역량이 AI 성능을 좌우합니다.',
      decision: '고객별 데이터 정리 사업을 단발 구축이 아니라 지속 운영 계약의 진입점으로 설계합니다.',
    },
    {
      label: 'AI 기술',
      title: 'AI 네이티브 개발 플랫폼',
      body: '코드 생성이 아니라 요구사항, 테스트, 배포, 운영 관측까지 연결된 개발 체계가 서비스 생산성을 바꿉니다.',
      decision: 'SK AX 내부 딜리버리 생산성 개선과 고객 대상 개발 현대화 오퍼링을 동시에 만들 수 있습니다.',
    },
    {
      label: 'AI 기술',
      title: 'Physical AI와 산업 운영 자동화',
      body: '로봇, 설비, 디지털 트윈, 비전 AI가 현장 데이터와 결합하면서 제조·물류·에너지 운영 의사결정에 들어옵니다.',
      decision: '제조 AX는 분석 대시보드가 아니라 현장 조치와 안전·품질 KPI까지 닫히는 구조로 제안해야 합니다.',
    },
  ],
  executiveMoves: [
    { label: 'Build', title: '운영 책임형 AI 패키지화', body: '에이전트 구축, 데이터 파운데이션, 보안 통제, 운영 KPI를 하나의 표준 제안 묶음으로 만듭니다.' },
    { label: 'Partner', title: 'GPU·보안·모델 생태계 선택', body: '모든 기술을 직접 보유하기보다 글로벌 CSP, AI 보안, 도메인 모델 파트너를 계층별로 고릅니다.' },
    { label: 'Run', title: 'AI 운영센터형 수익 모델', body: '일회성 구축보다 모니터링, 품질관리, drift 대응, 감사 리포트를 반복 매출로 전환합니다.' },
  ],
};

function GlobalIndustryTrendView() {
  const snapshot = globalIndustryTrendSnapshot;

  return (
    <div className="space-y-5">
      <section data-guide="global-industry-overview" className="axis-panel-flat overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="axis-kicker">Global decision lens</p>
                <h2 className="axis-section-heading mt-1">글로벌 산업 신호와 SK AX 의사결정 기준</h2>
              </div>
              <ExecutiveBadge tone="accent">2026 Signals</ExecutiveBadge>
            </div>
            <p className="mt-4 text-sm font-semibold leading-7 text-[var(--axis-ink)]">{snapshot.whyBody}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {snapshot.decisionPrinciples.map((item) => (
                <article key={item.label} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-body)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
          <aside className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-5 xl:border-l xl:border-t-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(220,90,36,0.24)] bg-[rgba(220,90,36,0.10)] text-[var(--axis-accent-strong)]">
                <Globe2 size={20} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-muted)]">What matters</p>
                <h3 className="text-base font-display font-semibold text-[var(--axis-ink)]">보여줘야 하는 이유</h3>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ['시장 기준선', '국내 Peer가 아직 말하지 않는 기술·운영 기준을 먼저 잡아 제안 메시지의 선후를 정합니다.'],
                ['투자 판단', '자체 구축, 제휴, 운영 대행 중 어디에 돈과 인력을 배치할지 빠르게 좁힙니다.'],
                ['리스크 통제', 'AI 보안, 데이터 주권, 감사 가능성처럼 고객 채택을 막는 조건을 먼저 확인합니다.'],
              ].map(([label, body]) => (
                <div key={label} className="border-l-2 border-[var(--axis-accent)] pl-3">
                  <p className="text-sm font-semibold text-[var(--axis-ink)]">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--axis-body)]">{body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section data-guide="global-interesting-tech" className="axis-panel-flat p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="axis-kicker">Executive tech radar</p>
            <h2 className="axis-section-heading mt-1">제일 관심가는 기술: 의사결정 우선순위</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
              기술 자체의 화제성보다 SK AX가 고객에게 운영 책임과 성과 지표를 제시할 수 있는지를 기준으로 골랐습니다.
            </p>
          </div>
          <Sparkles className="shrink-0 text-[var(--axis-accent-strong)]" size={22} />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {snapshot.focusTechnologies.map((item) => (
            <article key={item.title} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_16px_36px_-30px_rgba(26,26,31,0.30)]">
              <ExecutiveBadge tone="accent">{item.label}</ExecutiveBadge>
              <h3 className="mt-3 text-base font-display font-semibold leading-6 text-[var(--axis-ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
              <div className="mt-4 rounded-[var(--axis-radius-md)] border border-[rgba(90,107,87,0.22)] bg-[rgba(90,107,87,0.08)] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--axis-success)]">중요한 이유</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.importance}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--axis-muted)]">볼 지표: {item.metric}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article data-guide="global-trend-shift" className="axis-panel-flat p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="axis-kicker">Trend shift</p>
              <h2 className="axis-section-heading mt-1">트렌드 변화: 시장이 바꾸는 구매 기준</h2>
            </div>
            <LineChart className="text-[var(--axis-success)]" size={22} />
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.trendShifts.map((item, index) => (
              <section key={item.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[rgba(90,107,87,0.12)] text-sm font-black text-[var(--axis-success)]">{index + 1}</span>
                <div>
                  <ExecutiveBadge tone="accent">{item.label}</ExecutiveBadge>
                  <h3 className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[var(--axis-accent-strong)]">SK AX 판단: {item.decision}</p>
                </div>
              </section>
            ))}
          </div>
        </article>

        <article data-guide="global-ai-tech" className="axis-panel-flat p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="axis-kicker">AI technology playbook</p>
              <h2 className="axis-section-heading mt-1">AI 기술: 실행 가능한 역량으로 번역</h2>
            </div>
            <BrainCircuit className="text-[var(--axis-accent-strong)]" size={23} />
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.aiCapabilities.map((item) => (
              <section key={item.title} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                <ExecutiveBadge tone="accent">{item.label}</ExecutiveBadge>
                <h3 className="mt-2 text-sm font-semibold leading-6 text-[var(--axis-ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
                <p className="mt-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--axis-ink)]">의사결정 연결: {item.decision}</p>
              </section>
            ))}
          </div>
        </article>
      </section>

      <section data-guide="global-action-map" className="axis-panel-flat p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="axis-kicker">SK AX action map</p>
            <h2 className="axis-section-heading mt-1">글로벌 동향을 다음 의사결정으로 연결</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
              글로벌 신호는 관찰로 끝나면 가치가 낮습니다. 아래 세 가지 선택지가 실제 사업 포트폴리오 회의에서 바로 다뤄져야 할 안건입니다.
            </p>
          </div>
          <ShieldCheck className="shrink-0 text-[var(--axis-success)]" size={22} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {snapshot.executiveMoves.map((item) => (
            <article key={item.label} className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--axis-accent-strong)]">{item.label}</p>
              <h3 className="mt-2 text-base font-display font-semibold leading-6 text-[var(--axis-ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--axis-body)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

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

function formatCount(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${new Intl.NumberFormat('ko-KR').format(value)}건`;
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

function trendToneClass(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value === 0) return 'text-[var(--axis-muted)]';
  return value > 0 ? 'text-[#d3432b]' : 'text-[#2563eb]';
}

function trimDecimal(value: number, digits: number) {
  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
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
  const [selectedPeerId, setSelectedPeerId] = useState<PeerPlusFilterId>(externalSelectedPeerId ?? 'all');
  const [peerDetailCardId, setPeerDetailCardId] = useState<string | null>(null);
  const [peerDetailSlideIndex, setPeerDetailSlideIndex] = useState(0);
  const [activePeerReasoningId, setActivePeerReasoningId] = useState<'comparison' | 'swot' | null>(null);
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
  const comparisonLabel = isGlobalIndustry ? 'SK AX 글로벌 산업 동향' : isAllFilter ? 'SK AX vs Peer 전체' : `SK AX vs ${selectedPeer?.label ?? '선택 Peer'}`;
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
      operatingMarginPct: null,
      operatingMarginQoqDeltaPctp: null,
      axRevenueSharePct: null,
      contractCount: null,
      topKeyword: null,
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
      operatingMarginPct: null,
      operatingMarginQoqDeltaPctp: null,
      axRevenueSharePct: null,
      contractCount: null,
      topKeyword: null,
      dartRceptNo: null,
    })),
  ].map((baseRow) => {
    const hydratedRow = peerOverviewApiRows.find((row) => row.id === baseRow.id);
    return hydratedRow ? { ...baseRow, ...hydratedRow } : baseRow;
  });
  const peerOverviewVisibleRows = peerOverviewRows.filter((row) => isAllFilter || row.id === 'sk_ax' || row.id === selectedPeer?.id);

  const peerInsightCatalog: Record<'all' | PeerPlusPeerId, Array<{ label: '포지셔닝' | '사업 신호' | '기술 신호' | '리스크'; body: string }>> = {
    all: [
      { label: '포지셔닝', body: '전체 비교에서는 SK AX를 기준축으로 두고, 삼성 SDS는 ITS·클라우드·AI, LG CNS는 금융·공공·클라우드, 현대 오토에버는 모빌리티·운영, 포스코 DX는 산업DX·이차전지 문맥으로 나뉘어 보입니다.' },
      { label: '사업 신호', body: '공시 수치 기준 2025Q4 매출은 삼성 SDS 3.54조, LG CNS 1.94조, 현대 오토에버 1.32조, 포스코 DX 2,608억 수준으로 읽히며, 기업별로 규모 차이가 크게 나타납니다.' },
      { label: '기술 신호', body: '키워드 기준으로는 FabriX·Brity, 금융·공공 AI/DX, 커넥티드카·OTA, 산업DX·LLM처럼 각사가 반복적으로 내세우는 기술 문맥이 분명하게 갈립니다.' },
      { label: '리스크', body: '수주 수처럼 공시에서 직접 확인되지 않는 값은 비교 해석에 한계가 있어, 현재 화면은 실수치와 키워드 중심의 1차 비교로 읽는 편이 안전합니다.' },
    ],
    samsung_sds: [
      { label: '포지셔닝', body: '삼성 SDS는 2025Q4 기준 매출 3.54조, 영업이익 2,261억원 수준으로 규모 우위가 크고, SK AX와 비교할 때 ITS·클라우드·AI가 동시에 보이는 복합 신호 축으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로는 분기 매출이 3조원대 중반을 유지하고 있어 사업 규모 자체가 비교 기준점으로 작동합니다.' },
      { label: '기술 신호', body: 'FabriX, Brity, 에이전틱 AI, ITS, 클라우드 같은 키워드가 함께 나타나 기술 메시지가 운영형 AI와 서비스 축으로 묶여 보입니다.' },
      { label: '리스크', body: '수주 수는 공시에서 직접 확인되지 않기 때문에, 현재 단계에서는 규모와 수익성, 키워드 강도 중심으로만 비교하는 편이 적절합니다.' },
    ],
    lg_cns: [
      { label: '포지셔닝', body: 'LG CNS는 2025Q4 기준 매출 1.94조, 영업이익 2,119억원 수준이며 금융·공공·클라우드/MSP·AI/DX가 함께 보이는 다축형 경쟁군으로 읽힙니다.' },
      { label: '사업 신호', body: '공시 실수치 기준으로 영업이익률이 10%대를 보여 수익성 측면에서는 네 곳 중 상대적으로 안정적으로 읽히는 편입니다.' },
      { label: '기술 신호', body: '금융, 공공, 클라우드 MSP, AI/DX, 스마트물류 키워드가 반복돼 기술 신호가 특정 산업보다 플랫폼형 문맥으로 넓게 퍼져 있습니다.' },
      { label: '리스크', body: '실수치는 강하지만 수주 수 같은 직접 비교 지표는 공시 미기재라서, 현재 화면만으로는 확장 속도까지 단정하기 어렵습니다.' },
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
  const peerInsightItems = peerInsightCatalog[selectedPeerAnalysisId];
  const swotItems = swotCatalog[selectedPeerAnalysisId];
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
          eyebrow={isGlobalIndustry ? 'Global industry intelligence' : 'Peer+ analysis'}
          title={isGlobalIndustry ? 'Peer+ Global Signals' : 'Peer+'}
          subtitle={
            isGlobalIndustry
              ? '글로벌 산업 변화가 SK AX의 투자·제휴·포트폴리오 의사결정에 어떤 기준선을 주는지 정리한 화면입니다.'
              : '전체 모드에서는 시장 전반 비교를, 기업별 모드에서는 SK AX와 선택 기업의 재무·메시지 차이만 빠르게 읽을 수 있도록 정리한 화면입니다.'
          }
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

        {isGlobalIndustry ? (
          <GlobalIndustryTrendView />
        ) : (
          <>
        <section className="mb-5">
          <article data-guide="peer-overview" className="axis-panel-flat p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="axis-kicker">Overview</p>
                <h2 className="axis-section-heading mt-1">Peer 한눈 비교</h2>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)]">
              <div className="grid grid-cols-[1.08fr_0.98fr_0.98fr_0.88fr_0.82fr_0.88fr_1fr] gap-px bg-[var(--axis-hairline)] text-xs font-semibold text-[var(--axis-muted)]">
                {['기업', '매출', '영업이익', '영업이익률', '순이익', '수주 수', '핵심 키워드'].map((label) => (
                  <div key={label} className="bg-[var(--axis-surface-soft)] px-3 py-3">{label}</div>
                ))}
                {peerOverviewVisibleRows.map((row) => (
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
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{formatKrwBn(row.netIncomeKrwBn)}</div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{formatCount(row.contractCount)}</div>
                      <div className="bg-[var(--axis-canvas)] px-3 py-3 text-sm text-[var(--axis-body)]">{row.topKeyword?.trim() ? row.topKeyword : '-'}</div>
                    </div>
                  ))}
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
                  경쟁 메시지 차이와 SK AX 대응 포인트
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
                  {peerInsightItems.filter((item) => item.label !== '포지셔닝').map((item, index) => (
                    <article
                      key={`${item.label}-${item.body}`}
                      className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4"
                    >
                      <div className="mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">{item.label}</span>
                        <p className={`${index === 0 ? 'mt-2 text-base leading-7' : 'mt-2 text-sm leading-6'} font-semibold text-[var(--axis-ink)]`}>{item.body}</p>
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
          </>
        )}
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
