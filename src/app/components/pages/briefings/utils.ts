/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편 시 브리핑 유틸 추가 및 후속 정리
 *   2026-05-29 안가은 — 브리핑/믹서 페이지 구성 수정 및 글자 크기 조절 반영
 *   2026-06-11 박진 — 챗봇 플로우 연동에 맞춰 수정
 */
import type { BriefingPeriod, BriefingRange } from './types';

export function getBriefingFocusTitle(period: BriefingPeriod) {
  if (period === 'weekly') return '이번 주 핵심 변화';
  if (period === 'monthly') return '이번 달 핵심 변화';
  return '오늘의 핵심 변화';
}

export const periodMeta: Record<BriefingPeriod, { label: string; title: string; window: string; count: number }> = {
  daily: {
    label: '일간',
    title: '오늘 브리핑',
    window: '오늘 감지된 카드뉴스 기반',
    count: 4,
  },
  weekly: {
    label: '주간',
    title: '이번 주 브리핑',
    window: '최근 7일 경쟁사 신호 종합',
    count: 6,
  },
  monthly: {
    label: '월간',
    title: '이번 달 브리핑',
    window: '월간 AX 시장 변화 요약',
    count: 8,
  },
};

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toMonthInputValue(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function formatKoreanDate(value: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '');
}

export function formatKoreanMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return '이번 달';
  return `${year}년 ${month}월`;
}

function getMonthNumber(value: string) {
  const month = Number(value.split('-')[1]);
  return Number.isFinite(month) && month > 0 ? month : new Date().getMonth() + 1;
}

function getWeekLabel(index: number) {
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

export function getWeekStartDateValue(monthValue: string, weekIndex: number) {
  const [rawYear, rawMonth] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const year = rawYear || fallback.getFullYear();
  const month = rawMonth || fallback.getMonth() + 1;
  const safeWeekIndex = Math.max(1, Math.min(5, Number.isFinite(weekIndex) ? weekIndex : 1));
  const startDay = (safeWeekIndex - 1) * 7 + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
}

export function getWeekEndDateValue(monthValue: string, weekIndex: number) {
  const [rawYear, rawMonth] = monthValue.split('-').map(Number);
  const fallback = new Date();
  const year = rawYear || fallback.getFullYear();
  const month = rawMonth || fallback.getMonth() + 1;
  const lastDate = new Date(year, month, 0).getDate();
  const safeWeekIndex = Math.max(1, Math.min(5, Number.isFinite(weekIndex) ? weekIndex : 1));
  const endDay = Math.min(lastDate, safeWeekIndex * 7);
  return `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}

export function getWeekAnchorDateValue(monthValue: string, weekIndex: number, todayValue = toDateInputValue()) {
  const startDate = getWeekStartDateValue(monthValue, weekIndex);
  const endDate = getWeekEndDateValue(monthValue, weekIndex);
  if (monthValue === todayValue.slice(0, 7) && startDate <= todayValue && todayValue <= endDate) {
    return todayValue;
  }
  return endDate;
}

function getWeekRangeLabel(monthValue: string, weekIndex: number, todayValue = toDateInputValue()) {
  const startDate = getWeekStartDateValue(monthValue, weekIndex);
  const endDate = getWeekAnchorDateValue(monthValue, weekIndex, todayValue);
  const [startYear, startMonth, startDay] = startDate.split('-');
  const [, endMonth, endDay] = endDate.split('-');
  return `${startYear}.${startMonth}.${startDay} - ${endMonth}.${endDay}`;
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
    const range = selectedWeek ? getWeekRangeLabel(weeklyMonth, selectedWeek.value) : formatKoreanMonth(weeklyMonth);
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
