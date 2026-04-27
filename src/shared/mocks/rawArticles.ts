import type { RawArticle } from '../../features/raw-articles/model/rawArticle';

export const mockRawArticles: RawArticle[] = [
  {
    id: 1,
    title: '삼성SDS, 제조/금융 생성형 AI 운영 플랫폼 레퍼런스 확대',
    url: 'https://example.com/article1',
    sourceName: 'Naver News',
    peerId: 'samsung_sds',
    publishedAt: '2026-04-22T08:30:00Z',
    collectedAt: '2026-04-22T08:35:00Z',
    importanceLevel: 'urgent',
  },
  {
    id: 2,
    title: 'LG CNS, 금융권 AI+클라우드 보안 패키지 출시',
    url: 'https://example.com/article2',
    sourceName: 'E-daily',
    peerId: 'lg_cns',
    publishedAt: '2026-04-22T07:15:00Z',
    collectedAt: '2026-04-22T07:20:00Z',
    importanceLevel: 'notable',
  },
  {
    id: 3,
    title: '현대오토에버, SDV 데이터 플랫폼 외부 고객 적용 사례 공개',
    url: 'https://example.com/article3',
    sourceName: 'Chosun Biz',
    peerId: 'hyundai_autoever',
    publishedAt: '2026-04-21T16:45:00Z',
    collectedAt: '2026-04-21T16:50:00Z',
    importanceLevel: null,
  },
];
