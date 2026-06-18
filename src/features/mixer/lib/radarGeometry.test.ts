import { describe, expect, it } from 'vitest';
import {
  RADAR_GRID_LEVELS,
  RADAR_LABEL_RADIUS,
  clampRadarScore,
  radarLabelPoint,
  radarPoint,
} from './radarGeometry';

describe('clampRadarScore', () => {
  it('[0,1] 로 클램프, 비유한수는 0', () => {
    expect(clampRadarScore(0.5)).toBe(0.5);
    expect(clampRadarScore(1.5)).toBe(1);
    expect(clampRadarScore(-0.5)).toBe(0);
    expect(clampRadarScore(Number.NaN)).toBe(0);
  });
});

describe('radarPoint', () => {
  it('index 0 은 12시 방향(위), score 로 반지름 스케일', () => {
    const top = radarPoint(0, 4, 1);
    expect(top.x).toBeCloseTo(0);
    expect(top.y).toBeCloseTo(-86);

    const half = radarPoint(0, 4, 0.5);
    expect(half.y).toBeCloseTo(-43);
  });
  it('index 1/4 은 3시 방향(오른쪽)', () => {
    const right = radarPoint(1, 4, 1);
    expect(right.x).toBeCloseTo(86);
    expect(right.y).toBeCloseTo(0);
  });
});

describe('radarLabelPoint', () => {
  it('라벨 반지름(108) 고정', () => {
    const top = radarLabelPoint(0, 4);
    expect(top.x).toBeCloseTo(0);
    expect(top.y).toBeCloseTo(-RADAR_LABEL_RADIUS);
    expect(RADAR_LABEL_RADIUS).toBe(108);
  });
});

describe('RADAR_GRID_LEVELS', () => {
  it('4단계', () => {
    expect(RADAR_GRID_LEVELS).toEqual([0.25, 0.5, 0.75, 1]);
  });
});
