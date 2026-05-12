export type PeerPlusPeerId = 'samsung_sds' | 'lg_cns' | 'hyundai_autoever' | 'posco_dx';

export type PeerPlusIrProfile = {
  revenue: string;
  operatingProfit: string;
  axRatio: string;
  orderBacklog: string;
  margin: string;
  capex: string;
  deltas: {
    revenue: number;
    operatingProfit: number;
    axRatio: number;
    orderBacklog: number;
    margin: number;
    capex: number;
  };
  quarterly: Array<{ quarter: string; revenue: number; profit: number; ax: number }>;
  summary: string[];
};

export type PeerPlusKeyword = {
  label: string;
  weight: number;
  tone: 'accent' | 'success' | 'neutral';
};

export const peerPlusSelectionStorageKey = 'axis:peerPlus:selectedPeer';

export const mockPeerPlusOptions = [
  { id: 'samsung_sds', label: '삼성SDS' },
  { id: 'lg_cns', label: 'LG CNS' },
  { id: 'hyundai_autoever', label: '현대 오토에버' },
  { id: 'posco_dx', label: '포스코DX' },
] as const satisfies ReadonlyArray<{ id: PeerPlusPeerId; label: string }>;

export const mockPeerPlusIrProfiles: Record<PeerPlusPeerId, PeerPlusIrProfile> = {
  samsung_sds: {
    revenue: '3.42조',
    operatingProfit: '2,430억',
    axRatio: '31%',
    orderBacklog: '1.8조',
    margin: '7.1%',
    capex: '4,800억',
    deltas: { revenue: 0.42, operatingProfit: 1.8, axRatio: 2.4, orderBacklog: 3.1, margin: -0.2, capex: 4.6 },
    quarterly: [
      { quarter: 'Q1', revenue: 82, profit: 66, ax: 54 },
      { quarter: 'Q2', revenue: 86, profit: 69, ax: 61 },
      { quarter: 'Q3', revenue: 91, profit: 72, ax: 68 },
      { quarter: 'Q4', revenue: 96, profit: 78, ax: 74 },
    ],
    summary: ['클라우드와 AI 플랫폼 매출 비중이 점진적으로 확대됩니다.', 'ERP/SCM AI agent 패키지와 보안 운영이 함께 언급됩니다.'],
  },
  lg_cns: {
    revenue: '1.58조',
    operatingProfit: '1,120억',
    axRatio: '37%',
    orderBacklog: '2.1조',
    margin: '7.8%',
    capex: '3,200억',
    deltas: { revenue: 0.68, operatingProfit: 2.1, axRatio: 3.6, orderBacklog: 4.2, margin: 0.3, capex: -1.4 },
    quarterly: [
      { quarter: 'Q1', revenue: 74, profit: 60, ax: 58 },
      { quarter: 'Q2', revenue: 80, profit: 65, ax: 66 },
      { quarter: 'Q3', revenue: 88, profit: 72, ax: 73 },
      { quarter: 'Q4', revenue: 93, profit: 76, ax: 81 },
    ],
    summary: ['금융/공공 AX 패키지의 상품화 속도가 빠릅니다.', '수주 신호와 생성형 AI 운영 메시지가 카드뉴스에 자주 연결됩니다.'],
  },
  hyundai_autoever: {
    revenue: '9,820억',
    operatingProfit: '760억',
    axRatio: '24%',
    orderBacklog: '1.1조',
    margin: '7.7%',
    capex: '2,450억',
    deltas: { revenue: -0.24, operatingProfit: 0.9, axRatio: 1.7, orderBacklog: 2.2, margin: -0.1, capex: 2.8 },
    quarterly: [
      { quarter: 'Q1', revenue: 69, profit: 58, ax: 42 },
      { quarter: 'Q2', revenue: 73, profit: 62, ax: 48 },
      { quarter: 'Q3', revenue: 79, profit: 67, ax: 56 },
      { quarter: 'Q4', revenue: 85, profit: 70, ax: 63 },
    ],
    summary: ['스마트팩토리와 차량 데이터 플랫폼이 핵심 축입니다.', '제조 데이터와 디지털 트윈 키워드가 근접하게 나타납니다.'],
  },
  posco_dx: {
    revenue: '1.05조',
    operatingProfit: '690억',
    axRatio: '28%',
    orderBacklog: '1.4조',
    margin: '6.6%',
    capex: '2,900억',
    deltas: { revenue: 0.31, operatingProfit: -0.6, axRatio: 2.1, orderBacklog: 5.3, margin: -0.4, capex: 3.2 },
    quarterly: [
      { quarter: 'Q1', revenue: 64, profit: 52, ax: 45 },
      { quarter: 'Q2', revenue: 72, profit: 58, ax: 54 },
      { quarter: 'Q3', revenue: 83, profit: 66, ax: 63 },
      { quarter: 'Q4', revenue: 91, profit: 71, ax: 70 },
    ],
    summary: ['공공 메가딜과 산업 자동화 노출이 강합니다.', 'OT/IT 통합, 데이터센터, AI 인프라 문맥이 연결됩니다.'],
  },
};

export const mockPeerPlusKeywordCloud: Record<PeerPlusPeerId, PeerPlusKeyword[]> = {
  samsung_sds: [
    { label: 'ERP AI agent', weight: 3, tone: 'accent' },
    { label: 'SCM 자동화', weight: 2, tone: 'neutral' },
    { label: '보안형 GenAI', weight: 2, tone: 'success' },
    { label: '클라우드 MSP', weight: 1, tone: 'neutral' },
    { label: '공공 AX', weight: 2, tone: 'accent' },
    { label: 'MOU 공동검증', weight: 1, tone: 'success' },
  ],
  lg_cns: [
    { label: '금융 AX 패키지', weight: 3, tone: 'accent' },
    { label: 'DAP GenAI', weight: 2, tone: 'success' },
    { label: '클라우드 보안', weight: 2, tone: 'neutral' },
    { label: '공공 AI', weight: 2, tone: 'accent' },
    { label: 'SaaS 전환', weight: 1, tone: 'neutral' },
    { label: '전략 제휴', weight: 1, tone: 'success' },
  ],
  hyundai_autoever: [
    { label: 'GPU 클러스터', weight: 3, tone: 'accent' },
    { label: '차량 데이터', weight: 2, tone: 'success' },
    { label: '스마트팩토리', weight: 2, tone: 'neutral' },
    { label: '디지털 트윈', weight: 2, tone: 'accent' },
    { label: 'Kubernetes', weight: 1, tone: 'neutral' },
    { label: '제조 MOU', weight: 1, tone: 'success' },
  ],
  posco_dx: [
    { label: '산업 AI 자동화', weight: 3, tone: 'accent' },
    { label: '공공 메가딜', weight: 2, tone: 'success' },
    { label: 'OT/IT 통합', weight: 2, tone: 'neutral' },
    { label: '스마트팩토리', weight: 2, tone: 'accent' },
    { label: '데이터센터', weight: 1, tone: 'neutral' },
    { label: '정부 협약', weight: 1, tone: 'success' },
  ],
};
