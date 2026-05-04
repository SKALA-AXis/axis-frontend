import type { PeersData } from '../../features/peers/model/peer';

export const mockPeersData: PeersData = {
  peers: [
    {
      id: 'samsung_sds',
      name: '삼성 SDS',
      keywords: ['Agentic AI', '제조 AX', '운영 플랫폼'],
      priority: 'high',
      stats: { primary: 3, watch: 8, archive: 12 },
      direction: '생성형 AI를 산업별 운영 플랫폼으로 패키지화',
      implication: 'SK AX는 컨설팅-구축-운영까지 이어지는 AX 실행력과 산업별 성과 지표를 더 강하게 보여줄 필요가 있습니다.',
    },
    {
      id: 'lg_cns',
      name: 'LG CNS',
      keywords: ['금융', '보안', '클라우드'],
      priority: 'high',
      stats: { primary: 1, watch: 6, archive: 9 },
      direction: '규제 산업의 보안·컴플라이언스 부담을 AX 진입점으로 활용',
      implication: '금융·공공 제안에서는 AI 거버넌스, 감사 대응, 보안 운영 모델을 핵심 메시지로 끌어올리는 편이 좋습니다.',
    },
    {
      id: 'hyundai_autoever',
      name: '현대 오토에버',
      keywords: ['SDV', '제조 데이터', '모빌리티'],
      priority: 'medium',
      stats: { primary: 2, watch: 5, archive: 7 },
      direction: '자동차 SW 역량을 제조 데이터 플랫폼 사업으로 확장',
      implication: 'SK AX의 제조 AX 메시지는 설비·공정 최적화뿐 아니라 데이터 운영 플랫폼 관점까지 넓힐 필요가 있습니다.',
    },
    {
      id: 'posco_dx',
      name: '포스코 DX',
      keywords: ['스마트팩토리', '산업 AI', '로봇 자동화'],
      priority: 'high',
      stats: { primary: 2, watch: 4, archive: 6 },
      direction: '제조 현장 자동화와 산업 AI를 묶은 스마트팩토리 사업 확장',
      implication: '현장 실행 중심의 메시지가 강하므로 SK AX는 운영 데이터 연결성과 전사 확산 체계를 함께 보여줄 필요가 있습니다.',
    },
  ],
  periodLabels: {
    yearly: '연간',
    quarterly: '분기',
    monthly: '월간',
  },
  periodDescriptions: {
    yearly: '연간 기준으로 투자, 사업 포트폴리오, 전략 방향 변화를 묶어봅니다.',
    quarterly: '분기 기준으로 실적 발표와 신규 메시지 변화를 비교합니다.',
    monthly: '월간 기준으로 보도량과 세부 테마 확산 흐름을 빠르게 확인합니다.',
  },
  analyses: {
    samsung_sds: {
      source: '2026 IR 전략 자료',
      title: 'AI Full Stack 중심의 사업 전환',
      summary:
        '삼성 SDS는 클라우드와 디지털 포워딩 기반에서 AI 인프라, AX·AI 서비스, AI 플랫폼·솔루션, 신사업을 축으로 Global AX Company 2031 비전을 제시하고 있습니다.',
      highlightsTitle: '2031 전략 방향',
      highlights: [
        '클라우드와 MSP 역량을 AI 인프라 사업으로 확장',
        '업종 특화 Agent 중심의 AX·AI 서비스 전환',
        'AI Orchestrator, Data Control Plane 등 플랫폼·솔루션 고도화',
        '지역 거점, 로봇, 디지털 자산, AI 데이터 플랫폼 등 신시장 진입',
      ],
      pillars: [
        { name: 'AI 인프라', details: ['GPUaaS/NPUaaS', '글로벌 CSP 연계', '소버린 AI 클라우드', '직접 투자 및 DC DBO'] },
        { name: 'AX·AI 서비스', details: ['Vertical AI Agent', 'AX 전담 조직 고객 AX 리드', '하이테크·금융·공공/기업 공략', 'AI Native 개발 체계'] },
        { name: 'AI 플랫폼·솔루션', details: ['AI Orchestrator', 'Data Control Plane', 'OpenAI·NVIDIA 협력', 'SAP·Salesforce·Workday 등 솔루션 AX 확대'] },
        { name: '신사업 확장', details: ['미주·아시아 지역 거점 구축', '로봇·디지털 자산 포트폴리오', 'AI·데이터 플랫폼', 'AIOps/MLOps 내재화'] },
      ],
    },
    lg_cns: {
      source: '2025년 상반기 IR 자료',
      title: '투자 영역과 누적 투자 현황',
      summary:
        'LG CNS는 AI & Enterprise S/W, Bio & Healthcare, Clean Tech & Sustainability를 중심으로 전략 투자를 확대하고 있으며 2025년 상반기 누적 투자 금액은 6,776억 원으로 제시되어 있습니다.',
      highlightsTitle: '주요 내용',
      highlights: [
        '2025년 상반기 누적 투자 6,776억 원',
        'A영역 70.1%, C영역 21.4%, 기타 4.8%, B영역 3.7% 비중',
        '최근 5개년 누적 투자 추이 상승',
        'AI 최적화 스토리지, 보안 인식 자동화, 모빌리티, 클린테크 발굴에 투자',
      ],
      pillars: [
        { name: 'AI & Enterprise S/W', details: ['Vast Data', '보안 인식 자동화 S/W', '누적 2,332억 원 규모', '통신·서비스·전자 중심 투자'] },
        { name: 'Bio & Healthcare', details: ['항체 기반 면역 치료제 개발', '암 치료제 개발', '누적 144억 원 규모', '화학·전자 연계 바이오 투자'] },
        { name: 'Clean Tech & Sustainability', details: ['카카오모빌리티 협력', 'Cleantech 기업 발굴', '누적 1,451억 원 규모', '전자·통신서비스 확장'] },
        { name: '투자 포트폴리오', details: ['A영역 70.1%', 'C영역 21.4%', '기타 4.8%', 'B영역 3.7%'] },
      ],
    },
    hyundai_autoever: {
      source: '2025년 실적 전망 IR 자료',
      title: '2025년 매출 성장 요인',
      summary:
        '현대 오토에버는 2025년 실적 전망에서 SI, ITO, 차량 SW 매출 증가와 환율 상승 효과를 주요 성장 요인으로 제시하고 있습니다.',
      highlightsTitle: '매출 성장률',
      highlights: [
        '2024년 5,051억 원 → 2025년 6,604억 원, +30.7%',
        '2024년 2,067억 원 → 2025년 3,383억 원, +63.6%',
        '2024년 681억 원 → 2025년 975억 원, +43.1%',
        '2024년 576억 원 → 2025년 669억 원, +16.2%',
      ],
      pillars: [
        { name: '성장 구간 1', details: ['MS 라이선스 계약 증가', 'Cisco 라이선스 계약 증가', 'CS 가입자 및 OTA 사용량 증가', '내비게이션 SW 직접판매'] },
        { name: '성장 구간 2', details: ['구독·라이선스 신규 사업 증가', 'ERP 인프라 고도화', '보안 운영 신규 계약', 'Google POI 라이선스 공급'] },
        { name: '성장 구간 3', details: ['신공장 인프라 공급 증가', 'HW·라이선스 공급 증가', '운영·유지보수 매출 증가', '공장 운영 매출 증가'] },
        { name: '성장 구간 4', details: ['그룹사 ERP 개선', 'OTA 시스템 구축', '인프라 통합 운영', '보안 통합 운영 증가'] },
      ],
    },
    posco_dx: {
      source: '2026 스마트팩토리 사업 자료',
      title: '산업 AI와 자동화 중심의 제조 혁신 확장',
      summary:
        '포스코 DX는 제철소 현장 경험을 기반으로 스마트팩토리, 산업 AI, 로봇 자동화를 결합한 실행형 AX 사업을 확대하고 있습니다.',
      highlightsTitle: '핵심 확장 포인트',
      highlights: [
        '제조 현장 최적화 중심의 산업 AI 레퍼런스 확보',
        '스마트팩토리와 자동화 설비 구축 역량 결합',
        '에너지·물류·안전 영역까지 운영 데이터 적용 범위 확대',
        '현장 실행 조직과 유지운영 체계를 함께 제안',
      ],
      pillars: [
        { name: '스마트팩토리', details: ['생산 계획 최적화', '공정 모니터링', '설비 이상 탐지', '현장 KPI 대시보드'] },
        { name: '산업 AI', details: ['품질 예측', '에너지 효율화', '작업 안전 분석', '운영 데이터 학습 체계'] },
        { name: '자동화 구축', details: ['로봇 자동화', '물류 자동화', '제어 시스템 연계', '현장 설비 통합'] },
        { name: '운영 확산', details: ['제조 계열사 확산', '유지보수 체계', '현장 운영 지원', '성과지표 관리'] },
      ],
    },
  },
};
