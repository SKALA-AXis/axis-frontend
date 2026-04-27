import type { BriefingsData } from '../../features/briefings/model/briefing';

export const mockBriefingsData: BriefingsData = {
  dailySnapshot: {
    title: '2026년 4월 22일 Peer Intelligence 일간 브리핑',
    summary: '총 5건의 동향을 우선 검토와 지속 관찰 기준으로 정리했습니다.',
    sections: [
      {
        title: '오늘 바로 검토할 동향',
        items: [
          {
            headline: '삼성SDS - 제조·금융 생성형 AI 운영 플랫폼 레퍼런스 확대',
            source: '연합뉴스, 2026.04.22 08:30',
          },
          {
            headline: '현대오토에버 - SDV 데이터 플랫폼 외부 고객 적용 사례 공개',
            source: '조선비즈, 2026.04.21 16:45',
          },
        ],
      },
      {
        title: '지속 관찰할 동향',
        items: [
          {
            headline: 'LG CNS - 금융권 AI·클라우드 보안 패키지 출시',
            source: '전자신문, 2026.04.22 07:15',
          },
          {
            headline: 'Kakao Enterprise - 협업툴 내 AI 비서 베타 서비스',
            source: '기업 블로그, 2026.04.20 11:30',
          },
          {
            headline: '네이버클라우드 - 공공기관 Sovereign AI 인프라 패키지 확대',
            source: '보도자료, 2026.04.20 14:20',
          },
        ],
      },
    ],
  },
  weeklySnapshot: {
    title: '2026년 4월 3주차 Peer Intelligence 주간 브리핑',
    summary: '한 주 동안 누적된 Peer사 사업 메시지와 레퍼런스 변화를 묶어서 정리했습니다.',
    sections: [
      {
        title: '이번 주 핵심 변화',
        items: [
          {
            headline: '운영형 AI 메시지가 산업 레퍼런스 중심으로 강화됨',
            source: '주간 기사 묶음 분석, 2026.04.3주차',
          },
          {
            headline: '금융권 보안·거버넌스 프레임이 AI 제안의 핵심 축으로 부상',
            source: '전자신문, IR 자료, 기업 보도자료',
          },
        ],
      },
      {
        title: '연속 관찰 포인트',
        items: [
          {
            headline: '제조 데이터 플랫폼 메시지와 외부 고객 사례 확산 여부 확인 필요',
            source: '조선비즈, 기업 발표자료',
          },
        ],
      },
    ],
  },
  evidenceSources: [
    '기업 공시·IR 자료',
    '주요 경제지 및 산업지 기사',
    '기업 보도자료 및 공식 블로그',
    '수집 시각 기준 원문 링크 아카이브',
  ],
  history: [
    {
      id: 'BR-20260422-001',
      date: '2026-04-22',
      title: '2026년 4월 22일 일간 브리핑',
      status: 'delivered',
      summary: '삼성SDS 제조 AX 레퍼런스, LG CNS 금융 보안 패키지 등 전략 검토 동향 5건',
      primaryCount: 2,
      watchCount: 3,
      evidence: ['연합뉴스', '전자신문', '기업 보도자료'],
    },
    {
      id: 'BR-20260421-001',
      date: '2026-04-21',
      title: '2026년 4월 21일 일간 브리핑',
      status: 'delivered',
      summary: '네이버클라우드 공공 Sovereign AI, 현대오토에버 SDV 플랫폼 등 4건',
      primaryCount: 1,
      watchCount: 3,
      evidence: ['조선비즈', 'IR 자료', '기업 블로그'],
    },
    {
      id: 'BR-20260420-001',
      date: '2026-04-20',
      title: '2026년 4월 20일 일간 브리핑',
      status: 'delivered',
      summary: '카카오엔터프라이즈 AI 비서, KT 클라우드 사업 재편 등 업무 AX 관련 신호',
      primaryCount: 0,
      watchCount: 4,
      evidence: ['매일경제', '전자신문'],
    },
  ],
};
