# axis-frontend

AXIS 서비스의 React 대시보드입니다. 전략기획 담당자가 매일 아침 여는 이슈 브리핑 화면, AI 대화형 검색, Peer사 모니터링 뷰를 담당합니다.

> 전체 프로젝트 개요는 [axis-infra](https://github.com/skala-ai-13/axis-infra)를 참조하세요.

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 언어 | TypeScript 5.x |
| 프레임워크 | React 18.x |
| 빌드 | Vite |
| 라우팅 | React Router v6 |
| 서버 상태 | TanStack Query (React Query) v5 |
| 전역 상태 | Zustand |
| HTTP | axios |
| 스타일 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 타입 자동 생성 | openapi-typescript |
| 린트·포맷 | ESLint + Prettier |
| 테스트 | Vitest + React Testing Library |

---

## 프로젝트 구조

```
src/
├── main.tsx                진입점 (ReactDOM.render)
├── App.tsx                 라우팅 루트 컴포넌트
├── index.css               전역 Tailwind 스타일
├── vite-env.d.ts           Vite 환경변수 타입 선언
├── types/
│   └── api.ts              openapi.yaml에서 자동 생성 — 수동 수정 금지
├── api/
│   ├── client.ts           axios 인스턴스 (JWT 인터셉터 포함)
│   ├── issueCards.ts       이슈 카드 API 함수
│   ├── search.ts           검색 API 함수
│   └── peers.ts            Peer사 API 함수
├── pages/
│   ├── BriefingPage.tsx    오늘의 브리핑 (메인 화면)
│   ├── SearchPage.tsx      AI 대화형 검색
│   ├── PeerMonitorPage.tsx Peer사 모니터링 타임라인
│   └── SettingsPage.tsx    알림 설정
├── components/
│   ├── IssueCard/          이슈 카드, 상세, 중요도 배지, 이벤트 태그
│   ├── Search/             검색바, 결과, Citation 칩
│   ├── WeakSignal/         약한 신호 섹션, 강도 배지
│   ├── Layout/             Sidebar, Header, Layout
│   └── common/             LoadingSpinner, ErrorBoundary, EmptyState
├── hooks/
│   ├── useIssueCards.ts
│   ├── useSearch.ts
│   └── useWeakSignals.ts
├── store/
│   └── index.ts            Zustand 전역 UI 상태
└── utils/
    ├── formatDate.ts
    └── importanceColor.ts
```

---

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
npm run test         # Vitest
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
- 스타일: Tailwind CSS만 사용 — 인라인 `style={{}}` 금지
- 서버 상태 → React Query / 전역 UI 상태 → Zustand
- AI 생성 콘텐츠에는 반드시 `✨ AI 초안` 레이블 표시

---

## 주의사항

- `src/types/api.ts` 수동 수정 금지
- `any` 타입 사용 금지
- `console.log` 커밋에 포함 금지
- SpringBoot를 거치지 않고 Python AI 서버 직접 호출 금지
- `.env.local` 파일 커밋 금지
