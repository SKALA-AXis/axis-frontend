/**
 * 한국 회계 단위 (억/조) 포맷터.
 *
 * value 단위: 억 (KRW 100,000,000 = 1억).
 * - >= 10,000억 → "X.XX조"
 * - < 10,000억 → "X,XXX억" (천 단위 구분)
 *
 * PeerPlusView 의 DART 재무 요약에서 매출/영업이익 표시에 사용.
 */
export function formatEokValue(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}조`;
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)}억`;
}
