import { FormEvent, useEffect, useState } from 'react';
import { AdminView } from './components/AdminView';
import { BriefingsView } from './components/BriefingsView';
import { Footer } from './components/Footer';
import { HomeCardNewsView } from './components/HomeCardNewsView';
import { IssuesView } from './components/IssuesView';
import { MonitoringView } from './components/MonitoringView';
import { RawArticlesView } from './components/RawArticlesView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Input } from './components/ui/input';

type AuthMode = 'signIn' | 'signUp';
export type UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer';

const logoSrc = '/png.png';
const bookmarksStorageKey = 'axis:bookmarked-cards';
const authStorageKey = 'axis:authenticated';

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
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-12 bg-canvas">
      {/* ─── 좌측 form panel (5/12) ─────────────────────────── */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:col-span-5 lg:px-16 lg:py-20">
        <div className="mx-auto w-full max-w-[420px]">
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
                className="h-12 w-full rounded-md bg-action text-white text-btn-md transition-colors active:bg-primary-deep focus-visible:outline-2 focus-visible:outline-action-focus focus-visible:outline-offset-2"
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
                className="h-12 w-full rounded-md bg-action text-white text-btn-md transition-colors active:bg-primary-deep focus-visible:outline-2 focus-visible:outline-action-focus focus-visible:outline-offset-2"
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

      {/* ─── 우측 sunset gradient hero (7/12) — 모바일 숨김 ───── */}
      <aside className="hidden bg-auth-hero relative overflow-hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:p-16 xl:p-24">
        {/* 추상 패턴 — 도트 noise */}
        <svg className="absolute inset-0 h-full w-full opacity-15" viewBox="0 0 800 800" preserveAspectRatio="none">
          <defs>
            <pattern id="auth-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="800" height="800" fill="url(#auth-pattern)" />
        </svg>

        {/* eyebrow */}
        <p className="relative text-micro-eyebrow text-white/80">SK AX · 사업전략팀</p>

        {/* 핵심 타이포 */}
        <div className="relative">
          <p className="text-micro-eyebrow text-white/60 mb-6">PEER INTELLIGENCE</p>
          <h2 className="font-display text-display-lg text-white mb-6 leading-tight">
            전략기획의 다음 30분.
          </h2>
          <p className="text-subtitle text-white/85 max-w-[480px]">
            삼성SDS · LG CNS · 현대오토에버 · 포스코DX 의 변화를 24/7 자동 감지하고,
            SK AX 관점의 시사점 초안을 매일 아침 받아보세요.
          </p>
        </div>

        {/* 하단 통계 */}
        <div className="relative grid grid-cols-3 gap-8 border-t border-white/20 pt-8">
          <div>
            <p className="font-display text-heading-2 text-white tabular-nums">4+1</p>
            <p className="text-caption text-white/70 mt-1">Peer 사 · 자사</p>
          </div>
          <div>
            <p className="font-display text-heading-2 text-white tabular-nums">~500</p>
            <p className="text-caption text-white/70 mt-1">일일 수집</p>
          </div>
          <div>
            <p className="font-display text-heading-2 text-white tabular-nums">08:30</p>
            <p className="text-caption text-white/70 mt-1">평일 브리핑</p>
          </div>
        </div>

        {/* 하단 sunset stripe 시그니처 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-sunset-stripe" />
      </aside>
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
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas">
      {/* TopNav 풀폭 (사이드바 위) */}
      <TopNav activeView={activeView} />

      {/* 본문: 사이드바 + main 옆 나란히 */}
      <div className="flex flex-1 min-h-0 min-w-0">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          currentUserRole={currentUserRole}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 text-body-md md:pb-0">
          {renderView()}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [isAuthenticated, setIsAuthenticated] = useState(() => window.localStorage.getItem(authStorageKey) === 'true');

  const handleLogin = () => {
    window.localStorage.setItem(authStorageKey, 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(authStorageKey);
    setMode('signIn');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) return <DashboardShell onLogout={handleLogout} />;
  return <AuthScreen mode={mode} onModeChange={setMode} onLogin={handleLogin} />;
}
