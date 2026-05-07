# Task — AXIS 프론트엔드를 SK·Mistral·McKinsey 융합 톤으로 전환

axis-frontend (designing 브랜치) 의 **콘텐츠 (그래프 · 카드뉴스 · 데이터 테이블 · executive 카드 · floating chat) 와 도메인 로직은 그대로 유지**하면서, 시각 + 레이아웃을 **"SK 발주처 정체성 + Mistral 디자인 시스템 + McKinsey Insights 리서치 톤"** 으로 재구성한다.

세 가지 SoT:
- `design/design-mistral.md` — 컬러·타이포·라운딩 base
- **SK 정체성** — SK Red (#EA002C) → Mistral Orange (#DC5A24) **그라디언트** 로 흡수 (§3.G)
- **McKinsey Insights** 풍 — editorial wide layout + featured insights grid + sticky TOC + 출처/저자 명시 (§3.H)

## 1. 목표 / 비목표

**목표**
- 발주처 (SK AX 사업전략팀) 가 발표 시 "SK 답고 + 전문 리서치 사이트답다" 고 느끼는 톤
- McKinsey Insights / BCG Henderson Institute / Stratechery 의 article-style 정보 위계 — eyebrow + serif display + reading column + sources
- SK 시그니처 (빨강 → 오렌지 그라디언트) 가 액센트 영역에 자연스럽게 등장
- 그래프 · 카드뉴스 · executive 카드 · 차트 자체는 보존하되 framing 만 재구성
- 한국어 우선 typography (한글 + 영문 혼용 자연스럽게)

**비목표** (절대 건드리지 않음)
- 라우팅·상태·hook (`features/*` 의 mappers, hooks, model)
- API 계약 (`shared/api`, `features/**/api`)
- FSD 폴더 구조
- 기능 (북마크 · 검색 · 필터 · floating AI chat 의 동작 자체)
- Three.js 그래프 / Recharts 차트의 데이터 소스·렌더링 로직 (색상/스트로크만 변경)
- 다크 모드 — 1차 적용 범위 외 (§3.E)

## 2. 사전 컨텍스트 (반드시 읽어볼 파일)

| 파일 | 왜 |
|---|---|
| `design/design-mistral.md` | base 디자인 SoT |
| `design/design-mistral-prompt.md` (이 파일) | 적용 가이드 |
| `CLAUDE.md` | 프론트 컨벤션 |
| `src/styles/theme.css` | 자체 `--axis-*` 토큰 (cyberpunk dark mint) — 교체 대상 |
| `src/styles/fonts.css` | `AxisDisplayFallback` (Arial Narrow) — 교체 대상 |
| `tailwind.config.js` | 현재 `urgent / notable / reference` 정의 |
| `src/app/App.tsx` | 인증 + Sidebar 통합 라우팅 (~277 lines) |
| `src/app/components/Sidebar.tsx` | 현재 nav (~143 lines) |
| `src/app/components/HomeCardNewsView.tsx` | 메인 — Three.js 키워드 그래프 + 카드뉴스 |
| `src/app/components/MonitoringView.tsx` + `executive/ExecutiveSystem.tsx` | Recharts + Executive primitive |
| `src/app/components/CardNewsPreviewPanel.tsx` | 카드뉴스 미리보기 |
| `src/app/components/FloatingAiChat.tsx` | floating chat |
| `src/app/components/ui/{button,card,input,badge,dialog,popover,tooltip,separator}.tsx` | shadcn primitive |

### 작업 시작 전 1회 체크 (사용자 확인 단계)
4 파일 (`theme.css`, `HomeCardNewsView.tsx`, `MonitoringView.tsx`, `ExecutiveSystem.tsx`) 직접 열어 1줄 보고 후 시작.

## 3. 핵심 의사결정 (모두 합의됨 — 작업 착수 시 재확인만)

### A. PP Editorial Old → **Newsreader** (Google Fonts 무료 variable, near-serif editorial)
한글 헤드는 **Noto Serif KR** variable. font-family 분기로 라틴/한글 매칭.

### B. Mountain-Sunset Photography → **사용 X**
대시보드라 부적합. 대시보드 hero 는 editorial display + eyebrow + 통계 chip. AuthScreen 만 atmospheric gradient (SK Red → Mistral Orange → sunshine) 로 hero 톤 차용.

### C. Sunset Stripe Band → **모든 페이지 footer 보존**
SK Red → Mistral Orange → sunshine → cream 5-stop 가로 그라디언트. 8px 높이.

### D. Cream Surface 사용 4 곳 한정
- Pinned / Important card (북마크, 중요도 high)
- FloatingAiChat 본문
- CTA banner (Dashboard 상단 "오늘의 액션" 같은 강조)
- AuthScreen form panel

### E. 다크 모드 제외
`.dark` 블록 수정도 삭제도 X. light 만 작업.

### F. Executive System 시각 재정의
`ExecutiveSystem.tsx` 의 primitive (`ExecutiveCard / Badge / Metric / TrustSeal / Container / Header / Page`) 를 Mistral `card-base / badge-cream / stat-display` 등으로 시각만 변환. API 시그니처 보존.

### G. **SK Red → Mistral Orange 그라디언트** (사용자 합의)
SK 시그니처 빨강 (#EA002C) 을 단독으로 박지 않고 **Mistral Orange 와 그라디언트로 융합**. 적용 위치 :

```
주요 그라디언트 (정의):
  --gradient-sk-mistral: linear-gradient(135deg, #EA002C 0%, #C73018 30%, #DC5A24 70%, #E0822F 100%);

적용:
1. Sunset stripe band (footer): SK Red 시작 → Mistral Orange → sunshine → cream
   linear-gradient(90deg, #EA002C 0%, #DC5A24 18%, #E0822F 45%, #ECA341 70%, #F2C56B 88%, #F7E6C4 100%)
2. AuthScreen hero (우측 panel): 135deg 풀-블리드 그라디언트
3. 강조 카드 좌측 4px indicator bar — 중요도 'urgent' 만 그라디언트 vertical (top SK Red → bottom Mistral Orange)
4. eyebrow 라벨 ("오늘의 인텔리전스" 같은) — text gradient 적용 가능 (background-clip: text)
5. CTA button hover/active state — bg-gradient (단, hover 정의는 link 한정 정책상 active 만)
6. Three.js 그래프 root 노드 글로우
```

원칙: 그라디언트는 **시그니처 영역**에서만 사용. 본문 텍스트·일반 카드·버튼은 단색 (`primary` solid).

### H. **McKinsey Insights 풍** (사용자 합의 + 전문가 판단으로 구체화)
참조 사이트: mckinsey.com/insights, bcg.com/featured-insights, anthropic.com/research, stratechery.com

#### H.1 — Container / Grid 시스템 (구체 픽셀)

```
모든 페이지 공통 grid:
  container:         max-w-[1280px] mx-auto
  좌우 padding:      px-6 (mobile) / px-8 (tablet) / px-12 (desktop)
  내부 gap:          gap-6 (cards) / gap-8 (sections)

layout 모드 (페이지별):
  A. Reading mode    (article 상세 — IssueDetail, BriefingDetail, MonitoringView 분석)
       grid-cols-12 lg:grid-cols-[240px_minmax(720px,820px)_1fr]
       └─ left: sticky TOC 240px
       └─ center: reading column 720~820px max
       └─ right: meta / related (옵션)

  B. Index mode      (insights grid — HomeCardNewsView, BriefingsView, IssuesView)
       max-w-[1280px] · 3-up uniform grid 또는 1-2 asymmetric (§17)

  C. Data mode       (RawArticlesView, AdminView audit)
       max-w-[1440px] · full-width table (§11)

  D. Form mode       (SettingsView, AuthScreen, FloatingAiChat)
       max-w-[640px] mx-auto · cream form panel

section 간 spacing:
  py-16   (section 작음 — stat strip, filter row)
  py-24   (section 표준 — featured insights, network map)
  py-32   (section 크게 — hero, page-end CTA)
  border-y border-hairline-soft  (섹션 구분 — color 변화 X 라면 hairline)
```

#### H.2 — McKinsey 첫인상 핵심 패턴 (전문가 판단)

대시보드의 첫 화면 = **"오늘 가장 중요한 1건이 뭐야?" 의 답을 1초 안에**.
"통계 4개 + 그래프" 는 **BI tool 같음 → 약함**. 다음 순서로 재배치:

```
1. HERO CARD (풀폭, 1건 강조) — "Today's Featured Intelligence"
   - 좌측 이미지 (4:3 또는 16:9 max-540px) + 우측 텍스트
   - eyebrow + Newsreader heading-1 + subtitle + meta
   - button-primary "전체 보기 →"

2. STATS STRIP (얇은 row, 시그니처 신뢰 신호)
   - 4-cell, stat-display 36px (Newsreader 56px 보다 작게 — hero 보다 약하게)
   - py-8, border-y hairline-soft

3. NETWORK MAP (별도 섹션 — Three.js 그래프)
   - eyebrow "Network Map" + heading-3 "키워드 ↔ Peer 관계도"
   - 그래프 풀-블리드 컨테이너 (max-w-[1280px], aspect-[16/9] 또는 height 540)

4. FEATURED INSIGHTS (1-2 asymmetric 그리드 — 큰 1개 + 작은 4개) — §17

5. ALL ARTICLES (date desc, 3-col uniform 그리드)

6. SUNSET STRIPE → FOOTER
```

#### H.3 — 그 외 핵심 패턴

1. **Reading column 720~820px** — article 상세는 좁게
2. **Editorial display headline** — 큰 serif (Newsreader) + eyebrow ("INSIGHT · 2026.05.06") + subtitle
3. **Sticky sidebar TOC** (>1024px) — article 페이지 좌측 240px (§17.5)
4. **Asymmetric Featured Insights** — 1-2 패턴 (큰 hero card 1 + 작은 4) — §17
5. **Author / Published / Read-time 메타** — "AXIS AI · 2026.05.06 · 5분 read · 출처 4건" (AI 생성 명시 + 시간)
6. **인용 [1][2]** — 본문 footnote 마커 → 우측 drawer (§14)
7. **차트는 minimal stroke** — single line + 무채 grid + 작은 라벨 (§12)
8. **Pull quote** — 핵심 인용 큰 serif + 좌 4px sk-mistral bar
9. **Continue reading** — inline orange link
10. **Print-friendly** — §16

### I. **한국어 Typography 룰** (default 채움)

```css
/* font-family 분기 */
헤드 (h1~h4): font-display + font-display-ko 페어
  - 라틴: Newsreader (variable, 400)
  - 한글: Noto Serif KR (variable, 400)
  - CSS unicode-range 로 자동 분기:
    @font-face Newsreader { unicode-range: U+0020-024F, U+1E00-1EFF; }
    @font-face Noto Serif KR { unicode-range: U+AC00-D7AF, U+1100-11FF; }

본문: font-body
  - 라틴: Inter Variable
  - 한글: Pretendard Variable
  - 기본 16px / line-height 1.6 (한글은 1.55 보다 1.6 권장 — 한글 글꼴 baseline 차이)

코드: JetBrains Mono (영문만, 한글 fallback 시 Pretendard Variable)
```

**letter-spacing 분기**:
- 영문 헤드 (라틴 detected): 56px+ → -1.5px / 36px → -0.5px / body → 0
- 한글 헤드: 모두 **0** (Korean glyph 는 negative tracking 시 글자 붙어 어색)

**숫자 표기**:
- 천 단위 콤마 (`1,234`)
- 큰 숫자: `1,234억 원` / `1.2조 원` (한국 단위 한글)
- 비율: `87.5%`
- 음수: `−12.3%` (마이너스는 minus sign U+2212, hyphen X)
- monospace 숫자 사용처 — 데이터 테이블, 차트 라벨, KPI 카드. CSS: `font-variant-numeric: tabular-nums`
- 카드/본문 인라인 숫자는 본문 폰트 그대로 OK

**날짜/시간** (한국 표준):
- 날짜: `2026.05.06` (점 separator)
- 요일 포함: `2026.05.06 (월)` 또는 `2026.05.06 月` (격식체일 땐 한자 月)
- 시간: `14:30` (24h)
- 상대시간: `5분 전 / 3시간 전 / 어제 / 2026.05.04` (24h 이내 상대, 그 이상 절대)
- ISO 사용 X (UI 노출용)

**한자 / 영문 약어**:
- 한자 사용 X (예외: 月 火 水 같은 요일)
- 영문 약어: 대문자 그대로 (`M&A` `AI` `KPI` `SI` `IT` `IR` `DART`) — 한글로 풀어 쓰지 않음
- 회사명 표기: 영문은 그대로 (`삼성SDS / LG CNS / 현대오토에버 / 포스코DX / SK AX`)

**카피 톤** (격식체):
- 격식체 사용 (`~합니다 / ~입니다`) — 발주처 발표 환경
- 평어/반말 X
- 명령형 동사보다 정중한 표현 (`삭제` 보다 `삭제하기` 정도, 또는 정확한 원형)
- 영문 UI 라벨 한글화 (`Save` → `저장` / `Cancel` → `취소`)

### J. **사용자 역할별 화면 차이** (default 채움)

`UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer'` — 4 역할:

| 역할 | 화면 | 액션 |
|---|---|---|
| **admin** | 모든 메뉴 + AdminView (시스템 관리) | 모든 액션 (생성·수정·삭제·발송) |
| **strategist** | AdminView 제외 모든 메뉴 | 카드 북마크·필터·메모. 삭제 X. 알림 설정 일부 |
| **analyst** | strategist 와 동일 | strategist 와 동일 (현재 차등 없음 — 향후 분리 가능) |
| **viewer** | AdminView 제외 모든 메뉴 read-only | 북마크만 가능. 필터·검색은 OK. 메모/삭제/발송 X (UI 비활성 또는 hidden) |

**시각 처리**:
- 비활성 액션 버튼: `opacity-40 pointer-events-none` + tooltip "권한이 없습니다"
- AdminView 메뉴 항목: `currentUserRole !== 'admin'` 면 Sidebar 에서 hidden (현재 구현 그대로)
- 역할 표시: Sidebar 하단 user 패널에 "전략기획 · 박지원" 처럼 직책-이름. 작은 cream chip 으로 역할 표기 (`<Badge variant="cream-deeper">전략기획</Badge>`)

## 4. 작업 단계

### Phase 1 — 토큰 레이어

1. **`src/styles/fonts.css`** — Google Fonts CDN + unicode-range 분기:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@400;500;600;700&family=Noto+Serif+KR:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
   @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css');

   :root {
     --font-display: 'Newsreader', 'Noto Serif KR', 'Times New Roman', Georgia, serif;
     --font-body:    'Inter', 'Pretendard Variable', -apple-system, system-ui, sans-serif;
     --font-mono:    'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
   }
   ```
2. **`src/styles/theme.css`** 통째 재작성 (`.dark` 블록 보존):
   ```css
   :root {
     /* SK + Mistral 융합 */
     --sk-red: #EA002C;
     --primary: #DC5A24;
     --primary-deep: #B8451A;

     /* 시그니처 그라디언트 — §3.G */
     --gradient-sk-mistral: linear-gradient(135deg, #EA002C 0%, #C73018 30%, #DC5A24 70%, #E0822F 100%);
     --gradient-sunset-stripe: linear-gradient(90deg, #EA002C 0%, #DC5A24 18%, #E0822F 45%, #ECA341 70%, #F2C56B 88%, #F7E6C4 100%);
     --gradient-auth-hero: linear-gradient(135deg, #EA002C 0%, #DC5A24 35%, #E0822F 65%, #ECA341 100%);

     /* sunshine palette */
     --sunshine-300: #F2C56B;
     --sunshine-500: #ECA341;
     --sunshine-700: #E0822F;
     --sunshine-800: #C75D2C;
     --sunshine-900: #A24818;
     --yellow-saturated: #F7D14B;

     /* cream */
     --cream: #F5EAD0;
     --cream-soft: #FBF4E4;
     --cream-deeper: #ECDCB0;
     --beige-deep: #D4C28C;

     /* surface */
     --canvas: #FFFFFF;
     --surface: #FAF8F5;
     --surface-cream: #FBF4E4;
     --surface-code: #1A1A1F;

     /* ink */
     --ink: #1A1A1F;
     --ink-tint: #2A2A30;
     --charcoal: #2D2D33;
     --slate: #4A4A52;
     --steel: #6B6B73;
     --stone: #8E8E96;
     --muted: #B8B8BE;

     /* hairline */
     --hairline: #E5E0D6;
     --hairline-soft: #EFEAE0;
     --hairline-strong: #C8C2B4;

     /* shadcn semantic 매핑 */
     --background: var(--canvas);
     --foreground: var(--ink);
     --card: var(--canvas);
     --card-foreground: var(--ink);
     --primary-foreground: #FFFFFF;
     --secondary: var(--cream);
     --secondary-foreground: var(--ink);
     --muted: var(--surface);
     --muted-foreground: var(--steel);
     --border: var(--hairline-soft);
     --ring: var(--primary);
     --sidebar: var(--ink);
     --sidebar-foreground: #FFFFFF;
     --sidebar-primary: var(--primary);

     /* 자체 axis alias (호출 코드 보존용) */
     --axis-navy: var(--ink);
     --axis-radius-md: 8px;
     --axis-radius-lg: 12px;

     /* radius */
     --radius-xs: 4px;
     --radius-sm: 6px;
     --radius-md: 8px;
     --radius-lg: 12px;
     --radius-xl: 16px;
     --radius-xxl: 20px;
     --radius: var(--radius-lg);

     /* shadow */
     --shadow-card: rgba(0, 0, 0, 0.04) 0px 4px 12px;
     --shadow-mockup: rgba(0, 0, 0, 0.08) 0px 12px 24px -4px;

     --font-size: 16px;
   }

   @layer base {
     html { font-size: 16px; }
     body {
       font-family: var(--font-body);
       font-size: 16px;
       line-height: 1.55;
       color: var(--ink);
       background: var(--canvas);
       font-feature-settings: 'ss01', 'cv11';  /* Inter alt forms */
     }
     h1, h2, h3, h4, h5, h6 {
       font-family: var(--font-display);
       font-weight: 400;
       color: var(--ink);
     }
     /* 한글 헤드 letter-spacing 0 강제 */
     h1:lang(ko), h2:lang(ko), h3:lang(ko), h4:lang(ko) { letter-spacing: 0; }

     /* tabular numerals — KPI / 테이블 / 차트 라벨에 자동 */
     .tabular, .num, td.num, th.num {
       font-variant-numeric: tabular-nums;
       font-feature-settings: 'tnum' 1;
     }
   }
   ```
3. **`tailwind.config.js`**:
   - `colors`: `sk-red`, `primary`, `primary-deep`, `sunshine-{300,500,700,800,900}`, `yellow-saturated`, `cream*`, `beige-deep`, `ink`, `slate`, `steel`, `stone`, `hairline*`, `surface*`, `urgent` `notable` `reference` (mistral 톤)
   - `urgent: '#B8451A'`, `notable: '#A85F00'`, `reference: '#5A6B57'`
   - `fontFamily.display / body / mono`
   - `fontSize` 18 토큰 (Mistral §typography 표 그대로 — `hero / display-lg / heading-1 / stat-display / heading-2~5 / subtitle / body-md / body-sm / caption / caption-bold / micro / micro-eyebrow / btn-md / code-md`)
   - `borderRadius`: xs:4 / sm:6 / md:8 / lg:12 / xl:16 / xxl:20 / full:9999
   - `boxShadow`: `DEFAULT/sm/md/lg/xl/2xl: 'none'`, `card`, `mockup`
   - `backgroundImage`:
     ```js
     'sk-mistral':       'linear-gradient(135deg, #EA002C 0%, #C73018 30%, #DC5A24 70%, #E0822F 100%)',
     'sunset-stripe':    'linear-gradient(90deg, #EA002C 0%, #DC5A24 18%, #E0822F 45%, #ECA341 70%, #F2C56B 88%, #F7E6C4 100%)',
     'auth-hero':        'linear-gradient(135deg, #EA002C 0%, #DC5A24 35%, #E0822F 65%, #ECA341 100%)',
     ```
     `<div className="bg-sk-mistral" />` 한 줄.

### Phase 2 — Primitive (shadcn ui) override
- **`button.tsx`**: cva variant 보존 — default `bg-primary text-white rounded-md px-5 py-2.5 text-btn-md`, outline `border border-hairline-strong text-ink rounded-md`, secondary `bg-cream text-ink border border-beige-deep rounded-md`, ghost `text-primary`, destructive `bg-urgent text-white rounded-md`, link `text-primary hover:underline`
- **`card.tsx`**: `bg-canvas border border-hairline-soft rounded-lg p-6` (shadow 클래스 모두 제거)
- **`input.tsx`**: `rounded-md border border-hairline-strong h-11 px-4 text-body-md focus:border-2 focus:border-primary`
- **`badge.tsx`**: 4 variant — default `bg-primary text-white`, secondary `bg-cream-deeper text-ink`, outline `border border-hairline text-ink`, destructive `bg-urgent text-white`. 모두 `rounded-full px-2.5 py-1 text-caption-bold`
- **`separator.tsx`**: `bg-hairline-soft`
- **`dialog/popover.tsx`**: `bg-canvas border border-hairline-soft rounded-lg shadow-card` (backdrop blur X)
- **`tooltip.tsx`**: `bg-ink text-white rounded-md px-3 py-1.5 text-caption`

### Phase 3 — 도메인 뷰 (McKinsey Insights 풍 적용)

#### 3-1. Sidebar — Editorial nav (slim)
- 배경 `bg-ink` (다크 사이드바 유지) · 240px 폭
- 로고: AxisMark (SK Red 단색 또는 그라디언트 사각형 11×11) + Newsreader heading-3 "AXIS" + eyebrow "PEER INTELLIGENCE"
- 메뉴: `text-body-sm-strong text-white/70`, 활성 `text-white` + **좌측 2px sk-mistral gradient bar**
- 하단 user 패널: `bg-cream-soft/10` tile + `Badge variant="secondary"` 로 역할 표기 (`전략기획 · admin`)

#### 3-2. AuthScreen — 시그니처 hero (분할)
- 좌측 (5/12): white form panel — Newsreader heading-1 "AXIS" + subtitle "Peer Intelligence System" + 로그인 form (`card-cream`) + button-primary
- 우측 (7/12): `bg-auth-hero` 풀-블리드 그라디언트 panel + 큰 Newsreader display-lg quote ("전략기획의 다음 30분") + 작은 attribution
- 하단 sunset stripe (full-width) — 가장 시그니처

#### 3-3. HomeCardNewsView — McKinsey 첫 화면 (재배치 — §H.2 정신)

전문가 판단: 통계 row + 그래프 + grid 만 있으면 BI tool 같음. **"오늘 가장 중요한 1건"** 강조해야 리서치 사이트 첫인상.

```
순서 (위 → 아래):

┌─ 1. HERO CARD ─────────────────────────────────────────────┐ section py-32
│  max-w-[1280px] mx-auto px-12                              │
│                                                             │
│  eyebrow "오늘의 핵심 동향 · 2026.05.06 (월)" (micro-eyebrow)  │
│  ┌─────────────────────┬──────────────────────────────────┐│
│  │  IMAGE (4:3 max-540) │  Newsreader heading-1 (52px)     ││
│  │  rounded-lg          │  "LG CNS, 팔란티어와 AX 파트너십"  ││
│  │  shadow-card         │  subtitle text-subtitle text-steel││
│  │                      │  "글로벌 컨설팅 baseline 의 ..."   ││
│  │  좌측 4px sk-mistral │                                  ││
│  │  indicator (urgent)  │  meta row text-caption text-stone││
│  │                      │  "AXIS AI · 2026.05.06 ·         ││
│  │                      │   5분 read · 출처 4 · 신뢰도 91%" ││
│  │                      │                                  ││
│  │                      │  button-primary "전체 보기 →"     ││
│  └─────────────────────┴──────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘

┌─ 2. STATS STRIP ───────────────────────────────────────────┐ py-8
│  border-y border-hairline-soft                             │
│  grid grid-cols-4 gap-12                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ 33    │ │ 8     │ │ 87%   │ │ 4     │                  │
│  │ stat- │ │ stat- │ │ stat- │ │ stat- │                  │
│  │ display│ │ display│ │ display│ │ display│              │
│  │ 36px  │ │ 36px  │ │ 36px  │ │ 36px  │                  │
│  │ ───── │ │ ───── │ │ ───── │ │ ───── │                  │
│  │ MICRO │ │ MICRO │ │ MICRO │ │ MICRO │                  │
│  │ 오늘  │ │ 긴급  │ │ 신뢰도│ │ Peer  │                  │
│  │ 카드  │ │       │ │       │ │       │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│  (모든 숫자 tabular-nums + Newsreader)                      │
└────────────────────────────────────────────────────────────┘

┌─ 3. NETWORK MAP ───────────────────────────────────────────┐ py-24
│  eyebrow "Network Map" (micro-eyebrow text-primary)        │
│  Newsreader heading-2 "키워드 ↔ Peer 관계도"                │
│  body-sm text-steel "10 키워드 · 5 Peer · 33 카드"          │
│                                                             │
│  ┌─ Three.js graph (max-w-[1280px], aspect-[16/9]) ──┐    │
│  │  bg-surface-code rounded-lg shadow-mockup          │    │
│  │  산-석양 노드 팔레트 (§13)                           │    │
│  └────────────────────────────────────────────────────┘    │
│  caption text-stone "노드 클릭 → 해당 카드 표시"             │
└────────────────────────────────────────────────────────────┘

┌─ 4. FEATURED INSIGHTS (1-2 asymmetric grid — §17) ─────────┐ py-24
│  eyebrow "Featured Insights" + heading-2 "이번 주 주요 동향" │
│                                                             │
│  grid grid-cols-12 gap-6                                   │
│  ┌─ 큰 카드 (col-span-6 row-span-2) ─┐ ┌─ 작은 (col-span-3) ─┐ │
│  │  IMAGE (16:9)                     │ │  IMAGE (4:3)        │ │
│  │  eyebrow + Newsreader heading-3   │ │  small heading      │ │
│  │  subtitle + meta                  │ │  meta              │ │
│  └───────────────────────────────────┘ └─────────────────────┘ │
│                                       ┌─ 작은 (col-span-3) ─┐ │
│                                       │  ...                │ │
│                                       └─────────────────────┘ │
│  ┌─ small ─┐ ┌─ small ─┐ ┌─ small ─┐ ┌─ small ─┐           │
│  │ col-3   │ │ col-3   │ │ col-3   │ │ col-3   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  Pinned 카드는 bg-cream, 그 외는 bg-canvas + hairline       │
└────────────────────────────────────────────────────────────┘

┌─ 5. ALL ARTICLES (date desc) ──────────────────────────────┐ py-24
│  eyebrow "All Articles" + heading-3 "전체 동향 33건"        │
│  filter chip row (peer · event · 기간)                     │
│                                                             │
│  grid grid-cols-3 gap-6                                    │
│  uniform card (image 4:3 + eyebrow + heading-4 + 3줄 +     │
│                meta + 좌측 4px indicator bar)              │
│                                                             │
│  pagination 또는 "더 보기" button-secondary                 │
└────────────────────────────────────────────────────────────┘

┌─ 6. SUNSET STRIPE (8px) ───────────────────────────────────┐
└────────────────────────────────────────────────────────────┘

┌─ 7. FOOTER (§19) ──────────────────────────────────────────┐
└────────────────────────────────────────────────────────────┘
```

**핵심 룰**:
- Hero card 의 image area 비어있으면 **PlaceholderPattern** (§18) — Peer 별 abstract gradient
- Featured Insights 의 큰 카드 = 가장 최근 pinned 또는 importance score 최고
- Three.js 그래프 = "BI tool 처럼 보이는 위험" 방지 위해 별도 섹션 + small caption — 부수적 시각 요소로
- All Articles 그리드 = uniform 3-col 으로 단조롭지 않게 image-led 카드
- 모든 카드의 click affordance = `cursor-pointer` + 카드 안 우하단 작은 chevron icon (Lucide ArrowUpRight 16px) (§21)

#### 3-4. MonitoringView — Article + Chart 결합 (McKinsey Insights detail page 톤)

- 상단 hero (max-w-820px reading column): eyebrow + Newsreader heading-1 + author/published meta
- 좌측 sticky TOC (>1024px, 240px): "1. 개요 · 2. Peer 노출도 · 3. 신뢰도 · 4. 시사점" — 활성 항목 `text-primary` + 좌 2px primary border
- 본문 reading column 720~820px: 단락 본문 `text-body-md` (line-height 1.6 한글)
- Recharts: `card-feature-product` 안에 배치, primary stroke, hairline-soft grid, no decorative
- ExecutiveCard / Metric / TrustSeal 모두 §3.F 변환
- Pull quote (핵심 인용): `border-l-4 border-sk-mistral pl-6 py-4` + Newsreader heading-3
- Citations: 본문 안 `[1]` 마커 → 클릭 시 우측 drawer 열림 (출처 list)

#### 3-5. BriefingsView / IssuesView / RawArticlesView — 정보 그리드 + 데이터 테이블

- 상단 hero band (작은) + filter chip row (segmented-tab 스타일, 활성 = `text-primary` + 2px bottom border)
- BriefingsView: featured insights 그리드 (3-up)
- IssuesView: dense list (1-col, full-width 카드)
- RawArticlesView: **데이터 테이블** (§11 참조)

#### 3-6. SettingsView / AdminView / AlertsView — Cream form + utility grid
- form 패널: `card-cream` (`bg-cream rounded-lg p-8 border border-beige-deep`)
- input: Mistral text-input (h-11, hairline-strong, focus 2px primary)
- 4-col tile → 2-col tablet → 1-col mobile

#### 3-7. FloatingAiChat — Cream form 패널
- `bg-cream-soft border border-beige-deep rounded-lg shadow-card`
- 메시지: user `bg-primary text-white rounded-md`, assistant `bg-canvas border border-hairline-soft rounded-md`
- 입력: text-input + button-primary

### Phase 4 — 인터랙션 + 마무리
- focus ring → `outline: 2px solid var(--primary)` (visible only on `:focus-visible`)
- **hover state 명시 정의 금지** (link `hover:underline` 만 예외)
- `:active` 시 색만 변경 (`button-primary-pressed: bg-primary-deep`). scale transform X (Mistral 정신).
- transitions: 150~200ms ease

## 5. 토큰 매핑 표 (현재 → SK·Mistral·McKinsey)

| 영역 | 현재 (designing) | 신규 |
|---|---|---|
| Primary | `#3cffd0` 네온 | `#DC5A24` Mistral Orange (CTA 단색) + `bg-sk-mistral` 그라디언트 (시그니처 영역) |
| Background | `#0d0f13` 다크 | `#FFFFFF` canvas |
| Foreground | `#f6f8fb` | `#1A1A1F` ink |
| Card | `#161a22` | `#FFFFFF` + 1px hairline-soft |
| Sidebar | `#161a22` | `#1A1A1F` ink (다크 유지) |
| Border | `rgba(255,255,255,0.12)` | `#EFEAE0` hairline-soft |
| Display font | AxisDisplayFallback | **Newsreader** (라틴) + **Noto Serif KR** (한글) |
| Body font | Inter | Inter Variable + Pretendard Variable |
| Body 크기 | 14px | 16px (Mistral body-md), line-height 1.55~1.6 |
| Radius | `0.75rem` 단일 | xs 4 / sm 6 / md 8 / lg 12 / xl 16 / xxl 20 / full 9999 |
| Box shadow | 글로우 | `none`, `shadow-card` (feature) / `shadow-mockup` (code) |
| 그래프 색 | 네온 | sunshine palette (primary, sunshine-300/500/700/900, sk-red 1점) |

## 6. Don'ts
- 두 번째 액센트 색 금지 (orange/red gradient 만 시그니처 영역에서 사용)
- pill 버튼 금지 (`rounded-full` 은 badge / pill-tab 한정)
- 그라디언트 배경 — 시그니처 영역 외 금지 (auth hero / sunset stripe / strong indicator bar 만)
- chrome 그림자 금지 (`shadow-card` 는 feature card / `shadow-mockup` 은 code 전용)
- 인라인 typography (`text-[Npx]`) 금지
- 14px body 금지 → 16px
- hover 정의 금지 (`hover:underline` 만 예외)
- 한자 사용 금지 (요일 月火水 만 예외)
- 영문 약어를 한글로 풀어쓰기 금지 (M&A / AI / KPI 그대로)
- 한글 헤드 letter-spacing 음수 금지 (영문만)
- shadcn cva variants key 변경 금지
- `<html>` font-size 변경 금지
- `.dark` 블록 수정 금지
- **Sunset stripe band 누락 금지**
- 중요도 (urgent/notable/reference) 격리 — bar + caption-bold 라벨만. button/link/focus ring 사용 X
- Three.js 그래프의 데이터/구조 변경 금지 (색만)

## 7. 검증 체크리스트
자동 grep:
- [ ] `grep -rE "shadow-(sm|md|lg|xl|2xl)" src/` → 0
- [ ] `grep -rE "rounded-pill|rounded-3xl" src/` → 0
- [ ] `grep -rE "text-\[[0-9]+px\]" src/` → 0
- [ ] `grep -rE "#3cffd0|#0d0f13|#161a22" src/styles/` → 0 (`.dark` 제외)
- [ ] `grep -rE "bg-(red|yellow|green)-[0-9]" src/` → 0
- [ ] `grep -rE "bg-sunset-stripe|h-2 bg-sunset" src/` → ≥ 1 (모든 페이지 footer 공통)
- [ ] `grep -rE "bg-sk-mistral" src/` → ≥ 3 (시그니처 영역 — strong indicator bar 등)
- [ ] `grep -rE "tabular-nums|tnum" src/` → ≥ 1 (KPI/테이블 monospace 숫자)

수동:
- [ ] theme.css hex 가 design-mistral.md `colors:` + SK Red `#EA002C` 정합
- [ ] `tailwind.config.js` 에 `borderRadius` 7 + `fontSize` 18 + `backgroundImage` 3 (sk-mistral / sunset-stripe / auth-hero) 등록
- [ ] Newsreader + Noto Serif KR + Inter + Pretendard + JetBrains Mono fonts.css 로드
- [ ] `npm run type-check` + `npm run build` 통과
- [ ] 핵심 화면 (Auth → Home → Monitoring → Briefings) 시각 확인
- [ ] AuthScreen 우측 패널 SK→Mistral 그라디언트 살아있음
- [ ] 한글 헤드 어색하지 않음 (Noto Serif KR fallback 작동)
- [ ] 영문 약어 (AI / M&A) 가 한글 본문 안에서 자연스럽게 흐름
- [ ] 숫자 monospace + 천 단위 콤마 (KPI 카드)
- [ ] 차트 stroke = primary, grid = hairline-soft
- [ ] Three.js 노드 색이 산-석양 팔레트
- [ ] footer 직전 sunset stripe 모든 라우트
- [ ] 비활성 액션 (`UserRole === 'viewer'`) opacity-40 + tooltip
- [ ] Lighthouse LCP < 2s

## 8. 작업 권장 순서
1. **사전**: §2 의 4 파일 1줄 보고 → 사용자 OK
2. **§3 의사결정 재확인** (이미 합의 — 스킵 가능)
3. **Phase 1 (토큰)** 한 방
4. **Phase 2 (shadcn)** Button → Card → Input → Badge → Dialog → Popover → Tooltip → Separator
5. **Phase 3** Sidebar → AuthScreen → HomeCardNewsView hero → ExecutiveSystem → 나머지
6. **Phase 4** focus ring + sunset stripe footer 글로벌
7. **§7 검증** grep 8 + 수동 13

## 9. 변경량 추정
- Phase 1: ~60 min (Newsreader unicode-range + 그라디언트 토큰 3개)
- Phase 2: ~80 min
- Phase 3: ~240 min (McKinsey 풍 레이아웃 재배치 + ExecutiveSystem 변환 + sticky TOC)
- Phase 4: ~30 min
- §11~§16 적용 (테이블 / 차트 / 그래프 / 검색 / 메일 / print): ~120 min
- 검증: ~30 min
- **합계: ~9 시간**

## 10. 막히면
- design-mistral.md 의 `components:` 섹션 + 본 §11~§16 SoT
- 한글 헤드가 Newsreader 와 어색하면 unicode-range 분기 확인 (라틴만 Newsreader, 한글은 Noto Serif KR 강제)
- SK Red + Mistral Orange 가 너무 강해 보이면 그라디언트 비율 조정 (SK Red 0% → 18% 까지만)
- McKinsey 풍 reading column 720px 이 너무 좁아 보이면 820px 까지 확장
- Three.js 그래프 노드 5색이 부족하면 sunshine 5단계 + steel 1점 (총 6 색)
- cream 이 너무 많이 보이면 사용처 4 곳으로 한정 (§3.D)
- ExecutiveSystem.tsx 의 primitive 가 너무 많이 호출되면 일괄 변환 후 사용처 1~2 곳 시각 확인

---

## §11 — 데이터 테이블 패턴 (RawArticlesView · AdminView audit · 알림 로그)

```
구조:
  - 컨테이너: max-w-[1280px] · padding 0
  - 상단 filter chip row: segmented-tab 스타일 (active = text-primary + 2px bottom border)
  - 검색 input: text-input (h-11 rounded-md) 우측에 정렬
  - 테이블 자체: full-width · border-collapse

스타일:
  - <thead>: bg-surface · border-b border-hairline-soft · sticky top-0
    - <th>: text-caption-bold text-steel · padding 12px 16px · text-left
    - sortable column: 우측 chevron icon (Lucide ChevronUpDown), 클릭 시 fill primary
  - <tr>: border-b border-hairline-soft · height 56px (text dense), 64px (with icon/badge)
    - hover state X (Mistral 정책)
    - selected (multi-select 시): bg-cream-soft
  - <td>: padding 12px 16px · text-body-sm · vertical-align middle
    - 숫자 column: text-right · class="tabular-nums" · font-feature-settings 'tnum'
    - 날짜 column: text-caption text-steel · 2026.05.06 14:30 형식
    - status badge: <Badge variant="secondary"> 또는 cream-deeper · "발송 / 실패 / 스킵"

empty state:
  - 가운데 정렬 padding-y 96px
  - icon (Lucide FileSearch 48px text-stone)
  - heading-5 "결과가 없습니다"
  - body-sm text-steel "필터 조건을 변경해보세요"

pagination (하단):
  - "1-20 / 총 234" text-caption text-steel + button-secondary "이전" "다음"
  - mobile: 숫자 페이지 X, 이전/다음만
```

## §12 — 차트 가이드 (Recharts — MonitoringView)

```
LineChart (시계열):
  - <ResponsiveContainer>: width 100% height 280
  - <CartesianGrid>: strokeDasharray="0" stroke="#EFEAE0" (hairline-soft) · vertical={false}
  - <XAxis>: stroke="#8E8E96" (stone) · fontSize 13 · tickLine={false} · axisLine={{stroke:"#EFEAE0"}}
  - <YAxis>: 동일 + tickFormatter 천 단위 콤마
  - <Line>:
      stroke="#DC5A24" (primary)
      strokeWidth 2
      dot={false}
      activeDot={{ r: 4, fill: "#DC5A24" }}
  - 다중 series: primary / sunshine-700 / sunshine-500 / sunshine-300 / steel / sk-red 순
  - <Tooltip>: bg-ink text-white rounded-md px-3 py-2 text-caption · McKinsey 정도 절제
  - Legend: 차트 위 horizontal · text-caption text-steel · circle marker 8px

ScatterChart (Peer 노출도 분포):
  - 동일 grid/axis
  - <Scatter>: 각 Peer 별 색 (samsung_sds=primary / lg_cns=sunshine-700 / hyundai_autoever=sunshine-500 / posco_dx=steel / sk_ax=sk-red)
  - dot size 8px (반경 4)

empty/loading:
  - skeleton: bg-surface rounded-md (animate-pulse)

책: McKinsey 차트는 "single line + minimal grid + tabular nums + small label". decorative element 없음.
```

## §13 — Three.js 그래프 (HomeCardNewsView 키워드 그래프)

```
배경:
  - bg-surface-code (#1A1A1F) · rounded-lg · shadow-mockup · padding 0 (그래프 풀-블리드)

노드 색 (산-석양 팔레트):
  root (axis):       #DC5A24 (primary, 조금 큰 사이즈)
  peer 4사:          samsung_sds=#E0822F · lg_cns=#ECA341 · hyundai_autoever=#F2C56B · posco_dx=#A85F00
  sk_ax (자사):      #EA002C (SK Red — 단독)
  keyword (10개):    sunshine-{300,500,700,800,900} 5색 + cream / steel / stone 무채 5색 = 10
  inactive:          #4A4A52 (slate, 30% opacity)

노드 라벨:
  font: var(--font-body) Inter · 13px · weight 500
  color: #FFFFFF · text-shadow: 0 1px 2px rgba(0,0,0,0.5)
  한글 그대로 표기 ("AX" · "AI" · "보안" · "운영" 등)

엣지:
  stroke: rgba(255,255,255,0.12) (default), rgba(220,90,36,0.6) (selected path)
  width: 1px (default), 2px (selected)

인터랙션:
  hover: 노드 강조 (radius +30% 단순 transform)
  click: 해당 노드 카드 panel 표시 (우측 dialog)

카메라:
  perspective camera · field-of-view 50 · damping enabled

룰: 그래프 데이터 구조와 force layout 알고리즘은 절대 변경 X. 색상 + 라벨 폰트만 변경.
```

## §14 — 검색 + 인용 (Generative Search + Citations)

```
SearchBar:
  - <input>: text-input (h-12 — 일반 input 보다 크게 검색 강조) · rounded-md · placeholder "Peer 동향을 자연어로 물어보세요"
  - 좌측 leading icon Lucide Search 18px text-stone
  - 우측 button-primary "질문" + "AI" badge cream

검색 결과:
  - AI 답변: card-feature-product · padding 32 · 좌측 4px bg-sk-mistral indicator
    - eyebrow "AXIS AI · Generative Search"
    - 본문 reading column 720px max · text-body-md · line-height 1.6
    - 인용: 본문 안 [1] [2] 마커 — text-primary text-caption-bold · 클릭 시 우측 drawer 열림
  - 출처 패널 (drawer):
    - 우측 320px panel · bg-canvas · border-l border-hairline-soft
    - 카드 list: 출처 1건 = 카드 형태 (heading-5 + body-sm + meta + button-link "원문 →")

인용 칩:
  - 인라인 형태: <sup className="text-primary text-caption-bold cursor-pointer">[1]</sup>
  - hover: underline (예외 허용)
  - 클릭: anchor scroll 또는 drawer toggle

후속 질문 (suggestions):
  - 답변 하단 "후속 질문:" 라벨 + chip list (caption-bold)
  - chip: button-secondary (cream) · rounded-full · padding 6×12 · 클릭 시 새 검색
```

## §15 — 이메일 브리핑 (HTML 메일 토큰 정합)

```
이메일은 frontend 와 별도 렌더지만 톤 정합 필요. axis-backend 의 EmailService 가 생성하는 HTML
메일이 다음 토큰을 인라인 style 로 사용하도록 가이드:

배경: #FAF8F5 (surface)
컨테이너: max-width 600px · bg #FFFFFF · padding 32px · 가운데 정렬

헤더:
  - 좌측 SK·AXIS 로고 (sk-mistral gradient 32×32)
  - 헤드 Newsreader 28px "AXIS 일일 브리핑"
  - 부제 Inter 14px steel "2026.05.06 (월) · 오늘의 인텔리전스"

본문 카드 (카드 1건당):
  - 이미지 placeholder 또는 og:image (article_images.storage_path)
  - eyebrow 11px primary "긴급 · 보안"
  - 제목 Newsreader 22px · weight 500 · color #1A1A1F
  - 3줄 요약 Inter 16px · color #4A4A52 · line-height 1.55
  - 출처 row 13px steel "AXIS AI · 출처 3 · 신뢰도 89%"
  - CTA "AXIS 에서 자세히 보기 →" (text-primary)

footer:
  - sunset stripe band (img tag — gif 또는 inline SVG, 600×8px)
  - 회사명 / 수신거부 / 설정 링크 (12px steel)

이메일 클라이언트 호환:
  - Outlook 호환: float 대신 table-based layout
  - Gmail 호환: <link> CDN 대신 <style> 인라인
  - dark mode 자동 반전 차단: <meta name="color-scheme" content="light">
```

## §16 — Print Stylesheet (PDF Export)

```
@media print:
  /* sidebar / floating chat / interactive 모두 숨김 */
  .sidebar, .floating-chat, button, .filter-chip-row, .search-bar { display: none !important; }

  /* reading column 풀폭 */
  .reading-column { max-width: 100% !important; }
  .container { max-width: 100% !important; padding: 0 !important; }

  /* 폰트 */
  body { font-size: 11pt; line-height: 1.5; color: #000 !important; }
  h1 { font-size: 24pt; }
  h2 { font-size: 18pt; }

  /* 색 */
  .bg-sk-mistral, .bg-sunset-stripe { background: #DC5A24 !important; -webkit-print-color-adjust: exact; }
  .bg-cream, .bg-cream-soft { background: #F5EAD0 !important; }

  /* 페이지 분할 */
  .page-break { page-break-before: always; }
  h1, h2 { page-break-after: avoid; }
  .card { page-break-inside: avoid; }

  /* 차트는 SVG 그대로 인쇄 */
  .recharts-wrapper { page-break-inside: avoid; }

  /* 출처 / 인용 footnote 화 */
  sup.citation { font-size: 8pt; vertical-align: super; }

  /* footer */
  .sunset-stripe { height: 4mm; }
  .print-footer { position: fixed; bottom: 0; font-size: 9pt; color: #6B6B73; }

PDF export 버튼:
  - SettingsView 또는 카드 상세에 "PDF 로 저장" button-secondary
  - window.print() 호출
  - 파일명 default: "AXIS_브리핑_2026-05-06.pdf"
```

---

## §17 — 카드 visual hierarchy (Asymmetric Grid)

McKinsey / BCG / Anthropic Research 의 Featured Insights 핵심 = **"같은 크기 카드 N개"가 아닌 "큰 1개 + 작은 N개"**. 모두 동등 = 평면적 = 리서치 사이트 안 보임.

### 17.1 — 1-2 Asymmetric 패턴 (Featured Insights 섹션)

```
grid grid-cols-12 gap-6

┌─ 큰 카드 (col-span-6 row-span-2) ─┐
│  importance: 'urgent' OR pinned   │
│  image area 16:9 (max 540h)       │
│  eyebrow + Newsreader heading-3    │
│  subtitle + meta                  │
└───────────────────────────────────┘

┌─ 작은 카드 (col-span-3) ─┐ ┌─ 작은 카드 (col-span-3) ─┐
│  image 4:3                │ │  image 4:3                │
│  eyebrow                  │ │  eyebrow                  │
│  heading-4                │ │  heading-4                │
│  meta (no subtitle)       │ │  meta                     │
└───────────────────────────┘ └───────────────────────────┘

┌─ 작은 카드 ─┐ ┌─ 작은 카드 ─┐ ┌─ 작은 카드 ─┐ ┌─ 작은 카드 ─┐
│ col-span-3  │ │ col-span-3  │ │ col-span-3  │ │ col-span-3  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### 17.2 — Uniform 패턴 (All Articles 섹션)

```
grid grid-cols-3 gap-6
모든 카드 동일 크기. image 4:3 + eyebrow + heading-4 + 3 line body + meta + 좌측 4px indicator bar.
mobile: grid-cols-1
tablet: grid-cols-2
desktop: grid-cols-3
```

### 17.3 — 카드 컴포넌트 시각 위계

```jsx
// 큰 카드 (Hero / Featured large)
<article className="group cursor-pointer relative overflow-hidden rounded-lg border border-hairline-soft bg-canvas">
  {/* 좌측 4px indicator (urgent → sk-mistral gradient, 그 외 단색) */}
  <div className={cn("absolute left-0 top-0 bottom-0 w-1",
    importance === 'urgent' ? 'bg-sk-mistral' : 'bg-' + importance)} />

  {/* image area 16:9 */}
  <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-cream to-sunshine-300">
    {image ? <img src={image.storage_path} alt={image.alt_text} className="h-full w-full object-cover" />
           : <PlaceholderPattern peer={peer_id} />}
    {image?.attribution && (
      <div className="absolute bottom-2 right-3 text-fine-print text-white/80 bg-black/30 px-1.5 py-0.5 rounded-xs">
        {image.attribution}
      </div>
    )}
  </div>

  <div className="p-8">
    <p className="text-micro-eyebrow text-primary mb-3">{eyebrow}</p>
    <h3 className="text-heading-3 font-display text-ink mb-3">{title}</h3>
    <p className="text-body-md text-charcoal mb-4 line-clamp-2">{subtitle}</p>
    <div className="flex items-center gap-2 text-caption text-stone">
      <span>AXIS AI</span><span>·</span>
      <span>{publishedAt}</span><span>·</span>
      <span>{readMin}분 read</span><span>·</span>
      <span>출처 {sourceCount}건</span>
    </div>

    {/* click affordance — §21 */}
    <ArrowUpRight className="absolute bottom-6 right-6 size-4 text-stone" />
  </div>
</article>

// 작은 카드 (Featured small / Uniform)
// 동일하지만 image 4:3, padding 6, heading-4, subtitle 생략 또는 1줄
```

### 17.4 — 어떤 카드가 "큰 카드" 가 되나

우선순위 (자동 결정):
1. `importance === 'urgent'` AND 가장 최근 published 1건
2. 위 없으면 `pinned === true` AND importance score 최고 1건
3. 위도 없으면 importance score 최고 1건

큰 카드는 항상 그리드 좌상단. 그 우측에 작은 카드 2 stacked.

### 17.5 — Sticky TOC (Reading mode 페이지 한정)

```
적용 페이지: IssueDetail, BriefingDetail, MonitoringView 분석 article

좌측 240px sticky TOC:
  position: sticky top-24
  border-r border-hairline-soft
  padding-right: 24px

목차 자동 생성:
  - 본문의 h2 (heading-2) 자동 스캔 → TOC 항목
  - IntersectionObserver 로 활성 섹션 감지
  - 활성: text-primary + 좌 2px primary border
  - 비활성: text-steel + 좌 1px hairline

mobile (< 1024px):
  - TOC 숨김 (또는 상단 dropdown 으로 접힘)
  - reading column 풀폭
```

---

## §18 — 이미지 / 비주얼 자산 처리

리서치 사이트의 핵심 시각 자산 = 좋은 이미지. AXIS 는 `article_images.storage_path` + `attribution` + `alt_text` 컬럼이 이미 있음 (V4 schema).

### 18.1 — 이미지 비율 + 처리

```
HERO CARD:        16:9  (오늘의 메인 1건)
큰 Featured:      16:9
작은 Featured:    4:3
Uniform card:     4:3
Avatar / 로고:    1:1

cover crop:
  className="h-full w-full object-cover object-center"

라운딩:
  카드 image 영역은 카드의 윗부분에 배치 → rounded-t-lg
  full-bleed 카드는 rounded-lg 안 inner image rounded-none

attribution:
  하단 우측 작은 chip: "제공: 한경" 같은
  className="absolute bottom-2 right-3 bg-black/30 text-white/80 text-fine-print px-1.5 py-0.5 rounded-xs backdrop-blur-sm"

alt_text:
  alt 속성에 그대로 (접근성)
```

### 18.2 — 이미지 없는 카드 — PlaceholderPattern

데이터에 image 가 없을 수 있음 (raw_articles 의 60~70%). 빈 공간 X. **Peer 별 abstract gradient pattern**:

```jsx
// PlaceholderPattern.tsx (신규 컴포넌트)
const peerGradients: Record<string, string> = {
  samsung_sds:      'from-[#1428A0] via-[#3B4DC5] to-[#7A87E0]',  // 삼성 블루
  lg_cns:           'from-[#A50034] via-[#C73018] to-[#DC5A24]',  // LG 레드 → mistral
  hyundai_autoever: 'from-[#002C5F] via-[#0E5C9A] to-[#5891C6]',  // 현대 네이비
  posco_dx:         'from-[#005AAB] via-[#3F8DCF] to-[#83BFE9]',  // 포스코 블루
  sk_ax:            'from-[#EA002C] via-[#DC5A24] to-[#E0822F]',  // SK 시그니처
  default:          'from-cream via-sunshine-300 to-sunshine-500',
};

export function PlaceholderPattern({ peer, ratio = '4/3' }: { peer: string; ratio?: string }) {
  const gradient = peerGradients[peer] || peerGradients.default;
  return (
    <div className={cn('relative w-full bg-gradient-to-br overflow-hidden', gradient,
                       `aspect-[${ratio}]`)}>
      {/* 추상 패턴 — 작은 도형 noise */}
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 300">
        <defs>
          <pattern id={`p-${peer}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#p-${peer})`} />
      </svg>
      {/* peer 약자 워터마크 */}
      <div className="absolute bottom-3 right-4 text-white/40 text-caption-bold tracking-wider">
        {peer.toUpperCase().replace('_', ' ')}
      </div>
    </div>
  );
}
```

각 Peer 별 코퍼레이트 컬러를 placeholder 에 반영 → 이미지 없어도 시각 rhythm + Peer 식별 신호.

### 18.3 — 라이선스 / 권리

- attribution 필수 표기 (없으면 표기 안 함)
- og:image 출처 명확히 — 클릭 시 원문 URL 새 탭
- 5MB 상한 (article_images.file_size_bytes 가 이미 강제) — 클라이언트는 추가 압축 X

---

## §19 — Footer 구조

대시보드라 마케팅 footer (5-col link grid + social) 는 부적합. 그러나 **"전문성 신호"** 한 줄은 필수.

```jsx
// Footer.tsx (전역 layout 끝)
<>
  {/* Sunset Stripe Band — §3.C */}
  <div className="h-2 w-full bg-sunset-stripe" />

  {/* Footer thin */}
  <footer className="bg-surface border-t border-hairline-soft py-6">
    <div className="max-w-[1280px] mx-auto px-12 flex items-center justify-between text-caption text-steel">

      {/* 좌: brand + version */}
      <div className="flex items-center gap-3">
        <AxisMark size={24} />
        <span className="font-display-strong text-ink">AXIS</span>
        <span className="text-stone">·</span>
        <span>v0.1.0</span>
        <span className="text-stone">·</span>
        <span>2026 SKALA AI 13조 / SK AX 사업전략팀</span>
      </div>

      {/* 우: utility links */}
      <div className="flex items-center gap-6">
        <a href="/help" className="hover:text-primary hover:underline">도움말</a>
        <a href="/changelog" className="hover:text-primary hover:underline">릴리스 노트</a>
        <a href="/license" className="hover:text-primary hover:underline">라이선스</a>
      </div>
    </div>
  </footer>
</>
```

룰:
- 모든 라우트 layout 의 가장 끝에 (sticky 아님 — 콘텐츠 끝나면 등장)
- 64px 고정 높이
- text-caption (13px) 만 사용 — 더 큰 텍스트 X (상단 hero 와 충돌)
- 회사 정보 한 줄 + utility 링크 — 마케팅 navigation 금지

---

## §20 — State 패턴 (Loading / Empty / Error)

리서치 사이트의 신뢰 신호 = 모든 state 가 **일관**되고 **품격 있음**.

### 20.1 — Loading (Skeleton)

```jsx
// 카드 자리 그대로 placeholder rect
<div className="card-base animate-pulse">
  <div className="aspect-[4/3] bg-surface rounded-t-lg" />
  <div className="p-6 space-y-3">
    <div className="h-3 w-24 bg-surface rounded" />        {/* eyebrow */}
    <div className="h-6 w-3/4 bg-surface rounded" />        {/* heading */}
    <div className="h-4 w-full bg-surface rounded" />       {/* line 1 */}
    <div className="h-4 w-5/6 bg-surface rounded" />        {/* line 2 */}
    <div className="h-3 w-32 bg-surface rounded mt-4" />   {/* meta */}
  </div>
</div>
```

룰: animate-pulse 만 사용. spinner 금지 (리서치 사이트는 spinner 안 씀 — skeleton 으로 대체).

### 20.2 — Empty State

```jsx
<div className="flex flex-col items-center justify-center py-32 text-center">
  <div className="bg-cream-soft rounded-full p-6 mb-6">
    <FileSearch className="size-12 text-stone" />
  </div>
  <h3 className="text-heading-4 font-display text-ink mb-2">결과가 없습니다</h3>
  <p className="text-body-md text-steel max-w-md mb-6">
    필터 조건을 변경하거나 검색어를 다시 입력해보세요.
  </p>
  <Button variant="secondary">필터 초기화</Button>
</div>
```

화면별:
- 카드 그리드 empty: 위 패턴 그대로
- 검색 결과 0: "검색 결과가 없습니다" + 추천 검색어 chip
- 알림 0: 다른 메시지 ("최근 알림이 없습니다 — 시스템이 정상 동작 중입니다")
- 차트 데이터 없음: 차트 자리에 동일 패턴 (가운데 정렬)

### 20.3 — Error State

```jsx
<div className="border-l-4 border-urgent bg-cream-soft rounded-md p-6">
  <div className="flex items-start gap-3">
    <AlertCircle className="size-5 text-urgent shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-heading-5 text-ink mb-1">데이터를 불러올 수 없습니다</h4>
      <p className="text-body-sm text-charcoal mb-3">{error.message}</p>
      <Button variant="ghost" size="sm" onClick={retry}>다시 시도</Button>
    </div>
  </div>
</div>
```

배치:
- 페이지 상단 (섹션 header 아래) 에 표시
- 카드 그리드 안 개별 카드 에러는 카드 안에서 동일 패턴 (작게)
- 토스트는 작업 결과만 (저장 성공 / 실패) — 데이터 로드 에러는 인라인

---

## §21 — Affordance (No-hover 정책 하의 Click 신호)

Mistral 정책 = hover state 정의 X. 그러면 "클릭 가능한 카드" 임을 어떻게 알리나?

### 21.1 — 카드 click affordance

```jsx
<article className="group cursor-pointer transition-shadow duration-200">
  {/* 콘텐츠 */}

  {/* 우하단 chevron — 모든 클릭 카드 공통 */}
  <ArrowUpRight className="absolute bottom-6 right-6 size-4 text-stone
                          group-hover:text-primary
                          group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                          transition-transform duration-150" />
</article>
```

룰:
- `cursor-pointer` 필수 (CSS 표준 affordance)
- 우하단 16px chevron icon (Lucide ArrowUpRight) — 미세하게 hover 시 우상향 이동 + primary 색
- 카드 자체 배경색 hover X (Mistral 정신)
- chevron 의 미세 transform 만 허용 — "이건 클릭할 수 있다" 신호

### 21.2 — 인라인 link affordance

```jsx
<a className="text-primary hover:underline underline-offset-4">
  자세히 보기
</a>
```

룰: link 만 hover:underline 예외 허용. 다른 hover X.

### 21.3 — 버튼 affordance

```jsx
<button className="bg-primary text-white rounded-md px-5 py-2.5
                   active:bg-primary-deep
                   focus-visible:outline-2 focus-visible:outline-primary">
```

룰: `:active` 시 `bg-primary-deep` (어두워짐) 만. transform / scale X (Mistral 정신).

---

## §22 — Performance (Font + LCP)

5 폰트 family 로드 = LCP 위험. 다음 가이드:

### 22.1 — Critical fonts (HTML head 안 preload)

```html
<head>
  <!-- 가장 먼저 로드: hero 헤드와 본문에 영향 -->
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/Newsreader-VariableFont_opsz,wght.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/Inter-VariableFont_slnt,wght.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/PretendardVariable.woff2" crossorigin>

  <!-- 그 외 (Noto Serif KR / JetBrains Mono) 는 lazy -->
</head>
```

또는 Google Fonts CDN 사용 시:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 22.2 — Font subsetting

자체 호스팅 시 한국어 subset:
- Inter / Newsreader: 라틴 (Basic Latin + Latin Extended) 만
- Noto Serif KR / Pretendard: 한글 음절 (KS X 1001) + 라틴 fallback

용량 목표:
- Inter Variable: ~150 KB → subset 후 ~40 KB
- Newsreader Variable: ~120 KB → subset 후 ~35 KB
- Pretendard Variable: ~1.1 MB → subset 후 ~250 KB (한글 자주 사용 음절만)
- Noto Serif KR: ~3 MB → 한글 음절 전체 ~600 KB

### 22.3 — font-display: swap

모든 @font-face 에 `font-display: swap` 강제. FOIT (invisible) 보다 FOUT (unstyled) 가 LCP 에 유리.

```css
@font-face {
  font-family: 'Newsreader';
  src: url('/fonts/Newsreader.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0020-024F, U+1E00-1EFF;  /* 라틴만 */
}
```

### 22.4 — LCP 목표

- LCP < 2s (CLAUDE.md 명시)
- Hero card image = LCP 후보. `<img loading="eager" fetchpriority="high">` 적용
- 그 외 이미지 = `loading="lazy"` 기본

### 22.5 — mobile 한글 줄바꿈

CSS `word-break: keep-all` 적용 — 한글 단어 안 잘림 방지.

```css
@layer base {
  body, p, h1, h2, h3, h4, li {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
}
```

이러면 "삼성 SDS" 같은 단어가 모바일에서 줄바꿈 시 "삼/성/SDS" 로 안 잘리고 "삼성/SDS" 로 깔끔하게.
