// 브리핑 표시 텍스트 정제 순수 유틸 (refactoring P2/stage3). BriefingsView 에서 그대로 옮긴 것.

/** "<기간>에(는) " 선행 라벨 제거. */
export function stripLeadingRangeLabel(text: string, leadLabel: string) {
  if (text.startsWith(`${leadLabel}에는 `)) {
    return text.slice(`${leadLabel}에는 `.length);
  }
  if (text.startsWith(`${leadLabel}에 `)) {
    return text.slice(`${leadLabel}에 `.length);
  }
  return text;
}

/** 선행 번호(1. 2. ...) 제거 + 공백 정규화. */
export function normalizeBriefingText(text: string) {
  return text.replace(/(^|\s)\d+\.\s*/g, '$1').replace(/\s+/g, ' ').trim();
}

/** value 가 maxValue 초과면 maxValue, 빈값이면 maxValue. */
export function clampValue(value: string, maxValue: string) {
  if (!value) return maxValue;
  return value > maxValue ? maxValue : value;
}
