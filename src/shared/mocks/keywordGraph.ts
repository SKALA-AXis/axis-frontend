export type KeywordNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  category: '기업' | 'AX' | '보안' | '인프라' | '수주';
  score: number;
  changeRate: number;
  sourceType: string;
};

export type KeywordEdge = {
  source: string;
  target: string;
  weight: number;
  relationType: string;
};

export const graphNodes: KeywordNode[] = [
  { id: 'sk-axis', label: 'SK AX', x: 450, y: 280, size: 42, category: '기업', score: 96, changeRate: 18, sourceType: 'home' },
  { id: 'samsung-sds', label: '삼성SDS', x: 155, y: 118, size: 38, category: '기업', score: 91, changeRate: 13, sourceType: 'peer' },
  { id: 'lg-cns', label: 'LG CNS', x: 742, y: 124, size: 38, category: '기업', score: 89, changeRate: 16, sourceType: 'peer' },
  { id: 'hyundai-autoever', label: '현대오토에버', x: 174, y: 446, size: 38, category: '기업', score: 84, changeRate: 9, sourceType: 'peer' },
  { id: 'posco-dx', label: '포스코DX', x: 744, y: 450, size: 38, category: '기업', score: 86, changeRate: 14, sourceType: 'peer' },
  { id: 'axis', label: 'AX', x: 450, y: 196, size: 25, category: 'AX', score: 95, changeRate: 19, sourceType: 'home' },
  { id: 'ai-transformation', label: 'AI Transformation', x: 318, y: 162, size: 20, category: 'AX', score: 87, changeRate: 20, sourceType: 'cardnews' },
  { id: 'ai-shift', label: 'AI 전환', x: 600, y: 172, size: 20, category: 'AX', score: 82, changeRate: 15, sourceType: 'home' },
  { id: 'agentic-ai', label: '에이전틱 AI', x: 512, y: 112, size: 22, category: 'AX', score: 88, changeRate: 22, sourceType: 'cardnews' },
  { id: 'llm', label: 'LLM', x: 242, y: 66, size: 17, category: 'AX', score: 69, changeRate: 7, sourceType: 'insight' },
  { id: 'rag', label: 'RAG', x: 322, y: 72, size: 16, category: 'AX', score: 65, changeRate: 6, sourceType: 'insight' },
  { id: 'ai-agent', label: 'AI 에이전트', x: 656, y: 64, size: 19, category: 'AX', score: 81, changeRate: 14, sourceType: 'cardnews' },
  { id: 'generative-ai', label: '생성형 AI', x: 110, y: 218, size: 18, category: 'AX', score: 78, changeRate: 11, sourceType: 'cardnews' },
  { id: 'digital-twin', label: '디지털 트윈', x: 260, y: 382, size: 20, category: 'AX', score: 78, changeRate: 11, sourceType: 'peer' },
  { id: 'smart-factory', label: '스마트팩토리', x: 92, y: 520, size: 21, category: 'AX', score: 83, changeRate: 12, sourceType: 'peer' },
  { id: 'automation', label: '업무 자동화', x: 320, y: 505, size: 18, category: 'AX', score: 72, changeRate: 9, sourceType: 'home' },
  { id: 'security', label: '보안', x: 104, y: 302, size: 20, category: '보안', score: 79, changeRate: 12, sourceType: 'briefing' },
  { id: 'zero-trust', label: '제로트러스트', x: 230, y: 225, size: 17, category: '보안', score: 67, changeRate: 8, sourceType: 'cardnews' },
  { id: 'xdr', label: 'XDR', x: 62, y: 386, size: 16, category: '보안', score: 61, changeRate: 4, sourceType: 'cardnews' },
  { id: 'cloud-security', label: '클라우드 보안', x: 585, y: 376, size: 18, category: '보안', score: 70, changeRate: 10, sourceType: 'peer' },
  { id: 'cloud', label: '클라우드', x: 805, y: 236, size: 20, category: '인프라', score: 74, changeRate: 6, sourceType: 'peer' },
  { id: 'msp', label: 'MSP', x: 690, y: 220, size: 17, category: '인프라', score: 63, changeRate: 4, sourceType: 'news' },
  { id: 'datacenter', label: '데이터센터', x: 810, y: 345, size: 18, category: '인프라', score: 68, changeRate: 5, sourceType: 'insight' },
  { id: 'gpu', label: 'GPU 클러스터', x: 632, y: 520, size: 18, category: '인프라', score: 66, changeRate: 7, sourceType: 'cardnews' },
  { id: 'kubernetes', label: 'Kubernetes', x: 520, y: 492, size: 15, category: '인프라', score: 52, changeRate: 2, sourceType: 'news' },
  { id: 'deal', label: '수주', x: 588, y: 302, size: 22, category: '수주', score: 80, changeRate: 13, sourceType: 'news' },
  { id: 'mega-deal', label: '메가딜', x: 790, y: 65, size: 18, category: '수주', score: 71, changeRate: 10, sourceType: 'news' },
  { id: 'contract', label: '공급 계약', x: 694, y: 302, size: 16, category: '수주', score: 62, changeRate: 6, sourceType: 'peer' },
  { id: 'preferred', label: '우선협상대상자', x: 842, y: 525, size: 18, category: '수주', score: 73, changeRate: 12, sourceType: 'cardnews' },
  { id: 'public', label: '디지털플랫폼정부', x: 628, y: 38, size: 17, category: '수주', score: 64, changeRate: 9, sourceType: 'news' },
];

export const graphEdges: KeywordEdge[] = [
  { source: 'sk-axis', target: 'axis', weight: 5, relationType: '핵심 축' },
  { source: 'sk-axis', target: 'agentic-ai', weight: 4, relationType: '차별화' },
  { source: 'sk-axis', target: 'cloud-security', weight: 3, relationType: '거버넌스' },
  { source: 'sk-axis', target: 'deal', weight: 3, relationType: '제안 근거' },
  { source: 'samsung-sds', target: 'generative-ai', weight: 4, relationType: 'FabriX 신호' },
  { source: 'samsung-sds', target: 'llm', weight: 3, relationType: 'AI 플랫폼' },
  { source: 'samsung-sds', target: 'rag', weight: 3, relationType: '지식 검색' },
  { source: 'samsung-sds', target: 'zero-trust', weight: 3, relationType: '보안' },
  { source: 'lg-cns', target: 'ai-shift', weight: 4, relationType: 'AX 전환' },
  { source: 'lg-cns', target: 'ai-agent', weight: 4, relationType: 'AI agent' },
  { source: 'lg-cns', target: 'cloud', weight: 3, relationType: '클라우드' },
  { source: 'lg-cns', target: 'mega-deal', weight: 3, relationType: '수주' },
  { source: 'hyundai-autoever', target: 'digital-twin', weight: 4, relationType: '제조 데이터' },
  { source: 'hyundai-autoever', target: 'smart-factory', weight: 4, relationType: '스마트팩토리' },
  { source: 'hyundai-autoever', target: 'automation', weight: 3, relationType: '업무 자동화' },
  { source: 'hyundai-autoever', target: 'security', weight: 2, relationType: '운영 보안' },
  { source: 'posco-dx', target: 'gpu', weight: 3, relationType: 'AI 인프라' },
  { source: 'posco-dx', target: 'datacenter', weight: 3, relationType: '데이터센터' },
  { source: 'posco-dx', target: 'preferred', weight: 4, relationType: '공공 수주' },
  { source: 'posco-dx', target: 'contract', weight: 3, relationType: '계약' },
  { source: 'axis', target: 'ai-transformation', weight: 5, relationType: 'AX 상위 키워드' },
  { source: 'axis', target: 'ai-shift', weight: 4, relationType: '전환' },
  { source: 'axis', target: 'agentic-ai', weight: 5, relationType: '에이전틱' },
  { source: 'axis', target: 'smart-factory', weight: 3, relationType: '제조 AX' },
  { source: 'ai-transformation', target: 'agentic-ai', weight: 4, relationType: 'AI 연결' },
  { source: 'agentic-ai', target: 'llm', weight: 3, relationType: '기술 기반' },
  { source: 'llm', target: 'rag', weight: 2, relationType: '검색 증강' },
  { source: 'security', target: 'zero-trust', weight: 3, relationType: '거버넌스' },
  { source: 'security', target: 'xdr', weight: 2, relationType: '탐지 대응' },
  { source: 'security', target: 'cloud-security', weight: 3, relationType: '클라우드 보안' },
  { source: 'cloud', target: 'msp', weight: 2, relationType: '운영 관리' },
  { source: 'cloud', target: 'cloud-security', weight: 3, relationType: '보안 내재화' },
  { source: 'datacenter', target: 'gpu', weight: 2, relationType: 'AI 인프라' },
  { source: 'gpu', target: 'kubernetes', weight: 2, relationType: '컨테이너' },
  { source: 'deal', target: 'mega-deal', weight: 3, relationType: '대형 수주' },
  { source: 'deal', target: 'contract', weight: 2, relationType: '계약' },
  { source: 'deal', target: 'preferred', weight: 3, relationType: '선정' },
  { source: 'preferred', target: 'public', weight: 2, relationType: '공공 사업' },
  { source: 'public', target: 'cloud', weight: 2, relationType: '정부 클라우드' },
];

export const graphCategoryColor: Record<KeywordNode['category'], string> = {
  기업: 'var(--axis-graph-company)',
  AX: 'var(--axis-graph-ax)',
  보안: 'var(--axis-graph-security)',
  인프라: 'var(--axis-graph-infra)',
  수주: 'var(--axis-graph-deal)',
};

export const graphCompanyAliases: Record<string, string[]> = {
  'sk-axis': ['SK AX', 'SKAX', 'AX', 'AI 전환', '수주'],
  'samsung-sds': ['삼성SDS', '삼성 SDS', 'Samsung SDS', 'FabriX'],
  'lg-cns': ['LG CNS', 'LGCNS', 'DAP GenAI'],
  'hyundai-autoever': ['현대오토에버', '현대 오토에버', 'AutoEver', '스마트팩토리'],
  'posco-dx': ['포스코DX', '포스코 DX', '디지털플랫폼정부', '메가딜'],
};
