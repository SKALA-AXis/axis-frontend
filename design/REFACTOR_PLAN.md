# axis-frontend 리팩토링 계획

> 작성: 2026-05-18 · 검토 단계 — 실행 전 사용자 승인 필요

## 1. 진단

### 1.1 라인수 워스트 오펜더

```
  5449  src/types/api.ts                            ← openapi-typescript 자동 생성, 손대지 않음
  3936  src/app/components/AxisPlanningViews.tsx    ← 7개 뷰가 1 파일에 뭉쳐있음
  1113  src/app/components/HomeCardNewsView.tsx     ← 단일 뷰 + 인라인 데이터/sub-component
   949  src/app/components/BriefingsView.tsx        ← 단일 뷰 + date helpers + period meta
   737  src/app/App.tsx                             ← Auth / Guide / Shell / Router 4가지가 한 컴포넌트
  2×726 src/app/components/ui/sidebar.tsx
        src/app/components/ui/ui/sidebar.tsx        ← 동일 파일 중복 (cleanup)
   538  src/app/components/CardNewsDetailView.tsx
   464  src/app/components/GlobalTrendsView.tsx
   447  src/app/components/executive/ExecutiveSystem.tsx
   405  src/app/components/TopNav.tsx
```

총 tsx/ts 라인 약 31,400. shadcn `ui/` 와 `types/api.ts` 제외하면 **사용자 코드 ~23,000 라인 중 8,500 라인이 단일 파일 3개에 응집** (37%).

### 1.2 구조적 문제

| # | 문제 | 영향 |
|---|---|---|
| **A** | `AxisPlanningViews.tsx` 가 7개 무관한 뷰를 한 파일에 묶음 (Home/Mixer/PeerPlus/Insight/KeywordGraph + FloatingOverlay + CardNewsWorkspace). 각 뷰 226~782 라인. | LangCorrelated 변경에서 충돌, blame 추적 어려움, 한 뷰 작업에 4000 라인 스크롤, IDE 응답 느려짐 |
| **B** | `features/` 슬라이스가 절반만 구현됨 — `hooks/api/model/mappers` 는 있는데 **`components/` 가 없음**. 모든 view tsx 가 `src/app/components/` 에 평면 적치. | Feature 경계가 데이터-레이어만 분리되고 UI 는 평면. 새 feature 추가 시 컴포넌트 위치가 비일관 |
| **C** | `App.tsx` 가 AuthScreen + InAppGuideOverlay + DashboardShell + App 라우터 4 책임 동시 보유 | 인증/온보딩 변경 시 라우팅 코드와 같이 변경됨 |
| **D** | `ui/` 와 `ui/ui/` 가 **완전 동일 파일 중복** (sidebar.tsx + chart.tsx). `ui/ui/` 는 아무 곳에서도 import 안 됨 | 무관 코드 1500+ 라인. 미사용 dead path |
| **E** | 인라인 도메인 데이터 — `HomeCardNewsView.tsx` 의 `keywordCategories` (40 라인), `BriefingsView.tsx` 의 `periodMeta`/`weekOptions` (60 라인) 가 컴포넌트 파일에 박혀있음 | 데이터-only 변경에 컴포넌트 파일을 건드리게 됨, mock 와 비슷한 데이터의 위치 불일치 |
| **F** | `App.tsx` 의 storageKey 상수 5종 (`axis:bookmarked-cards`, `axis:authenticated`, `axis:theme-mode`, `axis:guide-complete`, `axis:authenticated` 중복) 인라인 정의 | 같은 키를 다른 곳에서 읽을 때 매직 스트링 산재 |

---

## 2. 목표 구조 (Target Architecture)

이미 부분 적용된 **Feature-Sliced Design (FSD) 변형** 을 끝까지 밀어붙임. 새 패턴 발명 안 함.

```
src/
├── app/                          앱 셸 — 라우팅, 전역 셋업, 최상위 레이아웃
│   ├── App.tsx                   ← 라우팅 + 최상위 provider 만 (~200 라인 목표)
│   ├── shell/
│   │   ├── DashboardShell.tsx    ← (App.tsx 에서 분리)
│   │   ├── TopNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── auth/
│       ├── AuthScreen.tsx        ← (App.tsx 에서 분리)
│       └── useAuthStorage.ts     ← (App.tsx storage keys 흡수)
│
├── features/
│   ├── home/                      ← NEW (현재 HomeDashboardView + HomeCardNewsView)
│   │   ├── components/
│   │   │   ├── HomeDashboardView.tsx
│   │   │   ├── HomeCardNewsView.tsx
│   │   │   ├── FeaturedCard.tsx
│   │   │   ├── Stat.tsx
│   │   │   └── ShareDialog.tsx
│   │   ├── hooks/
│   │   │   └── useHomeShare.ts
│   │   └── data/
│   │       └── keywordCategories.ts   ← HomeCardNewsView 인라인 키워드 데이터
│   │
│   ├── mixer/                     ← 일부 이미 있음, components 추가
│   │   ├── components/
│   │   │   └── MixerView.tsx
│   │   ├── hooks/
│   │   ├── api/
│   │   └── model/
│   │
│   ├── peer-strategy/             ← 일부 이미 있음, components 추가
│   │   └── components/
│   │       └── PeerPlusView.tsx
│   │
│   ├── insight/                   ← components 추가
│   │   └── components/
│   │       └── InsightResultView.tsx
│   │
│   ├── card-news/                 ← components 추가
│   │   └── components/
│   │       ├── CardNewsWorkspaceView.tsx
│   │       ├── CardNewsDetailView.tsx
│   │       ├── CardNewsPreviewPanel.tsx
│   │       ├── FloatingCardNewsOverlay.tsx
│   │       └── CardNewsBookSpine.tsx
│   │
│   ├── briefings/                 ← components 추가
│   │   ├── components/
│   │   │   └── BriefingsView.tsx
│   │   └── utils/
│   │       └── briefingDate.ts    ← BriefingsView 인라인 helpers (60 라인)
│   │
│   ├── global-trends/             ← components 추가
│   │   └── components/
│   │       └── GlobalTrendsView.tsx
│   │
│   ├── raw-articles/              ← components 추가
│   │   └── components/
│   │       └── RawArticlesView.tsx
│   │
│   ├── alerts/                    ← components 추가
│   ├── chat/                      (이미 있음)
│   ├── dashboard/                 (data)
│   ├── issues/                    ← components 추가
│   ├── link-verify/
│   ├── peers/
│   │
│   ├── keyword-graph/             ← NEW (AxisPlanningViews 의 KeywordGraphView 분리)
│   │   └── components/
│   │       └── KeywordGraphView.tsx
│   │
│   ├── admin/                     ← NEW (AdminView.tsx)
│   │   └── components/
│   │       └── AdminView.tsx
│   │
│   └── settings/                  ← NEW (SettingsView.tsx)
│       └── components/
│           └── SettingsView.tsx
│
├── entities/                     이미 있음, 유지
│   └── issue/
│
├── shared/
│   ├── ui/                        ← shadcn 컴포넌트 (구 app/components/ui/) 이동
│   ├── api/
│   ├── hooks/
│   ├── utils/                     ← peerLogo, formatDate 등
│   ├── content/
│   ├── mocks/
│   └── config/
│
├── styles/
└── types/                        ← api.ts (자동 생성, 그대로)
```

### 2.1 디자인 원칙

1. **Feature 폴더 = 자기완결 슬라이스**. `components / hooks / api / model / utils / data` 6 표준 하위 폴더. 없는 건 만들지 않음.
2. **View 컴포넌트 = feature 의 진입점**. URL slug 와 1:1. `features/<feature>/components/<Feature>View.tsx`.
3. **Sub-component 는 같은 feature 안에**. 다른 feature 가 import 하기 시작하면 그때 `shared/` 로 승격.
4. **인라인 도메인 데이터는 `data/` 폴더로**. Mock 와 다른 점은 — mock 은 stub, data 는 실제 사용 상수 (예: 키워드 categorization 룰).
5. **`app/` 는 라우팅/셸/auth 만**. 도메인 로직 0.

### 2.2 경계 조건

- `shared/ui/` 의 shadcn 컴포넌트는 feature 가 자유롭게 import.
- Feature 간 횡적 import 금지 (예: `features/home` → `features/mixer` 직접 import X). 필요하면 `shared/` 또는 `entities/` 경유.
- `app/` 은 모든 feature 를 import 할 수 있음 (라우터 책임).
- `features/<x>/` 은 `app/` 을 import 할 수 없음.

---

## 3. 단계별 로드맵

원자 단위 PR 5개. 각 PR 은 독립 머지 가능. 회귀 위험 분산.

### Phase 1 — Dead code 제거 + ui 이동 (저위험, 머지 단독 가능)

**범위**: `ui/ui/` 중복 삭제 + `app/components/ui/` → `shared/ui/` 이동

- `src/app/components/ui/ui/` (1500+ 라인 중복) 통째 삭제 — 어디서도 import 안 됨 검증 완료
- `src/app/components/ui/` → `src/shared/ui/` 이동
- 모든 import 경로 `../app/components/ui/...` → `../shared/ui/...` sed 일괄 치환
- 타입 체크 + 빌드 + 시각 회귀 0 확인

**산출물**: PR #1 `chore(ui): drop ui/ui duplicate + relocate shadcn to shared/ui`
**영향**: 모든 컴포넌트 import 경로 변경, 시각 0 변화.
**롤백 비용**: revert 1 커밋.

---

### Phase 2 — `App.tsx` 분해 (라우팅 골격 안정화)

**범위**: 737 라인 `App.tsx` 를 4 파일로 분리

- `src/app/auth/AuthScreen.tsx` ← 60-306 라인 (247 라인)
- `src/app/auth/useAuthStorage.ts` ← storageKey 5종 + 인증 상태 훅
- `src/app/shell/DashboardShell.tsx` ← 497-707 라인 (211 라인) — view switch 라우터 포함
- `src/app/shell/InAppGuideOverlay.tsx` ← 311-496 라인 (186 라인)
- `src/app/App.tsx` ← 200 라인 미만으로 축소, 라우팅 + AuthScreen ↔ DashboardShell 토글만

**산출물**: PR #2 `refactor(app): split App.tsx into auth/shell/guide modules`
**영향**: 인증/온보딩/메인 셸 변경이 독립.
**테스트 포인트**: 로그인 → 가이드 → 대시보드 → 로그아웃 → 가이드 재진입 시나리오 5분 시각 회귀.

---

### Phase 3 — `AxisPlanningViews.tsx` 분해 (가장 큰 이득)

**범위**: 3936 라인 → 7 개 feature 컴포넌트로 분리

| 추출 대상 | 라인 범위 | 이주처 |
|---|---|---|
| HomeDashboardView | 467-817 (351) | `features/home/components/HomeDashboardView.tsx` |
| MixerView | 818-1463 (646) | `features/mixer/components/MixerView.tsx` |
| PeerPlusView | 1464-2171 (708) | `features/peer-strategy/components/PeerPlusView.tsx` |
| FloatingCardNewsOverlay | 2172-2423 (252) | `features/card-news/components/FloatingCardNewsOverlay.tsx` |
| CardNewsWorkspaceView | 2424-2649 (226) | `features/card-news/components/CardNewsWorkspaceView.tsx` |
| InsightResultView | 2650-3431 (782) | `features/insight/components/InsightResultView.tsx` |
| KeywordGraphView | 3432-3936 (505) | `features/keyword-graph/components/KeywordGraphView.tsx` |

**공유 helper 처리**: 파일 상단 1-466 라인 (imports + 공통 헬퍼) 중
- 1 view 만 쓰는 헬퍼 → 그 view 파일 안으로 이동
- 2+ view 가 쓰는 헬퍼 → `features/card-news/utils/` 또는 `shared/utils/` (소속 명확하면 feature 에, 도메인 무관이면 shared 에)

**한 번에 진행하지 않고 1 view 씩 7 commits 로 쪼개기.** 각 commit 자체 검증 가능.

**산출물**: PR #3 `refactor(views): split AxisPlanningViews into feature modules` (7 commits)
**영향**: 새 feature 작업 시 다른 view 코드 보지 않아도 됨. blame 분리.
**리스크**: import 경로 변경 다수 + 공유 헬퍼 위치 결정. 시각 회귀 0 확인 필수.

---

### Phase 4 — `HomeCardNewsView.tsx` 분해 (1113 라인)

**범위**:
- `data/keywordCategories.ts` ← 인라인 키워드 데이터 (40 라인)
- `components/FeaturedCard.tsx` ← 466 라인부터 sub-component
- `components/Stat.tsx` ← 453 라인 sub-component
- `hooks/useHomeShare.ts` ← share/copy 로직 (141-190 라인)
- `components/HomeCardNewsView.tsx` ← 잔여 ~500 라인

**산출물**: PR #4 `refactor(home): split HomeCardNewsView`
**영향**: 키워드 룰 변경 시 데이터 파일만 건드림.

---

### Phase 5 — `BriefingsView.tsx` 분해 (949 라인) + 잡다 잔여

**범위**:
- `features/briefings/utils/briefingDate.ts` ← `toDateInputValue`, `toMonthInputValue`, `formatKoreanDate`, `formatKoreanMonth`, `getMonthNumber`, `getWeekLabel`, `getWeekOptions`, `buildBriefingRange` (50-120 라인)
- `features/briefings/data/periodMeta.ts` ← `periodMeta` const (29-48 라인)
- `features/briefings/components/BriefingsView.tsx` ← 잔여 ~700 라인 (이건 더 쪼개기 어려운 단일 화면 책임)

**추가 잡다**:
- `CardNewsDetailView.tsx` (538) → `features/card-news/components/` 이동
- `GlobalTrendsView.tsx` (464) → `features/global-trends/components/` 이동
- `RawArticlesView.tsx` → `features/raw-articles/components/` 이동
- `AdminView.tsx` → `features/admin/components/` 이동 (NEW feature 폴더)
- `SettingsView.tsx` → `features/settings/components/` 이동 (NEW feature 폴더)
- `AlertsView.tsx` → `features/alerts/components/` 이동
- `IssuesView.tsx` → `features/issues/components/` 이동
- `MonitoringView.tsx` → `features/peers/components/` 이동

**산출물**: PR #5 `refactor(views): relocate remaining feature views to features/*`
**영향**: `app/components/` 평면 적치 해소. `app/` 하위 = 셸/auth/router 전용.

---

## 4. 비-목표 (Out of Scope)

이번 리팩토링에서 하지 않는 것 — 별 PR 로 분리.

- ❌ shadcn UI 컴포넌트 자체의 리팩토링 (그건 라이브러리 코드)
- ❌ `types/api.ts` 손대기 (auto-generated, openapi.yaml 이 단일 진실원)
- ❌ React Query / Zustand / 라우팅 라이브러리 도입 — 현 history API 라우터 그대로
- ❌ TypeScript strict 옵션 강화 — 별도 검토
- ❌ 컴포넌트 내부 로직 변경 / 성능 최적화 — pure 파일 분할만
- ❌ Storybook / 단위 테스트 추가 — 별도 검토
- ❌ Tailwind 디자인 토큰 정비 — 별도 검토

---

## 5. 진행 원칙

1. **시각 회귀 0**. 모든 PR 후 dev 서버에서 7 view 시각 확인.
2. **Phase 단위 PR**. 각 PR 독립 머지 + 독립 revert 가능.
3. **mechanical-first**. 책임 분할이 명확하지 않으면 일단 파일만 옮김 (내부 로직 손대지 않음).
4. **import 경로 일괄 sed**. 수동 편집 X — IDE 의 "move file with refs" 또는 `grep -l 'from .*old_path' | xargs sed -i ''`.
5. **각 PR 본문에 변경 전후 라인수**. `before: 3936 → after: 250+646+708+...` 식으로 객관 지표.

---

## 6. 예상 산출

| Phase | PR 개수 | 라인 이동 | 작업 시간 추정 |
|---|---|---|---|
| 1 (ui dedup) | 1 | -1500 (삭제) + 모든 import 경로 수정 | 30 분 |
| 2 (App split) | 1 | 737 → 200 + 4 새 파일 | 1 시간 |
| 3 (AxisPlanningViews split) | 1 (7 commits) | 3936 → 0 + 7 새 파일 | 2~3 시간 |
| 4 (HomeCardNewsView split) | 1 | 1113 → ~500 + 4 새 파일 | 1 시간 |
| 5 (잔여 view + Briefings split) | 1 | 949 → ~700 + 잡 view 8 개 이동 | 1.5 시간 |
| **합계** | **5 PR** | **~6500 라인 재배치** | **6~7 시간** |

종료 시점:
- 모든 view 가 `features/<x>/components/<X>View.tsx`
- `app/components/` 는 사라짐 (또는 `app/shell/` 만 잔존)
- 단일 파일 1000+ 라인 = `types/api.ts` (auto-gen) 뿐
- shadcn UI 가 `shared/ui/` (FSD 표준 위치)

---

## 7. 리스크 + 완화

| 리스크 | 가능성 | 완화 |
|---|---|---|
| import 경로 일괄 치환 누락 → 빌드 실패 | 중 | `npm run type-check` 가 catch. PR 마다 CI 통과 강제 |
| view 사이 공유 헬퍼 위치 결정 어려움 | 중 | 처음엔 view 안에 남김 → 두 번째 사용자 등장 시 승격. premature shared 화 안 함 |
| 시각 회귀 (CSS 글로벌 영향) | 낮 | 모든 PR 후 dev 서버에서 7 view 시각 확인 |
| 라우팅 URL 깨짐 | 낮 | `useViewRouting` 훅이 view ↔ URL 매핑 단일 지점. view 컴포넌트 위치만 바꾸므로 무관 |
| feature 폴더 명명 충돌 | 낮 | 새 폴더는 `home`, `keyword-graph`, `admin`, `settings` 4개. 기존 폴더는 그대로 유지 |

---

## 8. 검증 체크리스트 (각 PR 공통)

- [ ] `npm run type-check` 통과 (0 errors)
- [ ] `npm run build` 통과
- [ ] dev 서버에서 7 view (home / mixer / peer / insight / mixer / graph / global / briefings / raw / settings / admin) 시각 회귀 없음
- [ ] URL 라우팅 정상 (각 view slug 직접 접근 + 새로고침)
- [ ] 카드 클릭 → 상세 → 백 (history 정상)
- [ ] 인증/온보딩 flow 정상 (PR #2 만)
- [ ] PR 본문에 변경 전후 라인수 차이 명시

---

## 9. 종료 조건 / Done definition

- `find src -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 500' | grep -v types/api` 결과가 5 파일 미만
- `src/app/components/` 디렉토리 사라짐 (또는 셸-only)
- 모든 feature 가 `components/` 하위에 view tsx 보유
- 신규 view 추가 가이드 한 줄로 표현 가능: "features/<name>/components/<Name>View.tsx 만들고 App.tsx 라우터에 case 추가"

---

## 10. 검증 단계 발견 (실 코드와 대조)

계획 작성 후 실 코드 cross-reference 검증으로 보정한 항목들 — 위 Phase 계획에 반영됨.

### 10.1 AxisPlanningViews 의 13 helper — 실제 사용 분포

```
LoadingBlock         → 4 views (Home/Mixer/PeerPlus/CardNewsWorkspace)   → shared/ui/
EmptyBlock           → 2 views (CardNewsWorkspace/InsightResult)         → shared/ui/
GraphifyPreview      → 2 views (Home/Mixer)                              → shared/ui/ 또는 entities/
MixerAnalysisOverlay → Mixer only                                         → features/mixer/
ChartButton          → HomeDashboard only                                 → features/home/
DonutCalloutChart    → Mixer only (polarPoint/donutArcPath 종속)          → features/mixer/
FilterChip           → KeywordGraph only                                  → features/keyword-graph/
MiniStat             → KeywordGraph only                                  → features/keyword-graph/
formatEokValue       → PeerPlus only                                      → features/peer-strategy/utils/
getCardSourceOptions → FloatingCardNews only                              → features/card-news/utils/
dedupeCardsById      → FloatingCardNews only                              → features/card-news/utils/
polarPoint           → DonutCalloutChart internal                         → DonutCalloutChart 와 같이
donutArcPath         → DonutCalloutChart internal                         → DonutCalloutChart 와 같이
```

→ **2/3 가 single-view helper.** Phase 3 분할 작업 시 각 view 안으로 이동하는 게 자연스러움. shared 승격은 위 3 개만.

### 10.2 외부 import 결합 (Phase 3 순서 주의)

```
App.tsx                          → AxisPlanningViews 의 7 view 모두 import
BriefingsView.tsx (line 17)      → AxisPlanningViews 의 FloatingCardNewsOverlay import
```

→ Phase 3 의 7 commits 중 **FloatingCardNewsOverlay 먼저** 이동해야 BriefingsView import 가 깨지지 않음. 안전 순서:

```
3.1  FloatingCardNewsOverlay  →  features/card-news/components/
3.2  CardNewsWorkspaceView    →  features/card-news/components/
3.3  HomeDashboardView        →  features/home/components/
3.4  MixerView                →  features/mixer/components/
3.5  PeerPlusView             →  features/peer-strategy/components/
3.6  InsightResultView        →  features/insight/components/
3.7  KeywordGraphView         →  features/keyword-graph/components/
+    각 commit 마다 App.tsx 의 import path 1줄씩 update
+    3.1 commit 에서 BriefingsView.tsx import 도 update
```

### 10.3 URL slug ↔ feature 폴더명 매핑

`useViewRouting.ts` 의 `VIEW_TO_PATH` 11 슬러그 ↔ feature 폴더 일대일 매칭:

| URL slug | viewId | feature 폴더 |
|---|---|---|
| `/` | `home` | `features/home/` (NEW) |
| `/briefings` | `briefings` | `features/briefings/` (있음) |
| `/insight` | `insight` | `features/insight/` (있음) |
| `/peer` | `peerPlus` | `features/peer-strategy/` (있음) |
| `/issues` | `issues` | `features/issues/` (있음) |
| `/mixer` | `mixer` | `features/mixer/` (있음) |
| `/graph` | `keywordGraph` | `features/keyword-graph/` (NEW) |
| `/global` | `globalTrends` | `features/global-trends/` (있음) |
| `/articles` | `rawArticles` | `features/raw-articles/` (있음) |
| `/settings` | `settings` | `features/settings/` (NEW) |
| `/admin` | `admin` | `features/admin/` (NEW) |

→ 신규 폴더 4 개: `home`, `keyword-graph`, `admin`, `settings`.
→ MonitoringView.tsx 는 어디 가야 하나? — 별 view (peer 모니터링) 일 가능성 있음. **Phase 5 시작 전 라우터에서 사용 여부 확인 필요** — 사용 안 되면 dead code 삭제, 사용되면 `features/peers/` 에 둠.

### 10.4 HomeCardNewsView 의 sub-component 범위

```
Stat (line 453)         → HomeCardNewsView 안에서만 4 회 사용
FeaturedCard (line 466) → HomeCardNewsView 안에서만 사용
```

→ shared 승격 X. `features/home/components/` 안에 둠.

### 10.5 BriefingsView 의 cross-feature import

`BriefingsView.tsx:17` 가 `AxisPlanningViews` 의 `FloatingCardNewsOverlay` 를 import 함.
이는 **feature 간 횡적 import** 사례 (briefings → card-news). 디자인 원칙 2.2 위반 후보지만, 카드뉴스 오버레이는 모든 카드 표시 화면이 공유하는 패턴이므로 정당함. Phase 3.1 후 import 경로만 `features/card-news/components/FloatingCardNewsOverlay` 로 수정.

### 10.6 CardNewsBookSpine.tsx

`app/components/CardNewsBookSpine.tsx` 가 plan 초안에 누락. 추가:
→ Phase 5 에서 `features/card-news/components/` 로 이동.

### 10.7 ui/ui 중복 검증

```
grep -rn "ui/ui" src/ --include='*.{ts,tsx}'  →  0 matches
diff src/app/components/ui/sidebar.tsx src/app/components/ui/ui/sidebar.tsx  →  0 diff
```

→ `ui/ui/` 통째 삭제 안전. Phase 1 그대로 진행.

---

## 11. 사용자 결정 요청 사항 (실행 전 확인)

1. **순서 확정**: Phase 1→5 순차 / 또는 일부 병렬 진행?
2. **Phase 3 의 7 commits 를 단일 PR vs 7 개 PR**: 단일 PR (롤백 단위 1) vs 7 PR (롤백 단위 7, 검증 더 안전). 현재 plan 은 단일 PR + 7 commits.
3. ~~MonitoringView.tsx 삭제 OK?~~ → **보존 결정 (2026-05-18).** 라우터 미연결이지만 peer 경쟁 모니터링 view (R&D/margin/exposure scatter 차트 등) 로 추후 wiring 예정. `features/peers/components/MonitoringView.tsx` 로 이주만, 삭제 X.
4. **shadcn `ui/` 이동** (Phase 1): import 경로 일괄 변경 영향이 크니 별 PR 로 분리? 현재 plan 은 ui/ui 삭제 와 묶음.

