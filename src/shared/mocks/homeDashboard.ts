/**
 * 홈 대시보드 mock 데이터.
 * - 시계열 (선그래프): peer 별 일별 카드뉴스 노출량
 * - DART (레이더): peer 별 재무 지표 정규화
 * - 수주 (막대): peer 별 최근 분기 수주 가속도
 *
 * 추후 axis-infra/openapi.yaml 연동 시 같은 모양의 응답 객체로 대체.
 */

export type DailyExposurePoint = {
  date: string;          /* YYYY-MM-DD */
  samsung_sds: number;
  lg_cns: number;
  hyundai_autoever: number;
  posco_dx: number;
  sk_ax: number;
};

export const dailyExposureSeries: DailyExposurePoint[] = [
  { date: '04-29', samsung_sds: 8,  lg_cns: 12, hyundai_autoever: 5,  posco_dx: 7,  sk_ax: 9 },
  { date: '04-30', samsung_sds: 10, lg_cns: 11, hyundai_autoever: 6,  posco_dx: 6,  sk_ax: 11 },
  { date: '05-01', samsung_sds: 7,  lg_cns: 14, hyundai_autoever: 8,  posco_dx: 9,  sk_ax: 10 },
  { date: '05-02', samsung_sds: 14, lg_cns: 13, hyundai_autoever: 7,  posco_dx: 10, sk_ax: 12 },
  { date: '05-03', samsung_sds: 11, lg_cns: 18, hyundai_autoever: 9,  posco_dx: 8,  sk_ax: 13 },
  { date: '05-04', samsung_sds: 13, lg_cns: 16, hyundai_autoever: 12, posco_dx: 11, sk_ax: 14 },
  { date: '05-05', samsung_sds: 9,  lg_cns: 15, hyundai_autoever: 14, posco_dx: 13, sk_ax: 15 },
  { date: '05-06', samsung_sds: 12, lg_cns: 17, hyundai_autoever: 11, posco_dx: 16, sk_ax: 16 },
  { date: '05-07', samsung_sds: 16, lg_cns: 19, hyundai_autoever: 13, posco_dx: 14, sk_ax: 18 },
];

/* DART 재무 지표 (정규화 0–100) — 레이더 */
export type DartRadarPoint = {
  metric: string;
  samsung_sds: number;
  lg_cns: number;
  hyundai_autoever: number;
  posco_dx: number;
  sk_ax: number;
};

export const dartRadarSeries: DartRadarPoint[] = [
  { metric: '매출 성장',  samsung_sds: 72, lg_cns: 88, hyundai_autoever: 65, posco_dx: 70, sk_ax: 78 },
  { metric: '영업이익률', samsung_sds: 65, lg_cns: 82, hyundai_autoever: 70, posco_dx: 68, sk_ax: 74 },
  { metric: 'R&D 투자',   samsung_sds: 90, lg_cns: 76, hyundai_autoever: 60, posco_dx: 55, sk_ax: 80 },
  { metric: '수주잔고',   samsung_sds: 78, lg_cns: 70, hyundai_autoever: 72, posco_dx: 85, sk_ax: 82 },
  { metric: 'AX 매출',    samsung_sds: 70, lg_cns: 92, hyundai_autoever: 55, posco_dx: 60, sk_ax: 76 },
  { metric: '해외 비중',  samsung_sds: 85, lg_cns: 64, hyundai_autoever: 78, posco_dx: 72, sk_ax: 68 },
];

/* Peer 별 수주 가속도 (전분기 대비 %) — 막대 */
export type DealAccelerationPoint = {
  peer: string;
  peer_id: 'samsung_sds' | 'lg_cns' | 'hyundai_autoever' | 'posco_dx' | 'sk_ax';
  accel_pct: number;       /* 전분기 대비 수주액 변화율 */
  deal_count: number;
};

export const dealAcceleration: DealAccelerationPoint[] = [
  { peer: '삼성SDS',     peer_id: 'samsung_sds',      accel_pct:  12.4, deal_count: 8 },
  { peer: 'LG CNS',      peer_id: 'lg_cns',            accel_pct:  28.1, deal_count: 12 },
  { peer: '현대오토에버', peer_id: 'hyundai_autoever',  accel_pct:  -4.2, deal_count: 5 },
  { peer: '포스코DX',    peer_id: 'posco_dx',          accel_pct:  35.7, deal_count: 9 },
  { peer: 'SK AX',       peer_id: 'sk_ax',             accel_pct:  18.3, deal_count: 7 },
];

/* 오늘의 동향 요약 (메인 카드용) */
export const todayTrendSummary = {
  headline: '포스코DX 공공 메가딜 + LG CNS AX 매출 성장이 이번 주 변화를 이끕니다',
  changeSummary: 'Peer 4사 합산 수주 가속도가 전주 대비 +14% 증가, 그 중 포스코DX 1,200억 단일 수주가 핵심 동인입니다. SK AX 자사는 R&D 투자 증가가 LG CNS 와의 격차를 좁히는 신호로 관찰됩니다.',
  rising: ['디지털플랫폼정부', '공공 메가딜', 'AX 매출 성장', 'GPU 클러스터 내재화'],
  falling: ['단순 챗봇 PoC', '단발성 데모 제안'],
  changeRateWow: 14.2,    /* 전주 대비 % */
  changeRateMom: 8.7,     /* 전월 대비 % */
};
