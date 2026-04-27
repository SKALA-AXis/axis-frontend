import type { AlertsData } from '../../features/alerts/model/alert';

export const mockAlertsData: AlertsData = {
  rules: [
    {
      id: 'RULE-001',
      name: '우선 검토 동향 즉시 알림',
      description: '검토 수준이 우선 검토인 동향 발생 시 즉시 Slack 알림',
      enabled: true,
      channels: ['slack', 'email'],
      lastTriggered: '2026-04-22T09:15:00Z',
    },
    {
      id: 'RULE-002',
      name: 'Agentic AI/산업 AX 알림',
      description: 'Agentic AI, 제조 AX, 금융 AX 키워드 포함 시 알림',
      enabled: true,
      channels: ['email'],
      lastTriggered: '2026-04-22T08:30:00Z',
    },
    {
      id: 'RULE-003',
      name: '파트너십 & M&A',
      description: '파트너십, M&A 이벤트 타입 알림',
      enabled: false,
      channels: ['dashboard'],
      lastTriggered: '2026-04-20T14:20:00Z',
    },
  ],
  history: [
    {
      id: 'ALERT-001',
      title: '[전략 검토] 삼성SDS - 제조 AX 레퍼런스 확대',
      message: '삼성SDS가 생성형 AI 운영 플랫폼을 제조/금융 고객 레퍼런스로 확장했습니다.',
      channel: 'slack',
      status: 'sent',
      triggeredAt: '2026-04-22T09:15:00Z',
    },
    {
      id: 'ALERT-002',
      title: '[영업 공유] LG CNS - 금융 AI 보안 패키지',
      message: 'LG CNS가 금융권 대상 AI+클라우드 보안 패키지를 출시했습니다.',
      channel: 'email',
      status: 'sent',
      triggeredAt: '2026-04-21T17:30:00Z',
    },
  ],
  conditionOptions: [
    '검토 수준이 우선 검토인 동향 발생 시 즉시 알림',
    'Agentic AI, 제조 AX, 금융 AX 키워드 포함 시 알림',
    '파트너십, M&A 이벤트 타입 알림',
    '특정 Peer사 신규 동향 수집 시 알림',
    '보고서 생성이 완료되면 알림',
  ],
  channelOptions: ['slack', 'email', 'dashboard'],
};
