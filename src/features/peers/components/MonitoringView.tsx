import { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, LineChart as LineChartIcon, Target } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCardNews } from '../../card-news/hooks/useCardNews';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import type { CardNewsItem, PeerId } from '../../card-news/model/cardNews';
import {
  getExecutiveRank,
  getExposureScore,
  getPeerLabel,
  getSuggestedActions,
  getTrustScore,
} from '../../card-news/mappers/cardNewsExecutive';
import {
  ExecutiveBadge,
  ExecutiveCard,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
  TrustSeal,
} from '../../../shared/ui/ExecutiveSystem';
import { FloatingAiChat } from '../../../app/shell/FloatingAiChat';

type PeerFilter = 'all' | PeerId;

const peerFilters: PeerFilter[] = ['all', 'samsung_sds', 'lg_cns', 'hyundai_autoever', 'posco_dx'];

const peerLabels: Record<PeerFilter, string> = {
  all: '전체 Peer',
  samsung_sds: '삼성SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대오토에버',
  posco_dx: '포스코DX',
};

const positioningData = [
  { name: 'SK AX', rd: 12, margin: 8, exposure: 80, color: '#DC5A24' },
  { name: '삼성SDS', rd: 20, margin: 25, exposure: 87, color: '#E0822F' },
  { name: 'LG CNS', rd: 18, margin: 14, exposure: 82, color: '#A85F00' },
  { name: '현대오토에버', rd: 10, margin: 10, exposure: 76, color: '#5A6B57' },
  { name: '포스코DX', rd: 19, margin: -4, exposure: 72, color: '#6B6B73' },
];

const strategyNotes: Record<Exclude<PeerFilter, 'all'>, string[]> = {
  samsung_sds: [
    'AI 운영 플랫폼과 클라우드 번들 제안을 강화하는 흐름입니다.',
    '공공·금융권 레퍼런스 확보 여부를 우선 관찰해야 합니다.',
    'SK AX는 운영 KPI와 보안 거버넌스의 정량 자료를 전면화해야 합니다.',
  ],
  lg_cns: [
    '금융·제조 고객군에서 AX 전환 패키지 상품화가 빠릅니다.',
    '수주 모멘텀과 실적 연결 메시지가 가장 선명합니다.',
    'SK AX는 그룹 시너지보다 산업별 외부 고객 확장성을 더 보여줘야 합니다.',
  ],
  hyundai_autoever: [
    'SDV, 제조 데이터, 스마트팩토리 실행 포지션이 강합니다.',
    '자동차 도메인 레퍼런스를 외부 산업으로 확장하는지 확인해야 합니다.',
    'SK AX는 멀티 산업 운영 경험과 데이터 거버넌스를 결합해야 합니다.',
  ],
  posco_dx: [
    '산업 현장의 OT/IT 통합과 자동화 메시지가 선명합니다.',
    '제조 특화 경험을 기반으로 현장 적용 신뢰도를 확보하고 있습니다.',
    'SK AX는 범산업 운영 자동화와 산업 AI의 범용성을 강조해야 합니다.',
  ],
};

export function MonitoringView() {
  const { dashboard } = useDashboard();
  const { cards } = useCardNews();
  const [selectedPeer, setSelectedPeer] = useState<PeerFilter>('all');
  const [metric, setMetric] = useState<'stock' | 'exposure'>('exposure');

  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const visibleCards = rankedCards.filter((card) => selectedPeer === 'all' || card.peer_id === selectedPeer).slice(0, 6);

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-12">
        <ExecutiveHeader
          eyebrow="Monitoring command center"
          title="모니터링"
          subtitle="Peer별 변화 신호와 재무 흐름을 빠르게 점검합니다."
          actions={<TrustSeal />}
        />

        <section className="axis-panel-flat p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {peerFilters.map((peer) => (
                <button
                  key={peer}
                  type="button"
                  onClick={() => setSelectedPeer(peer)}
                  className={`rounded-[var(--axis-radius-md)] px-3 py-2 text-sm font-semibold transition ${
                    selectedPeer === peer
                      ? 'bg-[var(--axis-navy)] text-white'
                      : 'border border-[var(--axis-hairline)] bg-white text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
                  }`}
                >
                  {peerLabels[peer]}
                </button>
              ))}
            </div>
            <label className="flex h-10 items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white px-3">
              <LineChartIcon size={15} className="text-[var(--axis-muted)]" />
              <select
                value={metric}
                onChange={(event) => setMetric(event.target.value as typeof metric)}
                className="bg-transparent text-sm font-semibold text-[var(--axis-ink)] outline-none"
              >
                <option value="exposure">노출 점수</option>
                <option value="stock">주가 흐름</option>
              </select>
              <ChevronDown size={14} className="text-[var(--axis-muted)]" />
            </label>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <PositioningPanel />
          <TrendPanel metric={metric} stockPoints={dashboard?.stockPoints ?? []} cards={visibleCards} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[26rem_minmax(0,1fr)]">
          <StrategyPanel selectedPeer={selectedPeer} />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="axis-kicker">Related cards</p>
                <h2 className="axis-section-heading mt-1">관찰 카드</h2>
              </div>
              <ExecutiveBadge tone="accent">{visibleCards.length} items</ExecutiveBadge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleCards.map((card) => (
                <ExecutiveCard key={card.id} card={card} compact bookmarked={Boolean(card.is_bookmarked)} />
              ))}
            </div>
          </div>
        </section>
      </ExecutiveContainer>

      <FloatingAiChat />
    </ExecutivePage>
  );
}

function PositioningPanel() {
  return (
    <section className="axis-panel-flat p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Comparison</p>
          <h2 className="axis-section-heading mt-1">R&D 투자 대비 수익성 포지션</h2>
        </div>
        <ExecutiveBadge>FR-032</ExecutiveBadge>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 16, right: 20, bottom: 16, left: 8 }}>
          <CartesianGrid stroke="rgba(16,24,32,0.08)" />
          <XAxis
            type="number"
            dataKey="rd"
            name="R&D"
            unit="%"
            domain={[0, 25]}
            tick={{ fontSize: 12, fill: '#6B6B73' }}
            label={{ value: 'R&D 투자 비중', position: 'insideBottom', offset: -8, fontSize: 12, fill: '#6B6B73' }}
          />
          <YAxis
            type="number"
            dataKey="margin"
            name="영업이익률"
            unit="%"
            domain={[-10, 30]}
            tick={{ fontSize: 12, fill: '#6B6B73' }}
            label={{ value: '영업이익률', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6B6B73' }}
          />
          <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
          {positioningData.map((item) => (
            <Scatter
              key={item.name}
              name={item.name}
              data={[item]}
              fill={item.color}
              shape={(props: { cx?: number; cy?: number }) => (
                <g>
                  <circle cx={props.cx} cy={props.cy} r={8 + item.exposure / 18} fill={item.color} fillOpacity={0.88} />
                  <text x={(props.cx ?? 0) + 12} y={(props.cy ?? 0) + 4} fontSize="12" fill="#1A1A1F">
                    {item.name}
                  </text>
                </g>
              )}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </section>
  );
}

function TrendPanel({
  metric,
  stockPoints,
  cards,
}: {
  metric: 'stock' | 'exposure';
  stockPoints: Array<{ date: string; samsungSds: number; lgCns: number; hyundaiAutoever: number; poscoDx: number }>;
  cards: CardNewsItem[];
}) {
  const exposureSeries = cards.map((card, index) => ({
    label: `${index + 1}`,
    exposure: getExposureScore(card),
    trust: getTrustScore(card),
  }));

  return (
    <section className="axis-panel-flat p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Trend</p>
          <h2 className="axis-section-heading mt-1">{metric === 'stock' ? 'Peer사 주가 흐름' : '카드 노출도와 신뢰도'}</h2>
        </div>
        <ExecutiveBadge tone="accent">{metric === 'stock' ? 'Financial' : 'CardNews'}</ExecutiveBadge>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {metric === 'stock' ? (
          <LineChart data={stockPoints} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(16,24,32,0.08)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B73' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B6B73' }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
            <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '종가']} />
            <Line type="monotone" dataKey="samsungSds" name="삼성SDS" stroke="#E0822F" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="lgCns" name="LG CNS" stroke="#A85F00" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="hyundaiAutoever" name="현대오토에버" stroke="#5A6B57" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="poscoDx" name="포스코DX" stroke="#6B6B73" strokeWidth={2.2} dot={false} />
          </LineChart>
        ) : (
          <LineChart data={exposureSeries} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(16,24,32,0.08)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B73' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B6B73' }} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="exposure" name="노출 점수" stroke="#DC5A24" strokeWidth={2.4} />
            <Line type="monotone" dataKey="trust" name="신뢰도" stroke="#E0822F" strokeWidth={2.2} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </section>
  );
}

function StrategyPanel({ selectedPeer }: { selectedPeer: PeerFilter }) {
  const notes =
    selectedPeer === 'all'
      ? [
          '고노출 카드를 먼저 검토하고, 근거가 부족한 카드는 human review로 분리합니다.',
          'Peer별 카드 수보다 노출도와 재무 연결 여부를 우선 판단합니다.',
          '브리핑과 믹서기로 이어질 후보 카드를 북마크해 보고 흐름을 만듭니다.',
        ]
      : strategyNotes[selectedPeer];

  return (
    <section className="axis-panel-flat p-4">
      <div className="flex items-center gap-2">
        <Target size={17} className="text-[var(--axis-accent)]" />
        <h3 className="axis-section-heading">전략 방향성</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">
        {selectedPeer === 'all' ? '전체 Peer 관점에서 오늘 검토해야 할 판단 기준입니다.' : `${peerLabels[selectedPeer]} 기준 후속 관찰 포인트입니다.`}
      </p>
      <div className="mt-4 space-y-3">
        {notes.map((note, index) => (
          <div key={note} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-white p-3">
            <span className="text-[11px] font-semibold text-[var(--axis-accent-strong)]">{String(index + 1).padStart(2, '0')}</span>
            <p className="mt-1 text-sm font-medium leading-6 text-[var(--axis-ink)]">{note}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] p-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-[var(--axis-accent)]" />
          <span className="text-xs font-semibold text-[var(--axis-ink)]">연동 API</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">
          `/api/monitoring/overview`, `/comparison`, `/{'{peerId}'}/financials`, `/{'{peerId}'}/strategy`
        </p>
      </div>
    </section>
  );
}
