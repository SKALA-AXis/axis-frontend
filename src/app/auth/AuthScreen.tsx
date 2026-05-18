import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Input } from '../../shared/ui/input';
import { themeStorageKey } from '../storage';

export type AuthMode = 'signIn' | 'signUp';
type SignInForm = { email: string; password: string };
type SignUpForm = { name: string; email: string; password: string };
type ThemeMode = 'light' | 'dark';

const logoSrc = '/png.png';
const initialSignInForm: SignInForm = { email: '', password: '' };
const initialSignUpForm: SignUpForm = { name: '', email: '', password: '' };

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

export function AuthScreen({
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
