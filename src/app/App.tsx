import { type CSSProperties, FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Moon, Sun, X } from 'lucide-react';
import { AdminView } from './components/AdminView';
import { BriefingsView } from './components/BriefingsView';
import {
  CardNewsWorkspaceView,
  HomeDashboardView,
  InsightResultView,
  KeywordGraphView,
  MixerView,
  PeerPlusView,
} from './components/AxisPlanningViews';
import { RawArticlesView } from './components/RawArticlesView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Input } from './components/ui/input';
import { peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../shared/mocks/peerPlus';

type AuthMode = 'signIn' | 'signUp';
export type UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer';

const logoSrc = '/png.png';
const bookmarksStorageKey = 'axis:bookmarked-cards';
const authStorageKey = 'axis:authenticated';
const legacyAuthStorageKey = 'axis:authenticated';
const themeStorageKey = 'axis:theme-mode';
const guideStorageKey = 'axis:guide-complete';

type SignInForm = { email: string; password: string };
type SignUpForm = { name: string; email: string; password: string };
type ThemeMode = 'light' | 'dark';
const initialSignInForm: SignInForm = { email: '', password: '' };
const initialSignUpForm: SignUpForm = { name: '', email: '', password: '' };
const appViewLabels: Record<string, string> = {
  home: '홈',
  briefings: '브리핑',
  insight: '인사이트',
  peerPlus: 'Peer+',
  issues: '카드뉴스',
  mixer: '믹서',
  keywordGraph: '키워드 그래프',
  settings: '설정',
};

function AxisMark() {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-[10px] font-black text-white"
      aria-hidden="true"
    >
      AX
    </div>
  );
}

function AuthScreen({
  mode,
  onModeChange,
  onLogin,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (showGuideAfterLogin?: boolean) => void;
}) {
  const [signInForm, setSignInForm] = useState<SignInForm>(initialSignInForm);
  const [signUpForm, setSignUpForm] = useState<SignUpForm>(initialSignUpForm);
  const [logoVisible, setLogoVisible] = useState(true);
  const [authThemeMode, setAuthThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === 'dark' ? 'dark' : 'light';
  });
  const isSignIn = mode === 'signIn';
  const isAuthDark = authThemeMode === 'dark';
  const primaryButtonStyle = {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    boxShadow: 'rgba(220, 90, 36, 0.28) 0px 10px 24px -12px',
  } as const;
  const authHeroStyle = {
    '--auth-hero-ink': isAuthDark ? '#F8F3EC' : '#1E1B19',
    '--auth-hero-muted': isAuthDark ? 'rgba(248, 243, 236, 0.74)' : 'rgba(69, 59, 49, 0.76)',
    '--auth-hero-line': isAuthDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(104, 84, 64, 0.20)',
    background: isAuthDark
      ? 'radial-gradient(circle at 24% 18%, rgba(220, 90, 36, 0.24), transparent 30%), radial-gradient(circle at 76% 20%, rgba(112, 129, 104, 0.24), transparent 32%), linear-gradient(145deg, #25272e 0%, #1d2027 48%, #3a251f 100%)'
      : 'radial-gradient(circle at 24% 18%, rgba(220, 90, 36, 0.16), transparent 30%), radial-gradient(circle at 78% 18%, rgba(90, 107, 87, 0.18), transparent 32%), linear-gradient(145deg, #fffaf2 0%, #f2e8dc 52%, #e5d0bc 100%)',
  } as CSSProperties;
  const authHeroPatternColor = isAuthDark ? '#FFFFFF' : '#9B6A48';
  const authHeroPatternOpacity = isAuthDark ? 0.15 : 0.2;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', authThemeMode === 'dark');
    window.localStorage.setItem(themeStorageKey, authThemeMode);
  }, [authThemeMode]);

  const handleSignInSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(false);
  };
  const handleSignUpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(true);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(220,90,36,0.16),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(90,107,87,0.14),transparent_26%),linear-gradient(135deg,var(--axis-canvas)_0%,var(--axis-surface-soft)_48%,rgba(220,90,36,0.10)_100%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(220,90,36,0.20),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(112,129,104,0.24),transparent_28%),linear-gradient(135deg,#16171c_0%,#222326_52%,#2d231f_100%)]">
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(120,110,96,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(120,110,96,0.16) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div className="absolute -left-24 top-0 h-[115%] w-[42vw] -skew-x-12 bg-[rgba(220,90,36,0.08)] dark:bg-[rgba(220,90,36,0.16)]" />
      <div className="absolute bottom-[-18%] left-[18%] h-[44%] w-[58vw] -skew-x-12 border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/42 dark:bg-white/5" />
      <button
        type="button"
        onClick={() => setAuthThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))}
        className="absolute right-6 top-6 z-20 inline-flex h-10 items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/82 px-4 text-sm font-semibold text-[var(--axis-ink)] shadow-[0_14px_36px_-28px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        {authThemeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        {authThemeMode === 'dark' ? 'Light' : 'Dark'}
      </button>
      <section className="absolute inset-0 z-10 flex items-center justify-center px-6 py-12 sm:px-12 lg:justify-start lg:pl-[14vw] lg:pr-[42vw] xl:pl-[15vw]">
        <div className="w-full max-w-[460px] rounded-[28px] border border-hairline-soft bg-canvas/92 p-8 shadow-[0_28px_90px_-48px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            {logoVisible ? (
              <img
                src={logoSrc}
                alt="Logo"
                className="h-11 w-11 object-contain"
                onError={() => setLogoVisible(false)}
              />
            ) : (
              <AxisMark />
            )}
            <div>
              <p className="font-display text-heading-3 text-ink">AXIS</p>
              <p className="text-caption text-steel">Peer Intelligence System</p>
            </div>
          </div>

          {isSignIn ? (
            <form className="space-y-6" onSubmit={handleSignInSubmit} noValidate>
              <div>
                <h1 className="font-display text-heading-1 text-ink mb-3">로그인</h1>
                <p className="text-body-md text-steel">전략 인텔리전스 콘솔에 접속하세요</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="sign-in-email" className="block text-caption-bold text-ink">이메일</label>
                <Input
                  id="sign-in-email"
                  type="email"
                  placeholder="example@skax.com"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm((c) => ({ ...c, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sign-in-password" className="block text-caption-bold text-ink">비밀번호</label>
                <Input
                  id="sign-in-password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm((c) => ({ ...c, password: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px"
                style={primaryButtonStyle}
              >
                로그인
              </button>

              <p className="text-center text-caption text-steel pt-2">
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  className="text-action underline underline-offset-4"
                  onClick={() => onModeChange('signUp')}
                >
                  회원가입
                </button>
              </p>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSignUpSubmit} noValidate>
              <div>
                <h1 className="font-display text-heading-1 text-ink mb-3">회원가입</h1>
                <p className="text-body-md text-steel">새 계정을 만들어 시작하세요</p>
              </div>

              {[
                { id: 'sign-up-name', label: '이름', type: 'text', placeholder: '이름을 입력하세요', key: 'name' as const },
                { id: 'sign-up-email', label: '이메일', type: 'email', placeholder: 'example@skax.com', key: 'email' as const },
                { id: 'sign-up-password', label: '비밀번호', type: 'password', placeholder: '비밀번호 생성', key: 'password' as const },
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <label htmlFor={field.id} className="block text-caption-bold text-ink">{field.label}</label>
                  <Input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={signUpForm[field.key]}
                    onChange={(e) => setSignUpForm((c) => ({ ...c, [field.key]: e.target.value }))}
                  />
                </div>
              ))}

              <button
                type="submit"
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px"
                style={primaryButtonStyle}
              >
                계정 생성
              </button>

              <p className="text-center text-caption text-steel pt-2">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  className="text-action underline underline-offset-4"
                  onClick={() => onModeChange('signIn')}
                >
                  로그인
                </button>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ─── 우측 hero는 배경 요소로 분리 ───────────────────── */}
      <aside
        className="absolute inset-y-0 right-0 hidden w-[44vw] min-w-[560px] overflow-hidden text-[var(--auth-hero-ink)] transition-colors duration-300 lg:flex lg:flex-col lg:justify-between lg:p-16 xl:p-24"
        style={authHeroStyle}
      >
        {/* 추상 패턴 — 도트 noise */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 800"
          preserveAspectRatio="none"
          style={{ opacity: authHeroPatternOpacity }}
        >
          <defs>
            <pattern id="auth-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1.5" fill={authHeroPatternColor} />
            </pattern>
          </defs>
          <rect width="800" height="800" fill="url(#auth-pattern)" />
        </svg>

        {/* eyebrow */}
        <p className="relative text-micro-eyebrow text-[var(--auth-hero-muted)] drop-shadow-sm">SK AX · 사업전략팀</p>

        {/* 핵심 타이포 */}
        <div className="relative">
          <p className="mb-6 text-micro-eyebrow text-[var(--auth-hero-muted)]">PEER INTELLIGENCE</p>
          <h2 className="mb-6 font-display text-display-lg leading-tight text-[var(--auth-hero-ink)] drop-shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
            전략기획의 다음 30분.
          </h2>
          <p className="max-w-[480px] text-subtitle text-[var(--auth-hero-ink)] opacity-90 drop-shadow-sm">
            삼성SDS · LG CNS · 현대오토에버 · 포스코DX 의 변화를 24/7 자동 감지하고,
            SK AX 관점의 시사점 초안을 매일 아침 받아보세요.
          </p>
        </div>

        {/* 하단 통계 */}
        <div className="relative grid grid-cols-3 gap-8 border-t pt-8" style={{ borderColor: 'var(--auth-hero-line)' }}>
          <div>
            <p className="font-display text-heading-2 text-[var(--auth-hero-ink)] tabular-nums">4+1</p>
            <p className="mt-1 text-caption text-[var(--auth-hero-muted)]">Peer 사 · 자사</p>
          </div>
          <div>
            <p className="font-display text-heading-2 text-[var(--auth-hero-ink)] tabular-nums">~500</p>
            <p className="mt-1 text-caption text-[var(--auth-hero-muted)]">일일 수집</p>
          </div>
          <div>
            <p className="font-display text-heading-2 text-[var(--auth-hero-ink)] tabular-nums">08:30</p>
            <p className="mt-1 text-caption text-[var(--auth-hero-muted)]">평일 브리핑</p>
          </div>
        </div>

        {/* 하단 sunset stripe 시그니처 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-sunset-stripe" />
      </aside>
    </div>
  );
}

const viewGuideMap: Record<string, Array<{ title: string; body: string; anchor: string; position: string; arrow: string; highlight: string }>> = {
  home: [
    { title: '통합 검색', body: '상단 검색창에 Peer사, 키워드, 카드뉴스 제목을 입력합니다. Peer사는 Peer+로, 키워드는 카드뉴스 검색 결과로 바로 연결됩니다.', anchor: '상단 검색창', position: 'left-[560px] top-[98px]', arrow: 'left-12 -top-3 border-l border-t', highlight: 'left-[500px] top-[22px] h-[62px] w-[calc(100vw-980px)]' },
    { title: 'Today Insight', body: '홈의 첫 섹션은 오늘 감지된 핵심 변화와 Graphify로 들어갈 시각화 영역입니다. 요약 수치보다 오늘 읽어야 할 흐름이 먼저 보이도록 구성합니다.', anchor: '메인 인사이트 영역', position: 'left-[360px] top-[176px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[136px] h-[360px] w-[calc(100vw-760px)]' },
    { title: '요약 카드뉴스', body: '오른쪽 카드뉴스 큐는 오늘 볼 뉴스만 압축해서 보여줍니다. 카드를 클릭하면 페이지 이동 없이 상세 카드뉴스가 플로팅으로 열립니다.', anchor: '오늘의 요약 카드뉴스', position: 'right-[64px] top-[220px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[150px] h-[360px] w-[390px]' },
    { title: '그래프 전환', body: '하단 그래프는 관심도, 주가 변동, Peer사별 수주/재무 지표를 넘겨 보며 오늘의 흐름을 비교하는 영역입니다.', anchor: '하단 그래프 영역', position: 'left-[360px] bottom-[72px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] bottom-[28px] h-[260px] w-[calc(100vw-700px)]' },
  ],
  briefings: [
    { title: '브리핑 기간 선택', body: '달력 옆에서 일간, 주간, 월간을 함께 고릅니다. 놓친 브리핑도 날짜 기준으로 다시 열 수 있습니다.', anchor: '좌측 상단 기간 컨트롤', position: 'left-[330px] top-[112px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[96px] h-[64px] w-[430px]' },
    { title: '브리핑 리포트', body: '카드뉴스를 개별로 나열하지 않고, 오늘의 핵심 변화와 SK AX 대응 방향으로 종합합니다.', anchor: '브리핑 본문', position: 'left-[420px] top-[258px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[210px] h-[420px] w-[calc(100vw-760px)]' },
    { title: '근거 카드뉴스', body: '우측 근거 카드뉴스는 브리핑을 만든 원천 카드입니다. 클릭하면 현재 브리핑 위에서 카드뉴스 상세가 열립니다.', anchor: '근거 카드뉴스 큐', position: 'right-[58px] top-[300px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[48px] top-[210px] h-[420px] w-[360px]' },
    { title: '공유·인쇄', body: '공유·인쇄 버튼은 브리핑 템플릿 미리보기를 열고, 그 안에서 내용 복사, 공유, 템플릿 인쇄를 실행합니다.', anchor: '우측 상단 버튼', position: 'right-[56px] top-[126px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[96px] h-[64px] w-[260px]' },
  ],
  insight: [
    { title: '핵심 인사이트', body: '상단은 지금 가장 중요한 변화와 SK AX 관점의 해석을 읽는 영역입니다. 개별 뉴스보다 결론을 먼저 확인합니다.', anchor: '인사이트 요약', position: 'left-[380px] top-[150px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[116px] h-[220px] w-[calc(100vw-820px)]' },
    { title: '원인·변화·영향·대응', body: '본문은 원인, 변화, 영향, 대응을 한 화면에서 이어 읽도록 나뉩니다. 각 섹션은 보고서 문장으로 바로 옮길 수 있는 내용입니다.', anchor: '인사이트 분석 섹션', position: 'left-[380px] top-[360px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[320px] h-[360px] w-[calc(100vw-820px)]' },
    { title: '출처 카드뉴스', body: '오른쪽 출처 카드뉴스를 누르면 현재 화면 위에서 근거 내용을 확인합니다. 인사이트의 근거를 빠르게 되짚는 용도입니다.', anchor: '출처 영역', position: 'right-[56px] top-[230px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[46px] top-[180px] h-[320px] w-[360px]' },
  ],
  peerPlus: [
    { title: 'Peer 선택', body: '우측 상단 Peer 칩으로 기업을 바꾸면 IR 수치, 워드클라우드, 관련 카드뉴스가 함께 바뀝니다.', anchor: 'Peer+ 상단', position: 'right-[70px] top-[118px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[94px] h-[62px] w-[420px]' },
    { title: 'IR Numeric Pack', body: '정량 지표는 매출, 영업이익, 수주, 클라우드/AI 투자 흐름을 증감값과 함께 보는 영역입니다.', anchor: 'IR 정량자료', position: 'right-[70px] top-[230px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[56px] top-[176px] h-[310px] w-[420px]' },
    { title: '차별 시사점', body: 'SK AX와 Peer사의 차이를 비교해 영업/전략 관점에서 바로 쓸 수 있는 시사점을 강조합니다.', anchor: 'Peer 비교 시사점', position: 'left-[360px] top-[330px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[260px] h-[300px] w-[calc(100vw-860px)]' },
    { title: '워드클라우드', body: '최근 도입한 AI 기술, 사업, MOU 키워드를 워드클라우드로 봅니다. 키워드를 클릭하면 관련 카드뉴스 목록이 플로팅으로 열립니다.', anchor: '워드클라우드', position: 'right-[420px] top-[530px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[360px] top-[430px] h-[260px] w-[420px]' },
  ],
  issues: [
    { title: '필터와 날짜 검색', body: '상단 한 줄에서 날짜, 대주제/소주제, Peer사, 키워드를 좁혀 봅니다. 필터는 카드 목록을 바꾸고 북마크 자료와도 연결됩니다.', anchor: '카드뉴스 필터 영역', position: 'left-[330px] top-[142px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[112px] h-[92px] w-[calc(100vw-390px)]' },
    { title: '카드뉴스 그리드', body: '카드뉴스는 4열 그리드로 훑어보는 영역입니다. 제목, 섹터, Peer사를 보고 관심 있는 카드를 선택합니다.', anchor: '카드뉴스 목록', position: 'left-[360px] top-[300px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[235px] h-[calc(100vh-330px)] w-[calc(100vw-390px)]' },
    { title: '플로팅 상세', body: '카드를 누르면 현재 화면 위에 상세가 뜹니다. 여러 장의 카드뉴스를 넘기며 요약, 시사점, 근거를 확인합니다.', anchor: '카드뉴스 상세 팝업', position: 'right-[64px] top-[250px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[190px] h-[420px] w-[420px]' },
    { title: '북마크/공유', body: '각 카드의 북마크와 공유 버튼은 믹서 후보, 브리핑 근거, 개인 검토 목록으로 이어집니다.', anchor: '카드 액션', position: 'right-[64px] top-[520px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[455px] h-[150px] w-[320px]' },
  ],
  mixer: [
    { title: '사용 전: 입력 조합', body: '믹서 시작 전에는 Peer, 고객사, 산업, 키워드를 얇은 선택 칩으로 조합합니다. 여기서 선택한 값이 결과 인사이트의 관점이 됩니다.', anchor: '믹서 선택 패널', position: 'left-[330px] top-[160px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[108px] h-[180px] w-[calc(100vw-700px)]' },
    { title: '사용 전: 카드뉴스 후보', body: '북마크와 카드뉴스 후보를 골라 믹서에 넣습니다. 선택한 뉴스는 결과의 근거 카드뉴스로 다시 확인할 수 있습니다.', anchor: '카드뉴스 후보/북마크', position: 'right-[70px] top-[170px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[112px] h-[260px] w-[420px]' },
    { title: '사용 전: 구성 비율', body: '아래 도넛 차트는 선택한 Peer, 산업, 키워드, 카드뉴스 비율을 보여줍니다. 결과를 만들기 전 입력 균형을 점검하는 영역입니다.', anchor: '입력 비율 차트', position: 'left-[360px] bottom-[92px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] bottom-[48px] h-[240px] w-[calc(100vw-760px)]' },
    { title: '사용 후: 결과 인사이트', body: '믹서를 실행하면 상단 중앙에 새 인사이트가 정리됩니다. 고객 제안 방향, 벤치마킹 포인트, 대응 아이디어를 먼저 읽습니다.', anchor: '믹서 결과 인사이트', position: 'left-[420px] top-[210px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[160px] h-[300px] w-[calc(100vw-840px)]' },
    { title: '사용 후: 결과 근거', body: '결과에 반영된 카드뉴스를 클릭하면 상세가 플로팅으로 열립니다. 그래프보다 실제 근거를 확인하는 흐름입니다.', anchor: '결과 카드뉴스', position: 'right-[66px] top-[310px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[250px] h-[340px] w-[420px]' },
  ],
  keywordGraph: [
    { title: '키워드 필터', body: '우측 상단 필터에서 기업, 섹터, 키워드를 좁힙니다. 선택한 필터는 2D와 3D 보기 모두에 반영됩니다.', anchor: '키워드 필터', position: 'right-[58px] top-[180px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[130px] h-[100px] w-[420px]' },
    { title: '2D 키워드 맵', body: '2D 그래프에서는 SK AX, Peer사, 섹터, 세부 키워드가 크기와 색으로 구분됩니다. 노드를 드래그하고 휠로 확대/축소합니다.', anchor: '2D 그래프 영역', position: 'left-[380px] top-[250px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[160px] h-[calc(100vh-240px)] w-[calc(100vw-680px)]' },
    { title: '관련 카드뉴스', body: '기업, Peer사, 키워드 노드를 클릭하면 관련 카드뉴스가 현재 그래프 위에 뜹니다. 바깥 영역을 누르면 닫힙니다.', anchor: '노드 선택 결과', position: 'right-[72px] top-[330px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[56px] top-[260px] h-[360px] w-[420px]' },
    { title: '3D/전체화면', body: '3D 보기에서는 SK AX를 중심에 두고 키워드가 구 안팎에 배치됩니다. 전체화면에서도 보기 전환과 필터를 계속 사용할 수 있습니다.', anchor: '상단 컨트롤', position: 'right-[58px] top-[142px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[104px] h-[72px] w-[520px]' },
  ],
  settings: [
    { title: '회원 설정', body: '프로필, 접속 로그, 알림 시간과 채널을 한 화면에서 조정합니다.', anchor: '설정 탭', position: 'left-[340px] top-[230px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[185px] h-[260px] w-[300px]' },
  ],
};

function InAppGuideOverlay({
  activeView,
  onClose,
}: {
  activeView: string;
  onClose: () => void;
}) {
  const steps = viewGuideMap[activeView] ?? viewGuideMap.home;
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    setStepIndex(0);
  }, [activeView]);

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(10,14,22,0.38)] backdrop-blur-[1px]">
      <div className={`pointer-events-none absolute hidden rounded-[18px] border-2 border-[var(--axis-accent)] bg-[rgba(220,90,36,0.08)] shadow-[0_0_0_9999px_rgba(10,14,22,0.28)] lg:block ${step.highlight}`} />
      <section className={`absolute w-[min(420px,calc(100vw-32px))] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-6 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.58)] transition-all duration-300 ${step.position}`}>
        <div className={`absolute h-6 w-6 rotate-45 bg-[var(--axis-canvas)] ${step.arrow} border-[var(--axis-hairline)]`} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="axis-kicker">{appViewLabels[activeView] ?? 'AXIS'} guide</p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-[var(--axis-ink)]">{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-ink)]"
            aria-label="사용 가이드 닫기"
          >
            <X size={17} />
          </button>
        </div>
        <p className="mt-4 text-base font-medium leading-7 text-[var(--axis-body)]">{step.body}</p>
        <div className="mt-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">설명 위치</p>
          <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{step.anchor}</p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--axis-muted)]">{stepIndex + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              className="inline-flex h-10 items-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 text-sm font-semibold text-[var(--axis-body)] disabled:opacity-40"
            >
              <ArrowLeft size={15} />
              이전
            </button>
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setStepIndex((index) => index + 1))}
              className="inline-flex h-10 items-center gap-1 rounded-[var(--axis-radius-md)] bg-[var(--axis-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--axis-accent-strong)]"
            >
              {isLast ? '닫기' : '다음'}
              {!isLast ? <ArrowRight size={15} /> : null}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardShell({ onLogout, showGuide, onGuideDone }: { onLogout: () => void; showGuide: boolean; onGuideDone: () => void }) {
  const [activeView, setActiveView] = useState('home');
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const [peerPlusSelectedPeer, setPeerPlusSelectedPeer] = useState<PeerPlusPeerId | undefined>(undefined);
  const [cardNewsSearchQuery, setCardNewsSearchQuery] = useState('');
  const [currentUserRole] = useState<UserRole>('strategist');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const stored = window.localStorage.getItem(bookmarksStorageKey);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      window.localStorage.removeItem(bookmarksStorageKey);
      return [];
    }
  });

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    window.localStorage.setItem(bookmarksStorageKey, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    window.localStorage.setItem(themeStorageKey, themeMode);
  }, [themeMode]);

  const toggleBookmark = (cardId: string) => {
    setBookmarkedIds((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId],
    );
  };

  const handleViewChange = (view: string) => {
    if (view === 'admin' && !isAdmin) {
      setActiveView('home');
      return;
    }
    if (view === 'assignment' || view === 'monitoring') {
      setActiveView('peerPlus');
      return;
    }
    if (view === 'matching' || view === 'rawArticles') {
      setActiveView('mixer');
      return;
    }
    setActiveView(view);
  };

  const handleSearchNavigate = (target: string, options?: { peerId?: PeerPlusPeerId; query?: string }) => {
    if (options?.peerId) {
      window.localStorage.setItem(peerPlusSelectionStorageKey, options.peerId);
      setPeerPlusSelectedPeer(options.peerId);
    }
    if (target === 'issues') {
      setCardNewsSearchQuery(options?.query ?? '');
    }
    handleViewChange(target);
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeDashboardView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        );
      case 'peerPlus':
        return (
          <PeerPlusView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            selectedPeerId={peerPlusSelectedPeer}
          />
        );
      case 'issues':
        return <CardNewsWorkspaceView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} initialQuery={cardNewsSearchQuery} />;
      case 'insight':
        return (
          <InsightResultView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        );
      case 'mixer':
        return <MixerView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />;
      case 'keywordGraph':
        return (
          <KeywordGraphView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        );
      case 'briefings':
        return <BriefingsView />;
      case 'rawArticles':
        return <RawArticlesView bookmarkedIds={bookmarkedIds} />;
      case 'settings':
        return <SettingsView onLogout={onLogout} />;
      case 'admin':
        return isAdmin ? (
          <AdminView />
        ) : (
          <HomeDashboardView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        );
      default:
        return (
          <HomeDashboardView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
        );
    }
  };

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas">
      {/* TopNav 풀폭 (사이드바 위) */}
      <TopNav
        activeView={activeView}
        onLogoClick={() => handleViewChange('home')}
        onNotificationSelect={handleViewChange}
        onUserClick={() => handleViewChange('settings')}
        onHelpClick={() => setHelpGuideOpen(true)}
        onSearchNavigate={handleSearchNavigate}
      />

      {/* 본문: 사이드바 + main 옆 나란히 */}
      <div className="flex flex-1 min-h-0 min-w-0">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          currentUserRole={currentUserRole}
          themeMode={themeMode}
          onThemeToggle={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 text-body-md md:pb-0">
          {renderView()}
        </main>
      </div>
      {showGuide || helpGuideOpen ? (
        <InAppGuideOverlay
          activeView={activeView}
          onClose={() => {
            if (showGuide) {
              onGuideDone();
            }
            setHelpGuideOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [isAuthenticated, setIsAuthenticated] = useState(() => window.sessionStorage.getItem(authStorageKey) === 'true');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 이전 localStorage 인증 흔적 때문에 첫 진입에서 대시보드가 바로 뜨지 않도록 정리한다.
    window.localStorage.removeItem(legacyAuthStorageKey);
  }, []);

  const handleLogin = (showGuideAfterLogin = false) => {
    window.sessionStorage.setItem(authStorageKey, 'true');
    setShowGuide(showGuideAfterLogin && window.localStorage.getItem(guideStorageKey) !== 'true');
    setIsAuthenticated(true);
  };

  const handleGuideDone = () => {
    window.localStorage.setItem(guideStorageKey, 'true');
    setShowGuide(false);
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(authStorageKey);
    setMode('signIn');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) return <DashboardShell onLogout={handleLogout} showGuide={showGuide} onGuideDone={handleGuideDone} />;
  return <AuthScreen mode={mode} onModeChange={setMode} onLogin={handleLogin} />;
}
