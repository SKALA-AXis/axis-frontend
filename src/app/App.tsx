import { FormEvent, useEffect, useState } from 'react';
import { AdminView } from './components/AdminView';
import { AlertsView } from './components/AlertsView';
import { BookmarksView } from './components/BookmarksView';
import { BriefingsView } from './components/BriefingsView';
import { DashboardOverview } from './components/DashboardOverview';
import { HomeCardNewsView } from './components/HomeCardNewsView';
import { IssuesView } from './components/IssuesView';
import { PeersView } from './components/PeersView';
import { RawArticlesView } from './components/RawArticlesView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { Button } from './components/ui/button';
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
      className="flex h-11 w-11 items-center justify-center rounded-2xl text-[10px] font-black text-white shadow-[0_6px_20px_rgba(255,127,0,0.4)]"
      style={{ background: 'linear-gradient(135deg,#ff8c00 0%,#e04400 100%)' }}
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
        background: 'linear-gradient(145deg, #fff8f2 0%, #f5f6fa 50%, #fff5ee 100%)',
      }}>
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle,rgba(255,140,0,0.18),transparent 70%)' }} />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle,rgba(225,0,42,0.12),transparent 70%)' }} />
        <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,rgba(255,127,0,0.15),transparent 70%)' }} />
        {/* Grid pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <section
        className="relative w-full max-w-[22rem] overflow-hidden rounded-[1.6rem] bg-white shadow-[0_32px_64px_rgba(0,0,0,0.10),0_8px_16px_rgba(0,0,0,0.06)] sm:max-w-[23rem]"
        style={{ border: '1px solid rgba(255,255,255,0.9)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#E1002A 0%,#ff7f00 50%,#ffb347 100%)' }} />

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
              <span className="block text-[1.1rem] font-black tracking-[-0.04em] text-[#E1002A]">AXIS</span>
            </div>
          </div>

          {isSignIn ? (
            <form className="space-y-5" onSubmit={handleSignInSubmit} noValidate>
              <div>
                <h1 className="text-[1.75rem] font-black tracking-[-0.05em] text-[#0f1117] leading-none">
                  로그인
                </h1>
                <p className="mt-1.5 text-[0.82rem] text-black/45">계정에 접속하여 시작하세요</p>
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
                  className="axis-input h-11 rounded-xl px-4 text-[0.88rem]"
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
                  className="axis-input h-11 rounded-xl px-4 text-[0.88rem]"
                />
              </div>

              <button
                type="submit"
                className="axis-accent mt-1 h-12 w-full rounded-xl text-[0.92rem] font-bold tracking-[-0.01em]"
              >
                로그인
              </button>

              <p className="text-center text-[11.5px] text-black/46">
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  className="font-semibold text-[#d96200] underline underline-offset-3 hover:text-[#ff7f00]"
                  onClick={() => onModeChange('signUp')}
                >
                  회원가입
                </button>
              </p>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSignUpSubmit} noValidate>
              <div>
                <h1 className="text-[1.75rem] font-black tracking-[-0.05em] text-[#0f1117] leading-none">
                  회원가입
                </h1>
                <p className="mt-1.5 text-[0.82rem] text-black/45">새 계정을 만들어 시작하세요</p>
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
                    className="axis-input h-11 rounded-xl px-4 text-[0.88rem]"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="axis-accent mt-1 h-12 w-full rounded-xl text-[0.92rem] font-bold tracking-[-0.01em]"
              >
                계정 생성
              </button>

              <p className="text-center text-[11.5px] text-black/46">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  className="font-semibold text-[#d96200] underline underline-offset-3 hover:text-[#ff7f00]"
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

function DashboardShell() {
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
      case 'dashboard':
        return <DashboardOverview onNavigate={handleViewChange} />;
      case 'issues':
        return <IssuesView onNavigate={handleViewChange} />;
      case 'peers':
        return <PeersView onNavigate={handleViewChange} />;
      case 'bookmarks':
        return <BookmarksView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />;
      case 'briefings':
        return <BriefingsView onNavigate={handleViewChange} />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return isAdmin ? <AdminView /> : <DashboardOverview onNavigate={handleViewChange} />;
      case 'rawArticles':
        return <RawArticlesView bookmarkedIds={bookmarkedIds} />;
      default:
        return <HomeCardNewsView bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />;
    }
  };

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-white md:flex-row">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} currentUserRole={currentUserRole} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 text-[13px] md:pb-0">
        {renderView()}
      </main>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (isAuthenticated) return <DashboardShell />;
  return <AuthScreen mode={mode} onModeChange={setMode} onLogin={() => setIsAuthenticated(true)} />;
}
