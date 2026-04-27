import type { Issue } from '../../entities/issue/model';

export const mockIssues: Issue[] = [
  {
    id: 'IC-20260422-001',
    peerId: 'samsung_sds',
    peerName: '삼성SDS',
    title: '생성형 AI 운영 플랫폼을 제조/금융 레퍼런스로 확장',
    summaryLines: [
      '대기업 고객의 업무 프로세스에 생성형 AI를 내재화하는 운영 플랫폼 메시지 강화',
      '제조와 금융 레퍼런스를 전면에 내세워 산업별 AX 경쟁 구도에 영향',
      '프론트에서는 이 데이터를 화면이 아니라 저장소 계층에서 주입받도록 분리해야 함',
    ],
    importance: 'urgent',
    createdAt: '2026-04-22T08:30:00Z',
    sourceUrl: 'https://example.com/issues/IC-20260422-001',
  },
  {
    id: 'IC-20260422-002',
    peerId: 'lg_cns',
    peerName: 'LG CNS',
    title: '금융권 대상 AI·클라우드 보안 패키지 출시',
    summaryLines: [
      '보안과 컴플라이언스 요구를 AI 도입 패키지와 함께 제안',
      'AI 분석 결과와 사람이 검토한 상태를 분리 저장할 필요가 있음',
    ],
    importance: 'notable',
    createdAt: '2026-04-22T07:15:00Z',
    sourceUrl: 'https://example.com/issues/IC-20260422-002',
  },
  {
    id: 'IC-20260422-003',
    peerId: 'hyundai_autoever',
    peerName: '현대오토에버',
    title: 'SDV 데이터 플랫폼 외부 고객 적용 사례 공개',
    summaryLines: [
      '자동차 SW 경험을 제조 데이터 플랫폼 사업으로 확장',
      '향후 상세 화면에서는 기사 원문, AI 초안, 검수본을 분리해야 함',
    ],
    importance: 'reference',
    createdAt: '2026-04-21T16:45:00Z',
    sourceUrl: 'https://example.com/issues/IC-20260422-003',
  },
];
