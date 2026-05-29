type TimestampCandidate = string | null | undefined;

function parseTimestamp(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const direct = Date.parse(normalized);
  if (Number.isFinite(direct)) {
    return direct;
  }

  if (/^\d{4}\.\d{2}\.\d{2}$/.test(normalized)) {
    const parsed = Date.parse(`${normalized.replace(/\./g, '-')}T00:00:00+09:00`);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = Date.parse(`${normalized}T00:00:00+09:00`);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function pickLatestTimestamp(candidates: TimestampCandidate[]): string | null {
  let latestValue: string | null = null;
  let latestTimestamp = Number.NEGATIVE_INFINITY;

  candidates.forEach((candidate) => {
    if (!candidate) return;
    const parsed = parseTimestamp(candidate);
    if (parsed == null || parsed <= latestTimestamp) return;
    latestTimestamp = parsed;
    latestValue = new Date(parsed).toISOString();
  });

  return latestValue;
}

export function pickLatestCardTimestamp(
  cards: Array<{ created_at?: string | null; published_date?: string | null; date?: string | null }>,
): string | null {
  return pickLatestTimestamp(cards.flatMap((card) => [card.created_at, card.published_date, card.date]));
}

export function formatTopNavUpdateTime(value: string | null | undefined): string {
  if (!value) return '기준 없음';

  const parsed = parseTimestamp(value);
  if (parsed == null) return '기준 없음';

  const date = new Date(parsed);
  const dateLabel = date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).replace(/\.$/, '');
  const timeLabel = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });

  return `${dateLabel} ${timeLabel}`;
}
