import { ExecutivePage } from './ExecutiveSystem';

/**
 * 페이지 전역 loading 메시지. ExecutivePage 컨테이너 안에 중앙 정렬 텍스트.
 * 카드뉴스/Mixer/PeerPlus/Home 등 여러 view 의 loading 상태에서 공통 사용.
 */
export function LoadingBlock({ label }: { label: string }) {
  return (
    <ExecutivePage className="flex min-h-full items-center justify-center p-6 text-sm text-[var(--axis-muted)]">
      {label}
    </ExecutivePage>
  );
}

/**
 * 카드 그리드/리스트 내부의 empty placeholder. ExecutivePage 컨테이너 없이 작게.
 */
export function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="axis-panel-flat p-8 text-center text-sm text-[var(--axis-muted)]">
      {label}
    </div>
  );
}
