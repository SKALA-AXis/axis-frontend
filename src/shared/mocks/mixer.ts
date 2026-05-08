export type MixerOptionGroup = {
  title: string;
  values: string[];
};

export type MixerRadarMetric = {
  subject: string;
  base: number;
  cardWeight?: number;
  keyword?: string;
  keywordValue?: number;
  industryWeight?: number;
  bookmarkWeight?: number;
  customerWeight?: number;
  max: number;
};

export const mockMixerConfig = {
  defaults: {
    peers: ['삼성SDS', 'LG CNS'],
    customers: ['공공기관'],
    industries: ['공공', '제조'],
    keywords: ['AX', '수주', 'AI 에이전트'],
  },
  options: [
    { title: 'Peer사', values: ['삼성SDS', 'LG CNS', '현대 오토에버', '포스코 DX'] },
    { title: '고객사', values: ['공공기관', '금융권', '제조 대기업', '유통/서비스'] },
    { title: '산업', values: ['공공', '금융', '제조', '클라우드', '보안'] },
    { title: '키워드', values: ['AX', 'AI 에이전트', '수주', '클라우드', '보안', '스마트팩토리'] },
  ] satisfies MixerOptionGroup[],
  connectionKeywords: ['AX', 'AI', '보안', '수주', '운영', '클라우드', '제조', '데이터'],
  radarMetrics: [
    { subject: '고객 적합', base: 62, customerWeight: 8, max: 96 },
    { subject: 'Peer 반복', base: 58, cardWeight: 6, max: 94 },
    { subject: '수주 연결', base: 64, keyword: '수주', keywordValue: 90, max: 95 },
    { subject: 'AX 실행', base: 66, keyword: 'AX', keywordValue: 92, max: 96 },
    { subject: '근거 다양', base: 54, bookmarkWeight: 12, cardWeight: 3, max: 92 },
    { subject: '제안 전환', base: 60, industryWeight: 7, customerWeight: 4, max: 95 },
  ] as MixerRadarMetric[],
  insightTemplate: {
    leadPrefix: '선택한 카드뉴스 묶음은',
    leadSuffix: '하나의 고객 제안 시나리오로 묶을 수 있습니다.',
    evidenceLabel: '근거 연결',
    actionLabel: '실행 문장',
  },
};
