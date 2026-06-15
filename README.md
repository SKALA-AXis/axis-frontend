# axis-frontend

AXIS 서비스의 React 대시보드입니다. 전략기획 담당자가 매일 아침 여는 이슈 브리핑 화면, AI 대화형 검색, Peer사 모니터링 뷰를 담당합니다.

> 전체 프로젝트 개요는 [axis-infra](https://github.com/skala-ai-13/axis-infra)를 참조하세요.

---

## 기술 스택

| 항목 | 내용 (2026-06-12 실측) |
|---|---|
| 언어 | TypeScript 5.x |
| 프레임워크 | React 18.x |
| 빌드 | Vite |
| 라우팅 | 커스텀 라우팅 (`src/app/App.tsx` — react-router 미사용) |
| 서버 상태 | fetch 기반 `shared/api/httpClient` + 도메인별 Repository + 커스텀 훅 (react-query 미사용) |
| 전역 상태 | 로컬 state + 커스텀 훅 (zustand 미사용) |
| 스타일 | Tailwind CSS + Radix UI (shadcn/ui 계열) |
| 타입 자동 생성 | openapi-typescript (`src/types/api.ts`) |
| 린트 | ESLint |
| 테스트 | 미도입 (`npm run test` = placeholder) — 도입 계획: axis-infra structure-tasks/axis-frontend.md 2-F4 |

---

## 프로젝트 구조 (2026-06-12 실측)

```
src/
├── main.tsx                 진입점
├── app/                     화면 셸
│   ├── App.tsx              커스텀 라우팅 루트
│   ├── components/          pages/(화면별) · layout/ · ui/ · auth/ · executive/ · shared/
│   ├── hooks/ · types/
├── features/                도메인 단위 (18개): briefings, dashboard, mixer, peers,
│   │                        global-trends, assistant, auth, settings, admin-* …
│   │                        각 도메인 = api/<도메인>Repository.ts + 컴포넌트·훅
├── entities/                도메인 모델 (issue)
├── shared/                  공용 계층 — api/httpClient.ts(공용 HTTP), config, hooks, lib
├── types/api.ts             openapi.yaml 자동 생성 — 수동 수정 금지
├── styles/ · docs/ · imports/
```

> ⚠️ **이중 구조 주의**: 화면 정의가 `app/components/pages/`와 `features/`에 병존한다.
> 정본 수렴 방향은 팀 결정 대기 (axis-infra `structure-tasks/axis-frontend.md` 2-F1).
> 신규 API 호출은 반드시 `features/<도메인>/api/*Repository.ts` 경유 — `httpClient` 직접 호출 금지.

## 로컬 개발 세팅

> 💡 **빠른 시작 (전체 스택)**: backend + ai + frontend 를 한 번에 cluster DB 와 함께 띄우려면 [`axis-infra` 의 `make up-cluster`](../axis-infra/README.md#mode-a--cluster-db--docker-compose--권장) — port-forward + docker compose 자동.
> 아래 절차는 frontend 만 host 에서 빠르게 iterate (Vite HMR) 하는 경우. backend 는 별도 (`make up-cluster` 또는 `./gradlew bootRun`) 로 띄워둬야 함.

```bash
# 1. 레포 클론
git clone https://github.com/skala-ai-13/axis-frontend.git
cd axis-frontend

# 2. 환경변수 설정
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8080

# 3. 의존성 설치
npm install

# 4. 타입 자동 생성 (axis-infra 레포가 같은 레벨에 있어야 함)
npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts

# 5. 개발 서버 실행
npm run dev

# 6. 브라우저 확인
open http://localhost:3000
```

---

## 주요 화면

| 화면 | 경로 | 설명 |
|---|---|---|
| 오늘의 브리핑 | `/` | 당일 이슈 카드 목록 + 상세 (메인) |
| AI 검색 | `/search` | Generative Search + Citation 표시 |
| Peer사 모니터링 | `/peers` | Peer사별 이슈 타임라인 |
| 알림 설정 | `/settings` | 이메일 알림 시간·조건 설정 (AWS SES, 매일 08:30 KST 자동 브리핑) |

---

## 타입 자동 생성

`src/types/api.ts`는 **수동으로 수정하지 않습니다.** `axis-infra/api/openapi.yaml`이 변경되면 아래 명령어로 재생성합니다.

```bash
npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts
```

팀 공지로 openapi.yaml 변경 알림이 오면 이 명령어를 먼저 실행하고 개발을 시작합니다.

---

## 개발 명령어

```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # 프로덕션 빌드
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run test         # ⚠️ placeholder (테스트 미도입 — 'No tests yet')
npm run preview      # 빌드 결과 미리보기
```

---

## 환경 변수

```bash
# 로컬 개발
VITE_API_BASE_URL=http://localhost:8080

# 운영 (SKALA EKS ALB endpoint)
VITE_API_BASE_URL=http://skala3-team13-axis-alb-1349892737.ap-northeast-2.elb.amazonaws.com
# (P8 에서 사용자 도메인 발급 시 https://axis.skala25a.project.skala-ai.com 패턴으로)
```

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) — push / PR 시 자동 실행

```
npm ci
npm run type-check
npm run lint
npm run test
npm run build
```

> CI 상세 설명 및 실패 대응 방법: [axis-infra/docs/CI.md](https://github.com/SKALA-AXis/axis-infra/blob/develop/docs/CI.md)

---

## 코딩 컨벤션

- 컴포넌트 파일명: `PascalCase.tsx` / 유틸·훅 파일명: `camelCase.ts`
- Props 타입: `interface`로 정의, `Props` 접미사 사용 (예: `IssueCardProps`)
- API 타입: `src/types/api.ts`에서만 import — 직접 타입 선언 금지
- API 호출: 도메인 `*Repository.ts` 경유 — `shared/api/httpClient` 직접 호출 금지
- 스타일: Tailwind CSS 우선 — 인라인 `style={{}}` 신규 추가 금지 (기존 잔존분은 점진 치환)
- AI 생성 콘텐츠에는 반드시 `✨ AI 초안` 레이블 표시

---

## 주의사항

- `src/types/api.ts` 수동 수정 금지
- `any` 타입 사용 금지
- `console.log` 커밋에 포함 금지
- SpringBoot를 거치지 않고 Python AI 서버 직접 호출 금지
- `.env.local` 파일 커밋 금지
