# AXIS — 프론트엔드 컨텍스트 (axis-frontend)

> 이 레포는 AXIS 서비스의 React 대시보드입니다.
> 전략기획 담당자가 매일 아침 여는 이슈 브리핑 화면을 담당합니다.
> 전체 프로젝트 맥락은 axis-infra/CLAUDE.md를 참조하세요.

---

## 이 레포의 책임

```
axis-frontend가 하는 일:
├── 오늘의 브리핑 대시보드 (메인 화면)
├── 이슈 카드 목록·상세 뷰
├── AI 대화형 검색 (Generative Search + Citation)
├── Peer사별 모니터링 뷰 (타임라인)
├── 약한 신호 감지 섹션
└── 알림 설정 화면
```

---

## 프로젝트 구조

```
axis-frontend/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── api.ts                   ← openapi.yaml에서 자동 생성 (수동 수정 금지)
│   ├── api/
│   │   ├── client.ts                ← axios 인스턴스 (기본 설정)
│   │   ├── issueCards.ts            ← 이슈 카드 API 함수
│   │   ├── search.ts                ← 검색 API 함수
│   │   └── peers.ts                 ← Peer사 API 함수
│   ├── pages/
│   │   ├── BriefingPage.tsx         ← 오늘의 브리핑 (메인)
│   │   ├── SearchPage.tsx           ← AI 검색
│   │   ├── PeerMonitorPage.tsx      ← Peer사 모니터링
│   │   └── SettingsPage.tsx         ← 알림 설정
│   ├── components/
│   │   ├── IssueCard/
│   │   │   ├── IssueCard.tsx        ← 이슈 카드 컴포넌트
│   │   │   ├── IssueCardDetail.tsx  ← 이슈 카드 상세
│   │   │   ├── ImportanceBadge.tsx  ← 긴급/주목/참고 배지
│   │   │   └── EventTypeTag.tsx     ← 이벤트 타입 태그
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResult.tsx
│   │   │   └── CitationChip.tsx     ← 출처 인용 칩
│   │   ├── WeakSignal/
│   │   │   ├── WeakSignalSection.tsx
│   │   │   └── SignalStrengthBadge.tsx
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useIssueCards.ts
│   │   ├── useSearch.ts
│   │   └── useWeakSignals.ts
│   ├── store/
│   │   └── index.ts                 ← Zustand 전역 상태
│   └── utils/
│       ├── formatDate.ts
│       └── importanceColor.ts
└── public/
```

---

## 기술 스택

```
언어             TypeScript 5.x
프레임워크        React 18.x
빌드 도구         Vite
라우팅           React Router v6
서버 상태         TanStack Query (React Query) v5
전역 상태         Zustand
HTTP 클라이언트   axios
스타일           Tailwind CSS
UI 컴포넌트       shadcn/ui
아이콘           Lucide React
날짜 처리         date-fns
타입 생성         openapi-typescript (자동 생성)
린트             ESLint + Prettier
테스트           Vitest + React Testing Library
```

---

## 타입 자동 생성

**`src/types/api.ts`는 수동으로 수정하지 않습니다.**
axis-infra/api/openapi.yaml이 변경되면 아래 명령어로 재생성합니다.

```bash
npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts
```

openapi.yaml이 바뀌었다는 팀 공지가 오면 이 명령어를 먼저 실행하고 개발을 시작합니다.

---

## API 호출 구조

### axios 클라이언트 설정

```typescript
// src/api/client.ts
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터 — JWT 토큰 자동 삽입
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터 — 에러 공통 처리
client.interceptors.response.use(
  (response) => response.data.data,  // { success, data } 에서 data만 추출
  (error) => Promise.reject(error)
)
```

### React Query 훅 패턴

```typescript
// src/hooks/useIssueCards.ts
export function useIssueCards(filters: IssueCardFilters) {
  return useQuery({
    queryKey: ['issue-cards', filters],
    queryFn: () => issueCardsApi.getList(filters),
    staleTime: 1000 * 60 * 5,  // 5분 캐시
  })
}

// src/hooks/useSearch.ts
export function useGenerativeSearch() {
  return useMutation({
    mutationFn: (request: SearchRequest) => searchApi.genSearch(request),
  })
}
```

---

## 핵심 화면 설계

### 1. 오늘의 브리핑 (BriefingPage)

```
┌─────────────────────────────────────────┐
│  AXIS  │ 오늘의 브리핑  2026.04.20 월요일 │
├─────────────────────────────────────────┤
│  🔴 긴급 2건    🟡 주목 5건    🟢 참고 8건 │
├────────────────────┬────────────────────┤
│  [이슈 카드 목록]   │  [선택된 이슈 상세] │
│                    │                    │
│  🔴 LG CNS 팔란티어 │  제목               │
│     파트너십 체결   │  3줄 요약           │
│                    │  ───────────────   │
│  🟡 삼성SDS OpenAI  │  SK AX 시사점 ✨    │
│     리셀러 성과 발표 │  · 왜 중요한가      │
│                    │  · 잠재 영향        │
│  🟢 LG CNS 임원    │  · 후속 질문        │
│     인사 발표       │  · 액션 아이템      │
│                    │  ───────────────   │
│                    │  출처 [1][2][3]    │
└────────────────────┴────────────────────┘
```

### 2. AI 검색 (SearchPage)

```
┌─────────────────────────────────────────┐
│  🔍 무엇이 궁금하세요?                    │
│  [ LG CNS 최근 전략 변화           🔍 ]  │
│                                          │
│  추천 검색어: 삼성SDS 파트너십 | LG CNS M&A │
├─────────────────────────────────────────┤
│  ✨ AI 답변                              │
│                                          │
│  LG CNS는 2026년 3월 팔란티어와          │
│  파트너십을 체결하였으며[1]...            │
│                                          │
│  [1] LG CNS-팔란티어 파트너십 — ZDNet    │
│  [2] AIPCon 현장 취재 — IT조선           │
├─────────────────────────────────────────┤
│  후속 질문:                              │
│  · 팔란티어 파운드리 vs SK AX 비교?       │
│  · SK AX 대응 전략은?                    │
└─────────────────────────────────────────┘
```

### 3. 약한 신호 섹션 (WeakSignalSection)

```
┌─────────────────────────────────────────┐
│  ⚡ 약한 신호 — 아직 보도 안 된 변화      │
├─────────────────────────────────────────┤
│  🔴 강  LG CNS 팔란티어 관련 채용 5배 증가│
│         4주간 1건 → 5건                  │
│         "파트너십 공식 발표 예상 3~6개월" │
│                                          │
│  🟡 중  삼성SDS MLOps 시니어 채용 급증   │
│         AI 인프라 내재화 신호             │
└─────────────────────────────────────────┘
```

---

## 이슈 카드 컴포넌트

```typescript
// src/components/IssueCard/IssueCard.tsx

interface IssueCardProps {
  card: IssueCard          // types/api.ts에서 자동 생성된 타입
  onClick: () => void
  isSelected?: boolean
}

// 중요도별 색상
const importanceConfig = {
  urgent:    { bg: 'bg-red-50',    badge: 'bg-red-500',    label: '긴급', emoji: '🔴' },
  notable:   { bg: 'bg-yellow-50', badge: 'bg-yellow-500', label: '주목', emoji: '🟡' },
  reference: { bg: 'bg-green-50',  badge: 'bg-green-500',  label: '참고', emoji: '🟢' },
}

// 이벤트 타입 한글 매핑
const eventTypeLabel = {
  partnership: '파트너십',
  ma:          'M&A',
  personnel:   '인사',
  tech:        '기술',
  regulation:  '규제',
  new_biz:     '신규사업',
}
```

---

## Citation 렌더링

AI가 생성한 텍스트에서 `[1]`, `[2]` 같은 인용 번호를 클릭하면 원문으로 이동합니다.

```typescript
// src/components/Search/CitationChip.tsx
// 텍스트에서 [숫자] 패턴을 감지해서 클릭 가능한 칩으로 변환

function renderWithCitations(text: string, sources: Source[]) {
  return text.replace(/\[(\d+)\]/g, (match, index) => {
    const source = sources[parseInt(index) - 1]
    return `<a href="${source.url}" target="_blank">[${index}]</a>`
  })
}
```

---

## 환경 변수

```bash
# .env.local (로컬 개발용)
VITE_API_BASE_URL=http://localhost:8080

# .env.production (운영)
VITE_API_BASE_URL=https://api.axis.internal
```

---

## 로컬 개발 환경 세팅

```bash
# 1. 의존성 설치
npm install

# 2. 타입 자동 생성 (axis-infra 레포가 같은 레벨에 있어야 함)
npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
open http://localhost:3000
```

---

## GitHub Actions CI

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  build:
    steps:
      - npm ci
      - npm run type-check    # tsc --noEmit
      - npm run lint          # ESLint
      - npm run test          # Vitest
      - npm run build         # Vite 빌드
```

---

## 코딩 컨벤션

```
컴포넌트:     함수형 컴포넌트만 사용 (class 컴포넌트 금지)
파일명:       PascalCase.tsx (컴포넌트), camelCase.ts (유틸·훅)
Props 타입:   interface로 정의, Props 접미사 붙임 (IssueCardProps)
API 타입:     src/types/api.ts에서만 import (직접 타입 선언 금지)
스타일:       Tailwind CSS만 사용 (인라인 style 금지)
상태 관리:    서버 상태 → React Query, 전역 UI 상태 → Zustand
import 순서:  1) React  2) 외부 라이브러리  3) 내부 모듈
```

### 컴포넌트 작성 패턴

```typescript
// ✅ 올바른 패턴
interface IssueCardProps {
  card: IssueCard
  onClick: () => void
}

export function IssueCard({ card, onClick }: IssueCardProps) {
  return (
    <div onClick={onClick} className="...">
      ...
    </div>
  )
}

// ❌ 금지 패턴
export default function(props: any) { ... }  // any 타입 금지
```

---

## 성능 요구사항

- **초기 로딩**: 2초 이내 (LCP 기준)
- **이슈 카드 목록 렌더링**: 20건 기준 200ms 이내
- **검색 결과 표시**: 로딩 스피너 → 스트리밍 응답 표시

### 최적화 포인트

```typescript
// 이슈 카드 목록 — React.memo로 불필요한 리렌더 방지
export const IssueCard = React.memo(({ card, onClick }: IssueCardProps) => {
  ...
})

// 검색 — 디바운스 적용 (300ms)
const debouncedQuery = useDebounce(query, 300)

// 이미지 없음 — 모든 콘텐츠 텍스트 기반이라 최적화 용이
```

---

## AI 생성 콘텐츠 표시 원칙

AI가 생성한 시사점, 요약, 검색 답변에는 반드시 아이콘과 레이블을 표시합니다.

```typescript
// ✅ 필수 — AI 생성 콘텐츠임을 명시
<div className="ai-generated">
  <span>✨ AI 초안</span>
  <p>{implication.why_important}</p>
</div>

// confidence가 낮으면 경고 표시
{implication.confidence < 0.6 && (
  <span className="text-yellow-600">⚠️ 근거 불충분</span>
)}
```

---

## 절대 하지 말 것

- `src/types/api.ts` 수동 수정 금지 (openapi-typescript로만 갱신)
- `any` 타입 사용 금지
- 인라인 스타일 (`style={{ }}`) 사용 금지 → Tailwind 클래스 사용
- `console.log` 를 커밋에 포함 금지
- AI 생성 콘텐츠에 ✨ 아이콘과 '초안' 레이블 없이 표시 금지
- SpringBoot를 거치지 않고 Python AI 서버 직접 호출 금지
- `.env.local` 파일 커밋 금지
