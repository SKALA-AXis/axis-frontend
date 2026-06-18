import { describe, expect, it } from 'vitest';
import {
  buildEvidenceReason,
  normalizeEvidenceText,
  sanitizeObjectivePeerFlowText,
  stripEvidenceStageLabels,
  toPublicEvidenceText,
} from './peerEvidenceText';

describe('normalizeEvidenceText', () => {
  it('공백 정규화', () => {
    expect(normalizeEvidenceText('  a   b  ')).toBe('a b');
  });
});

describe('toPublicEvidenceText', () => {
  it('내부 마커를 공개 근거로 치환', () => {
    expect(toPublicEvidenceText('raw_articles 기반')).toBe('공개 근거 기반');
    expect(toPublicEvidenceText('signal:12 확인')).toBe('공개 근거 확인');
  });
});

describe('buildEvidenceReason', () => {
  it('해석 우선, 없으면 출처', () => {
    expect(buildEvidenceReason('출처', '해석')).toBe('해석');
    expect(buildEvidenceReason('출처', '   ')).toBe('출처');
  });
});

describe('stripEvidenceStageLabels', () => {
  it('단계 라벨 제거', () => {
    expect(stripEvidenceStageLabels('진행 내용: 협력 확대')).toBe('협력 확대');
  });
});

describe('sanitizeObjectivePeerFlowText', () => {
  it('주관/비교 표현 객관화', () => {
    expect(sanitizeObjectivePeerFlowText('SK AX 대비 우위')).toBe('우위');
    expect(sanitizeObjectivePeerFlowText('자사 역량 강화')).toBe('해당 기업 역량 강화');
  });
});
