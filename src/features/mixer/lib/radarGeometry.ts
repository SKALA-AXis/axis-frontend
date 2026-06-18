// Mixer 레이더 차트 SVG 좌표 계산용 순수 헬퍼 (refactoring P2). MixerView 에서 그대로 옮긴 것.

export const RADAR_CHART_RADIUS = 86;
export const RADAR_LABEL_RADIUS = RADAR_CHART_RADIUS + 22;
export const RADAR_GRID_LEVELS = [0.25, 0.5, 0.75, 1];

/** 점수를 [0,1] 로 클램프, 비유한수는 0. */
export function clampRadarScore(score: number) {
  return Math.max(0, Math.min(Number.isFinite(score) ? score : 0, 1));
}

/** index/total 축의 점수 반영 좌표(12시 방향 시작, 시계방향). */
export function radarPoint(index: number, total: number, score = 1) {
  const safeTotal = Math.max(total, 1);
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / safeTotal;
  const radius = RADAR_CHART_RADIUS * clampRadarScore(score);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/** index/total 축의 라벨 좌표(라벨 반지름 고정). */
export function radarLabelPoint(index: number, total: number) {
  const safeTotal = Math.max(total, 1);
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / safeTotal;
  return {
    x: Math.cos(angle) * RADAR_LABEL_RADIUS,
    y: Math.sin(angle) * RADAR_LABEL_RADIUS,
  };
}
