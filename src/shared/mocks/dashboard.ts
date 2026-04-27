import type { DashboardData } from '../../features/dashboard/model/dashboard';

export const mockDashboardData: DashboardData = {
  trends: [
    {
      peer: '삼성SDS',
      title: 'FabriX 기반 ERP/SCM AI 에이전트 통합 서비스',
      reason:
        '구매, 물류 등 핵심 프로세스에 AI Agent를 결합한 운영 사례를 앞세워 대형 제조 고객군을 선점하고 있습니다.',
      reviewLevel: 'primary',
      status: '대응 전략 수립',
    },
    {
      peer: 'LG CNS',
      title: 'DAP GenAI 중심의 공공·금융 소버린 AI 패키지',
      reason: '망 분리 환경에서도 작동하는 온프레미스형 LLM 구축 역량을 전면에 내세우고 있습니다.',
      reviewLevel: 'primary',
      status: '영업 기회 분석',
    },
    {
      peer: '현대오토에버',
      title: '글로벌 스마트 팩토리 2.0 및 제조 데이터 플랫폼 확장',
      reason: 'HMGICS에서 검증된 AI 기반 디지털 트윈 모델을 외부 부품사로 확산하고 있습니다.',
      reviewLevel: 'watch',
      status: '시사점 도출',
    },
  ],
  articles: [
    {
      peer: '삼성SDS',
      title: '제조·금융 생성형 AI 운영 플랫폼 레퍼런스 확대',
      source: '연합뉴스',
      publishedAt: '2026.04.22 08:30',
      note: '운영형 AI 메시지 강화',
    },
    {
      peer: 'LG CNS',
      title: '금융권 AI·클라우드 보안 패키지 출시',
      source: '전자신문',
      publishedAt: '2026.04.22 07:15',
      note: '금융 보안 진입 포인트 확대',
    },
    {
      peer: '현대오토에버',
      title: 'SDV 데이터 플랫폼 외부 고객 적용 사례 공개',
      source: '조선비즈',
      publishedAt: '2026.04.21 16:45',
      note: '제조·모빌리티 확장 흐름',
    },
  ],
  keywords: [
    { text: 'Agentic AI', type: 'tech', size: 'text-2xl', x: '48%', y: '20%' },
    { text: 'SK AX', type: 'org', size: 'text-2xl', x: '33%', y: '34%' },
    { text: '제조 AX', type: 'tech', size: 'text-xl', x: '60%', y: '38%' },
    { text: 'LG CNS', type: 'org', size: 'text-xl', x: '72%', y: '28%' },
    { text: '금융권', type: 'place', size: 'text-lg', x: '30%', y: '50%' },
    { text: '클라우드 보안', type: 'tech', size: 'text-lg', x: '56%', y: '58%' },
    { text: 'SDV', type: 'tech', size: 'text-base', x: '76%', y: '60%' },
    { text: '공공기관', type: 'place', size: 'text-sm', x: '28%', y: '70%' },
    { text: '현대오토에버', type: 'org', size: 'text-base', x: '48%', y: '76%' },
    { text: '데이터 플랫폼', type: 'tech', size: 'text-base', x: '68%', y: '78%' },
    { text: '서울', type: 'place', size: 'text-sm', x: '38%', y: '88%' },
    { text: 'AI 거버넌스', type: 'tech', size: 'text-sm', x: '78%', y: '45%' },
  ],
  keywordSearchPoints: [
    { time: '09:00', agenticAi: 120, sovereignAi: 82, digitalTwin: 65, aiGovernance: 48 },
    { time: '10:00', agenticAi: 168, sovereignAi: 96, digitalTwin: 78, aiGovernance: 60 },
    { time: '11:00', agenticAi: 214, sovereignAi: 124, digitalTwin: 92, aiGovernance: 85 },
    { time: '12:00', agenticAi: 196, sovereignAi: 141, digitalTwin: 101, aiGovernance: 88 },
    { time: '13:00', agenticAi: 238, sovereignAi: 163, digitalTwin: 120, aiGovernance: 97 },
    { time: '14:00', agenticAi: 261, sovereignAi: 172, digitalTwin: 134, aiGovernance: 112 },
    { time: '15:00', agenticAi: 249, sovereignAi: 168, digitalTwin: 129, aiGovernance: 118 },
  ],
  keywordSeries: [
    { key: 'agenticAi', name: 'Agentic AI', color: '#ea580c', total: '249' },
    { key: 'sovereignAi', name: 'Sovereign AI', color: '#2563eb', total: '168' },
    { key: 'digitalTwin', name: '디지털 트윈', color: '#14b8a6', total: '129' },
    { key: 'aiGovernance', name: 'AI 거버넌스', color: '#7c3aed', total: '118' },
  ],
  notifications: [
    { title: '전략 검토', detail: '삼성SDS 제조 AX 레퍼런스 시사점 작성 필요', time: '12분 전', tone: 'urgent' },
    { title: '브리핑', detail: '전략기획팀 일간 브리핑 08:30 발송 완료', time: '38분 전', tone: 'info' },
    { title: '영업 공유', detail: '금융권 AI 보안 패키지 관련 알림 전송 대기', time: '1시간 전', tone: 'info' },
  ],
  keywordNewsCount: '11,104',
};
