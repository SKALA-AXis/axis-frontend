// Mixer 필터 옵션 집계/병합 + 회사 키워드 판별 순수 유틸 (refactoring P2/stage3).
// MixerView 에서 그대로 옮긴 것.

export type MixerFilterOption = {
  value: string;
  label: string;
  count: number;
};

// 필터 옵션에서 제외할 회사명 키워드(회사는 별도 peer 필터로 다룸).
const MIXER_COMPANY_KEYWORD_BLOCKLIST = [
  '삼성SDS',
  '삼성 SDS',
  'Samsung SDS',
  'LG CNS',
  '엘지씨엔에스',
  '현대오토에버',
  '현대 오토에버',
  'Hyundai AutoEver',
  '포스코DX',
  '포스코 DX',
  'POSCO DX',
  'SK AX',
  'SK C&C',
  'SK주식회사',
  'SK',
];

/** 필터 값 정규화(문자열화 + trim). */
export function normalizeMixerFilterValue(value: unknown) {
  return String(value ?? '').trim();
}

/** 비교용 키워드 정규화(소문자 + 공백/._- 제거). */
export function normalizeMixerKeywordForCompare(value: string) {
  return value.toLowerCase().replace(/[\s._-]/g, '');
}

/** 회사명 키워드인지(블록리스트 대조, 2자 이하는 정확일치). */
export function isCompanyKeyword(value: string) {
  const normalized = normalizeMixerKeywordForCompare(value);
  return MIXER_COMPANY_KEYWORD_BLOCKLIST.some((company) => {
    const companyValue = normalizeMixerKeywordForCompare(company);
    if (companyValue.length <= 2) return normalized === companyValue;
    return normalized === companyValue || normalized.includes(companyValue);
  });
}

/** 값 목록 → {value,label,count} 옵션(빈도 내림차순, 라벨 ko 정렬, limit). */
export function buildMixerFilterOptions(
  values: Array<string | null | undefined>,
  labelMap?: Record<string, string>,
  limit?: number,
): MixerFilterOption[] {
  const counts = new Map<string, number>();
  values.forEach((rawValue) => {
    const value = normalizeMixerFilterValue(rawValue);
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  const options = Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: labelMap?.[value] ?? value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
  return typeof limit === 'number' ? options.slice(0, limit) : options;
}

/** 같은 label 옵션을 합산 병합(value=label 로 정규화, 빈도 내림차순, limit). */
export function mergeMixerFilterOptions(options: MixerFilterOption[], limit?: number) {
  const merged = new Map<string, MixerFilterOption>();
  options.forEach((option) => {
    const key = option.label;
    const current = merged.get(key);
    if (current) {
      merged.set(key, { ...current, count: current.count + option.count });
      return;
    }
    merged.set(key, { ...option, value: option.label });
  });
  const sorted = Array.from(merged.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'),
  );
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}
