// 삭제 카드뉴스 '숨김' 목록 localStorage persistence (refactoring P2/stage3). AdminView 에서 이동.

export function readHiddenCardIds(storageKey: string) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return [];
    }
    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }
    return parsedValue.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

export function writeHiddenCardIds(storageKey: string, cardIds: string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(cardIds));
  } catch {
    // Local UI preference only. Ignore storage failures.
  }
}
