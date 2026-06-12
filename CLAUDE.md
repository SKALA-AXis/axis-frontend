# AXIS — 프론트엔드 컨텍스트 (axis-frontend)

> React 대시보드. 전체 프로젝트 맥락은 axis-infra/CLAUDE.md 참조.
> **2026-06-11 실측 기준으로 전면 재작성** — 이전 버전은 초기 설계안(React Router/Zustand/React Query 등)을 서술했으나 실제 구현과 달랐음.

---

## 실제 기술 스택 (실측)

```
React 18 + Vite + TypeScript (strict)
라우팅      ❌ React Router 미사용 — useViewRouting 커스텀 훅 + 상태 기반 뷰 분기
서버 상태    ❌ React Query 미사용 — feature별 Repository 패턴 (HTTP + mock 듀얼)
전역 상태    ❌ Zustand 미사용 — 로컬 useState 중심
HTTP        shared/api/httpClient (axios 아님 — 자체 클라이언트)
스타일       Tailwind CSS v4 + Executive 디자인 시스템 (app/components/executive/)
시각화       recharts, three (키워드 그래프), lucide-react 아이콘
타입         src/types/api.ts ← openapi-typescript 자동 생성 (수동 수정 금지)
테스트       ⚠️ 0개 — `npm run test` 는 더미 ("No tests yet")
```

## 구조 — 이중 구조 과도기 (수렴 방향 팀 결정 대기)

```
src/
├── app/                  ← 레거시이자 "현재 실사용" 트리
│   ├── components/pages/ ← DashboardShell 이 분기하는 실제 뷰 11종:
│   │     home(dashboard) · briefings · keyword-graph · mixer · peer-plus
│   │     · card-news-workspace · raw-articles · search · notifications
│   │     · settings · admin
│   ├── components/executive/  ← 디자인 시스템 (ExecutiveBadge tone 6종: neutral/accent/success/warning/danger/dark)
│   ├── components/ui/         ← shadcn/ui 래퍼 46개
│   └── auth/ shell/
├── features/             ← 신 구조 (25+ feature: api/ hooks/ model/ components/)
│   │                        일부는 실사용(예: global-trends 패널을 peer-plus 가 embed),
│   │                        일부는 app/ 와 동명 중복(미사용 추정) — 정리 대상
├── shared/               ← httpClient · mocks · 공용 ui/hooks
├── entities/ types/ styles/
```

**신규 코드 배치 규칙(잠정)**: 새 기능은 `features/<도메인>/` 패턴(api/hooks/model/components)으로 작성하고, 화면 연결은 기존 뷰에 embed. `app/` vs `features/` 최종 수렴은 팀 결정 후 일괄 진행.

## 데이터 접근 — Repository 패턴

```ts
// features/<도메인>/api/<도메인>Repository.ts
// HttpRepository + fallbackRepository(mock) 를 Hybrid 로 묶는 구조
// 컴포넌트에서 httpClient 직접 호출 금지 (현재 위반 2건 정리 대상)
```

## 타입 자동 생성 (규칙 유지)

`src/types/api.ts` 수동 수정 금지. `axis-infra/api/openapi.yaml` 변경 공지 시:

```bash
npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts
```

## push 전 게이트 (전부 통과 후 push)

```bash
npm run type-check && npm run lint && npm run build
# 테스트가 생기면 npm run test 포함 (현재 더미)
```

## AI 생성 콘텐츠 표시 원칙 (유지)

AI 생성 텍스트(시사점·요약·검색 답변)에는 ✨ 아이콘 + "AI 초안" 라벨 필수.
confidence < 0.6 이면 "⚠️ 근거 불충분" 표시.

## 환경 변수

```bash
VITE_API_BASE_URL=   # .env (커밋 금지). 기본은 빈 값 — dev 는 vite proxy, prod 는 nginx 가 /api 처리.
                     # 값을 넣으면 프록시를 우회해 빌드에 절대 URL 이 박힘 (로컬 빌드 산출물 검증 시 함정)
```

## 절대 하지 말 것

- `src/types/api.ts` 수동 수정 (자동 생성 전용)
- `any` 타입, 인라인 `style={{}}` (기존 85건은 점진 정리 대상 — 신규 금지)
- 컴포넌트에서 httpClient 직접 호출 (Repository 경유)
- SpringBoot 우회한 Python AI 서버 직접 호출
- `.env` 커밋, `console.log` 커밋
- `git add -A` — 명시적 파일 목록만 (untracked WIP 휩쓸림 방지)
