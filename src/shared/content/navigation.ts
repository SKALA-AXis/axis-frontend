/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 작업 중 화면 라벨 추가
 *   2026-05-15 최종민 — GlobalTrends 뷰 추가 및 전면 개편·Peer+ 글로벌 산업 탭 정리 반영
 *   2026-05-22 박진 — 카드뉴스 대폭 수정 및 알림 설정 반영
 */
export const viewLabels: Record<string, string> = {
  home: '홈',
  assignment: 'Peer+',
  matching: '믹서',
  peerPlus: 'Peer+',
  issues: '카드뉴스',
  keywordGraph: '키워드 그래프',
  monitoring: 'Peer+',
  mixer: '믹서',
  briefings: '브리핑',
  rawArticles: '믹서기',
  notifications: '알림',
  search: '검색',
  settings: '설정',
  admin: '관리자',
};

export const primaryNavigationItems = [
  { id: 'home', label: '홈' },
  { id: 'briefings', label: '브리핑' },
  { id: 'peerPlus', label: 'Peer+' },
  { id: 'issues', label: '카드뉴스' },
  { id: 'mixer', label: '믹서' },
  { id: 'keywordGraph', label: '키워드 그래프' },
] as const;

export const adminNavigationItem = { id: 'admin', label: '관리자' } as const;
