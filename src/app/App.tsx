import { FormEvent, useEffect, useState } from 'react';
import { AdminView } from './components/AdminView';
import { BriefingsView } from './components/BriefingsView';
import { HomeCardNewsView } from './components/HomeCardNewsView';
import { IssuesView } from './components/IssuesView';
import { MonitoringView } from './components/MonitoringView';
import { RawArticlesView } from './components/RawArticlesView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { Input } from './components/ui/input';

type AuthMode = 'signIn' | 'signUp';
export type UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer';

const logoSrc = '/png.png';
const bookmarksStorageKey = 'axis:bookmarked-cards';

type SignInForm = { email: string; password: string };
type SignUpForm = { name: string; email: string; password: string };
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

function AuthScreen({
  mode,
  onModeChange,
  onLogin,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onLogin: () => void;
}) {
  const [signInForm, setSignInForm] = useState<SignInForm>(initialSignInForm);
  const [signUpForm, setSignUpForm] = useState<SignUpForm>(initialSignUpForm);
  const [logoVisible, setLogoVisible] = useState(true);
  const isSignIn = mode === 'signIn';

  const handleSignInSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };
  const handleSignUpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8"
      style={{
        background:
          'linear-gradient(90deg, rgba(16,24,32,0.055) 1px, transparent 1px), linear-gradient(180deg, rgba(16,24,32,0.055) 1px, transparent 1px), var(--axis-canvas)',
        backgroundSize: '40px 40px',
      }}>
      <section
        className="relative w-full max-w-[22rem] overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-white sm:max-w-[23rem]"
      >
        <div className="h-1 w-full bg-[var(--axis-navy)]" />

        <div className="px-7 pb-8 pt-7 sm:px-8">
          {/* Logo */}
          <div className="mb-7 flex items-center gap-3">
            {logoVisible ? (
              <img
                src={logoSrc}
                alt="Logo"
                className="h-9 w-9 object-contain"
                onError={() => setLogoVisible(false)}
              />
            ) : (
              <AxisMark />
            )}
            <div className="leading-none">
              <span className="block text-[1.1rem] font-black tracking-[-0.04em] text-[var(--axis-ink)]">AXIS</span>
              <span className="mt-1 block text-[0.7rem] font-semibold text-[var(--axis-muted)]">Executive Intelligence</span>
            </div>
          </div>

          {isSignIn ? (
            <form className="space-y-5" onSubmit={handleSignInSubmit} noValidate>
              <div>
                <h1 className="text-[1.75rem] font-semibold tracking-[-0.05em] text-[var(--axis-ink)] leading-none">
                  로그인
                </h1>
                <p className="mt-1.5 text-[0.82rem] text-[var(--axis-muted)]">전략 인텔리전스 콘솔에 접속하세요</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sign-in-email" className="block text-[0.82rem] font-semibold text-black/70">
                  이메일
                </label>
                <Input
                  id="sign-in-email"
                  type="email"
                  placeholder="example@skax.com"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm((c) => ({ ...c, email: e.target.value }))}
                  className="h-11 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-4 text-[0.88rem] focus:border-[var(--axis-accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sign-in-password" className="block text-[0.82rem] font-semibold text-black/70">
                  비밀번호
                </label>
                <Input
                  id="sign-in-password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm((c) => ({ ...c, password: e.target.value }))}
                  className="h-11 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-4 text-[0.88rem] focus:border-[var(--axis-accent)]"
                />
              </div>

              <button
                type="submit"
                className="mt-1 h-12 w-full rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-[0.92rem] font-bold tracking-[-0.01em] text-white transition hover:bg-[var(--axis-ink)]"
              >
                로그인
              </button>

              <p className="text-center text-[11.5px] text-black/46">
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  className="font-semibold text-[var(--axis-accent-strong)] underline underline-offset-3 hover:text-[var(--axis-ink)]"
                  onClick={() => onModeChange('signUp')}
                >
                  회원가입
                </button>
              </p>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSignUpSubmit} noValidate>
              <div>
                <h1 className="text-[1.75rem] font-semibold tracking-[-0.05em] text-[var(--axis-ink)] leading-none">
                  회원가입
                </h1>
                <p className="mt-1.5 text-[0.82rem] text-[var(--axis-muted)]">새 계정을 만들어 시작하세요</p>
              </div>

              {[
                { id: 'sign-up-name', label: '이름', type: 'text', placeholder: '이름을 입력하세요', key: 'name' as const },
                { id: 'sign-up-email', label: '이메일', type: 'email', placeholder: 'example@skax.com', key: 'email' as const },
                { id: 'sign-up-password', label: '비밀번호', type: 'password', placeholder: '비밀번호 생성', key: 'password' as const },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label htmlFor={field.id} className="block text-[0.82rem] font-semibold text-black/70">
                    {field.label}
                  </label>
                  <Input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={signUpForm[field.key]}
                    onChange={(e) => setSignUpForm((c) => ({ ...c, [field.key]: e.target.value }))}
                    className="h-11 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-4 text-[0.88rem] focus:border-[var(--axis-accent)]"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="mt-1 h-12 w-full rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-[0.92rem] font-bold tracking-[-0.01em] text-white transition hover:bg-[var(--axis-ink)]"
              >
                계정 생성
              </button>

              <p className="text-center text-[11.5px] text-black/46">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  className="font-semibold text-[var(--axis-accent-strong)] underline underline-offset-3 hover:text-[var(--axis-ink)]"
                  onClick={() => onModeChange('signIn')}
                >
                  로그인
                </button>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function DashboardShell({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState('home');
  const [currentUserRole] = useState<UserRole>('strategist');
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

  const toggleBookmark = (cardId: string) => {
    setBookmarkedIds((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId],
    );
  };

  const handleViewChange = (view: string) => {
    setActiveView(view === 'admin' && !isAdmin ? 'home' : view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeCardNewsView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />;
      case 'monitoring':
        return <MonitoringView />;
      case 'issues':
        return <IssuesView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />;
      case 'briefings':
        return <BriefingsView onNavigate={handleViewChange} />;
      case 'settings':
        return <SettingsView onLogout={onLogout} />;
      case 'admin':
        return isAdmin ? <AdminView /> : <MonitoringView />;
      case 'rawArticles':
        return <RawArticlesView bookmarkedIds={bookmarkedIds} />;
      default:
        return <HomeCardNewsView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />;
    }
  };

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-white md:flex-row">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        currentUserRole={currentUserRole}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 text-[13px] md:pb-0">
        {renderView()}
      </main>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setMode('signIn');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) return <DashboardShell onLogout={handleLogout} />;
  return <AuthScreen mode={mode} onModeChange={setMode} onLogin={() => setIsAuthenticated(true)} />;
}
