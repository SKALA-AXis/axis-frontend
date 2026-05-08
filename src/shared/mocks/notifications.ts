export type NotificationItem = {
  id: string;
  peer: string;
  title: string;
  tone: string;
  target: string;
  time: string;
  read: boolean;
};

export const notificationStorageKey = 'axis:notifications';
export const notificationClearedStorageKey = 'axis:notifications-cleared';

export const mockNotificationItems: NotificationItem[] = [
  { id: 'notice-posco-megadeal', peer: '포스코DX', title: '공공 메가딜 우선협상 신호가 감지되었습니다.', tone: '대응 필요', target: 'keywordGraph', time: '08:30', read: false },
  { id: 'notice-lg-cardnews', peer: 'LG CNS', title: 'AX 금융 패키지 관련 카드뉴스 요약이 준비되었습니다.', tone: '카드뉴스 보기', target: 'issues', time: '08:12', read: false },
  { id: 'notice-samsung-ir', peer: '삼성SDS', title: 'IR 기반 AI agent 지표가 Peer+에 반영되었습니다.', tone: 'Peer+ 이동', target: 'peerPlus', time: '07:55', read: true },
  { id: 'notice-hyundai-factory', peer: '현대 오토에버', title: '스마트팩토리 데이터 플랫폼 언급량이 증가했습니다.', tone: '관찰', target: 'peerPlus', time: '어제', read: true },
  { id: 'notice-briefing-ready', peer: 'AXIS', title: '주간 브리핑 초안이 생성되어 검토할 수 있습니다.', tone: '브리핑', target: 'briefings', time: '어제', read: true },
];
