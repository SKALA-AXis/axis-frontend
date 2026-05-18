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
