// Peer+ 표시용 숫자/추세 포맷 순수 유틸 (refactoring P2/stage3). PeerPlusView 에서 그대로 옮긴 것.

/** 소수 자리 정리(불필요한 끝 0 제거). */
export function trimDecimal(value: number, digits: number) {
  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

/** 억 단위 → 조/억 표시. null/NaN 은 "-". */
export function formatKrwBn(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  const absolute = Math.abs(value);
  if (absolute >= 10000) {
    const jo = value / 10000;
    return `${trimDecimal(jo, 2)}조`;
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)}억`;
}

/** 퍼센트 표시. null/NaN 은 "-". */
export function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${trimDecimal(value, 2)}%`;
}

/** QoQ 퍼센트(부호 포함). null/NaN 은 null. */
export function formatQoqPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${trimDecimal(value, 2)}%`;
}

/** QoQ 퍼센트포인트(부호 포함). null/NaN 은 null. */
export function formatQoqPctPoint(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${trimDecimal(value, 2)}%p`;
}

/** 추세 부호별 색상 클래스. */
export function trendToneClass(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value === 0) return 'text-[var(--axis-muted)]';
  return value > 0 ? 'text-[#d3432b]' : 'text-[#2563eb]';
}
