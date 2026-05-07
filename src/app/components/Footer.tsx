/**
 * Footer — Sunset Stripe Band (§3.C) + 얇은 64px utility footer (§19)
 * 모든 페이지 콘텐츠 끝에 등장. 마케팅 footer 아님 — 전문성 신호 한 줄.
 */
export function Footer() {
  return (
    <>
      {/* Sunset Stripe Band — 8px 풀-블리드 그라디언트 — 시그니처 */}
      <div className="h-2 w-full bg-sunset-stripe" />

      {/* 얇은 utility footer */}
      <footer className="bg-surface border-t border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-12 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-caption text-steel">
          {/* 좌: brand + version + 팀 */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sk-mistral">
              <span className="text-fine-print font-display-strong text-white">AX</span>
            </span>
            <span className="font-body text-body-sm-strong text-ink">AXIS</span>
            <span className="text-stone">·</span>
            <span>v0.1.0</span>
            <span className="text-stone">·</span>
            <span>2026 SKALA AI 13조 / SK AX 사업전략팀</span>
          </div>

          {/* 우: utility links */}
          <div className="flex items-center gap-6">
            <a href="/help" className="text-action hover:underline underline-offset-4">도움말</a>
            <a href="/changelog" className="text-action hover:underline underline-offset-4">릴리스 노트</a>
            <a href="/license" className="text-action hover:underline underline-offset-4">라이선스</a>
          </div>
        </div>
      </footer>
    </>
  );
}
