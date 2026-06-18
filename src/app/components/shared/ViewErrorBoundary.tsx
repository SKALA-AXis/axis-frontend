/*
 * 작성일: 2026-06-12
 * 작성자: 최종민
 * 변경이력:
 *   2026-06-12 최종민 — 뷰를 라우트 단위 지연 청크로 분리하며 에러 바운더리 컴포넌트 추가
 */
import { Component, type ReactNode } from 'react';

import { ExecutiveButton, ExecutiveContainer, ExecutivePage } from '../executive/ExecutiveSystem';

const chunkReloadGuardKey = 'axis:chunk-reload-at';
const chunkReloadGuardWindowMs = 30_000;

const chunkErrorPatterns = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
];

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return chunkErrorPatterns.some((pattern) => message.includes(pattern));
}

type ViewErrorBoundaryProps = { children: ReactNode };
type ViewErrorBoundaryState = { error: unknown };

export class ViewErrorBoundary extends Component<ViewErrorBoundaryProps, ViewErrorBoundaryState> {
  state: ViewErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ViewErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // 배포로 옛 해시 청크가 404 가 되면 새 index.html 을 받도록 자동 새로고침.
    // 30초 내 재발 시에는 루프 방지를 위해 수동 새로고침 안내로 전환한다.
    if (!isChunkLoadError(error)) return;
    const lastReloadAt = Number(window.sessionStorage.getItem(chunkReloadGuardKey) ?? 0);
    if (Date.now() - lastReloadAt <= chunkReloadGuardWindowMs) return;
    window.sessionStorage.setItem(chunkReloadGuardKey, String(Date.now()));
    window.location.reload();
  }

  render() {
    if (this.state.error == null) {
      return this.props.children;
    }

    const label = isChunkLoadError(this.state.error)
      ? '새 버전이 배포되었습니다. 화면을 다시 불러와 주세요.'
      : '화면을 표시하는 중 문제가 발생했습니다.';

    return (
      <ExecutivePage>
        <ExecutiveContainer className="flex min-h-full items-center justify-center py-12">
          <div className="axis-panel-flat flex min-h-[180px] w-full max-w-xl flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[var(--axis-muted)]">
            <span>{label}</span>
            <ExecutiveButton variant="secondary" onClick={() => window.location.reload()}>
              새로고침
            </ExecutiveButton>
          </div>
        </ExecutiveContainer>
      </ExecutivePage>
    );
  }
}
