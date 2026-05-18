/**
 * URL ↔ view state 양방향 동기화 훅.
 *
 * - mount 시 현재 URL pathname 의 첫 segment 를 view 로 인식 (slug 매핑 적용).
 *   unknown 이면 default.
 * - setView(next) 호출 시 `window.history.pushState` 로 URL push. 동일 view 는 no-op.
 * - 브라우저 back/forward (popstate) → URL 재읽기 → state 동기화.
 *
 * nginx (`try_files $uri $uri/ /index.html;`) + ALB SPA fallback 와 호환.
 *
 * Internal viewId ↔ URL slug 매핑 — 내부 코드는 viewId 유지, URL 만 깔끔.
 * 예: viewId='peerPlus' ↔ URL='/peer'.
 *
 * Scope: view-level. subview state (선택 peer / card id / search query) 는 별도
 * PR 에서 query param 으로 진화 가능.
 */

import { useCallback, useEffect, useState } from 'react';

// Internal viewId → URL pathname. 'home' 은 root `/`.
const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  briefings: '/briefings',
  insight: '/insight',
  peerPlus: '/peer',
  issues: '/issues',
  mixer: '/mixer',
  keywordGraph: '/graph',
  globalTrends: '/global',
  rawArticles: '/articles',
  settings: '/settings',
  admin: '/admin',
};

// URL slug (root 이외) → internal viewId. 자동 역매핑.
const SLUG_TO_VIEW: Record<string, string> = Object.entries(VIEW_TO_PATH).reduce(
  (acc, [view, path]) => {
    const slug = path.replace(/^\/+|\/+$/g, '');
    if (slug) acc[slug] = view;
    return acc;
  },
  {} as Record<string, string>,
);

function readViewFromUrl(defaultView: string): string {
  if (typeof window === 'undefined') return defaultView;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return defaultView; // root → default (home)
  // 첫 segment 만 사용 — 향후 `/peer/samsung_sds` 같은 nested 경로 호환.
  const first = path.split('/')[0];
  return SLUG_TO_VIEW[first] ?? defaultView;
}

function viewToPath(view: string): string {
  return VIEW_TO_PATH[view] ?? '/';
}

export function useViewRouting(defaultView = 'home'): [string, (next: string) => void] {
  const [view, setViewState] = useState<string>(() => readViewFromUrl(defaultView));

  // 초기 URL 정합 — unknown 진입 또는 viewId 가 매핑된 path 와 다르면 정상 path 로
  // replaceState (back stack 오염 방지).
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
