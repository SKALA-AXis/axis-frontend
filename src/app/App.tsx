import { type CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Moon, Sun, X } from 'lucide-react';
import {
  AdminView,
  BriefingsView,
  CardNewsWorkspaceView,
  HomeDashboardView,
  InsightResultView,
  KeywordGraphView,
  MixerView,
  PeerPlusView,
  RawArticlesView,
  SettingsView,
} from './components/pages';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { FloatingAiChat } from './components/shared/FloatingAiChat';
import { Input } from './components/ui/input';
import { viewLabels } from '../shared/content/navigation';
import { commonGuideSteps, guideTargetByAnchor, viewGuideMap, type ProductGuideStep } from '../shared/content/productGuide';
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

function resolveAdaptiveFontSize() {
  if (window.innerWidth >= 1800 && window.innerHeight >= 900) return '14.4px';
  if (window.innerWidth >= 1440) return '14px';
  if (window.innerWidth >= 1280) return '13.8px';
  if (window.innerWidth <= 1180) return '14.3px';
  return '14.4px';
}
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

type GuideLayout = {
  panelStyle?: CSSProperties;
  highlightStyle?: CSSProperties;
  arrowStyle?: CSSProperties;
  arrowClass?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createGuideLayout(rect: DOMRect, targetKey?: string): GuideLayout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gap = 18;
  const margin = 16;

  const panelWidth = Math.min(420, viewportWidth - margin * 2);
  const estimatedPanelHeight = Math.min(560, viewportHeight - margin * 2);
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;

  let left = rect.right + gap;
  let top = targetCenterY - estimatedPanelHeight / 2;
  let arrowClass = '-left-2 border-b border-l';
  let arrowStyle: CSSProperties = { top: clamp(targetCenterY - top - 10, 28, estimatedPanelHeight - 34) };

  if (left + panelWidth > viewportWidth - margin) {
    left = rect.left - panelWidth - gap;
    arrowClass = '-right-2 border-r border-t';
    arrowStyle = { top: clamp(targetCenterY - top - 10, 28, estimatedPanelHeight - 34) };
  }

  if (left < margin) {
    left = clamp(targetCenterX - panelWidth / 2, margin, viewportWidth - panelWidth - margin);
    top = rect.bottom + gap;
    arrowClass = '-top-2 border-l border-t';
    arrowStyle = { left: clamp(targetCenterX - left - 10, 26, panelWidth - 34) };
  }

  if (top + estimatedPanelHeight > viewportHeight - margin) {
    const aboveTop = rect.top - estimatedPanelHeight - gap;
    if (aboveTop > margin) {
      top = aboveTop;
      arrowClass = '-bottom-2 border-r border-b';
      arrowStyle = { left: clamp(targetCenterX - left - 10, 26, panelWidth - 34) };
    }
  }

  top = clamp(top, margin, Math.max(margin, viewportHeight - estimatedPanelHeight - margin));

  return {
    panelStyle: {
      left,
      top,
      width: panelWidth,
    },
    highlightStyle: {
      left: clamp(rect.left - 8, 8, viewportWidth - 16),
      top: clamp(rect.top - 8, 8, viewportHeight - 16),
      width: Math.max(24, Math.min(rect.width + 16, viewportWidth - Math.max(16, rect.left))),
      height: Math.max(24, Math.min(rect.height + 16, viewportHeight - Math.max(16, rect.top))),
    },
    arrowStyle,
    arrowClass,
  };
}

function resolveGuideSteps(baseSteps: ProductGuideStep[]) {
  const visibleSteps = baseSteps.filter((step) => {
    const targetKey = guideTargetByAnchor[step.anchor];
    return !targetKey || Boolean(document.querySelector(`[data-guide="${targetKey}"]`));
  });

  return visibleSteps.length > 0 ? visibleSteps : baseSteps;
}

function scrollGuideTargetIntoView(targetElement: HTMLElement) {
  const rect = targetElement.getBoundingClientRect();
  const verticalMargin = 96;
  const horizontalMargin = 48;
  const isOutOfViewport =
    rect.top < verticalMargin ||
    rect.bottom > window.innerHeight - verticalMargin ||
    rect.left < horizontalMargin ||
    rect.right > window.innerWidth - horizontalMargin;

  if (!isOutOfViewport) return;

  targetElement.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: 'smooth',
  });
}

function broadcastGuideStep(activeView: string, anchor: string | null, step?: ProductGuideStep) {
  window.dispatchEvent(new CustomEvent('axis:guide-step-change', {
    detail: { activeView, anchor, step },
  }));
}

function InAppGuideOverlay({
  activeView,
  onClose,
}: {
  activeView: string;
  onClose: () => void;
}) {
  const viewSpecificSteps = viewGuideMap[activeView] ?? [];
  const baseSteps = useMemo(
    () => (activeView === 'home'
      ? [...viewSpecificSteps, ...commonGuideSteps.slice(1)]
      : viewSpecificSteps),
    [activeView, viewSpecificSteps],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [guideLayout, setGuideLayout] = useState<GuideLayout>({});
  const panelRef = useRef<HTMLElement | null>(null);
  const steps = useMemo(() => resolveGuideSteps(baseSteps), [baseSteps]);
  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const step = steps[safeStepIndex] ?? steps[0];
  const isLast = safeStepIndex === steps.length - 1;
  const hasDynamicPanel = Boolean(guideLayout.panelStyle);
  const hasDynamicHighlight = Boolean(guideLayout.highlightStyle);
  const shouldRenderGuide = true;

  const handleGuideClose = () => {
    setStepIndex(0);
    setGuideLayout({});
    onClose();
  };

  useEffect(() => {
    if (steps.length === 0) {
      handleGuideClose();
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setStepIndex(0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeView]);

  useEffect(() => {
    if (steps.length === 0) return;
    if (stepIndex !== safeStepIndex) {
      setStepIndex(safeStepIndex);
    }
  }, [safeStepIndex, stepIndex, steps.length]);

  if (!step) {
    return null;
  }

  useEffect(() => {
    const targetKey = guideTargetByAnchor[step.anchor];

    const updateLayout = () => {
      if (!targetKey) {
        setGuideLayout({});
        return;
      }

      const targetElement = document.querySelector<HTMLElement>(`[data-guide="${targetKey}"]`);
      if (!targetElement) {
        setGuideLayout({});
        return;
      }

      setGuideLayout(createGuideLayout(targetElement.getBoundingClientRect(), targetKey));
    };

    updateLayout();
    const frameId = window.requestAnimationFrame(updateLayout);
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
    };
  }, [activeView, step.anchor, safeStepIndex]);

  useEffect(() => {
    const targetKey = guideTargetByAnchor[step.anchor];
    if (!targetKey) return;

    broadcastGuideStep(activeView, step.anchor, step);

    let timeoutId: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      const targetElement = document.querySelector<HTMLElement>(`[data-guide="${targetKey}"]`);
      if (!targetElement) return;

      scrollGuideTargetIntoView(targetElement);
      timeoutId = window.setTimeout(() => {
        const refreshedTarget = document.querySelector<HTMLElement>(`[data-guide="${targetKey}"]`);
        if (!refreshedTarget) return;
        setGuideLayout(createGuideLayout(refreshedTarget.getBoundingClientRect(), targetKey));
      }, 220);
    });

    return () => {
      broadcastGuideStep(activeView, null);
      window.cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [activeView, step.anchor, safeStepIndex]);

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement) return;

    const margin = 16;
    const rect = panelElement.getBoundingClientRect();
    const maxHeight = window.innerHeight - margin * 2;
    const nextLeft = clamp(rect.left, margin, Math.max(margin, window.innerWidth - rect.width - margin));
    const nextTop = clamp(rect.top, margin, Math.max(margin, window.innerHeight - Math.min(rect.height, maxHeight) - margin));
    const horizontalOverflow = rect.left < margin || rect.right > window.innerWidth - margin;
    const verticalOverflow = rect.top < margin || rect.bottom > window.innerHeight - margin || rect.height > maxHeight;

    if (!horizontalOverflow && !verticalOverflow) return;

    setGuideLayout((current) => {
      const currentPanelStyle = current.panelStyle ?? {};
      const currentLeft = typeof currentPanelStyle.left === 'number' ? currentPanelStyle.left : rect.left;
      const currentTop = typeof currentPanelStyle.top === 'number' ? currentPanelStyle.top : rect.top;
      const nextWidth = typeof currentPanelStyle.width === 'number' ? currentPanelStyle.width : rect.width;

      if (
        Math.abs(currentLeft - nextLeft) < 1 &&
        Math.abs(currentTop - nextTop) < 1 &&
        currentPanelStyle.maxHeight === maxHeight &&
        currentPanelStyle.right === 'auto' &&
        currentPanelStyle.bottom === 'auto'
      ) {
        return current;
      }

      return {
        ...current,
        panelStyle: {
          ...currentPanelStyle,
          left: nextLeft,
          top: nextTop,
          width: nextWidth,
          maxHeight,
          right: 'auto',
          bottom: 'auto',
        },
      };
    });
  }, [guideLayout.panelStyle, step.anchor, safeStepIndex]);

  return (
    <div className="fixed inset-0 z-[70] bg-[rgba(10,14,22,0.38)] backdrop-blur-[1px]">
      <div
        className={`pointer-events-none absolute rounded-[18px] border-2 border-[var(--axis-accent)] bg-[rgba(220,90,36,0.08)] shadow-[0_0_0_9999px_rgba(10,14,22,0.28)] ${
          shouldRenderGuide ? '' : 'hidden'
        } ${
          hasDynamicHighlight ? '' : `hidden lg:block ${step.highlight}`
        }`}
        style={guideLayout.highlightStyle}
      />
      <section
        ref={panelRef}
        className={`absolute max-h-[calc(100vh-32px)] w-[min(420px,calc(100vw-32px))] overflow-y-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-6 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.58)] transition-all duration-300 ${
          shouldRenderGuide ? '' : 'hidden'
        } ${
          hasDynamicPanel ? '' : step.position
        }`}
        style={guideLayout.panelStyle}
      >
        <div
          className={`absolute h-5 w-5 rotate-45 border-[var(--axis-hairline)] bg-[var(--axis-canvas)] ${
            hasDynamicPanel ? `border ${guideLayout.arrowClass ?? '-left-2 border-b border-l'}` : step.arrow
          }`}
          style={guideLayout.arrowStyle}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="axis-kicker">{viewLabels[activeView] ?? 'AXIS'} guide</p>
            <h2 className="mt-2 text-2xl font-display font-semibold text-[var(--axis-ink)]">{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleGuideClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-ink)]"
            aria-label="사용 가이드 닫기"
          >
            <X size={17} />
          </button>
        </div>
        <p className="mt-4 text-base font-medium leading-7 text-[var(--axis-body)]">{step.body}</p>
        <div className="mt-5 space-y-3">
          <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">사용자 관점</p>
            <p className="mt-2 text-sm leading-6 text-[var(--axis-body)]">{step.userFeeling}</p>
          </div>
          <div className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">주요 인사이트</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--axis-body)]">
              {step.insights.map((insight) => (
                <li key={insight} className="flex gap-2">
                  <span className="mt-[2px] text-[var(--axis-accent-strong)]">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">설명 위치</p>
          <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{step.anchor}</p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--axis-muted)]">{safeStepIndex + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safeStepIndex === 0}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setStepIndex((index) => Math.max(0, index - 1));
              }}
              className="inline-flex h-10 items-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 text-sm font-semibold text-[var(--axis-body)] disabled:opacity-40"
            >
              <ArrowLeft size={15} />
              이전
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isLast) {
                  handleGuideClose();
                  return;
                }
                setStepIndex((index) => index + 1);
              }}
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

  useEffect(() => {
    const applyAdaptiveScale = () => {
      document.documentElement.style.setProperty('--font-size', resolveAdaptiveFontSize());
      document.documentElement.classList.toggle('axis-wide-viewport', window.innerWidth >= 1800 && window.innerHeight >= 900);
    };

    applyAdaptiveScale();
    window.addEventListener('resize', applyAdaptiveScale);

    return () => {
      window.removeEventListener('resize', applyAdaptiveScale);
      document.documentElement.style.removeProperty('--font-size');
      document.documentElement.classList.remove('axis-wide-viewport');
    };
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.querySelectorAll<HTMLElement>('main, .axis-executive-page').forEach((element) => {
        element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeView]);

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
      <FloatingAiChat />
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
