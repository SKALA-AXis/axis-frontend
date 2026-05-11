import type { CardNewsDisplayEntry } from '../../features/card-news/model/cardNews';

export type FallbackCardNewsDisplayEntry = Required<
  Pick<CardNewsDisplayEntry, 'id' | 'title' | 'displayDate' | 'badgeLabel' | 'coverStyle' | 'previewImageStyle'>
> & {
  cardId: string;
  peerCompany: string;
  sector: string;
  sourceType: string;
};

export const cardNewsPresentationDefaults = {
  peerCompany: '삼성SDS',
  sector: 'AX',
  sourceType: '뉴스',
  coverStyle: 'linear-gradient(180deg, rgba(37,37,40,0.55), rgba(17,17,17,0.82)), linear-gradient(135deg, #364153 0%, #111827 100%)',
  previewImageStyle: 'linear-gradient(135deg, rgba(248,249,251,0.92), rgba(232,236,242,0.74)), linear-gradient(125deg, #dbe3ef 0%, #edf2f7 100%)',
} as const;

export const fallbackCardNewsDisplayEntries: FallbackCardNewsDisplayEntry[] = [
  {
    id: 'peer-samsung-1',
    cardId: 'sector-2026-05-02',
    title: '실적 엇갈린 삼성SDS-LG CNS...\nAI 2라운드 돌입',
    peerCompany: '삼성SDS',
    sector: 'AX',
    sourceType: '뉴스',
    displayDate: '2026.05.03',
    badgeLabel: 'AI',
    coverStyle: 'linear-gradient(180deg, rgba(37,37,40,0.8) 0%, rgba(29,29,33,0.4) 30%, rgba(17,17,17,0.78) 100%), radial-gradient(circle at 50% 68%, rgba(177, 60, 255, 0.95), rgba(103, 25, 169, 0.95) 26%, rgba(33, 12, 53, 0.98) 42%, rgba(17,17,17,1) 75%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(233,240,255,0.84), rgba(255,223,213,0.55)), radial-gradient(circle at 72% 38%, rgba(255,255,255,0.58), transparent 18%), linear-gradient(125deg, #ced9ee 0%, #f4d4c6 48%, #bfd4ea 100%)',
  },
  {
    id: 'peer-lg-1',
    cardId: 'peer-2026-05-04',
    title: 'AgenticWire N\nSK AX,\n에이전틱 기반 운영혁신\n시스템 경쟁 본격화',
    peerCompany: 'LG CNS',
    sector: '인프라',
    sourceType: '블로그',
    displayDate: '2026.05.04',
    badgeLabel: 'Infra',
    coverStyle: 'linear-gradient(180deg, rgba(14,35,73,0.52), rgba(6,20,44,0.82)), radial-gradient(circle at 70% 15%, rgba(255,255,255,0.26), transparent 16%), linear-gradient(135deg, #224f9b 0%, #0f2859 55%, #132643 100%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(238,245,255,0.82), rgba(217,238,255,0.56)), radial-gradient(circle at 18% 24%, rgba(255,255,255,0.72), transparent 16%), linear-gradient(125deg, #d2def1 0%, #cfd8e7 46%, #c7d8f0 100%)',
  },
  {
    id: 'peer-hyundai-1',
    cardId: 'ai-market-2026-05-03',
    title: '현대 오토에버,\n1분기 매출 9357억\n전년비 12.3% 증가',
    peerCompany: '현대 오토에버',
    sector: '수주',
    sourceType: '증권사',
    displayDate: '2026.04.30',
    badgeLabel: 'IR',
    coverStyle: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18)), linear-gradient(135deg, #dfe5ef 0%, #bcc9d8 54%, #edf1f6 100%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(253,250,248,0.84), rgba(239,242,247,0.62)), radial-gradient(circle at 80% 25%, rgba(255,255,255,0.72), transparent 18%), linear-gradient(125deg, #ece7e2 0%, #d4e0ee 50%, #f5e6db 100%)',
  },
  {
    id: 'peer-posco-1',
    cardId: 'peer-2026-05-04',
    title: '포스코DX,\n스마트팩토리용 산업 AI\n자동화 패키지 공개',
    peerCompany: '포스코 DX',
    sector: '인프라',
    sourceType: 'IR',
    displayDate: '2026.04.21',
    badgeLabel: 'Factory',
    coverStyle: 'linear-gradient(180deg, rgba(18,34,59,0.45), rgba(13,19,31,0.86)), radial-gradient(circle at 64% 35%, rgba(48,141,255,0.24), transparent 18%), linear-gradient(135deg, #0d2d56 0%, #1c6bb7 48%, #061324 100%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(238,246,255,0.86), rgba(230,238,246,0.62)), radial-gradient(circle at 72% 24%, rgba(255,255,255,0.76), transparent 16%), linear-gradient(125deg, #d6e4f3 0%, #bdd6ef 52%, #e8eef5 100%)',
  },
  {
    id: 'peer-samsung-2',
    cardId: 'ai-market-2026-05-03',
    title: '삼성SDS,\n공공 AX 사업 확장 위한\n보안형 생성형 AI 강화',
    peerCompany: '삼성SDS',
    sector: '보안',
    sourceType: 'IR',
    displayDate: '2026.04.27',
    badgeLabel: 'Secure',
    coverStyle: 'linear-gradient(180deg, rgba(37,37,40,0.55), rgba(17,17,17,0.8)), radial-gradient(circle at 50% 65%, rgba(243, 126, 39, 0.92), rgba(143, 72, 17, 0.95) 28%, rgba(17,17,17,1) 70%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(255,244,238,0.84), rgba(255,233,220,0.56)), radial-gradient(circle at 60% 20%, rgba(255,255,255,0.66), transparent 17%), linear-gradient(125deg, #ead7cf 0%, #eed8ca 48%, #d8e7f4 100%)',
  },
  {
    id: 'peer-lg-2',
    cardId: 'sector-2026-05-02',
    title: 'LG CNS,\n금융권 AI·클라우드 보안\n패키지 수주 확대',
    peerCompany: 'LG CNS',
    sector: '보안',
    sourceType: '증권사',
    displayDate: '2026.04.24',
    badgeLabel: 'Security',
    coverStyle: 'linear-gradient(180deg, rgba(14,35,73,0.42), rgba(7,20,42,0.86)), linear-gradient(135deg, #284a84 0%, #152b57 42%, #081429 100%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(244,247,252,0.84), rgba(229,237,248,0.6)), radial-gradient(circle at 22% 24%, rgba(255,255,255,0.72), transparent 16%), linear-gradient(125deg, #dce4ef 0%, #c6d5ea 50%, #d5dee8 100%)',
  },
  {
    id: 'peer-hyundai-2',
    cardId: 'peer-2026-05-04',
    title: '현대 오토에버,\n제조 데이터 플랫폼 외부\n고객 적용 사례 공개',
    peerCompany: '현대 오토에버',
    sector: 'AX',
    sourceType: '뉴스',
    displayDate: '2026.04.22',
    badgeLabel: 'Data',
    coverStyle: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.22)), linear-gradient(135deg, #d5dde8 0%, #9ab0c9 52%, #eff3f7 100%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(243,248,255,0.84), rgba(235,241,249,0.58)), radial-gradient(circle at 76% 20%, rgba(255,255,255,0.72), transparent 18%), linear-gradient(125deg, #d7e0eb 0%, #cad8e8 52%, #f2e4dc 100%)',
  },
  {
    id: 'peer-posco-2',
    cardId: 'sector-2026-05-02',
    title: '포스코DX,\n산업 AX 구축 사업에서\n운영형 레퍼런스 확대',
    peerCompany: '포스코 DX',
    sector: '수주',
    sourceType: '증권사',
    displayDate: '2026.04.19',
    badgeLabel: 'Deal',
    coverStyle: 'linear-gradient(180deg, rgba(20,35,53,0.46), rgba(9,16,26,0.84)), linear-gradient(135deg, #113159 0%, #26537f 48%, #0c1725 100%)',
    previewImageStyle: 'linear-gradient(135deg, rgba(240,245,250,0.84), rgba(226,234,241,0.6)), radial-gradient(circle at 28% 22%, rgba(255,255,255,0.74), transparent 16%), linear-gradient(125deg, #d9e4ef 0%, #c7d3df 52%, #eef3f8 100%)',
  },
];
