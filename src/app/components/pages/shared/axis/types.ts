/*
 * 작성일: 2026-06-01
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-01 안가은 — 브리핑 믹서 사용자 화면 작업으로 타입 정의 추가 후 홈 키워드 급등/트렌드 인사이트 타입 보강
 */
export type PositioningTone = 'accent' | 'company' | 'infra' | 'security' | 'deal' | 'success';

export type PositioningPoint = {
  name: string;
  shortLabel: string;
  xScore: number;
  yScore: number;
  size: number;
  tone: PositioningTone;
  caption: string;
  impactTitle: string;
  impactBody: string;
  watchTitle: string;
  watchBody: string;
  insightBody: string;
  metrics: ReadonlyArray<{ label: string; value: string }>;
  evidenceNote: string;
};

export type KeywordSpikeInsight = {
  key: string;
  time: string;
  title: string;
  valueLabel: string;
  reason: string;
  skAxPoint: string;
  causeFactors?: Array<{
    rank?: number;
    keyword?: string;
    title?: string;
    description?: string;
    evidenceCount?: number;
  }>;
  evidence?: Array<Record<string, unknown>>;
};

export type DonutCalloutDatum = {
  name: string;
  value: number;
  color: string;
};
