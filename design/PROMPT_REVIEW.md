# axis_page_prompts/ 리뷰 — 개선 사항 정리

> 8개 페이지 프롬프트 (`01_home_dashboard.md` ~ `08_keyword_graph_page.md`),
> 와이어프레임 4장 (`IMG_6407.jpg` ~ `IMG_6410.jpg`),
> 현재 코드베이스 (`designing` 브랜치, commit `e826883`) 를 교차 검증한 결과.
>
> 결론을 먼저 말하면 **현재 프롬프트는 절반 이상이 와이어프레임의 페이지 의도와 어긋나거나, 기존 디자인 시스템·기존 컴포넌트와 충돌한다.** AI 에게 그대로 던지면 새 페이지 8개를 만들면서 기존 자산을 무시하고 다시 짜는 위험이 큼.

---

## 1. 한눈에 보는 매핑 (가장 중요)

| 프롬프트 파일 | 와이어프레임 추정 위치 | 현재 사이드바 메뉴 (`Sidebar.tsx`) | 정합성 |
|---|---|---|---|
| 01 home_dashboard | IMG_6407 우측 (홈) | `home` (`HomeCardNewsView`) | ⚠️ 본문 구성이 현재와 전혀 다름 (현재는 Network Map + Hero + Bloomberg grid) |
| 02 assignment_page | **추정 불가** — 와이어프레임에 "배정" 페이지가 없음 | **없음** | ❌ 페이지명/의도가 와이어프레임에 없음 — IMG_6409 좌측은 "**브리핑**" 페이지 |
| 03 matching_page | **추정 불가** — 와이어프레임에 "매칭" 페이지가 없음 | **없음** | ❌ 페이지명/의도가 와이어프레임에 없음 — IMG_6409 우측은 "**믹서기**" 페이지 |
| 04 peer_plus_page | IMG_6408 좌측 (Peer사) | **없음** | ⚠️ 신규 페이지 — 사이드바 추가 필요 |
| 05 card_news_page | IMG_6408 우측 (카드뉴스) | `issues` (`IssuesView`) | ⚠️ 현재는 책등 stack — 프롬프트는 3-up 그리드 + 변환 흐름 화살표 (다른 컨셉) |
| 06 insight_result_page | IMG_6410 좌측 (믹서기 결과) | **없음** | ⚠️ "믹서기 결과" 라는 명칭과 다름 — 실제로는 믹서기의 후속 화면 |
| 07 test_generation_page | **추정 불가** | **없음** | ❌ 와이어프레임에 없음. AXIS 도메인과 관계 불분명 |
| 08 keyword_graph_page | IMG_6407 좌측 (3D 구) | **없음** (홈에 임베디드) | ⚠️ 현재 `KeywordPeerGraph` 가 홈에 임베디드. 별도 페이지로 분리하라는 지시인지 불분명 |
| **누락 — 회원정보** | IMG_6410 우측 | **없음** | ❌ 프롬프트 부재 |
| **누락 — 모니터링** | (와이어 X) | `monitoring` (`MonitoringView`) | ❌ 프롬프트 부재. 기존 코드 존재 |
| **누락 — 설정** | (와이어 X) | `settings` (`SettingsView`) | ❌ 프롬프트 부재 |
| **누락 — 관리자** | (와이어 X) | `admin` (`AdminView`) | ❌ 프롬프트 부재 |

---

## 2. 가장 심각한 문제 — 페이지 정체성 미스매치

`02_assignment_page.md`, `03_matching_page.md`, `07_test_generation_page.md` 세 페이지는 **AXIS 도메인 (Peer 모니터링 + 카드뉴스 브리핑) 과 무관한 일반 CRM/sales 도구 템플릿** 으로 작성됨.

- "고객사", "담당자", "상담 메모", "예정 일정", "배정 후보" 등 영업 CRM 용어 사용
- AXIS 의 실제 페이지 ("브리핑", "믹서기", "카드뉴스 결과") 와 일대일 매핑 불가능
- 프롬프트를 그대로 AI 에 던지면 **AXIS 와 무관한 영업 관리 화면 3개가 생성됨**

### 권장
- `02` → 와이어프레임 IMG_6409 좌측을 "**브리핑 페이지**" 로 다시 작성 (일간/주간 브리핑, 본·지역 동향 시각화, 라거 우측 패널)
- `03` → 와이어프레임 IMG_6409 우측을 "**믹서기 페이지**" 로 다시 작성 (필터 + 변/택 카드 선택)
- `07` → 폐기 또는 "**카드뉴스 생성 (테스트)**" 로 재정의 (현재 도메인엔 자동 파이프라인이라 사용자 트리거 생성이 없음)

---

## 3. 사이드바 / 네비게이션 정합성 ❌

모든 프롬프트가 "**기존 사이드바를 그대로 유지한다**" 라고 명시하지만, 정작 8개 페이지 중 5개 (02·03·04·06·07·08) 가 **현재 사이드바에 존재하지 않는 메뉴**.

현재 사이드바 (`src/app/components/Sidebar.tsx:21-27`) :

```ts
const baseMenuItems = [
  { id: 'home',         label: '홈' },
  { id: 'monitoring',   label: '모니터링' },
  { id: 'issues',       label: '카드뉴스' },
  { id: 'briefings',    label: '브리핑' },
  { id: 'rawArticles',  label: '믹서기' },
];
```

### 권장
1. **사이드바에 신규 페이지를 추가할지** 여부를 먼저 결정하고 명시
2. 추가한다면 어떤 라벨/아이콘/순서인지 프롬프트에 박을 것
3. URL 라우팅 (React Router 도입 여부) 도 결정 — 현재는 `useState('home')` 토글 방식

---

## 4. 디자인 토큰 / 컬러 팔레트 어긋남 ⚠️

프롬프트가 명시한 컬러는 **현재 디자인 시스템에 없거나 의도와 다름**.

| 프롬프트 표현 | 현재 디자인 시스템 (`theme.css`, `tailwind.config.js`) | 어긋남 |
|---|---|---|
| "회색 톤", "검은 테두리" | 라이트 Mistral — `--canvas` (#FFFFFF) + `--cream-soft` (#FBF4E4) + `--hairline-soft` (#EFEAE0) | 회색/검정 ≠ 크림 + 헤어라인 |
| "필터 칩은 연한 초록색" | 팔레트에 초록 없음. 액션 = `--primary` Mistral Orange (#DC5A24) | 디자인 시스템 위반 |
| "AXIS 로고는 붉은색 강조" | `--sk-red` (#EA002C) + `/axis-logo.png` | OK (단, 현재 로고 PNG 는 검정 톤이라 invert 필터로 화이트 처리 중) |
| "shadow-sm 수준" | 카드는 hairline border + shadow-card 토큰 | 톤 일관성 위해 토큰 명시 필요 |

### 권장
- 프롬프트에서 **하드코드 색상 (회색·초록) 금지**. 대신 토큰명 (`bg-cream-soft`, `text-action`, `border-hairline-soft`) 사용 강제
- 필터 칩 = 초록색 → **`bg-cream-soft` + `text-charcoal` + active 시 `bg-ink text-white`** (현재 IssuesView 의 Peer 칩 패턴과 통일)

---

## 5. 기존 컴포넌트 / 유틸 미활용 ⚠️

8개 프롬프트 모두 "처음부터 만든다" 톤. 기존 자산이 풍부한데 무시됨.

| 기존 자산 | 위치 | 어느 프롬프트에서 활용해야 하는데 누락? |
|---|---|---|
| `TopNav` | `src/app/components/TopNav.tsx` | 모든 프롬프트 (단순히 "기존 헤더 유지" 만 언급, 실제 props 활용 가이드 없음) |
| `Sidebar` | `src/app/components/Sidebar.tsx` | 위와 동일 |
| `CardNewsBookSpine` / `CardNewsBookSpineList` | `src/app/components/CardNewsBookSpine.tsx` | 05 카드뉴스 — 현재 IssuesView 가 이미 이걸 씀. 프롬프트는 별개 그리드 제안 |
| `CardNewsDetailView` | `src/app/components/CardNewsDetailView.tsx` | 05·06 — 카드 클릭 시 detail 모달이 이미 존재. 프롬프트는 "편집 모달 연다" 같은 모호한 표현 |
| `EditorialCard` (Bloomberg 톤) | `HomeCardNewsView.tsx` 내부 | 04 Peer+ 의 뉴스 카드, 05 카드뉴스 그리드 후보 |
| `KeywordPeerGraph` | `HomeCardNewsView.tsx` 내부 (Three.js) | 08 키워드 그래프 — 이미 구현됨. 프롬프트는 처음 만드는 듯 작성 |
| `PlaceholderPattern` | `src/app/components/PlaceholderPattern.tsx` | 04·05·06 의 이미지 자리 |
| `getPeerTheme` / `peerThemes` | `src/features/card-news/peerTheme.ts` | Peer 색 일관용 — 04 Peer+ 에서 필수 |
| `getCardImage` + Unsplash 큐레이션 | `src/features/card-news/cardImages.ts` | 05·06 의 카드 썸네일 |
| `getExecutiveRank` 등 매퍼 | `src/features/card-news/mappers/cardNewsExecutive.ts` | 데이터 가공 — 모든 분석 페이지 |
| `useCardNews` 훅 | `src/features/card-news/hooks/useCardNews.ts` | 데이터 로딩 — 모든 카드뉴스 페이지 |
| `cardNewsItems` mock | `src/shared/mocks/cardNews.ts` | 모든 mock 데이터 — 프롬프트는 새로 만들라고 함 |
| `ExecutiveSystem` (ExecutiveCard, Header, Metric, Button 등) | `src/app/components/executive/ExecutiveSystem.tsx` | 모든 분석 페이지 — 미언급 |

### 권장
- 프롬프트에 **"신규 컴포넌트 만들기 전에 위 자산을 먼저 확인하라"** 섹션 추가
- 각 페이지 프롬프트에 활용 가능한 **import 목록을 미리 박을 것**

---

## 6. 데이터 모델 추상화 — 기존 타입과 충돌 ⚠️

프롬프트가 새 데이터 구조 ( `insightResult`, `generationForm`, `comparisonSummary` 등 ) 를 자유롭게 정의함. 기존 타입 (`CardNewsItem`, `CardNewsImplication`, `CardNewsEvidenceChain`) 과 매핑 가이드 없음.

특히:
- `06_insight_result.flowSteps` ← 기존 `CardNewsItem.implication.suggested_actions` 와 어떻게 연결?
- `04_peer_plus.comparisonSummary` ← `evidence_chain.financial_refs` / `mbb_refs` 활용 가능
- `05_card_news.cardNewsTitle / shortFormTitle` ← 현재 `CardNewsItem` 에 없음 (필드 추가 필요? 아니면 폐기?)
- `08_keyword_graph.nodes/edges` ← 현재 `HomeCardNewsView.buildGraph()` 와 동일 구조 — 재사용 명시 필요

### 권장
- 프롬프트별 "**데이터 매핑**" 섹션을 기존 `CardNewsItem` / `Implication` / `EvidenceChain` 타입과 1:1 대응시켜 명시
- 새 필드 추가 필요시 `axis-infra/api/openapi.yaml` 갱신 절차 명시 (CLAUDE.md 규칙)

---

## 7. AI 생성 콘텐츠 표시 원칙 누락 ❌

`axis-frontend/CLAUDE.md` 마지막 섹션에 **MUST** 로 명시:

> AI 생성 콘텐츠에 ✨ 아이콘과 'AI 초안' 레이블 없이 표시 금지
> confidence < 0.6 면 ⚠️ 경고 표시

8개 프롬프트 중 **이걸 언급하는 프롬프트는 0건.** AXIS 의 가장 핵심 정책이 빠짐.

### 권장
- 모든 프롬프트의 "디자인 규칙" 섹션에 AI 콘텐츠 표시 원칙 박을 것
- 04 (AI 비교 요약), 06 (AI 인사이트), 07 (AI 생성 결과) 는 특히 강하게 명시

---

## 8. Peer 사 정체성 누락 ❌

AXIS 의 핵심 = Peer 4사 (삼성SDS / LG CNS / 현대오토에버 / 포스코DX) 모니터링.

프롬프트 4개 (02·04·06·07) 가 "기업", "고객사", "대상 기업" 같은 일반어 사용. Peer 4사가 누군지 명시 안 함.

### 권장
- 프롬프트 공통 prefix 에 "**비교 대상은 항상 Peer 4사 — 삼성SDS / LG CNS / 현대오토에버 / 포스코DX. 자사는 SK AX**" 박을 것
- Peer 별 시그니처 색은 `peerThemes` util 사용 (수동 색 지정 금지)

---

## 9. Citation / 근거 패턴 누락 ❌

AXIS 의 차별화 = "AI 답변에 [1][2] 인용 + 출처 hover/jump"

`CardNewsDetailView` 에 이미 구현되어있음 (`renderWithCitations` 함수). 프롬프트에서 04·06 분석 페이지에 인용 패턴 가이드 부재.

### 권장
- 04 Peer+ 비교 요약, 06 인사이트 결과 본문에 **citation 의무화** — 기존 `renderWithCitations` 또는 동일 패턴 활용

---

## 10. 라우팅 / 페이지 전환 모호 ⚠️

모든 프롬프트가 "X 클릭 시 Y 페이지로 이동" 표현 사용. 그런데:
- 현재 React Router 미사용 (`useState('home')` 토글)
- "Y 페이지" 가 신규 페이지인지 기존 페이지인지 불명
- 8개 페이지 간 이동 다이어그램 없음

### 권장
- 별도 `00_navigation_map.md` 로 페이지 전환 그래프 작성
- React Router 도입 결정 + 각 페이지 URL 명시 (예: `/home`, `/peer/:id`, `/cards/:id`)
- 프롬프트의 "이동" 은 `setActiveView('xxx')` 호출인지 router push 인지 명시

---

## 11. 반응형 / 빈 상태 가이드 빈약 ⚠️

- "작은 화면에서는 줄바꿈" 정도. 구체적 breakpoint (md=768 / lg=1024 / xl=1280) 없음
- mobile bottom nav 패턴 (현재 `Sidebar.tsx:156-174` 에 구현됨) 미언급
- 빈 상태 (no data / loading / error) 는 07 만 3-state 명시. 나머지 7개 누락
- 기존 `StatePatterns.tsx` 활용 가이드 없음

---

## 12. 페이지별 구체 코멘트

### 01 home_dashboard.md
- ❌ 현재 홈 (`HomeCardNewsView`) 는 Network Map + Hero + Stats + Bloomberg Editorial Card 그리드. **프롬프트는 5-카드 대시보드 (메인 + 보조 + 선/레이더/막대 그래프) 로 전혀 다른 구조**.
- 둘 중 어느 방향이 맞는지 결정 필요. 와이어프레임 IMG_6407 우측은 프롬프트 쪽에 가까움 (큰 카드 + 우측 보조 + 하단 3 그래프).
- **결정 시점에 기존 Network Map / Bloomberg 그리드를 폐기할지 명시 필요.**

### 02 assignment_page.md
- ❌ "배정" 페이지는 와이어프레임에 없음. IMG_6409 좌측은 "**브리핑**" 화면.
- 와이어프레임 내용: "2026년 5월 7일 일간 브리핑, 연간/구간, 본/지역 동향, 벤치마크, 라거 (right) → 시각화 그래프 X 이미지(아이콘) 라거"
- 현재 `BriefingsView.tsx` 가 존재 — 이걸 와이어 기준으로 재작성하는 프롬프트로 다시 써야 함.

### 03 matching_page.md
- ❌ "매칭" 페이지는 와이어프레임에 없음. IMG_6409 우측은 "**믹서기**" 화면 — 필터 + 변/택 카드 선택.
- 현재 `RawArticlesView.tsx` 가 존재 — 믹서기 본연의 의도 (raw article → 카드뉴스 mix) 로 재작성 필요.

### 04 peer_plus_page.md
- ⚠️ 와이어프레임 IMG_6408 좌측과 매핑됨.
- 좋은 점: 비교 요약 + IR 차트 + 뉴스 카드의 3-층 구조가 명확.
- 누락: Peer 4사 명시, citation, AI 라벨, peer 색 활용
- 추가 필요: 사이드바 신규 메뉴 추가 가이드 ("Peer+", icon=Users 또는 Building 등)

### 05 card_news_page.md
- ⚠️ 현재 `IssuesView.tsx` (책등 stack) 와 다른 컨셉 (3-up 그리드 + 변환 흐름).
- 와이어프레임 IMG_6408 우측은 그리드 + 썸네일 — 프롬프트 방향 가까움.
- 그러나 책등 stack 디자인을 사용자 (당신) 가 직접 요구해서 만든 것. **둘 중 무엇을 채택할지 결정 필요.**
- 추가: `cardNewsTitle`, `shortFormTitle` 필드는 mock 에 없음 — 데이터 모델 확장 또는 폐기 결정

### 06 insight_result_page.md
- ⚠️ 와이어프레임 IMG_6410 좌측 ("믹서기 결과") 에 대응. 그런데 프롬프트 제목은 "인사이트 결과" — 명칭 정합성 깨짐.
- "믹서기" → "결과" → "인사이트 결과" 흐름인 듯. 프롬프트에 이 흐름 명시 필요.
- 흐름도 (`flowSteps`) 라이브러리 미지정 (React Flow? 자체 SVG?)

### 07 test_generation_page.md
- ❌ "테스트 생성" 의도 불분명. AXIS 는 자동 파이프라인이라 사용자 트리거 생성 X.
- 폐기 또는 "**시뮬레이션 / 가설 시나리오 생성**" 으로 재정의 필요.
- 빈 캔버스 + empty/loading/generated 3-state 패턴은 좋음.

### 08 keyword_graph_page.md
- ⚠️ 와이어프레임 IMG_6407 좌측 ("3D 구") 와 매핑됨.
- **현재 `HomeCardNewsView` 안에 `KeywordPeerGraph` (Three.js) 가 이미 있음.** 별도 페이지로 빼라는 건지, 홈에서 분리하라는 건지 불명.
- 4 카테고리 100 키워드 사전 (`keywordCategories`) 도 이미 정의됨 — 프롬프트는 처음부터 만드는 듯 작성.

---

## 13. 누락된 페이지 프롬프트 (작성 필요)

| 페이지 | 와이어프레임 | 현재 코드 | 우선순위 |
|---|---|---|---|
| **회원정보** | IMG_6410 우측 | 없음 | 중 (와이어프레임에 명시되어있으나 컨텐츠는 placeholder) |
| **모니터링** | 없음 | `MonitoringView.tsx` 존재 | 상 (사이드바 메뉴) |
| **설정** | 없음 | `SettingsView.tsx` 존재 | 중 |
| **관리자** | 없음 | `AdminView.tsx` 존재 | 하 (admin 전용) |
| **로그인 / 회원가입** | 없음 | `App.tsx` 의 `AuthScreen` | 중 (이미 존재, 정합성 검증만) |

---

## 14. 프롬프트 구조 자체의 비효율

8개 프롬프트가 모두 동일한 도입부 5줄 ("너는 기존 AXIS 프론트엔드..." + "헤더와 사이드바는 그대로...") 로 시작. 프롬프트 길이의 30~40% 가 중복.

### 권장 구조
1. **`00_common_context.md`** (신규) — 모든 페이지에 공통 적용되는 규칙
   - 사이드바·TopNav 재사용
   - 디자인 토큰 (절대 하드코드 금지)
   - Peer 4사 명시
   - AI 콘텐츠 표시 (✨ 라벨 + confidence)
   - Citation 패턴
   - 빈 상태 / 로딩 / 에러 처리
   - 반응형 breakpoint
   - 활용 가능한 기존 컴포넌트·훅·util 목록
2. **`00_navigation_map.md`** (신규) — 페이지 간 이동, URL 구조
3. **`00_data_model_map.md`** (신규) — 기존 타입 ↔ 신규 필드 매핑표
4. **각 페이지 프롬프트** — 차별 포인트만 (페이지 목적, 본문 레이아웃, 페이지 전용 데이터, 페이지 전용 인터랙션, 완료 기준)

---

## 15. 즉시 적용 가능한 액션 아이템 (우선순위 순)

1. **🔴 시급** — 02·03·07 프롬프트의 페이지 정체성 재정의
   - 02 → 브리핑 페이지로 재작성
   - 03 → 믹서기 페이지로 재작성
   - 07 → 폐기 또는 "시나리오 생성" 으로 재정의
2. **🔴 시급** — 사이드바 메뉴 vs 프롬프트 페이지 정합성 결정
   - 신규 페이지 (Peer+, 인사이트 결과, 키워드 그래프) 를 사이드바에 추가할지 결정
   - 추가 시 IA (정보구조) 다이어그램 작성
3. **🟡 중** — 공통 prefix 분리 (`00_common_context.md`)
4. **🟡 중** — 디자인 토큰 / 색상 팔레트 정정 (회색·초록 → cream-soft·action)
5. **🟡 중** — 기존 컴포넌트 활용 가이드를 각 페이지 프롬프트에 박기
6. **🟢 낮** — 누락 페이지 (회원정보·모니터링·설정·관리자) 프롬프트 작성
7. **🟢 낮** — 라우팅 (React Router 도입) 결정 + URL 매핑
8. **🟢 낮** — Citation 패턴, AI 라벨, Peer 색 가이드 박기

---

## 16. 신뢰도 낮은 결론

이 리뷰는 와이어프레임 4장의 한글 손글씨 메모를 시각으로 해석한 것이라 **메모 일부는 다르게 읽힐 가능성 있음** (특히 IMG_6409 좌측 "브리핑" 추정). 프롬프트 작성자와 와이어프레임 작성자가 동일하다면 의도를 직접 확인하는 것이 가장 빠름.

---

## 2차 검토 — 추가 발견 (꼼꼼히 다시 본 결과)

> 1차 검토 후 프롬프트 본문을 한 줄씩 다시 읽으면서, 단순 "정합성" 문제 너머의 **구조적 모순·묵시적 갭·데이터 모델 충돌**을 추가로 발견함.

---

## 17. 8개 외에 묵시적으로 더 필요한 페이지 ❌

각 프롬프트의 "상호작용" 섹션이 언급한 이동 대상 페이지를 전부 모으면 8개를 넘어서 **12~14개의 페이지가 필요해짐**.

### 01 home_dashboard 가 언급한 이동 대상
- `오늘의 인사이트 상세 페이지` ← 06 인사이트 결과로 해석 가능 (불명확)
- `카드뉴스 페이지` ← 05 ✓
- `선그래프 상세` ❌ (8개 외)
- `레이더차트 상세` ❌ (8개 외)
- `막대그래프 상세` ❌ (8개 외)
- `키워드 그래프 페이지` ← 08 ✓

### 04 peer_plus_page 가 언급한 이동 대상
- `상세 비교 페이지` ❌ (8개 외)
- `레이더차트 상세 화면` ❌
- `DART 상세 화면` ❌
- `뉴스 원문 또는 내부 뉴스 상세 모달` ⚠️ (모달 vs 페이지 모호)

### 06 insight_result 의 후속 액션
- `관련 데이터 보기` ← 어디로?
- `카드뉴스 생성` ← "현재 인사이트 데이터를 넘긴다" — 데이터 전달 방식 불명. URL query? localStorage? Zustand?
- `그래프로 보기` ← 키워드 그래프 (08) 또는 `차트 상세 페이지` ❌
- `보고서에 추가` ← **보고서 기능 자체가 8개 외** ❌

### 07 test_generation 의 후속 액션
- `다시 생성`, `저장`, `카드뉴스로 변환`, `보고서에 추가`
- 보고서 페이지 또 등장

### 08 keyword_graph 의 더블클릭 이동
- `관련 인사이트 결과 페이지 또는 카드뉴스 페이지` — 둘 중 어느쪽?

### 결론
**8개 페이지 외에 최소 4-6개 페이지 (그래프 상세 3종, DART 상세, 비교 상세, 보고서) 가 묵시적으로 필요.** 프롬프트 인벤토리 자체가 불완전.

---

## 18. 02·03 프롬프트 — 둘 다 믹서기 가능성 (의도 혼동)

1차 검토에서 02·03 을 단순히 "잘못된 페이지" 로 분류했는데, 다시 보니 **둘 다 IMG_6409 right (믹서기) 의 다른 측면**을 묘사한 것일 수 있음.

| 프롬프트 | 핵심 구조 | IMG_6409 right (믹서기) 와 대조 |
|---|---|---|
| 02 | 좌 상세 + 우 후보 리스트 + 체크 선택 | ⚠️ 우측 리스트 + 체크 표시 일치 (좌측 상세는 없음) |
| 03 | 상단 필터 + 카드 그리드 + 체크 선택 | ⚠️ 필터 + 변/택 카드 + 체크 일치 |

가능한 해석:
- **(A)** 02 = 믹서기 selection (대상 + 후보), 03 = 매칭 = 다른 페이지 (?)
- **(B)** 02 = 매칭 = Peer 와 키워드 매칭, 03 = 믹서기 selection
- **(C)** 둘 다 같은 페이지 (믹서기) 의 두 가지 시안 — 작성자가 뷰 두 개 만든 것

어느 해석이든 **CRM 어휘 ("고객사", "상담 메모", "예정 일정")** 는 폐기해야 함. 직접 확인 시급.

---

## 19. 데이터 모델 충돌 — 신규 필드와 기존 타입 ⚠️

### A. 04 Peer+ — `targetCompany` 자유 입력 vs Peer 5사 고정
- 프롬프트: "**기업명 입력 박스**" → 자유 텍스트 입력 시사
- AXIS 도메인: 비교 대상은 항상 Peer 4사 + SK AX 자사 = **고정 5개**
- 자유 입력은 무관 기업까지 허용한다는 뜻 — 분석 데이터가 없는 기업은 결과 못 보여줌
- 권장: 입력 박스 → **Peer selector** (drop-down 또는 칩 선택)

### B. 05 카드뉴스 — Reels 데이터 모델 부재
- 프롬프트가 가정한 신규 필드: `cardNewsTitle`, `shortFormTitle`, `durationSec`
- 현재 `CardNewsItem` 타입: 해당 필드 **없음**
- 현재 `cardNewsItems` mock: 해당 필드 **없음**
- AI 파이프라인 (`axis-ai`): Reels 변환 단계 **미구현**
- 결정 필요:
  - (a) `axis-infra/api/openapi.yaml` 갱신 → 타입 재생성 → AI 파이프라인 추가 (full stack)
  - (b) 페이지 내 액션 (UI 만) 으로 두고 데이터는 미리 안 만듦
  - (c) Reels 기능 자체 폐기

### C. 05 카드뉴스 — bulk select vs is_bookmarked 충돌
- 프롬프트: "여러 카드를 **선택**한 뒤 **일괄** 내보내기"
- 현재: 카드별 `is_bookmarked` 토글 + `bookmarkedIds` 배열 (영속 저장)
- bookmark 와 일시적 select 은 **다른 의미**인데 모델이 안 정해짐
- 권장: select 는 페이지 내 임시 state (`selectedIds: Set<string>`), bookmark 와 분리. 액션 후 select 는 reset.

### D. 06 insight_result — `flowSteps` 와 기존 `implication` 의 관계
- 프롬프트: `insightResult.flowSteps[]` = `{ name, description, status, iconType }` 배열
- 기존 `CardNewsItem.implication`:
  - `why_important`, `potential_impact`, `follow_up_questions[]`, `suggested_actions[]`, `confidence`
- 매핑이 **자동 안 됨** — `implication.suggested_actions` 는 단순 텍스트 배열, `flowSteps` 는 단계형 객체
- 권장:
  - (a) `flowSteps` 는 별도 신규 필드 (AI 파이프라인 추가 생성)
  - (b) `suggested_actions` 를 단계로 그대로 표시 (구조 변경 없이)
  - (c) 클라이언트에서 `suggested_actions` 를 휴리스틱으로 `flowSteps` 변환

### E. 01 home — 시계열 / 변화율 데이터 부재
- 프롬프트: "오늘 감지된 변화", "전주/전월 대비", "상승/하락 키워드", "과거 대비 변화율"
- 현재 데이터 모델: 카드뉴스 단위만 있고 **시계열 trend 데이터 없음**
- DART 지표 비교용 radar 차트 데이터도 없음
- 결정 필요:
  - 신규 데이터 파이프라인 (trend 집계) 만들지
  - 또는 home 의 그래프 영역을 폐기/단순화

---

## 20. 와이어프레임 메모 ↔ 프롬프트 미반영 사항 ❌

와이어프레임에 손글씨로 적힌 의도가 프롬프트 본문에 반영 안 된 케이스.

### A. IMG_6407 right (홈) — "출력하면 브리핑페이지" (파란 메모)
- 와이어 의도: 메인 카드 클릭 → **브리핑 페이지** 로 이동
- 프롬프트 01: "오늘의 인사이트 상세 페이지로 이동" — **다른 목적지**
- 정정 필요

### B. IMG_6408 left (Peer사) — "사진 없으면 경쟁사 로고 / 클릭하면 카드뉴스" (초록 메모)
- 와이어 의도: 뉴스 카드 사진 없을 때 **fallback = Peer 로고**, 클릭 시 → **카드뉴스 페이지**
- 프롬프트 04: "원문 또는 내부 뉴스 상세 모달" — **다른 동작**
- 권장: `PlaceholderPattern` 의 Peer 색 + 로고 패턴 활용 + 카드뉴스 detail view 로 라우팅

### C. IMG_6408 right (카드뉴스) — "→ 제목변환 흐름 / 출력화면 상세..." (초록 메모)
- 와이어: 카드 사이 화살표로 변환 흐름 + 클릭 시 상세
- 프롬프트 05: 변환 흐름은 카드 **안에서** 단계형 텍스트로 표시 — 와이어와 다름
- 와이어는 카드 **사이의** 화살표를 의도

### D. IMG_6409 left (브리핑) — "순서 바꿔" + "시각화 구체적 설명이 좋음" (초록 메모)
- 와이어 의도: 사이드바와 본문 사이에 순서 변경 컨트롤, 시각화에 텍스트 설명 함께
- 프롬프트 02 는 **브리핑 페이지가 아님** (CRM 화면) — 메모 의도 완전 미반영

### E. IMG_6410 left (믹서기 결과) — bubble 흐름 + "선택뉴스의 분석 (중향)"
- 와이어 의도: 원형 → 화살표 → 다른 모양의 단계 흐름
- 프롬프트 06: "원인, 변화, 영향, 대응" 4단계 — **일관 (OK)**

---

## 21. 페이지별 추가 코멘트 (§12 심화)

### 01 home — 더 큰 결정 필요
- 현재 `HomeCardNewsView` = Network Map + Hero + Stats + Bloomberg grid
- 프롬프트 = 5-카드 분석 대시보드 (메인 + 보조 + 3 그래프)
- 와이어프레임 IMG_6407 right = 프롬프트 쪽
- **결정 시점에:**
  - 현재 Network Map 폐기? → 08 키워드 그래프로 이동
  - 현재 Bloomberg grid 폐기? → 05 카드뉴스로 통합
  - 현재 Hero 유지? → 메인 카드의 컨텐츠로 변환
- 사용자가 직접 만든 책등 stack / Bloomberg 카드를 **버리는 결정**이 필요할 수 있음 — 합의 필수

### 04 peer_plus — `targetCompany` 자유 입력 폐기 + Peer selector 로
- 위 §19A 참조

### 05 card_news — 책등 stack vs 그리드 결정
- 현재 IssuesView (`CardNewsBookSpineList`) = 사용자가 직접 요구한 책등 stack
- 프롬프트 05 = 3-up 그리드 + 변환 흐름 화살표
- 둘 중 채택 결정. **사용자 본인 의도를 직접 확인** 필요
- Reels 데이터 모델 결정 (§19B)

### 06 insight — flowSteps 와 implication 정합성
- 위 §19D 참조
- 클릭 시 카드뉴스 데이터 전달 방식 명시 (URL query / Zustand store / props)

### 07 test_generation — 폐기 또는 재정의
- AXIS 의 product model = **자동 파이프라인** (매일 아침 카드뉴스/브리핑 자동 생성)
- 사용자 트리거 생성은 model 과 모순
- 권장 재정의:
  - "**가설 시나리오 시뮬레이션**" — "Peer A 가 산업 X 진출 시 SK AX 영향" 같은 What-if
  - "**카드뉴스 수동 생성**" — 자동화 보완용 admin 기능
  - "**프롬프트 디버깅**" — admin 전용 AI 출력 점검

### 08 keyword_graph — home 임베디드와 중복
- 현재 `KeywordPeerGraph` 는 `HomeCardNewsView` 안에 있음
- 프롬프트 08: 별도 페이지로 분리
- 프롬프트 01: home 에 키워드 그래프 안 등장
- **결정**:
  - (a) home 에서 빼고 08 페이지로 이동 (단일 출처) ← 권장
  - (b) 양쪽 유지 (중복) — 비추
  - (c) home 미니버전 + 08 풀버전

---

## 22. 차트 / 시각화 / 폼 라이브러리 결정 필요 ⚠️

8개 프롬프트가 사용하는 시각화 요소:
- 선그래프, 막대그래프, 레이더차트 (01)
- 차트 + 이미지 (04)
- 단계형 흐름도 (06)
- 3D 구 / 네트워크 그래프 (08)
- 폼 입력 (07)

**미결정 라이브러리**:
| 용도 | 후보 | 현재 상태 | 권장 |
|---|---|---|---|
| 차트 (선/막대/레이더) | Recharts / D3 / Chart.js / Visx | `axis-frontend/CLAUDE.md` 미언급. 코드 내 `package.json` 확인 필요 | **Recharts** (React 친화) |
| 흐름도 | React Flow / xyflow / 자체 SVG | 없음 | **자체 SVG** (4단계 정도면 라이브러리 과함) |
| 그래프 (네트워크) | Three.js / Sigma.js / D3-force | **Three.js 사용중** ← 유지 | 유지 |
| 폼 | react-hook-form + zod / 자체 useState | 없음 | **react-hook-form + zod** (07 폼 복잡) |
| 모달 | Radix Dialog (shadcn) | 사용중 (`ui/dialog.tsx`) | 유지 |

**권장**: 위 표를 `00_common_context.md` 에 박아 모든 페이지에서 동일 라이브러리 사용 강제.

---

## 23. 폴더 구조 / 파일 명명 — CLAUDE.md 와 실제 코드 충돌 ⚠️

`axis-frontend/CLAUDE.md` 는 다음 구조 명시:
```
src/
├── pages/
│   ├── BriefingPage.tsx
│   ├── SearchPage.tsx
│   ├── PeerMonitorPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── IssueCard/
│   ├── Search/
│   ...
```

**실제 코드**:
```
src/
├── app/
│   ├── App.tsx
│   └── components/
│       ├── BriefingsView.tsx        ← Page 가 아니라 View
│       ├── HomeCardNewsView.tsx
│       ├── IssuesView.tsx
│       ├── MonitoringView.tsx
│       └── ...
├── features/
│   └── card-news/
└── shared/
    └── mocks/
```

신규 페이지 작성 시:
- 어느 폴더? `src/app/components/`? `src/pages/` 신설?
- suffix? `Page.tsx`? `View.tsx`?
- features 분리? (e.g., `src/features/peer-plus/`)

**권장**:
- 실제 코드와 맞춰 **`src/app/components/<Name>View.tsx`** 로 통일
- 도메인 단위 로직은 **`src/features/<domain>/`** 분리 (이미 `card-news/` 패턴 존재)
- CLAUDE.md 도 실제 구조에 맞게 갱신 (또는 점진적 마이그레이션 계획 명시)

---

## 24. 묵시적 "보고서" 기능 — 8개 외 ❌

06 insight_result 와 07 test_generation 모두 "**보고서에 추가**" 액션 언급.

- 보고서 페이지 = 8개 외
- 보고서 데이터 모델 = 정의 없음
- 보고서 export 형식 = PDF? Excel? 슬라이드?

권장: 보고서 기능을 9번째 프롬프트로 작성하거나, 명시적으로 "phase 2" 로 빼고 현 액션 버튼은 disabled 표시.

---

## 25. 각 페이지의 "검색창 동작" 미정의 ⚠️

8개 프롬프트 모두 TopNav 의 검색창을 언급하지만 **동작이 페이지마다 다름**:

| 페이지 | 프롬프트의 검색 동작 |
|---|---|
| 01 home | "키워드 / 기업명 입력 시 홈 요약 카드와 그래프 필터링" |
| 02 assignment | "고객사명·담당자명 기준 후보 + 상세 정보 필터링" |
| 03 matching | "title·description 에 반영" |
| 04 peer+ | (검색창 별개로 페이지 내 `기업명` 입력 박스 따로 있음) |
| 05 card_news | (언급 없음) |
| 06 insight | (언급 없음) |
| 07 test | (언급 없음) |
| 08 keyword_graph | (언급 없음) |

→ 페이지마다 검색창 의미가 달라짐. 글로벌 검색인지 페이지 내 필터인지 합의 필요.

권장: **글로벌 검색 = ⌘K modal** (Linear / Stripe 톤) + 페이지 내 필터는 별도 컴포넌트로 분리.

---

## 26. 2차 검토 액션 추가 (§15 보강)

기존 §15 액션에 다음 추가:

9. **🔴 시급** — 02·03 의 의도 직접 확인 (믹서기 selection? 매칭? 둘 다 믹서기?)
10. **🔴 시급** — Reels 변환 (`shortFormTitle`, `durationSec`) 데이터 모델 결정 — full stack 갱신 vs UI-only vs 폐기
11. **🟡 중** — 묵시적 페이지 (그래프 상세 3종, DART 상세, 비교 상세, 보고서) 처리 결정
12. **🟡 중** — KeywordPeerGraph 의 home 분리 여부 결정 (단일 출처 권장)
13. **🟡 중** — 차트/그래프/폼 라이브러리 표준화 (Recharts + Three.js + RHF + Zod)
14. **🟢 낮** — 폴더 구조 합의 + CLAUDE.md 갱신
15. **🟢 낮** — 보고서 기능 phase 정의

---

## 27. 한 줄 요약

> 프롬프트 자체는 **각 페이지 단위로는 그럴듯**하지만, **8개 사이의 정합성·기존 코드 자산·도메인 모델·라우팅·데이터 흐름**이 검증 안 된 상태. 그대로 AI 에 던지면 "8개의 단위 화면" 은 나오지만 **하나의 일관된 제품으로 작동 안 함**. 프롬프트 분해 → 공통 prefix 추출 → 페이지 인벤토리 (8 + 묵시적 6) 정렬 → 데이터 모델 매핑 표 작성, 이 4단계가 선행 작업 필수.
