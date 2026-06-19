# axis-frontend

AXIS 서비스의 React 대시보드입니다. 전략기획 담당자가 매일 아침 여는 이슈 브리핑 화면, AI 대화형 검색, Peer사 모니터링 뷰를 담당합니다.

> 전체 프로젝트 개요는 [axis-infra](https://github.com/SKALA-AXis/axis-infra)를 참조하세요.

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
| 테스트 | Vitest (`npm run test` = `vitest run`) — 점진 도입 중 |

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

### 사전 요구사항

- **Node.js 20+** & npm
- 프론트는 `/api` 를 backend 로 프록시하므로 **backend(:8080)가 떠 있어야** 합니다(아래 둘 중 하나).

### 가장 쉬운 길 — 전체 스택 한 번에 (클러스터 불필요)

`axis-infra` 의 docker compose 로 backend·ai·frontend·DB 를 모두 띄웁니다(프론트는 :3000 으로 서빙):

```bash
cd ../axis-infra && cp .env.local.example .env    # OPENAI_API_KEY 채움
docker compose --profile local up -d --build        # → http://localhost:3000
```

자세히: [axis-infra/README](https://github.com/SKALA-AXis/axis-infra)

### 프론트만 호스트에서 (Vite HMR)

backend(:8080)가 떠 있는 상태에서 프론트만 직접 실행해 빠르게 iterate:

```bash
# 1. 레포 클론 (axis-infra 와 형제 디렉토리로)
git clone https://github.com/SKALA-AXis/axis-frontend.git
cd axis-frontend

# 2. 환경변수 — 기본값(빈 VITE_API_BASE_URL)이면 Vite proxy 가 /api 를 :8080 으로 전달
cp .env.example .env

# 3. 의존성 설치
npm install

# 4. (openapi.yaml 변경 시) 타입 재생성 — axis-infra 가 형제 디렉토리에 있어야 함
npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts

# 5. 개발 서버 (포트 3100)
npm run dev

# 6. 브라우저
open http://localhost:3100
```

> backend 가 :8080 이 아니면 `.env` 의 `VITE_API_PROXY_TARGET` 로 지정하세요.
> **팀 개발자**(SKALA EKS 접근 시): `cd ../axis-infra && make up-cluster` 로 공용 클러스터 백엔드에 붙일 수 있습니다.

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
npm run dev          # 개발 서버 (포트 3100, Vite HMR)
npm run build        # 프로덕션 빌드 (tsc && vite build)
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run test         # vitest run
npm run preview      # 빌드 결과 미리보기 (포트 3101)
```

> ⚠️ **로컬 `npm run build` 가 멈춘 듯 보일 때**: 일부 환경에서 Vite(esbuild) minify 단계가 CPU 0%로 멈추는 현상이 있습니다(코드 문제 아님). 검증만 빠르게 하려면 `npx vite build --minify false`, 정식 풀빌드는 CI 가 수행합니다.

---

## 환경 변수

`.env.example` 참고 (커밋 금지). 로컬 기본값이면 추가 설정 없이 동작합니다.

```bash
# 로컬 개발(권장): 비워두면 Vite dev proxy 가 /api 를 backend(:8080)로 전달
VITE_API_BASE_URL=

# (선택) backend 가 :8080 이 아닐 때만 proxy 대상 지정
VITE_API_PROXY_TARGET=http://127.0.0.1:8080
```

- **브라우저가 backend 를 직접 호출**(프록시 우회)하게 하려면 `VITE_API_BASE_URL` 에 절대 URL 을 넣습니다. 이때 backend CORS 에 dev origin(`http://localhost:3100`)이 허용돼야 합니다.
- **운영**: nginx 가 `/api` 를 처리하므로 보통 빈 값으로 빌드합니다.

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
