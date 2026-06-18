// Mixer 표시 텍스트 정규화/정제/유사도 순수 유틸 (refactoring P2/stage3).
// MixerView 에서 그대로 옮긴 것 — DOM/상태 무관, 내부 상호호출만.

export const provenanceString = (provenance: Record<string, unknown>, key: string): string | null => {
  const value = provenance?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const sanitizeMixerActionText = (value?: string | null): string => {
  return (value ?? '')
    .replace(/^SK AX는 경영진 리뷰 안건을 정보 공유가 아니라 자원 배분 의사결정으로 격상한다\.?\s*/, '')
    .replace(/^경영진 리뷰 안건을 정보 공유가 아니라 자원 배분 의사결정으로 격상한다\.?\s*/, '')
    .trim();
};

export const sanitizeMixerDisplayText = (value?: string | null): string => {
  const cleaned = (value ?? '')
    .replace(/^각 이슈는\s+/, '')
    .replace(/^핵심 신호는\s*/, '')
    .replace(/\bevent_type\b/gi, '이벤트 유형')
    .replace(/\bexposure_score\b/gi, '노출 점수')
    .replace(/\bnew_biz\b/gi, '신사업')
    .replace(/\bma\b/g, 'M&A')
    .replace(/\b(?:source_card_id|target_card_id|card_id|input_card_ids|matched_card_ids|peer_ids|mix_id|langfuse_trace_id)\b/gi, '')
    .replace(/\b[a-z][a-z0-9]*_[a-z0-9_]*\b/gi, '')
    .replace(/\b[A-Z]{2,}-\d{2,}\b/g, '선택 카드')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?。])/g, '$1')
    .replace(/^[\s,;:·ㆍ.。!?]+/g, '')
    .trim();
  return dedupeMixerSentences(cleaned);
};

export function normalizeMixerTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\bevent_type\b/gi, '이벤트유형')
    .replace(/\bexposure_score\b/gi, '노출점수')
    .replace(/\bnew_biz\b/gi, '신사업')
    .replace(/\bma\b/g, 'm&a')
    .replace(/\b(?:source_card_id|target_card_id|card_id|input_card_ids|matched_card_ids|peer_ids|mix_id|langfuse_trace_id)\b/gi, '')
    .replace(/\b[a-z][a-z0-9]*_[a-z0-9_]*\b/gi, '')
    .replace(/\b[A-Z]{2,}-\d{2,}\b/g, '선택카드')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

export function areMixerTextsSimilar(left?: string | null, right?: string | null) {
  const leftKey = normalizeMixerTextKey(left ?? '');
  const rightKey = normalizeMixerTextKey(right ?? '');
  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;
  const shorter = leftKey.length <= rightKey.length ? leftKey : rightKey;
  const longer = leftKey.length > rightKey.length ? leftKey : rightKey;
  return shorter.length >= 24 && longer.includes(shorter);
}

export function uniqueMixerTexts(values: string[]) {
  const seen: string[] = [];
  return values.filter((value) => {
    const cleaned = sanitizeMixerDisplayText(value);
    if (!cleaned) return false;
    if (seen.some((current) => areMixerTextsSimilar(current, cleaned))) return false;
    seen.push(cleaned);
    return true;
  });
}

export function dedupeMixerSentences(value: string) {
  if (!value) return '';
  const sentences = value.match(/[^.!?。]+[.!?。]?/g) ?? [value];
  const seen: string[] = [];
  const unique = sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      if (!sentence) return false;
      if (seen.some((current) => areMixerTextsSimilar(current, sentence))) return false;
      seen.push(sentence);
      return true;
    });
  return unique.join(' ').trim();
}

export const formatMixerDate = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

export const mixerModeLabel = (mode?: string | null): string => (mode === 'deep' ? '정확 분석' : '빠른 실행');
