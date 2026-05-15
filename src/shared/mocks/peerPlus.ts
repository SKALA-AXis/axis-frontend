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
  { id: 'samsung_sds', label: '삼성 SDS' },
  { id: 'lg_cns', label: 'LG CNS' },
  { id: 'hyundai_autoever', label: '현대 오토에버' },
  { id: 'posco_dx', label: '포스코 DX' },
] as const satisfies ReadonlyArray<{ id: PeerPlusPeerId; label: string }>;

export const mockPeerPlusIrProfiles: Record<PeerPlusPeerId, PeerPlusIrProfile> = {
  samsung_sds: {
    revenue: '3.54조',
    operatingProfit: '2,261억',
    axRatio: '공시 미기재',
    orderBacklog: '공시 미기재',
    margin: '6.39%',
    capex: '공시 미기재',
    deltas: { revenue: 4.24, operatingProfit: 6.90, axRatio: 0, orderBacklog: 0, margin: -0.50, capex: 0 },
    quarterly: [
      { quarter: 'Q1', revenue: 34898, profit: 2685, ax: 0 },
      { quarter: 'Q2', revenue: 35120, profit: 2302, ax: 0 },
      { quarter: 'Q3', revenue: 33913, profit: 2323, ax: 0 },
      { quarter: 'Q4', revenue: 35368, profit: 2261, ax: 0 },
    ],
    summary: ['공시 기준으로는 2025Q4 매출 3.54조원, 영업이익 2,261억원 수준이며 ITS, 클라우드, AI 문맥이 함께 나타납니다.', '키워드 기준으로는 FabriX, Brity, 에이전틱 AI, 운영·유지보수 계열 신호가 같이 읽힙니다.'],
  },
  lg_cns: {
    revenue: '1.94조',
    operatingProfit: '2,119억',
    axRatio: '공시 미기재',
    orderBacklog: '공시 미기재',
    margin: '10.95%',
    capex: '공시 미기재',
    deltas: { revenue: -4.38, operatingProfit: 5.90, axRatio: 0, orderBacklog: 0, margin: 1.06, capex: 0 },
    quarterly: [
      { quarter: 'Q1', revenue: 12114, profit: 789, ax: 0 },
      { quarter: 'Q2', revenue: 14602, profit: 1408, ax: 0 },
      { quarter: 'Q3', revenue: 15223, profit: 1202, ax: 0 },
      { quarter: 'Q4', revenue: 19356, profit: 2119, ax: 0 },
    ],
    summary: ['공시 기준으로는 2025Q4 매출 1.94조원, 영업이익 2,119억원 수준이며 SI/금융, 클라우드/MSP, AI/DX 축이 함께 보입니다.', '키워드 기준으로는 금융, 공공, AI/DX, 스마트물류 문맥이 반복되어 사업 신호가 비교적 넓게 분포합니다.'],
  },
  hyundai_autoever: {
    revenue: '1.32조',
    operatingProfit: '764억',
    axRatio: '공시 미기재',
    orderBacklog: '공시 미기재',
    margin: '5.78%',
    capex: '공시 미기재',
    deltas: { revenue: 25.46, operatingProfit: 5.09, axRatio: 0, orderBacklog: 0, margin: -0.49, capex: 0 },
    quarterly: [
      { quarter: 'Q1', revenue: 8330, profit: 267, ax: 0 },
      { quarter: 'Q2', revenue: 10421, profit: 814, ax: 0 },
      { quarter: 'Q3', revenue: 10543, profit: 708, ax: 0 },
      { quarter: 'Q4', revenue: 13227, profit: 764, ax: 0 },
    ],
    summary: ['공시 기준으로는 2025Q4 매출 1.32조원, 영업이익 764억원 수준이며 스마트모빌리티, SI, ITES/유지운영 축이 함께 나타납니다.', '키워드 기준으로는 커넥티드카, OTA, 자율주행, 차량, 운영 계열 문맥이 중심을 이룹니다.'],
  },
  posco_dx: {
    revenue: '2,608억',
    operatingProfit: '-13억',
    axRatio: '공시 미기재',
    orderBacklog: '공시 미기재',
    margin: '-0.50%',
    capex: '공시 미기재',
    deltas: { revenue: -27.88, operatingProfit: -105.60, axRatio: 0, orderBacklog: 0, margin: -6.92, capex: 0 },
    quarterly: [
      { quarter: 'Q1', revenue: 2968, profit: 229, ax: 0 },
      { quarter: 'Q2', revenue: 2729, profit: 171, ax: 0 },
      { quarter: 'Q3', revenue: 2447, profit: 217, ax: 0 },
      { quarter: 'Q4', revenue: 2608, profit: -13, ax: 0 },
    ],
    summary: ['공시 기준으로는 2025Q4 매출 2,608억원, 영업이익 -13억원 수준이며 산업DX, 이차전지/EV, AI/지능화 축이 같이 보입니다.', '키워드 기준으로는 스마트팩토리, 산업, 이차전지, EV, AI/LLM 문맥이 중심 신호로 나타납니다.'],
  },
};

export const mockPeerPlusKeywordCloud: Record<PeerPlusPeerId, PeerPlusKeyword[]> = {
  samsung_sds: [
    { label: 'FabriX', weight: 3, tone: 'accent' },
    { label: 'Brity', weight: 2, tone: 'success' },
    { label: '에이전틱 AI', weight: 2, tone: 'accent' },
    { label: '클라우드', weight: 2, tone: 'neutral' },
    { label: 'ITS', weight: 2, tone: 'neutral' },
    { label: '유지보수', weight: 1, tone: 'success' },
  ],
  lg_cns: [
    { label: '금융', weight: 3, tone: 'accent' },
    { label: '클라우드 MSP', weight: 2, tone: 'neutral' },
    { label: 'AI/DX', weight: 2, tone: 'success' },
    { label: '공공', weight: 2, tone: 'accent' },
    { label: '스마트물류', weight: 1, tone: 'neutral' },
    { label: 'SI', weight: 1, tone: 'success' },
  ],
  hyundai_autoever: [
    { label: '커넥티드카', weight: 3, tone: 'accent' },
    { label: 'OTA', weight: 2, tone: 'success' },
    { label: '자율주행', weight: 2, tone: 'accent' },
    { label: '차량', weight: 2, tone: 'neutral' },
    { label: '운영', weight: 1, tone: 'neutral' },
    { label: 'ERP', weight: 1, tone: 'success' },
  ],
  posco_dx: [
    { label: '산업DX', weight: 3, tone: 'accent' },
    { label: '스마트팩토리', weight: 2, tone: 'success' },
    { label: '이차전지', weight: 2, tone: 'accent' },
    { label: 'EV', weight: 2, tone: 'neutral' },
    { label: 'AI', weight: 1, tone: 'neutral' },
    { label: 'LLM', weight: 1, tone: 'success' },
  ],
};
