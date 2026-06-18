/*
 * 작성일: 2026-06-09
 * 작성자: 최종민
 * 변경이력:
 *   2026-06-09 최종민 — 홈 인사이트 anchor_date 및 브리핑 생성 클라이언트 추가
 *   2026-06-14 안가은 — 브리핑·믹서 표시 동작 수정
 */
import type { BriefingPeriod } from '../data/periodMeta';

export type BriefingRange = {
  seedKey: string;
  title: string;
  window: string;
  leadLabel: string;
  displayLabel: string;
};

export function toDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toMonthInputValue(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function formatKoreanDate(value: string): string {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '');
}

export function formatKoreanMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return '이번 달';
  return `${year}년 ${month}월`;
}

export function getMonthNumber(value: string): number {
  const month = Number(value.split('-')[1]);
  return Number.isFinite(month) && month > 0 ? month : new Date().getMonth() + 1;
}

export function getWeekLabel(index: number): string {
  return ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주'][index - 1] ?? `${index}주차`;
}

export function getWeekOptions(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const safeYear = year || fallback.getFullYear();
  const safeMonth = month || fallback.getMonth() + 1;
  const lastDate = new Date(safeYear, safeMonth, 0).getDate();
  const weekCount = Math.ceil(lastDate / 7);

  return Array.from({ length: weekCount }, (_, index) => {
    const week = index + 1;
    const startDay = index * 7 + 1;
    const endDay = Math.min(lastDate, startDay + 6);
    const monthLabel = `${safeMonth}월`;
    return {
      value: week,
      label: `${monthLabel} ${getWeekLabel(week)}`,
      range: `${safeYear}.${String(safeMonth).padStart(2, '0')}.${String(startDay).padStart(2, '0')} - ${String(safeMonth).padStart(2, '0')}.${String(endDay).padStart(2, '0')}`,
    };
  });
}

export function getWeekStartDateValue(monthValue: string, weekIndex: number): string {
  const [rawYear, rawMonth] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const year = rawYear || fallback.getFullYear();
  const month = rawMonth || fallback.getMonth() + 1;
  const safeWeekIndex = Math.max(1, Math.min(5, Number.isFinite(weekIndex) ? weekIndex : 1));
  const startDay = (safeWeekIndex - 1) * 7 + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
}

export function getWeekEndDateValue(monthValue: string, weekIndex: number): string {
  const [rawYear, rawMonth] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const year = rawYear || fallback.getFullYear();
  const month = rawMonth || fallback.getMonth() + 1;
  const lastDate = new Date(year, month, 0).getDate();
  const safeWeekIndex = Math.max(1, Math.min(5, Number.isFinite(weekIndex) ? weekIndex : 1));
  const endDay = Math.min(lastDate, safeWeekIndex * 7);
  return `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}

export function getWeekAnchorDateValue(
  monthValue: string,
  weekIndex: number,
  todayValue = toDateInputValue(),
): string {
  const startDate = getWeekStartDateValue(monthValue, weekIndex);
  const endDate = getWeekEndDateValue(monthValue, weekIndex);
  if (monthValue === todayValue.slice(0, 7) && startDate <= todayValue && todayValue <= endDate) {
    return todayValue;
  }
  return endDate;
}

export function getMonthAnchorDateValue(monthValue: string, todayValue = toDateInputValue()): string {
  const [rawYear, rawMonth] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const year = rawYear || fallback.getFullYear();
  const month = rawMonth || fallback.getMonth() + 1;
  if (monthValue === todayValue.slice(0, 7)) {
    return todayValue;
  }
  const lastDate = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
}

export function buildBriefingRange(
  period: BriefingPeriod,
  dailyDate: string,
  weeklyMonth: string,
  weekIndex: number,
  monthlyMonth: string,
): BriefingRange {
  if (period === 'daily') {
    const dateLabel = formatKoreanDate(dailyDate);
    return {
      seedKey: `daily-${dailyDate}`,
      title: `${dateLabel} 일간 브리핑`,
      window: `${dateLabel} 감지 카드뉴스 기반`,
      leadLabel: dateLabel,
      displayLabel: dateLabel,
    };
  }

  if (period === 'weekly') {
    const month = getMonthNumber(weeklyMonth);
    const weekOptions = getWeekOptions(weeklyMonth);
    const selectedWeek = weekOptions.find((item) => item.value === weekIndex) ?? weekOptions[0];
    const label = selectedWeek?.label ?? `${month}월 ${getWeekLabel(1)}`;
    const range = selectedWeek?.range ?? formatKoreanMonth(weeklyMonth);
    return {
      seedKey: `weekly-${weeklyMonth}-${selectedWeek?.value ?? 1}`,
      title: `${label} 브리핑`,
      window: `${label} 카드뉴스 종합 · ${range}`,
      leadLabel: label,
      displayLabel: label,
    };
  }

  const monthLabel = formatKoreanMonth(monthlyMonth);
  return {
    seedKey: `monthly-${monthlyMonth}`,
    title: `${monthLabel} 브리핑`,
    window: `${monthLabel} 카드뉴스 종합`,
    leadLabel: monthLabel,
    displayLabel: monthLabel,
  };
}

/** axis-ai briefing/generate anchor_date (daily=일자, weekly/monthly=선택 기간의 누적 종료일). */
export function toBriefingAnchorDate(
  period: BriefingPeriod,
  dailyDate: string,
  weeklyMonth: string,
  weekIndex: number,
  monthlyMonth: string,
): string {
  if (period === 'daily') {
    return dailyDate;
  }
  if (period === 'monthly') {
    return getMonthAnchorDateValue(monthlyMonth);
  }
  return getWeekAnchorDateValue(weeklyMonth, weekIndex);
}
