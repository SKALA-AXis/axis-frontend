/**
 * App-level localStorage / sessionStorage 키 단일 진실원.
 *
 * 같은 키를 여러 컴포넌트가 읽고 쓰는데, 매직 스트링 으로 흩어지면
 * "axis:authenticated" vs "axis:authenticated" 같은 미세 오타 버그가 가능.
 */

export const bookmarksStorageKey = 'axis:bookmarked-cards';
export const authStorageKey = 'axis:authenticated';
export const legacyAuthStorageKey = 'axis:authenticated';
export const themeStorageKey = 'axis:theme-mode';
export const guideStorageKey = 'axis:guide-complete';
