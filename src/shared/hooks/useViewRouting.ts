/**
 * URL ↔ view state 양방향 동기화 훅.
 *
 * - mount 시 URL pathname 첫 segment → view (slug 매핑 + whitelist). unknown → default.
 * - setView(next) → `window.history.pushState` + state. 동일 view 는 no-op.
 * - popstate (브라우저 back/forward) → URL 재읽기 → state 동기화.
 * - mount 1회 replaceState 로 viewId ↔ path 정합 (unknown URL 진입 정리).
 *
 * nginx `try_files /index.html` + ALB SPA fallback 와 호환.
 *
 * Internal viewId ↔ URL slug 매핑 — 내부 코드는 viewId 그대로, URL 만 깔끔.
 * 예: viewId='peerPlus' ↔ URL='/peer'.
 */

import { useCallback, useEffect, useState } from 'react';
import { peerPlusSelectionStorageKey } from '../content/peerPlus';

const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  briefings: '/briefings',
  insight: '/insight',
  peerPlus: '/peer',
  issues: '/issues',
  mixer: '/mixer',
  keywordGraph: '/graph',
  search: '/search',
  settings: '/settings',
  admin: '/admin',
};

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
  if (!path) return defaultView;
  const first = path.split('/')[0];
  // back-compat alias: 인사이트 페이지가 브리핑에 흡수되어 /insight 딥링크는 briefings 로.
  if (first === 'insight') return 'briefings';
  // 글로벌 동향 전용 페이지 제거 — Peer+ 글로벌 산업 필터로 통합.
  if (first === 'global-trends') {
    window.localStorage.setItem(peerPlusSelectionStorageKey, 'global_industry');
    return 'peerPlus';
  }
  return SLUG_TO_VIEW[first] ?? defaultView;
}

function viewToPath(view: string): string {
  return VIEW_TO_PATH[view] ?? '/';
}

export function useViewRouting(defaultView = 'home'): [string, (next: string) => void] {
  const [view, setViewState] = useState<string>(() => readViewFromUrl(defaultView));

  useEffect(() => {
    const expected = viewToPath(view);
    if (window.location.pathname !== expected) {
      window.history.replaceState({}, '', expected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPop = () => {
      setViewState(readViewFromUrl(defaultView));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [defaultView]);

  const setView = useCallback(
    (next: string) => {
      if (next === view) return;
      const path = viewToPath(next);
      window.history.pushState({}, '', path);
      setViewState(next);
    },
    [view],
  );

  return [view, setView];
}
