# Frontend 리팩토링 진행 (refactor/frontend-structure)

기준 계획: `axis-infra/docs/structure-tasks/refactoring-architecture.md` (Frontend P0~P3)
브랜치: `refactor/frontend-structure` (base: `origin/develop` @ 813695b)
게이트: `tsc --noEmit`(= type-check = lint) + `vite build --minify false`
  ※ 전체 `build`는 esbuild minify 에서 로컬 데드락(기존 알려진 이슈)이라 `--minify false` 로 검증, CI 가 풀빌드.
원칙: develop 직접 머지/PR 없음. 커밋+푸시만. 동작 보존 우선.

---

## ✅ 완료 (게이트 green, 커밋됨)

### P0 (#115) — vendor 청크 분리
- `vite.config.ts` manualChunks 함수에 `recharts-vendor`·`three-vendor`·`radix-vendor` 추가(기존 react-vendor 와 동일 의도).
- 효과: 앱 코드만 바뀌는 배포에서 대형 라이브러리 청크 해시 유지 → 브라우저 캐시(nginx `/assets/` immutable) 적중률 향상.
- 검증: `vite build --minify false` 로 4개 벤더 청크 분리 확인
  (react 229k·radix 183k·recharts 864k·three 1084k, gzip 기준 각각 55/40/166/197k).

### P1 — httpClient 우회 → repository (app↔features 수렴)
- **KeywordGraphView**: `httpClient.get` 직접 호출(`/api/keyword-graph`, `/api/keyword-graph/{node}/cards`)을
  신설 `features/keyword-graph` repository 로 이동.
  - `model/keywordGraph.ts`: `KeywordGraphPayload`·`KeywordGraphCardsPayload` 타입(컴포넌트 → 모델 이동).
  - `api/keywordGraphRepository.ts`: `fetchKeywordGraph`·`fetchKeywordGraphCards` + 미구성 가드용 `isKeywordGraphApiConfigured`.
  - 컴포넌트의 `!httpClient` 가드 3곳은 `isKeywordGraphApiConfigured()` 로 치환 → **동작 완전 동일**.
- **FloatingAiChat**: 이미 `assistantRepository` 사용 중. 남은 httpClient 참조는 `HttpRequestError`(에러 타입) import 뿐 →
  데이터 우회 아님 → **변경 불필요**(멀쩡한 코드 미수정).
- 검증: `tsc --noEmit` + `vite build --minify false` 통과, 컴포넌트 내 httpClient 직접 참조 0.

---

## ⏸ 이월 (무인 자동작업 부적합 — 사유 + 실행가능 가이드)

### P2 — container/presentational 분할 (component ≤600줄)
> **이월 사유**: 대상이 전부 **상태 보유 핵심 데모 화면**인데, 이 레포는
> (1) 테스트가 전무하고(아래 P3), (2) 로컬에서 앱 실행/시각 검증이 불가(풀빌드 minify 데드락).
> `tsc`+`build` 는 타입·번들만 보장하고 **렌더/상태/레이아웃 회귀는 못 잡는다.**
> 데모(2026-06-23) 직전 무인 환경에서 핵심 화면을 시각 검증 없이 분할하는 것은
> "완벽한지 확인" 원칙 위반 → **테스트(P3) 선행 후 소단위 분할** 권장.

600줄 초과 대상(실측):

| 컴포넌트 | 줄수 | 권장 분할(소단위) |
|---|---:|---|
| MixerView | 2042 | mixer 설정 패널 / 결과 뷰 / 공유 모달 / 프리셋 — 우선 **순수 표현 leaf**(props-only)부터 |
| HomeDashboardView | 1224 | 위젯별(요약·타임라인·시그널·차트) presentational 추출, 컨테이너는 데이터/상태만 |
| SettingsView | 1166 | 탭별(프로필·알림규칙·비번·접속로그) 섹션 컴포넌트 |
| KeywordGraphView | 1131 | three.js 캔버스 / 사이드 카드패널 / 필터바 분리 (데이터는 이미 P1 로 repo 분리됨) |
| PeerPlusView | 947 | peer 비교 표 / 기간 셀렉터 / 카드 그리드 |
| BriefingsView | 938 | 생성 폼 / 목록 / 상세 |
| AdminView | 906 | 리소스별(peers·sources·prompts·scheduler·usage·audit) 패널 |
| AuthScreen | 761 | 로그인/회원가입/이메일인증 단계 폼 |
| FloatingCardNewsOverlay | 622 | 오버레이 셸 / 카드 본문 / 네비게이션 |
> sidebar.tsx(726)는 shadcn/ui 생성물 → 분할 대상 아님.

**안전 분할 순서(컴포넌트당)**: ① 순수 표현 leaf(hooks 無, props in→JSX out) 추출 → ② 순수 helper/포맷 모듈화
→ ③ 마지막에 상태/effect 컨테이너만 잔류. 각 단계 `tsc`+`build`+(가능하면)스토리/스냅샷.

### P3 — 테스트 (이 환경에선 안전 도입 불가)
> - `vitest` 바이너리는 transitive 로 존재하나 **package.json 미선언**, **jsdom/@testing-library 부재**(컴포넌트 테스트 불가),
>   `test` 스크립트는 `echo 'No tests yet'` 스텁.
> - 이 워크트리의 `node_modules` 는 **팀원 메인 체크아웃에 심링크**라, 여기서 `npm install` 하면 팀원 환경을 오염시키고
>   `package-lock.json` 이 바뀐다. 무인/격리 원칙상 금지.
> **권장(감독 하)**: 메인 체크아웃에서 `vitest`+`jsdom`+`@testing-library/react`+`@vitest/coverage-v8` 정식 추가,
> `test` 스크립트 `vitest run` 으로 교체, vite.config 에 `test` 블록(environment: 'jsdom') 추가.
> 그 후 **순수 대상부터**: repository(httpClient 목), mappers(cardNewsExecutive 등), `features/*/api` 정규화 함수.
> 이게 갖춰지면 P2 분할을 회귀 없이 진행 가능.

### 비고
- 본 워크트리는 node_modules 를 메인에 심링크해 게이트만 돌림(읽기 전용). 머지 전 정식 체크아웃에서 풀빌드 CI 확인 권장.
