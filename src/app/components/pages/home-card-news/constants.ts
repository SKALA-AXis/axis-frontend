import { Copy, Mail, Send } from 'lucide-react';

import type { ShareTargetId } from './types';

export const keywordPalette = ['#DC5A24', '#E0822F', '#ECA341', '#F2C56B', '#A85F00', '#5A6B57', '#EA002C'];

export const keywordCategories: Record<string, { name_ko: string; keywords: string[] }> = {
  ax: {
    name_ko: 'AX',
    keywords: [
      'AX', 'AI Transformation', 'AI 전환', 'AI 혁신', '디지털 전환', 'DX',
      '제조AX', '제조 AX', '엔터프라이즈 AI', '에이전틱AI', '에이전틱 AI', 'agentic AI',
      'AI 에이전트', 'AI agent', '생성형 AI', 'generative AI', 'LLM', 'RAG',
      'AI 플랫폼', 'AI 팩토리', '스마트팩토리', 'smart factory',
      '디지털 트윈', 'digital twin', '업무 자동화', '프로세스 최적화', '운영 최적화',
    ],
  },
  security: {
    name_ko: '보안',
    keywords: [
      '보안', '사이버보안', '정보보안', '정보보호', '제로트러스트', 'ZTA',
      'EDR', 'XDR', 'SOC', '관제', '취약점', '랜섬웨어', '침해', '해킹',
      '데이터 유출', '개인정보', 'ISMS', 'ISMS-P',
      '클라우드 보안', 'AI 보안', 'AI security', 'secure AI', '프롬프트 인젝션',
    ],
  },
  infra: {
    name_ko: '인프라',
    keywords: [
      '인프라', 'IT 인프라', '클라우드', 'cloud', '클라우드 전환', '클라우드 관리',
      'MSP', 'managed service provider', '데이터센터', '데이터 센터', 'IDC',
      'GPU', 'GPU 클러스터', 'AI 인프라', '서버', '네트워크', '스토리지',
      '가상화', '쿠버네티스', 'Kubernetes', '컨테이너',
      '프라이빗 클라우드', '하이브리드 클라우드', '망분리',
    ],
  },
  deal: {
    name_ko: '수주',
    keywords: [
      '수주', '대형 수주', '메가딜', '단일 수주', '프로젝트 수주', '계약', '공급 계약',
      '사업자 선정', '우선협상대상자', 'MOU', '업무협약', '양해각서', '협약',
      '정부 협약', '정부', '공공', '공공 사업', '조달청', '디지털플랫폼정부',
      '인수', '합병', '인수합병', 'M&A', '지분 인수', '지분 투자', '투자 유치',
    ],
  },
};

export const keywordKeys = Object.keys(keywordCategories);

export const shareTargets: ReadonlyArray<{
  id: ShareTargetId;
  label: string;
  icon: typeof Copy | typeof Mail | typeof Send;
}> = [
  { id: 'copy', label: '링크 복사', icon: Copy },
  { id: 'mail', label: '이메일 공유', icon: Mail },
  { id: 'native', label: '기기 공유', icon: Send },
] as const;
