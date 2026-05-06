# AXIS Executive Experience Architecture

## 문서 목적

이 문서는 AXIS 프론트엔드를 대기업 임원용 전략 인텔리전스 콘솔로 전환하기 위한 데이터 기반 디자인 시스템 명세입니다. 기준은 `../axis-backend`의 Spring Boot 구현, `../axis-infra/api/openapi.yaml`의 OpenAPI v3 계약, 그리고 `DESIGN-airtable.md`, `DESIGN-ibm.md`, `DESIGN-claude.md`, `DESIGN-intercom.md`, `DESIGN-wired.md`, `DESIGN-theverge.md`의 레퍼런스 분석입니다.

AXIS의 핵심 경험은 뉴스 소비가 아니라, 검증된 전략 신호를 빠르게 판단하고 후속 액션으로 전환하는 것입니다. 따라서 본 설계는 다음 네 가지 질문에 답하도록 구성되었습니다.

- 이 데이터가 백엔드의 어떤 엔드포인트에서 오는가?
- 바쁜 임원이 3초 안에 가장 먼저 인지해야 하는 정보는 무엇인가?
- 카드뉴스가 핵심인 제품에서 정보 밀도와 심미적 절제를 어떻게 공존시킬 것인가?
- 현재 React, Vite, Tailwind CSS, Recharts 기반 프론트엔드에서 안정적으로 구현 가능한가?

---

## [데이터 분석]

### 1. 백엔드 계약의 핵심 구조

백엔드는 모든 정상 응답을 `{ success, data, timestamp }` 래퍼로 반환합니다. 프론트엔드는 이 래퍼를 공통 API 클라이언트에서 해제한 뒤 도메인 모델에 전달합니다.

| 도메인 | API | 핵심 데이터 | 프론트 UI 책임 |
|---|---|---|---|
| 카드뉴스 | `GET /api/cards`, `GET /api/cards/today`, `GET /api/cards/{id}` | `CardNews` | 홈, 카드뉴스 목록, 북마크, 브리핑, 믹서기의 공통 입력 |
| 링크 검증 | `POST /api/cards/{id}/verify-link` | `source_links.status`, `archive_url` | 근거 링크 신뢰 상태 확인 |
| 공유 | `POST /api/cards/{id}/share` | `share_url`, `expires_at` | 팀 내 보고 링크 생성 |
| 모니터링 | `GET /api/monitoring/overview` | `MonitoringOverview` | Peer별 관찰 상태, 최근 카드, 기간 기준 요약 |
| Peer 재무 | `GET /api/monitoring/{peerId}/financials` | `FinancialTimeSeries` | 매출, 영업이익, R&D 흐름 시각화 |
| 경쟁 비교 | `GET /api/monitoring/comparison` | `MonitoringComparison` | Peer 비교 차트 |
| 전략 분석 | `GET /api/monitoring/{peerId}/strategy` | `PeerStrategy` | 채용, 수주, 파트너십 방향성 |
| 브리핑 | `GET /api/briefings/today`, `GET /api/briefings/{briefingId}` | `BriefingReport` | 카드 묶음에서 도출한 임원 보고 문장 |
| 브리핑 생성 | `POST /api/briefings/generate` | `briefing_id`, `status` | 기간/카드 선택 기반 보고서 생성 |
| 북마크 | `GET/POST/DELETE /api/bookmarks` | `CardNews.id` | 믹서기와 보고 후보 선별 |
| 믹서기 | `POST /api/mixer` | `MixerResult.generated_implication` | 여러 카드의 연결점과 SK AX 관점 생성 |
| 설정 | `GET/PUT /api/settings/*` | `AlertRules`, `NotificationSettings`, `AccessLog` | 알림 채널과 사용자 보안 신뢰 보조 |

### 2. 화면 표시 데이터 우선순위

임원용 화면에서는 데이터의 존재 여부보다 판단 순서가 중요합니다. 백엔드 스키마를 기준으로 우선순위를 다음과 같이 재분류했습니다.

| 우선순위 | 데이터 | 판단 이유 | 대표 UI |
|---|---|---|---|
| 1순위 | `title`, `summary_lines`, `exposure_band`, `exposure_score`, `trust_score`, `implication.suggested_actions` | 3초 안에 무엇이 중요하고 무엇을 해야 하는지 판단해야 함 | `ExecutiveCard`, `ExecutiveBriefingHero`, `CardDecisionPanel` |
| 2순위 | `evidence_chain.source_links`, `financial_refs`, `provenance`, `mbb_refs`, `validation_pass` | 대기업 임원 보고에서는 출처·공시·IR 페이지·생성 이력이 신뢰도를 결정함 | `EvidenceChainPanel`, `EvidencePill`, `TrustSeal` |
| 3순위 | `MonitoringComparison`, `FinancialTimeSeries`, `PeerStrategy`, `BriefingReport`, `MixerResult` | 상세 판단, 전략 비교, 보고서 생성 단계에서 필요한 확장 맥락 | `MonitoringCommandCenter`, `ExecutiveChartSystem`, `MixerWorkbench` |

### 3. 기존 프론트와 데이터 갭

기존 프론트는 카드뉴스의 시각적 캐러셀과 목업 중심 구조가 강했습니다. 반면 백엔드는 `exposure_score`, `trust_score`, `evidence_chain`, `financial_context`, `suggested_actions`를 이미 제공하거나 계약에 포함하고 있습니다. 이 값들이 UI의 중심에 오지 않으면 AXIS는 백엔드가 가진 비즈니스 판단 능력을 화면에서 잃게 됩니다.

이번 구현에서는 `CardNewsItem` 모델을 OpenAPI `CardNews`와 호환되도록 확장했습니다. 기존 목업 필드는 유지하면서 다음 필드를 추가했습니다.

- `peer_id`, `cluster_id`, `published_date`
- `event_type`, `sector`, `exposure_band`, `exposure_score`, `trust_score`
- `implication`
- `sources`, `source_count`
- `evidence_chain`
- `financial_context`
- `slides`, `display`
- `validation_pass`, `is_bookmarked`, `bookmark_count`, `share_count`, `created_at`

이 구조 덕분에 현재 목업 데이터와 향후 실제 OpenAPI 응답을 같은 컴포넌트에서 처리할 수 있습니다.

---

## [논리 수립]

### 1. Executive Flow

임원 사용자의 이동은 정보 탐색형이 아니라 의사결정형입니다. 따라서 전체 IA는 `요약 -> 상세 -> 실행`으로 고정합니다.

1. Summary
   홈에서 오늘의 핵심 카드, 고노출 카드 수, 평균 신뢰도, 실행 항목 수를 먼저 보여줍니다.

2. Drill-down
   카드 상세에서 출처 링크, 재무 연결, DART 번호, IR 페이지, LLM provenance, MBB/시장 리퍼런스를 확인합니다.

3. Action
   북마크, 공유, 브리핑 생성, 믹서기 생성, 원문 확인으로 이어집니다.

### 2. 디자인 레퍼런스 통합 논리

여러 기업 레퍼런스를 그대로 섞으면 제품 정체성이 흐려집니다. 따라서 레퍼런스를 역할별로만 흡수했습니다.

| 레퍼런스 | 채택한 요소 | 배제한 요소 | AXIS 적용 |
|---|---|---|---|
| Airtable | 구조화된 카드, 필터, 데이터 친화성 | 과한 파스텔 시그니처 카드 | 카드뉴스 라이브러리와 믹서기 후보 선택 |
| IBM | 4px 그리드, 얇은 라인, 엔터프라이즈 신뢰감, 차트 질서 | 완전한 0px radius, 단일 IBM Blue 강제 | 모니터링, 설정, 근거 패널 |
| Claude | 따뜻한 캔버스, 읽기 좋은 브리핑 흐름 | 서체 의존이 큰 문학적 과장 | 브리핑 리포트와 홈 요약 문장 |
| Intercom | 조용한 제품 UI, AI 보조 액션 | Fin Orange 중심의 소비자 친화 톤 | 플로팅 AI 채팅과 워크벤치 조작감 |
| WIRED | 카드뉴스의 에디토리얼 밀도, 강한 타이포 계층 | 순수 흑백, 무라운드, 과격한 뉴스스탠드 밀도 | 카드 커버와 제목 계층에 제한 적용 |
| The Verge | 강한 이슈 신호와 타임라인 감각 | 네온·초고채도·클럽 무드 | high exposure 상태 강조에만 제한 적용 |

### 3. 시각 원칙

AXIS는 임원용 전략 시스템이므로 다음 원칙을 우선합니다.

1. Clarity over Complexity
   KPI를 많이 보여주기보다 노출도, 신뢰도, 근거 완성도, 다음 액션을 먼저 보여줍니다.

2. Actionable Insights
   `implication.suggested_actions`를 카드 하단의 `Next action`으로 승격합니다.

3. Sophisticated Minimalism
   배경 장식, 그라데이션, 과한 그림자, 오렌지 일변도 팔레트를 제거하고 `Deep Navy`, `Warm Ivory`, `Slate`, `Controlled Coral`로 정리합니다.

### 4. 3초 인지 규칙

각 주요 화면에서 사용자가 3초 안에 인지해야 하는 첫 정보는 다음과 같습니다.

| 화면 | 3초 인지 대상 |
|---|---|
| 홈 | 오늘 가장 중요한 카드뉴스, 노출도, 신뢰도, 다음 액션 |
| 카드뉴스 | 현재 필터 기준 고노출 카드 수와 검증 완료 카드 수 |
| 모니터링 | 선택 Peer, 고노출 신호 수, 평균 신뢰도, 전략 방향성 |
| 브리핑 | 오늘/이번 주 브리핑의 핵심 문장과 근거 출처 묶음 |
| 믹서기 | 선택 카드 수, 생성 가능 여부, 연결점과 SK AX 관점 |
| 설정 | 역할, 알림 채널, 접속 로그 |

---

## [컴포넌트 명세]

### 1. 디자인 토큰

구현 위치: `src/styles/index.css`

| Token | 값 | 역할 |
|---|---|---|
| `--axis-canvas` | `#f7f4ee` | 전체 배경. Claude/Intercom 계열의 따뜻한 캔버스 |
| `--axis-surface` | `#ffffff` | 카드, 패널, 입력 표면 |
| `--axis-surface-muted` | `#ede8df` | 보조 카드, 필터 배경 |
| `--axis-ink` | `#101820` | 최상위 텍스트 |
| `--axis-navy` | `#111827` | 주요 CTA, 내비게이션 활성 |
| `--axis-body` | `#334155` | 본문 텍스트 |
| `--axis-muted` | `#64748b` | 메타 텍스트 |
| `--axis-hairline` | `#d8d2c8` | 얇은 경계선 |
| `--axis-accent` | `#c66a4a` | 절제된 강조 |
| `--axis-blue` | `#0f62fe` | OpenAPI, 정보성 상태 |
| `--axis-success` | `#198038` | 검증 통과, 성공 |
| `--axis-warning` | `#b7791f` | 검토 필요 |
| `--axis-danger` | `#da1e28` | 고노출, 위험 |

### 2. Atomic Components

#### `ExecutiveBadge`

노출도, Peer, 섹터, 검증 상태를 작은 상태값으로 표시합니다.

사용 데이터:

- `exposure_band`
- `peer_id`
- `sector`
- `validation_pass`
- `evidence_chain.pass`

#### `ExecutiveMetric`

상단 KPI 카드입니다. 숫자만 크게 보여주며 보조 설명은 한 줄로 제한합니다.

사용 위치:

- 홈 KPI
- 카드뉴스 필터 결과
- 브리핑 상태
- 모니터링 상태
- 믹서 선택 상태
- 설정 요약

#### `EvidencePill`

근거 체인 4종의 존재 여부를 점으로 보여줍니다.

체크 항목:

- Source
- Financial
- Provenance
- MBB / Market

### 3. Molecule Components

#### `ExecutiveCard`

모든 카드뉴스 목록의 기본 단위입니다.

필수 정보:

- Peer
- Sector
- Exposure
- Title
- Summary
- Exposure score
- Trust score
- Evidence completeness
- Next action

이 컴포넌트는 홈 우측 후보 리스트, 카드뉴스 라이브러리, 믹서기 후보, 모니터링 관련 카드에서 동일하게 사용합니다.

#### `CardDecisionPanel`

카드 상세 판단 패널입니다.

표시 정보:

- `implication.potential_impact`
- `implication.why_important`
- `source_count`
- `trust_score`
- `evidence completeness`

#### `InsightActionStrip`

`implication.suggested_actions`와 `follow_up_questions`를 실행 가능한 형태로 보여줍니다.

#### `EvidenceChainPanel`

임원 보고 신뢰를 담당하는 핵심 패널입니다.

표시 정보:

- `source_links`
- `financial_refs`
- `provenance`
- `mbb_refs`
- `pass`
- `missing`

### 4. Organism Components

#### `ExecutiveBriefingHero`

구현 파일: `HomeCardNewsView.tsx`

홈 첫 화면에서 가장 중요한 카드뉴스를 한 개 크게 보여줍니다. 기존 카드뉴스 감각을 유지하되, 이미지보다 판단 정보가 우선되도록 구성했습니다.

#### `HighDensityCardGrid`

구현 파일: `IssuesView.tsx`

Peer, Sector, Exposure, Query 기준으로 카드뉴스를 필터링합니다. 카드 클릭 시 우측 상세 패널이 열리고 근거 체인과 액션이 이어집니다.

#### `MixerWorkbench`

구현 파일: `RawArticlesView.tsx`

북마크 카드 2~20개를 선택해 `MixerResult.generated_implication`에 대응하는 결과를 생성합니다.

#### `MonitoringCommandCenter`

구현 파일: `MonitoringView.tsx`

Peer 필터, KPI, 포지셔닝 차트, 트렌드 차트, 전략 방향성, 관련 카드 목록을 통합합니다.

#### `ExecutiveBriefingReport`

구현 파일: `BriefingsView.tsx`

카드 묶음 기반 브리핑을 리포트 구조로 표시합니다. 일간/주간 전환, 히스토리 검색, 근거 원장을 포함합니다.

---

## [구현 가이드]

### 1. 실제 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/shared/api/httpClient.ts` | `get/post/put/delete` 추가, OpenAPI 공통 래퍼 자동 unwrap |
| `src/features/card-news/model/cardNews.ts` | OpenAPI `CardNews` 호환 필드 확장 |
| `src/features/card-news/api/cardNewsRepository.ts` | `/api/cards`, `/api/cards/today` 경로 반영 |
| `src/features/card-news/mappers/cardNewsExecutive.ts` | 임원 UI용 파생값 계산 함수 추가 |
| `src/shared/mocks/cardNews.ts` | 목업 데이터에 `evidence_chain`, `implication`, `financial_context` 보강 |
| `src/styles/index.css` | executive token, panel, card, table class 추가 |
| `src/app/components/executive/ExecutiveSystem.tsx` | 공통 Executive UI 컴포넌트 추가 |
| `src/app/components/HomeCardNewsView.tsx` | 홈 Executive 카드 브리핑으로 전면 재작성 |
| `src/app/components/IssuesView.tsx` | 카드뉴스 라이브러리와 상세 근거 패널 재작성 |
| `src/app/components/RawArticlesView.tsx` | 믹서기 워크벤치 재작성 |
| `src/app/components/BriefingsView.tsx` | 브리핑 리포트 화면 재작성 |
| `src/app/components/MonitoringView.tsx` | 모니터링 커맨드 센터 재작성 |
| `src/app/components/Sidebar.tsx` | 임원 콘솔형 내비게이션 재작성 |
| `src/app/components/SettingsView.tsx` | 설정 화면 재작성 |
| `src/app/components/FloatingAiChat.tsx` | AI 채팅 톤 통일 |
| `src/app/App.tsx` | 인증 화면 색상/표면 톤 통일 |

### 2. 상태 관리 전략

현재 프로젝트는 별도 전역 상태 라이브러리를 적극 사용하지 않고 `useAsyncResource`와 local state를 중심으로 구성되어 있습니다. 이번 구현도 이 구조를 유지했습니다.

권장 발전 방향:

1. 서버 상태
   `TanStack Query`를 도입해 `/api/cards`, `/api/monitoring`, `/api/briefings`, `/api/mixer`를 쿼리 키 기준으로 관리합니다.

2. UI 상태
   화면 내부 필터, 선택 카드, 상세 패널 open state는 local state로 유지합니다.

3. 사용자 상태
   인증 사용자, role, notification settings는 Context 또는 Zustand로 분리합니다.

4. 북마크
   현재는 localStorage 기반입니다. 백엔드 `/api/bookmarks` 연동 시 optimistic update가 적합합니다.

### 3. API 연동 세부 지침

#### 카드뉴스

현재:

- fallback mock 우선 안정성 확보
- API 활성 시 `/api/cards?sort=exposure_desc&limit=30`
- 홈은 `/api/cards/today?limit=10`

추가 권장:

- `GET /api/cards/{id}` 상세 재조회
- `POST /api/cards/{id}/verify-link`를 `EvidenceChainPanel`에 연결
- `POST /api/cards/{id}/share`를 공유 모달에 연결

#### 모니터링

현재 화면 구조는 다음 API에 맞춰 설계되어 있습니다.

- `/api/monitoring/overview`
- `/api/monitoring/comparison?metric=exposure_score`
- `/api/monitoring/{peerId}/financials?quarters=8`
- `/api/monitoring/{peerId}/strategy`
- `/api/monitoring/{peerId}/cards`

#### 브리핑

브리핑 생성은 202 Accepted 흐름을 가집니다.

권장 구현 순서:

1. `POST /api/briefings/generate`
2. 반환된 `briefing_id` 저장
3. `GET /api/briefings/{briefingId}/status` polling
4. completed 시 `GET /api/briefings/{briefingId}` 조회

#### 믹서기

OpenAPI 제약:

- `card_ids` 최소 2개
- 최대 20개

현재 UI도 2개 이상에서만 생성 버튼이 활성화됩니다. 실제 API 연동 시 `POST /api/mixer` 결과를 그대로 `MixerResultView`로 매핑하면 됩니다.

### 4. 성능 가이드

현재 빌드 기준 Vite chunk warning이 발생할 수 있습니다. 주 원인은 Recharts와 Radix UI가 같은 번들에 포함되기 때문입니다.

권장 최적화:

- 모니터링 차트를 lazy import
- Admin, Settings, Briefings를 route-level lazy split
- 카드뉴스 이미지에는 `loading="lazy"` 적용
- 카드 그리드가 100개 이상으로 커질 경우 virtualization 도입
- Recharts tooltip과 custom shape는 memoized data만 전달

### 5. 접근성 가이드

- 버튼은 최소 40px 이상 높이를 유지합니다.
- 선택 상태는 색만이 아니라 border/ring으로도 표시합니다.
- 상세 패널은 overlay click과 close button을 모두 제공합니다.
- 차트는 핵심 수치를 상단 KPI로 중복 제공해 시각 의존도를 낮춥니다.

### 6. Validation

#### 기능적 무결성

검증 항목:

- `CardNews` 핵심 필드가 UI에서 누락되지 않는가?
- `EvidenceChain` 4종 상태가 카드 상세에서 표시되는가?
- `suggested_actions`가 실행 UI로 승격되는가?
- 북마크 카드가 믹서기 입력으로 연결되는가?
- 모니터링이 Peer 필터 기준으로 관련 카드를 재정렬하는가?

현재 구현 상태:

- 충족

#### 비즈니스 적합성

검증 항목:

- 임원이 3초 안에 핵심 카드와 조치 방향을 파악할 수 있는가?
- 공유, 북마크, 브리핑, 믹서기 흐름이 끊기지 않는가?
- 근거, 재무, 출처 신뢰도, provenance가 보고 신뢰를 보강하는가?

현재 구현 상태:

- 충족
- 실제 export/download 기능은 후속 구현 필요

#### 기술적 실현 가능성

검증 항목:

- 현재 스택으로 빌드 가능한가?
- 화면 전환과 차트가 과한 애니메이션 없이 안정적으로 동작하는가?
- OpenAPI 래퍼와 fallback mock이 공존하는가?

현재 검증:

```bash
npm run build
```

결과:

- TypeScript compile 성공
- Vite production build 성공
- Recharts/Radix 포함으로 bundle size warning 존재

### 7. 다음 구현 우선순위

1. `POST /api/mixer` 실제 연동
2. `POST /api/cards/{id}/share` 실제 공유 링크 연동
3. `POST /api/cards/{id}/verify-link` 근거 패널 버튼 추가
4. `GET /api/monitoring/*` 병렬 조회와 TanStack Query 도입
5. 브리핑 생성 polling 구현
6. PDF/PPT Export 또는 보고서 복사 기능 추가
7. Admin 화면까지 Executive token 기반으로 재작성

---

## 결론

이번 디자인 시스템은 AXIS를 단순한 카드뉴스 뷰어에서 `Executive Intelligence Console`로 전환하기 위한 기반입니다. 핵심은 카드뉴스를 시각 자료가 아니라 의사결정 단위로 다루는 것입니다.

모든 주요 화면은 이제 같은 원칙을 공유합니다.

- 먼저 요약한다.
- 반드시 근거를 보여준다.
- 다음 액션을 제안한다.
- 공유와 보고 흐름으로 이어진다.

이 구조는 백엔드의 OpenAPI v3 계약과 현재 프론트엔드 스택 모두에 부합하며, 실제 데이터 연동이 진행되어도 화면 구조를 크게 바꾸지 않고 확장할 수 있습니다.
