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

### 🔄 P2 — container/presentational 분할 (component ≤600줄) — 쉬운 추출 6파일 완료
> **진척(2026-06-18, 인터랙티브 세션)**: P3 인프라 위에서 6개 빅파일의 **순수 헬퍼 + 표현 하위컴포넌트**를
> 테스트 가드하며 features/*/lib·components 로 분리(전부 move-only, 매 커밋 tsc+vitest+build green).
> 도달불가 dead 코드 2건(KeywordGraph 카드폴백·Mixer escapeRegExp, origin/develop 에서도 dead 확인) 제거.
> 추출 모듈: KeywordGraph(graphGeometry·graphNodes) · Mixer(radarGeometry·mixerText·mixerSentence·
> mixerFilters + 표현 컴포넌트 3종 MixerReadableText·MixerFilterGroupPanel·MixerAnalysisProgressPanel) ·
> Settings(accessLogFormat·strategyContextFormat + SettingsFormFields) · Peers(peerNumberFormat·
> peerEvidenceText) · Admin(adminFormat) · Briefings(briefingText). RTL 컴포넌트 테스트 포함 **총 82 테스트**.
>
> **남은 것 = 하드 컨테이너 분할(감독 권장)**: 각 화면의 **메인 상태 컴포넌트**(state/effect/handler + 결과 렌더 JSX),
> AdminView 대형 패널 4종, HomeDashboardView(모듈레벨 헬퍼 없는 단일 컴포넌트)는 stateful 분할이라
> 렌더/상태 회귀 위험. 무인 환경(앱 미실행·시각검증 불가)에선 보류 — RTL 렌더 테스트로 가드하며 감독 하 진행 권장.

600줄 초과 대상(실측):

| 컴포넌트 | 줄수 | 권장 분할(소단위) |
|---|---:|---|
| MixerView | ~~2042~~ **1582** | 쉬운 추출 완료(헬퍼4+표현컴포넌트3). 남은=메인 상태 컴포넌트 분할 |
| HomeDashboardView | 1224 | 모듈레벨 헬퍼 無(단일 컴포넌트) → 하드 분할만 가능(위젯별 presentational) |
| SettingsView | ~~1166~~ **975** | 쉬운 추출 완료(포맷터2+폼컴포넌트). 남은=탭별 섹션 컨테이너 분할 |
| KeywordGraphView | ~~1131~~ **975** | 데이터·기하·정규화 분리 완료. 남은=three.js 캔버스/카드패널 컴포넌트 분할 |
| PeerPlusView | ~~947~~ **873** | 숫자/증거 포맷터 분리 완료. 남은=비교표/카드그리드 + parseTopKeywordEvidence |
| BriefingsView | ~~938~~ **920** | 텍스트 헬퍼 분리. 남은=생성폼/목록/상세 + adaptGeneratedBriefing 매퍼 |
| AdminView | ~~906~~ **872** | 포맷터 분리 완료. 남은=대형 패널 4종(AdminUsers·DeletedCards·AuditLogs) 분할 |
| AuthScreen | 761 | 미착수 — 단계 폼(로그인/회원가입/이메일인증) 분할 |
| FloatingCardNewsOverlay | 622 | 미착수 — 오버레이 셸/카드 본문/네비 분할 |
> sidebar.tsx(726)는 shadcn/ui 생성물 → 분할 대상 아님.

**안전 분할 순서(컴포넌트당)**: ① 순수 표현 leaf(hooks 無, props in→JSX out) 추출 → ② 순수 helper/포맷 모듈화
→ ③ 마지막에 상태/effect 컨테이너만 잔류. 각 단계 `tsc`+`build`+(가능하면)스토리/스냅샷.

### ✅ P3 — 테스트 인프라 (완료, 2026-06-18)
- node_modules 심링크 제거 → **격리 워크트리에 실설치**(팀원 메인 환경 무영향)로 환경 제약 해소.
- devDeps: `vitest`·`jsdom`·`@testing-library/react`·`@testing-library/jest-dom`·`@vitest/coverage-v8`.
- `vitest.config.ts`(vite.config mergeConfig + jsdom) · `vitest.setup.ts`(jest-dom) · `test` 스크립트 `vitest run`.
- 현재 테스트 19종: keywordGraphRepository(4)·graphGeometry(9)·graphNodes(6). 매 커밋 vitest green.
- → 이제 P2 컴포넌트 분할을 회귀 테스트로 가드 가능.

### 비고
- 본 워크트리는 node_modules 를 메인에 심링크해 게이트만 돌림(읽기 전용). 머지 전 정식 체크아웃에서 풀빌드 CI 확인 권장.
