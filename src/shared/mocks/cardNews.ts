export type CardNewsArticlePage = {
  title: string;
  paragraphs: string[];
};

export type CardNewsItem = {
  id: string;
  category: string;
  date: string;
  title: string;
  coverImageUrl: string;
  coverImageAlt: string;
  summary: string[];
  articlePages: CardNewsArticlePage[];
  insights: string[];
  source: string;
  sourceUrl: string;
  detailTitle: string;
  detailDescription: string;
  detailPoints: string[];
  actionItems: string[];
};

export const cardNewsItems: CardNewsItem[] = [
  {
    id: 'sector-2026-05-02',
    category: '섹터',
    date: '2026.05.02',
    title: '삼성 SDS와 LG CNS의 1분기 실적이 엇갈리며 AX 투자 전략 차이가 뚜렷해졌습니다.',
    coverImageUrl: '/png.png',
    coverImageAlt: '분기 실적 비교를 상징하는 추상 이미지',
    summary: [
      '삼성 SDS와 LG CNS의 2026년 1분기 실적이 엇갈림',
      '삼성 SDS는 물류 사업 부진과 일회성 비용으로 영업이익 감소',
      'LG CNS는 AX 사업 확대로 역대 최대 실적 기록',
    ],
    articlePages: [
      {
        title: '실적 흐름 요약',
        paragraphs: [
          '삼성 SDS는 클라우드와 AX 투자를 이어가고 있지만 물류 부문의 부진과 일회성 비용 영향으로 단기 수익성은 주춤한 모습입니다.',
          '반면 LG CNS는 AI 전환 수요 확대를 실적으로 연결하면서 매출과 영업이익 모두 강한 성장세를 보였습니다.',
        ],
      },
      {
        title: '경쟁 구도 변화',
        paragraphs: [
          '두 회사 모두 AI를 핵심 축으로 사업 구조를 재편하고 있지만, LG CNS는 성장 가시성을 먼저 증명했고 삼성 SDS는 투자 선행 국면의 색채가 더 강합니다.',
          '이 차이는 고객 제안 시점에서 안정적 실행 레퍼런스를 강조할지, 미래 아키텍처와 확장성을 강조할지의 메시지 차이로 이어질 수 있습니다.',
        ],
      },
    ],
    insights: [
      'LG CNS는 AX 중심 사업 확대로 매출과 영업이익의 증가를 동시에 증명하고 있습니다.',
      '삼성 SDS는 AI 퍼스트 전략에 대한 대규모 투자 계획을 바탕으로 중장기 반등 여지를 만들고 있습니다.',
      '양사 모두 AI를 핵심 축으로 사업 구조 재편을 진행 중이라 메시지 경쟁이 더 치열해질 가능성이 큽니다.',
    ],
    source: '산업 리포트 요약',
    sourceUrl: 'https://example.com/cards/sector-2026-05-02',
    detailTitle: '실적 비교 상세',
    detailDescription:
      '이번 이슈는 단순 실적 증감보다 AX 투자 회수 속도와 고객 레퍼런스 확보의 차이를 보여준다는 점에서 의미가 있습니다. 제안 전략과 벤치마크 관점 모두에서 후속 추적이 필요한 뉴스입니다.',
    detailPoints: [
      '삼성 SDS는 AI 투자와 플랫폼 고도화의 선행 지표를 점검할 필요가 있습니다.',
      'LG CNS는 실적 호조가 어떤 산업군과 어떤 서비스 묶음에서 나왔는지 세부 확인이 중요합니다.',
      '두 회사의 다음 분기 가이던스와 수주잔고 변화가 경쟁 강도를 판단하는 핵심 신호가 됩니다.',
    ],
    actionItems: [
      'AX 경쟁사별 투자 시기와 영역 비교표 업데이트',
      '물류·서비스 매출 믹스 변화에 따른 벤치마크 정리',
      '다음 분기 실적 발표 전 선행지표 모니터링 강화',
    ],
  },
  {
    id: 'ai-market-2026-05-03',
    category: 'AI',
    date: '2026.05.03',
    title: '국내 AX 시장이 PoC 중심에서 전사 확산형 구축 수요로 빠르게 이동하고 있습니다.',
    coverImageUrl: '/png.png',
    coverImageAlt: 'AX 시장 확산을 상징하는 추상 이미지',
    summary: [
      '대기업 대상 AI 전환 컨설팅과 구축 수요가 동시에 증가',
      'PoC 중심 제안에서 전사 확산형 프로젝트로 예산 구조 이동',
      '보안, 데이터 거버넌스, 운영 자동화 요구가 함께 커짐',
    ],
    articlePages: [
      {
        title: '시장 수요 변화',
        paragraphs: [
          '고객사는 더 이상 단발성 데모나 챗봇 PoC만으로는 의사결정을 내리지 않고, 실제 업무 전환과 운영 확산까지 포함된 제안을 선호하고 있습니다.',
          '예산 역시 실험성 프로젝트보다 부서 간 연계와 운영 체계를 포함한 중대형 구축 사업으로 이동하는 흐름이 뚜렷합니다.',
        ],
      },
      {
        title: '제안 구조의 변화',
        paragraphs: [
          '보안, 데이터 거버넌스, 운영 자동화는 이제 부가 요소가 아니라 수주 성패를 가르는 기본 조건으로 자리잡고 있습니다.',
          '클라우드와 온프레미스를 혼합한 아키텍처 수요가 늘면서 기술력보다 설계력과 운영 역량을 어떻게 증명할지가 더 중요해지고 있습니다.',
        ],
      },
    ],
    insights: [
      '실행 조직과 운영 조직을 함께 제안하는 전략이 중요합니다.',
      '고객은 기술 그 자체보다 적용 속도와 운영 안정성을 더 중시합니다.',
      '장기 운영 계약을 확보할 수 있는 구조 설계가 수주 경쟁력으로 이어질 수 있습니다.',
    ],
    source: 'AX 트렌드 브리프',
    sourceUrl: 'https://example.com/cards/ai-market-2026-05-03',
    detailTitle: '시장 재편 상세',
    detailDescription:
      '이 변화는 기술 데모 경쟁에서 운영 체계 경쟁으로 시장의 중심축이 이동하고 있다는 신호입니다. 제안서 구성, 레퍼런스 제시 방식, 운영 전환 사례 확보 전략까지 함께 재정비할 필요가 있습니다.',
    detailPoints: [
      '전사 확산형 프로젝트는 보안과 운영 설계 문서의 완성도가 중요합니다.',
      '산업별 템플릿과 운영 KPI 제시는 초기 진입보다 후속 확산에 더 큰 영향을 줍니다.',
      '구축 이후 유지운영 모델을 어떻게 제안하는지가 장기 계약 성패를 좌우합니다.',
    ],
    actionItems: [
      '고객 유형별 AX 제안서 템플릿 정비',
      '운영 전환 사례 중심 레퍼런스 페이지 구성',
      '데이터·보안·운영 패키지형 상품 초안 검토',
    ],
  },
  {
    id: 'peer-2026-05-04',
    category: 'Peer',
    date: '2026.05.04',
    title: '주요 Peer 4사가 생성형 AI를 넘어 운영형 패키지 경쟁으로 빠르게 이동하고 있습니다.',
    coverImageUrl: '/png.png',
    coverImageAlt: 'Peer 경쟁 구도를 상징하는 추상 이미지',
    summary: [
      '생성형 AI 기반 업무도구와 에이전트 제품이 빠르게 늘어남',
      'Peer사들이 산업별 특화 패키지를 앞세워 차별화 시도',
      '서비스 출시 속도보다 고객 안착률이 주요 성과 지표로 부상',
    ],
    articlePages: [
      {
        title: '라인업 확장 흐름',
        paragraphs: [
          '삼성 SDS, LG CNS, 현대 오토에버, 포스코 DX는 모두 생성형 AI 기능 소개보다 산업별 운영 패키지와 구축 레퍼런스를 함께 제시하는 방향으로 메시지를 확장하고 있습니다.',
          '단순 챗봇이나 업무도구 소개에서 벗어나 데이터, 보안, 자동화, 운영 체계까지 포함한 구조가 경쟁의 기본 포맷이 되고 있습니다.',
        ],
      },
      {
        title: '평가 기준의 이동',
        paragraphs: [
          '이제 고객은 출시 속도보다 실제 안착률과 운영 성과를 더 중요한 지표로 보고 있습니다.',
          '결국 승부처는 어떤 산업군에서 어떤 형태로 확산 가능한지, 그리고 구축 이후 운영 안정성을 어떻게 증명하는지에 달려 있습니다.',
        ],
      },
    ],
    insights: [
      '산업별 템플릿과 운영 지원체계가 승부처가 될 가능성이 큽니다.',
      '브랜드 메시지보다 실제 도입 속도와 전환 KPI 제시가 중요합니다.',
      '고객 교육과 내부 확산 프로그램을 함께 제안할 필요가 있습니다.',
    ],
    source: 'Peer 모니터링 데일리',
    sourceUrl: 'https://example.com/cards/peer-2026-05-04',
    detailTitle: 'Peer 경쟁 상세',
    detailDescription:
      '제품 비교만으로는 부족하고, 어떤 고객군에서 어떤 방식으로 안착시키는지가 더 중요합니다. 경쟁사 메시지와 실제 구축 패턴을 함께 봐야 영업 대응과 제안 차별화 포인트를 뽑아낼 수 있습니다.',
    detailPoints: [
      '삼성 SDS는 운영 플랫폼 메시지와 제조·금융 레퍼런스를 강화하고 있습니다.',
      'LG CNS는 공공·금융 중심 보안과 거버넌스 패키지로 안정성을 부각하고 있습니다.',
      '현대 오토에버와 포스코 DX는 제조 현장 데이터와 실행형 자동화 메시지가 강점입니다.',
    ],
    actionItems: [
      '경쟁사별 서비스 라인업 맵 최신화',
      '도입 업종·성과지표 중심 비교 카드 작성',
      '영업팀용 카드뉴스 공유 흐름 테스트',
    ],
  },
];
