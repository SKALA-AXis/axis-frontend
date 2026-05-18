/**
 * URL ↔ view state 양방향 동기화 훅.
 *
 * - mount 시 현재 URL pathname 의 첫 segment 를 view 로 인식. unknown 이면 default.
 * - setView(next) 호출 시 `window.history.pushState` 로 URL push. 동일 view 는 no-op.
 * - 브라우저 back/forward (popstate) → URL 재읽기 → state 동기화.
 *
 * nginx (`try_files $uri $uri/ /index.html;`) + ALB SPA fallback 와 호환 — 어떤
 * 경로로 직접 진입해도 index.html 이 로딩되고 본 훅이 view 를 복원.
 *
 * Scope: view-level (e.g. `/peerPlus`). subview state (선택 peer / card id / search
 * query) 는 별도 PR 에서 query param 으로 진화 가능.
 */

import { useCallback, useEffect, useState } from 'react';

const VALID_VIEWS = new Set([
  'home',
  'briefings',
  'insight',
  'peerPlus',
  'issues',
  'mixer',
  'keywordGraph',
  'globalTrends',
  'rawArticles',
  'settings',
  'admin',
]);

function readViewFromUrl(defaultView: string): string {
  if (typeof window === 'undefined') return defaultView;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return defaultView;
  // 첫 segment 만 사용 — 향후 `/peerPlus/samsung_sds` 같은 nested 경로 호환.
  const first = path.split('/')[0];
  return VALID_VIEWS.has(first) ? first : defaultView;
}

function viewToPath(view: string): string {
  // 'home' 은 root path `/` 로 매핑 — URL 깔끔하게.
  return view === 'home' ? '/' : `/${view}`;
}

export function useViewRouting(defaultView = 'home'): [string, (next: string) => void] {
  const [view, setViewState] = useState<string>(() => readViewFromUrl(defaultView));

  // 초기 URL 정합 — `/foobar` 같은 unknown 진입 시 resolved view 의 정상 path 로
  // replaceState (back stack 오염 방지). `/` ↔ `home` 자연 매핑은 둘 다 valid 라 변환 X.
  useEffect(() => {
    const expected = viewToPath(view);
    if (window.location.pathname !== expected) {
      window.history.replaceState({}, '', expected);
    }
    // 의도적으로 mount 1회만 (initial 정합).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 브라우저 back/forward → URL re-read → state update.
  useEffect(() => {
    const onPop = () => {
      setViewState(readViewFromUrl(defaultView));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [defaultView]);

  const setView = useCallback(
    (next: string) => {
      // 동일 view click → history pollution 방지.
      if (next === view) return;
      const path = viewToPath(next);
      window.history.pushState({}, '', path);
      setViewState(next);
    },
    [view],
  );

  return [view, setView];
}
