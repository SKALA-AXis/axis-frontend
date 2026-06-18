// 전략 컨텍스트(업로드) 표시 포맷 순수 유틸 (refactoring P2/stage3). SettingsView 에서 그대로 옮긴 것.

/** ISO 시각 → ko-KR(Asia/Seoul) 월일시분. 무효는 "방금". */
export function formatStrategyContextTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '방금';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

/** 바이트 → KB/MB 표시(0 이하는 "0 KB"). */
export function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 KB';
  }
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** 공백 정규화 미리보기(빈 내용은 "내용 없음"). */
export function strategyContextPreview(value: string) {
  return value.replace(/\s+/g, ' ').trim() || '내용 없음';
}
