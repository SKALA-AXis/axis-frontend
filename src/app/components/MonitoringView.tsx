import { useState } from 'react';
import { ChevronLeft, ChevronRight, Dot, Info } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import { FloatingAiChat } from './FloatingAiChat';

const peerFilters = ['전체', '삼성SDS', 'LG CNS', '현대 오토에버', '포스코 DX'] as const;
type PeerFilter = (typeof peerFilters)[number];

const highlightNews = [
  {
    id: 'n1',
    title: '실적 엇갈린 삼성SDS·LG CNS...AI 2라운드 돌입',
    date: '2026.05.03',
    image:
      'linear-gradient(135deg, rgba(28,19,85,1) 0%, rgba(112,57,255,1) 45%, rgba(17,17,17,0.9) 100%)',
    tag: 'AI',
  },
  {
    id: 'n2',
    title: '현대오토에버, 1분기 매출 9357억...전년비 12.3% 증가',
    date: '2026.04.30',
    image:
      'linear-gradient(135deg, rgba(214,218,227,1) 0%, rgba(176,184,199,1) 45%, rgba(242,244,247,1) 100%)',
    tag: 'IR',
  },
  {
    id: 'n3',
    title: "SK AX, 디지털트윈도 '에이전트AI' 브랜드로 통합",
    date: '2026.04.29',
    image:
      'linear-gradient(135deg, rgba(188,208,220,1) 0%, rgba(233,241,246,1) 52%, rgba(110,127,143,1) 100%)',
    tag: 'Brand',
  },
  {
    id: 'n4',
    title: 'SK AX, 사람 대신 여러 AI 에이전트가 인프라 운영하는 서비스 내놔',
    date: '2026.04.02',
    image:
      'linear-gradient(135deg, rgba(11,40,82,1) 0%, rgba(28,100,180,1) 45%, rgba(6,10,20,1) 100%)',
    tag: 'Infra',
  },
];

const positioningData = [
  { name: 'SK C&C', rd: 3, profit: -4, size: 90, color: '#ef4444', trail: [[4, -3], [5, -2], [6, -2], [7, -1]] },
  { name: '현대오토에버', rd: 10, profit: 10, size: 96, color: '#2dd4bf', trail: [[6, 5], [8, 7], [9, 8], [11, 12]] },
  { name: '네이버클라우드', rd: 14, profit: 4, size: 92, color: '#65c466', trail: [[13, 2], [15, 4], [16, 5], [17, 6]] },
  { name: '삼성SDS', rd: 20, profit: 25, size: 108, color: '#8b5cf6', trail: [[17, 21], [18, 23], [19, 24], [21, 26], [22, 25]] },
  { name: 'LG CNS', rd: 20, profit: 14, size: 102, color: '#fb923c', trail: [[16, 8], [17, 10], [18, 11], [19, 13], [21, 15]] },
  { name: '포스코DX', rd: 19, profit: -4, size: 90, color: '#3b82f6', trail: [[20, -3], [21, -2], [22, -2], [23, -3]] },
];

const keywordTrend = [
  { time: '09:00', agentic: 110, sovereign: 78, digital: 70, aiOps: 55 },
  { time: '10:00', agentic: 150, sovereign: 90, digital: 78, aiOps: 64 },
  { time: '11:00', agentic: 205, sovereign: 116, digital: 88, aiOps: 82 },
  { time: '12:00', agentic: 184, sovereign: 130, digital: 93, aiOps: 88 },
  { time: '13:00', agentic: 226, sovereign: 142, digital: 108, aiOps: 99 },
  { time: '14:00', agentic: 246, sovereign: 149, digital: 121, aiOps: 113 },
  { time: '15:00', agentic: 238, sovereign: 146, digital: 117, aiOps: 109 },
];

const peerInsights: Record<
  Exclude<PeerFilter, '전체'>,
  {
    summaryTitle: string;
    bullets: string[];
    detailBullets: string[];
    stockLabel: string;
    stockData: Array<{ date: string; price: number; ma5: number; ma20: number; ma60: number }>;
  }
> = {
  삼성SDS: {
    summaryTitle: 'SK AX 관점에서의 Peer사 분석',
    bullets: [
      '삼성SDS는 AI 에이전트 플랫폼, 공공·글로벌 확장, M&A 등 스케일 전략을 병행 중입니다.',
      'SK AX는 산업별 AX 프로젝트, 운영 자동화, 수익성 개선 실행력을 더 선명하게 보여줄 필요가 있습니다.',
      '결론적으로 "플랫폼 확장"과 "현장 실행"의 경쟁 구도가 더 뚜렷해지고 있습니다.',
    ],
    detailBullets: [
      '삼성SDS는 최근 뉴스와 IR에서 AI 에이전트, 클라우드, 글로벌 사업 확장을 핵심 성장축으로 제시했습니다.',
      '생성형 AI 사업을 단일 솔루션보다 플랫폼 번들로 묶어 고객 락인을 강화하려는 흐름이 뚜렷합니다.',
      'SK AX는 산업 현장 레퍼런스와 ROI 중심 내러티브를 강화하면 차별화가 더 쉬워집니다.',
    ],
    stockLabel: 'SamsungSDS',
    stockData: [
      { date: '4.25', price: 76800, ma5: 77000, ma20: 76200, ma60: 75800 },
      { date: '5.2', price: 80500, ma5: 78200, ma20: 77100, ma60: 76000 },
      { date: '5.9', price: 77600, ma5: 78500, ma20: 77600, ma60: 76400 },
      { date: '5.16', price: 81200, ma5: 79800, ma20: 78300, ma60: 76900 },
      { date: '5.23', price: 88400, ma5: 83200, ma20: 79900, ma60: 77800 },
      { date: '5.30', price: 86400, ma5: 84800, ma20: 80800, ma60: 78600 },
      { date: '6.13', price: 72600, ma5: 80100, ma20: 81400, ma60: 79400 },
      { date: '6.27', price: 78500, ma5: 79200, ma20: 82000, ma60: 79900 },
      { date: '7.11', price: 73400, ma5: 76000, ma20: 80800, ma60: 80200 },
      { date: '7.25', price: 70300, ma5: 73300, ma20: 79400, ma60: 80100 },
      { date: '8.8', price: 64600, ma5: 69400, ma20: 77600, ma60: 79600 },
      { date: '8.22', price: 62200, ma5: 65400, ma20: 75400, ma60: 78600 },
      { date: '9.5', price: 61800, ma5: 63200, ma20: 73100, ma60: 77100 },
      { date: '9.19', price: 59200, ma5: 61100, ma20: 70200, ma60: 75400 },
      { date: '10.3', price: 57800, ma5: 59400, ma20: 67400, ma60: 73600 },
      { date: '10.17', price: 56400, ma5: 57900, ma20: 64800, ma60: 71400 },
    ],
  },
  'LG CNS': {
    summaryTitle: 'SK AX 관점에서의 Peer사 분석',
    bullets: [
      'LG CNS는 제조·금융 고객군에서 AI 전환 패키지를 빠르게 상품화하고 있습니다.',
      '데이터센터, 클라우드 MSP, 생성형 AI 프로젝트를 묶는 식의 제안력이 강화되고 있습니다.',
      'SK AX는 그룹 시너지와 운영 자동화 성과를 보다 정량적으로 보여주는 전략이 유효합니다.',
    ],
    detailBullets: [
      'LG CNS의 최근 메시지는 "대형 고객 전환 프로젝트의 안정적 수행"에 가깝습니다.',
      '고객 사례 중심 확산 속도가 빨라, 수주 모멘텀을 보여주는 커뮤니케이션이 강점입니다.',
      'SK AX는 AI 에이전트 운영 모델과 산업별 ROI를 묶어 경쟁 프레임을 바꾸는 것이 중요합니다.',
    ],
    stockLabel: 'LGCNS',
    stockData: [
      { date: '4.25', price: 62200, ma5: 62000, ma20: 61000, ma60: 59800 },
      { date: '5.2', price: 64500, ma5: 63100, ma20: 61800, ma60: 60200 },
      { date: '5.9', price: 63900, ma5: 63600, ma20: 62400, ma60: 60600 },
      { date: '5.16', price: 66100, ma5: 64400, ma20: 63100, ma60: 61100 },
      { date: '5.23', price: 68800, ma5: 66400, ma20: 64200, ma60: 61800 },
      { date: '5.30', price: 67500, ma5: 67100, ma20: 64900, ma60: 62300 },
      { date: '6.13', price: 65100, ma5: 66800, ma20: 65400, ma60: 62700 },
      { date: '6.27', price: 66200, ma5: 66000, ma20: 65700, ma60: 63100 },
      { date: '7.11', price: 63500, ma5: 64900, ma20: 65500, ma60: 63400 },
      { date: '7.25', price: 62800, ma5: 63600, ma20: 65100, ma60: 63600 },
      { date: '8.8', price: 61100, ma5: 62100, ma20: 64500, ma60: 63700 },
      { date: '8.22', price: 60200, ma5: 61000, ma20: 63700, ma60: 63600 },
      { date: '9.5', price: 59600, ma5: 60100, ma20: 62900, ma60: 63400 },
      { date: '9.19', price: 58700, ma5: 59300, ma20: 61800, ma60: 63000 },
      { date: '10.3', price: 57500, ma5: 58400, ma20: 60600, ma60: 62400 },
      { date: '10.17', price: 56800, ma5: 57600, ma20: 59500, ma60: 61800 },
    ],
  },
  '현대 오토에버': {
    summaryTitle: 'SK AX 관점에서의 Peer사 분석',
    bullets: [
      '현대 오토에버는 SDV, 스마트팩토리, 엔터프라이즈 IT를 연결하는 실행 포지션이 강합니다.',
      '그룹 내부 대형 레퍼런스를 바탕으로 솔루션 신뢰도를 높이고 있습니다.',
      'SK AX는 범산업 확장성과 AI 운영 고도화를 동시에 부각하는 대응이 필요합니다.',
    ],
    detailBullets: [
      '오토에버는 자동차 도메인 이해도와 시스템 통합 경험을 결합해 방어력이 높습니다.',
      '최근 성과 메시지는 "성장률과 대형 프로젝트 수행 안정성"에 집중돼 있습니다.',
      'SK AX는 제조 외 산업의 복수 사례를 묶어 확장성을 더 설득력 있게 제시할 수 있습니다.',
    ],
    stockLabel: 'HyundaiAutoEver',
    stockData: [
      { date: '4.25', price: 132000, ma5: 131000, ma20: 128000, ma60: 121000 },
      { date: '5.2', price: 136000, ma5: 133000, ma20: 129000, ma60: 122000 },
      { date: '5.9', price: 141000, ma5: 137000, ma20: 131000, ma60: 124000 },
      { date: '5.16', price: 145000, ma5: 140000, ma20: 133000, ma60: 126000 },
      { date: '5.23', price: 149000, ma5: 144000, ma20: 136000, ma60: 128000 },
      { date: '5.30', price: 147000, ma5: 146000, ma20: 138000, ma60: 130000 },
      { date: '6.13', price: 143000, ma5: 145000, ma20: 139000, ma60: 132000 },
      { date: '6.27', price: 138000, ma5: 141000, ma20: 140000, ma60: 133000 },
      { date: '7.11', price: 134000, ma5: 137000, ma20: 139000, ma60: 134000 },
      { date: '7.25', price: 131000, ma5: 133000, ma20: 138000, ma60: 135000 },
      { date: '8.8', price: 128000, ma5: 130000, ma20: 136000, ma60: 135500 },
      { date: '8.22', price: 126000, ma5: 127000, ma20: 134000, ma60: 135000 },
      { date: '9.5', price: 124000, ma5: 125000, ma20: 132000, ma60: 134000 },
      { date: '9.19', price: 121000, ma5: 123000, ma20: 129000, ma60: 133000 },
      { date: '10.3', price: 119000, ma5: 121000, ma20: 126000, ma60: 131000 },
      { date: '10.17', price: 117000, ma5: 118000, ma20: 123000, ma60: 129000 },
    ],
  },
  '포스코 DX': {
    summaryTitle: 'SK AX 관점에서의 Peer사 분석',
    bullets: [
      '포스코 DX는 산업 AI, 스마트팩토리, 자동화 설비 운영 영역에서 강한 현장 밀착형 포지션을 유지합니다.',
      '캡티브 수요와 제조 특화 경험 덕분에 실행 사례 축적 속도가 빠릅니다.',
      'SK AX는 멀티 산업 운영 경험과 AI 에이전트 기반 효율화 지표를 더 적극적으로 전면 배치할 필요가 있습니다.',
    ],
    detailBullets: [
      '포스코 DX는 제조 현장의 OT/IT 통합에 강점이 있어 실행 신뢰도가 높게 인식됩니다.',
      '시장 메시지는 혁신 기술보다 "실제 현장 적용"과 "공장 단위 확산"에 가깝습니다.',
      'SK AX는 산업 AI의 범용성과 운영 자동화 수준을 함께 보여줄 때 차별화가 커집니다.',
    ],
    stockLabel: 'PoscoDX',
    stockData: [
      { date: '4.25', price: 48200, ma5: 48100, ma20: 47200, ma60: 45800 },
      { date: '5.2', price: 49400, ma5: 48700, ma20: 47600, ma60: 46100 },
      { date: '5.9', price: 50700, ma5: 49600, ma20: 48100, ma60: 46500 },
      { date: '5.16', price: 51900, ma5: 50500, ma20: 48700, ma60: 47000 },
      { date: '5.23', price: 53300, ma5: 51900, ma20: 49400, ma60: 47600 },
      { date: '5.30', price: 52600, ma5: 52400, ma20: 49900, ma60: 48000 },
      { date: '6.13', price: 51200, ma5: 52100, ma20: 50300, ma60: 48400 },
      { date: '6.27', price: 49800, ma5: 50900, ma20: 50500, ma60: 48800 },
      { date: '7.11', price: 48700, ma5: 49500, ma20: 50300, ma60: 49000 },
      { date: '7.25', price: 47200, ma5: 48200, ma20: 49900, ma60: 49100 },
      { date: '8.8', price: 46300, ma5: 47000, ma20: 49200, ma60: 49000 },
      { date: '8.22', price: 45400, ma5: 46100, ma20: 48300, ma60: 48800 },
      { date: '9.5', price: 44800, ma5: 45200, ma20: 47400, ma60: 48500 },
      { date: '9.19', price: 43900, ma5: 44400, ma20: 46500, ma60: 48100 },
      { date: '10.3', price: 43100, ma5: 43600, ma20: 45600, ma60: 47700 },
      { date: '10.17', price: 42500, ma5: 42800, ma20: 44700, ma60: 47200 },
    ],
  },
};

const newsPagination = [1, 2, 3, 4, 5, 6];

export function MonitoringView() {
  const { dashboard } = useDashboard();
  const [selectedFilter, setSelectedFilter] = useState<PeerFilter>('전체');
  const peerInsight = selectedFilter === '전체' ? null : peerInsights[selectedFilter];

  return (
    <div className="axis-page relative flex-1 overflow-auto bg-[#fbfbfc] xl:overflow-hidden">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8 xl:h-full xl:justify-start">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
            <h1 className="text-[1.65rem] font-black tracking-[-0.05em] text-[#171717]">모니터링</h1>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-[1rem] border border-black/6 bg-[linear-gradient(180deg,#f4f5f7,#eceef2)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              {peerFilters.map((filter) => {
                const active = selectedFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-[0.8rem] px-3.5 py-2 text-[0.74rem] font-bold transition ${
                      active
                        ? 'bg-white text-[#d96200] shadow-[0_8px_18px_rgba(17,17,17,0.08)]'
                        : 'text-black/48 hover:bg-white/72 hover:text-black/68'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {selectedFilter === '전체' ? <OverviewSection stockPoints={dashboard?.stockPoints ?? []} /> : peerInsight ? <PeerSection insight={peerInsight} /> : null}
      </div>

      <FloatingAiChat />
    </div>
  );
}

function OverviewSection({
  stockPoints,
}: {
  stockPoints: Array<{ date: string; samsungSds: number; lgCns: number; hyundaiAutoever: number; poscoDx: number }>;
}) {
  const [activeChart, setActiveChart] = useState<'keyword' | 'stock'>('keyword');

  return (
    <section className="space-y-5">
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-[1.2rem] font-black tracking-[-0.04em] text-[#1b1b1b]">주요 핵심 뉴스</h2>
          <div className="flex items-center gap-2 text-[0.82rem] text-black/56">
            <ChevronLeft size={15} />
            {newsPagination.map((page) => (
              <button
                key={page}
                type="button"
                className={`font-semibold ${page === 2 ? 'text-[#d91f1f]' : 'text-black/72'}`}
              >
                {page}
              </button>
            ))}
            <ChevronRight size={15} />
          </div>
        </div>

        <div className="overflow-hidden rounded-[1rem] border border-black/6 bg-white shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
          {highlightNews.map((item, index) => (
            <article
              key={item.id}
              className={`flex items-center gap-3 px-4 py-2.5 sm:px-5 ${index !== highlightNews.length - 1 ? 'border-b border-black/8' : ''}`}
            >
              <div
                className="flex h-[42px] w-[52px] shrink-0 items-center justify-center rounded-md text-[0.7rem] font-black text-white"
                style={{ background: item.image }}
              >
                {item.tag}
              </div>
              <h3 className="min-w-0 flex-1 text-[0.9rem] font-semibold tracking-[-0.03em] text-[#212121]">
                {item.title}
              </h3>
              <span className="shrink-0 text-[0.84rem] text-black/46">{item.date}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PositioningChartCard />
        <OverviewSwitcherCard
          activeChart={activeChart}
          stockPoints={stockPoints}
          onPrevious={() => setActiveChart('keyword')}
          onNext={() => setActiveChart('stock')}
        />
      </div>
    </section>
  );
}

function PeerSection({
  insight,
}: {
  insight: {
    summaryTitle: string;
    bullets: string[];
    detailBullets: string[];
    stockLabel: string;
    stockData: Array<{ date: string; price: number; ma5: number; ma20: number; ma60: number }>;
  };
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[1.45rem] font-black tracking-[-0.045em] text-[#1b1b1b]">{insight.summaryTitle}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {insight.bullets.map((item, index) => (
            <article
              key={item}
              className="rounded-[1rem] border border-[#f1d8c7] bg-[linear-gradient(180deg,#fffaf6,#fff4ec)] px-4 py-4 shadow-[0_8px_20px_rgba(17,17,17,0.04)]"
            >
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#111111] px-2 text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-3 text-[0.9rem] font-semibold leading-6 text-[#232323]">{item}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PositioningChartCard />
        <PeerStockCard label={insight.stockLabel} data={insight.stockData} />
      </div>

      <div>
        <h3 className="text-[1.35rem] font-black tracking-[-0.04em] text-[#1b1b1b]">상세 내용</h3>
        <div className="mt-3 rounded-[1.05rem] border border-black/6 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
          <div className="space-y-3">
            {insight.detailBullets.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-[0.95rem] bg-[#faf7f4] px-4 py-3">
                <span className="mt-0.5 text-[0.75rem] font-black text-[#d96200]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-[0.9rem] font-medium leading-6 text-[#2a2a2a]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PositioningChartCard() {
  return (
    <section className="rounded-[1.2rem] border border-black/6 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[1rem] font-black tracking-[-0.04em] text-[#222]">DART 기반 포지셔닝</h3>
        <Info size={15} className="text-black/30" />
      </div>

      <div className="mb-1 flex items-center justify-end gap-2 text-[11px] font-semibold text-[#7267d3]">
        <Dot size={20} className="-mx-1 text-[#7c5cff]" />
        DART 기준 (Q1 2026)
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,17,23,0.08)" />
          <XAxis
            type="number"
            dataKey="rd"
            name="R&D 투자 비중"
            unit="%"
            domain={[0, 25]}
            tick={{ fontSize: 12, fill: 'rgba(15,17,23,0.55)' }}
            label={{ value: 'R&D 투자 비중 (%)', position: 'insideBottom', offset: -4, fontSize: 12, fill: 'rgba(15,17,23,0.55)' }}
          />
          <YAxis
            type="number"
            dataKey="profit"
            name="영업이익률"
            unit="%"
            domain={[-10, 30]}
            tick={{ fontSize: 12, fill: 'rgba(15,17,23,0.55)' }}
            label={{ value: '영업이익률 (%)', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'rgba(15,17,23,0.55)' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) => [`${value}%`, name === 'profit' ? '영업이익률' : 'R&D 투자 비중']}
          />
          <ReferenceLine x={0} stroke="transparent" />
          {positioningData.map((company) => (
            <Scatter
              key={company.name}
              name={company.name}
              data={[company]}
              fill={company.color}
              line={{ stroke: company.color, strokeOpacity: 0.18, strokeWidth: 2 }}
              lineType="joint"
              shape={(props: { cx?: number; cy?: number }) => (
                <ScatterPoint {...props} label={company.name} color={company.color} />
              )}
            />
          ))}
          {positioningData.map((company) => (
            <Scatter
              key={`${company.name}-trail`}
              name={`${company.name} trail`}
              data={company.trail.map(([rd, profit]) => ({ rd, profit }))}
              fill={company.color}
              opacity={0.18}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </section>
  );
}

function KeywordTrendCard() {
  return (
    <section className="rounded-[1.2rem] border border-black/6 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[1rem] font-black tracking-[-0.04em] text-[#222]">키워드 검색량 추이</h3>
          <p className="mt-1 text-xs text-black/42">시간대별 내부 검색량 기준</p>
        </div>
        <span className="rounded-full bg-[#fff1e2] px-2 py-1 text-[11px] font-bold text-[#f5820d]">실시간</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={keywordTrend} margin={{ top: 8, right: 12, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,17,23,0.08)" />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'rgba(15,17,23,0.55)' }} />
          <YAxis tick={{ fontSize: 12, fill: 'rgba(15,17,23,0.55)' }} />
          <Tooltip formatter={(value: number) => [`${value}`, '검색량']} />
          <Line type="monotone" dataKey="agentic" name="Agentic AI" stroke="#f5820d" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="sovereign" name="Sovereign AI" stroke="#2f52c6" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="digital" name="디지털 트윈" stroke="#ff2850" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="aiOps" name="AI 거버넌스" stroke="#141414" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-black/68 sm:grid-cols-4">
        <LegendItem color="#f5820d" label="Agentic AI" value="현재 249" />
        <LegendItem color="#2f52c6" label="Sovereign AI" value="현재 168" />
        <LegendItem color="#ff2850" label="디지털 트윈" value="현재 127" />
        <LegendItem color="#141414" label="AI 거버넌스" value="현재 111" />
      </div>
    </section>
  );
}

function OverviewSwitcherCard({
  activeChart,
  stockPoints,
  onPrevious,
  onNext,
}: {
  activeChart: 'keyword' | 'stock';
  stockPoints: Array<{ date: string; samsungSds: number; lgCns: number; hyundaiAutoever: number; poscoDx: number }>;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const isKeyword = activeChart === 'keyword';

  return (
    <section className="rounded-[1.2rem] border border-black/6 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[1rem] font-black tracking-[-0.04em] text-[#222]">
            {isKeyword ? '키워드 검색량 추이' : 'Peer사 주가 추이'}
          </h3>
          <p className="mt-1 text-xs text-black/42">
            {isKeyword ? '시간대별 내부 검색량 기준' : '최근 거래일 기준 주요 Peer 종가 흐름'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isKeyword ? (
            <span className="rounded-full bg-[#fff1e2] px-2 py-1 text-[11px] font-bold text-[#f5820d]">실시간</span>
          ) : null}
          <button
            type="button"
            onClick={onPrevious}
            disabled={isKeyword}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 bg-white text-black/56 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:text-black/20"
            aria-label="이전 그래프 보기"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!isKeyword}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 bg-white text-black/56 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:text-black/20"
            aria-label="다음 그래프 보기"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isKeyword ? <KeywordTrendBody /> : <OverviewStockBody stockPoints={stockPoints} />}
    </section>
  );
}

function KeywordTrendBody() {
  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={keywordTrend} margin={{ top: 8, right: 12, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,17,23,0.08)" />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: 'rgba(15,17,23,0.55)' }} />
          <YAxis tick={{ fontSize: 12, fill: 'rgba(15,17,23,0.55)' }} />
          <Tooltip formatter={(value: number) => [`${value}`, '검색량']} />
          <Line type="monotone" dataKey="agentic" name="Agentic AI" stroke="#f5820d" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="sovereign" name="Sovereign AI" stroke="#2f52c6" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="digital" name="디지털 트윈" stroke="#ff2850" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="aiOps" name="AI 거버넌스" stroke="#141414" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-black/68 sm:grid-cols-4">
        <LegendItem color="#f5820d" label="Agentic AI" value="현재 249" />
        <LegendItem color="#2f52c6" label="Sovereign AI" value="현재 168" />
        <LegendItem color="#ff2850" label="디지털 트윈" value="현재 127" />
        <LegendItem color="#141414" label="AI 거버넌스" value="현재 111" />
      </div>
    </>
  );
}

function OverviewStockBody({
  stockPoints,
}: {
  stockPoints: Array<{ date: string; samsungSds: number; lgCns: number; hyundaiAutoever: number; poscoDx: number }>;
}) {
  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={stockPoints} margin={{ top: 8, right: 10, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,17,23,0.08)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(15,17,23,0.55)' }} />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgba(15,17,23,0.55)' }}
            tickFormatter={(value: number) => `${Math.round(Number(value) / 1000)}k`}
            width={44}
          />
          <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '종가']} />
          <Line type="monotone" dataKey="samsungSds" name="삼성 SDS" stroke="#EE7501" strokeWidth={2.1} dot={false} />
          <Line type="monotone" dataKey="lgCns" name="LG CNS" stroke="#111111" strokeWidth={2.1} dot={false} />
          <Line type="monotone" dataKey="hyundaiAutoever" name="현대 오토에버" stroke="#E1002A" strokeWidth={2.1} dot={false} />
          <Line type="monotone" dataKey="poscoDx" name="포스코 DX" stroke="#1A3A91" strokeWidth={2.1} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-black/68">
        <LegendItem color="#EE7501" label="삼성 SDS" />
        <LegendItem color="#111111" label="LG CNS" />
        <LegendItem color="#E1002A" label="현대 오토에버" />
        <LegendItem color="#1A3A91" label="포스코 DX" />
      </div>
    </>
  );
}

function PeerStockCard({
  label,
  data,
}: {
  label: string;
  data: Array<{ date: string; price: number; ma5: number; ma20: number; ma60: number }>;
}) {
  return (
    <section className="rounded-[1.2rem] border border-black/6 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
      <div className="mb-3">
        <h3 className="text-[1rem] font-black tracking-[-0.04em] text-[#222]">{label}</h3>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,17,23,0.08)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(15,17,23,0.55)' }} />
          <YAxis
            tick={{ fontSize: 11, fill: 'rgba(15,17,23,0.55)' }}
            tickFormatter={(value: number) => value.toLocaleString()}
            width={62}
          />
          <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '가격']} />
          <Line type="monotone" dataKey="price" name="주가" stroke="#4a88e5" strokeWidth={2.4} dot={false} />
          <Line type="monotone" dataKey="ma5" name="5일이동평균" stroke="#ef6b3b" strokeWidth={1.9} dot={false} />
          <Line type="monotone" dataKey="ma20" name="20일이동평균" stroke="#d7b12f" strokeWidth={1.9} dot={false} />
          <Line type="monotone" dataKey="ma60" name="60일이동평균" stroke="#53a064" strokeWidth={1.9} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-black/68">
        <LegendItem color="#4a88e5" label="주가" />
        <LegendItem color="#ef6b3b" label="5일이동평균" />
        <LegendItem color="#d7b12f" label="20일이동평균" />
        <LegendItem color="#53a064" label="60일이동평균" />
      </div>
    </section>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
      {value ? <span className="text-black/42">{value}</span> : null}
    </div>
  );
}

function ScatterPoint(props: {
  cx?: number;
  cy?: number;
  payload?: { name: string };
  color: string;
  label: string;
}) {
  const { cx = 0, cy = 0, color, label } = props;

  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.96} />
      <circle cx={cx} cy={cy} r={14} fill={color} fillOpacity={0.14} />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>
        {label}
      </text>
    </g>
  );
}
