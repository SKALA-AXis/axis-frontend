import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, MailCheck, Moon, RefreshCw, Sun } from 'lucide-react';
import type { SignupPayload } from '../../../features/auth/model/auth';
import { Input } from '../ui/input';

export type AuthMode =
  | 'signIn'
  | 'signUp'
  | 'verifyEmail'
  | 'confirmEmail'
  | 'forgotPassword'
  | 'confirmPasswordReset'
  | 'passwordResetComplete';

export type SignInForm = { email: string; password: string; rememberMe: boolean };

type SignUpForm = { name: string; email: string; password: string };
type SignupVerificationState = {
  email: string;
  name?: string;
  verificationExpiresAt?: string;
  message?: string;
};

export type SignupResult = { loggedIn: true } | ({ loggedIn: false } & SignupVerificationState);

type LoginStatus = 'idle' | 'success' | 'error';
type ThemeMode = 'light' | 'dark';
type NoticeTone = 'success' | 'danger';

const logoSrc = '/png.png';
const themeStorageKey = 'axis:theme-mode';
const initialSignInForm: SignInForm = { email: '', password: '', rememberMe: true };
const initialSignUpForm: SignUpForm = { name: '', email: '', password: '' };
const invalidPasswordResetLinkMessage = '유효하지 않거나 만료된 링크입니다.';
const passwordResetSentMessage = '입력한 이메일로 비밀번호 재설정 안내를 보냈습니다.';
const passwordResetCompleteMessage = '비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.';

export function resolveInitialAuthMode(): AuthMode {
  if (window.location.pathname === '/auth/email-verifications/confirm') return 'confirmEmail';
  if (window.location.pathname === '/auth/password-reset/confirm') return 'confirmPasswordReset';
  return 'signIn';
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatVerificationExpiresAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
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

function AuthNotice({ tone, children }: { tone: NoticeTone; children: ReactNode }) {
  const toneClass = tone === 'success'
    ? 'border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.08)] text-[var(--axis-success)]'
    : 'border-[rgba(190,61,42,0.24)] bg-[rgba(190,61,42,0.08)] text-[var(--axis-danger)]';
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-2 rounded-[var(--axis-radius-md)] border px-3 py-2 text-sm font-semibold ${toneClass}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function isCallbackPath() {
  return window.location.pathname === '/auth/email-verifications/confirm' ||
    window.location.pathname === '/auth/password-reset/confirm';
}

function shouldShowRawResetError(message: string) {
  return message.includes('백엔드 서버') || message.includes('API를 찾을 수 없습니다') || message.includes('서버 오류');
}

export function AuthScreen({
  mode,
  onModeChange,
  onLogin,
  onLoginSuccess,
  onSignup,
  onResendVerification,
  onVerifyEmail,
  onRequestPasswordReset,
  onConfirmPasswordReset,
  verificationToken,
  passwordResetToken,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (form: SignInForm) => Promise<void>;
  onLoginSuccess: () => void;
  onSignup: (form: SignupPayload) => Promise<SignupResult>;
  onResendVerification: (email: string) => Promise<void>;
  onVerifyEmail: (token: string) => Promise<void>;
  onRequestPasswordReset: (email: string) => Promise<void>;
  onConfirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  verificationToken?: string | null;
  passwordResetToken?: string | null;
}) {
  const [signInForm, setSignInForm] = useState<SignInForm>(initialSignInForm);
  const [signUpForm, setSignUpForm] = useState<SignUpForm>(initialSignUpForm);
  const [signupVerification, setSignupVerification] = useState<SignupVerificationState | null>(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [passwordResetForm, setPasswordResetForm] = useState({ password: '', confirmPassword: '' });
  const [logoVisible, setLogoVisible] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [resendError, setResendError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [emailConfirmStatus, setEmailConfirmStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [authThemeMode, setAuthThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === 'dark' ? 'dark' : 'light';
  });
  const isSignIn = mode === 'signIn';
  const isVerifyEmail = mode === 'verifyEmail';
  const isConfirmEmail = mode === 'confirmEmail';
  const isForgotPassword = mode === 'forgotPassword';
  const isConfirmPasswordReset = mode === 'confirmPasswordReset';
  const isPasswordResetComplete = mode === 'passwordResetComplete';
  const verificationEmail = signupVerification?.email || signUpForm.email || signInForm.email;
  const verificationExpiresAt = formatVerificationExpiresAt(signupVerification?.verificationExpiresAt);
  const loginButtonLabel = loginStatus === 'success' ? '이동 중' : isSubmitting ? '처리 중' : '로그인';
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

  useEffect(() => {
    if (mode !== 'confirmEmail') return;
    setAuthError('');
    setAuthMessage('');
    setResendError('');
    setResendMessage('');
    if (!verificationToken) {
      setEmailConfirmStatus('error');
      setAuthError('유효하지 않은 인증 링크입니다.');
      return;
    }

    let cancelled = false;
    setEmailConfirmStatus('checking');
    onVerifyEmail(verificationToken)
      .then(() => {
        if (cancelled) return;
        setEmailConfirmStatus('success');
        setAuthMessage('이메일 인증이 완료되었습니다. 로그인할 수 있습니다.');
        window.history.replaceState(null, '', '/');
      })
      .catch((error) => {
        if (cancelled) return;
        setEmailConfirmStatus('error');
        setAuthError(error instanceof Error ? error.message : '이메일 인증에 실패했습니다.');
      });

    return () => {
      cancelled = true;
    };
  }, [mode, verificationToken]);

  useEffect(() => {
    if (mode !== 'confirmPasswordReset') return;
    setAuthError('');
    setAuthMessage('');
    if (!passwordResetToken) {
      setAuthError(invalidPasswordResetLinkMessage);
    }
  }, [mode, passwordResetToken]);

  const changeAuthMode = (nextMode: AuthMode) => {
    setAuthError('');
    setAuthMessage('');
    setLoginStatus('idle');
    setResendError('');
    setResendMessage('');
    if (nextMode !== 'verifyEmail' && nextMode !== 'confirmEmail') {
      setSignupVerification(null);
    }
    if (nextMode !== 'confirmEmail' && nextMode !== 'confirmPasswordReset' && isCallbackPath()) {
      window.history.replaceState(null, '', '/');
    }
    if (nextMode === 'forgotPassword' && !forgotPasswordEmail) {
      setForgotPasswordEmail(signInForm.email);
    }
    onModeChange(nextMode);
  };

  const handleSignInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setLoginStatus('idle');
    setIsSubmitting(true);
    try {
      await onLogin(signInForm);
      setLoginStatus('success');
      setAuthMessage('로그인 성공. 대시보드로 이동합니다.');
      await wait(650);
      onLoginSuccess();
    } catch (error) {
      setLoginStatus('error');
      setAuthError(error instanceof Error ? error.message : '로그인에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setIsSubmitting(true);
    try {
      const result = await onSignup(signUpForm);
      if (result.loggedIn) {
        onLoginSuccess();
        return;
      }
      const nextVerification = {
        email: result.email || signUpForm.email,
        name: result.name || signUpForm.name,
        verificationExpiresAt: result.verificationExpiresAt,
        message: result.message ?? '가입 이메일로 인증 링크를 발송했습니다.',
      };
      setSignupVerification(nextVerification);
      setSignInForm((current) => ({ ...current, email: nextVerification.email, password: '' }));
      setSignUpForm(initialSignUpForm);
      setResendError('');
      setResendMessage('');
      onModeChange('verifyEmail');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setIsSubmitting(true);
    try {
      setSignupVerification(null);
      await onRequestPasswordReset(forgotPasswordEmail);
      setAuthMessage(passwordResetSentMessage);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '비밀번호 재설정 안내를 보내지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (!passwordResetToken) {
      setAuthError(invalidPasswordResetLinkMessage);
      return;
    }
    if (passwordResetForm.password.length < 8 || passwordResetForm.password.length > 64) {
      setAuthError('비밀번호는 8자 이상 64자 이하로 입력하세요.');
      return;
    }
    if (passwordResetForm.password !== passwordResetForm.confirmPassword) {
      setAuthError('새 비밀번호와 확인값이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmPasswordReset(passwordResetToken, passwordResetForm.password);
      setPasswordResetForm({ password: '', confirmPassword: '' });
      setSignInForm(initialSignInForm);
      window.history.replaceState(null, '', '/');
      onModeChange('passwordResetComplete');
    } catch (error) {
      const message = error instanceof Error ? error.message : invalidPasswordResetLinkMessage;
      setAuthError(shouldShowRawResetError(message) ? message : invalidPasswordResetLinkMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    setResendError('');
    setResendMessage('');
    setIsResending(true);
    try {
      await onResendVerification(verificationEmail);
      setResendMessage('인증 메일을 다시 발송했습니다.');
    } catch (error) {
      setResendError(error instanceof Error ? error.message : '인증 메일 재발송에 실패했습니다.');
    } finally {
      setIsResending(false);
    }
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
      <section className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto px-6 py-12 sm:px-12 lg:justify-start lg:pl-[14vw] lg:pr-[42vw] xl:pl-[15vw]">
        <div className="w-full max-w-[460px] rounded-[28px] border border-hairline-soft bg-canvas/92 p-8 shadow-[0_28px_90px_-48px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
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

          {isConfirmEmail ? (
            <div className="space-y-6">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.10)] text-[var(--axis-success)]">
                  {emailConfirmStatus === 'checking' ? <RefreshCw size={24} className="animate-spin" /> : <MailCheck size={26} />}
                </div>
                <p className="mb-3 text-micro-eyebrow text-action">EMAIL CONFIRMATION</p>
                <h1 className="font-display text-heading-1 text-ink mb-3">
                  {emailConfirmStatus === 'checking' ? '이메일 인증 확인 중' : '이메일 인증'}
                </h1>
                <p className="text-body-md leading-6 text-steel">인증 링크의 유효성을 확인하고 있습니다.</p>
              </div>

              {authMessage ? <AuthNotice tone="success">{authMessage}</AuthNotice> : null}
              {authError ? <AuthNotice tone="danger">{authError}</AuthNotice> : null}

              <button
                type="button"
                disabled={emailConfirmStatus === 'checking'}
                onClick={() => changeAuthMode('signIn')}
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-50"
                style={primaryButtonStyle}
              >
                로그인으로 이동
              </button>
            </div>
          ) : isSignIn ? (
            <form className="space-y-6" onSubmit={handleSignInSubmit} noValidate>
              <div>
                <h1 className="font-display text-heading-1 text-ink mb-3">로그인</h1>
                <p className="text-body-md text-steel">전략 인텔리전스 콘솔에 접속하세요</p>
              </div>

              {authMessage ? <AuthNotice tone="success">{authMessage}</AuthNotice> : null}
              {authError ? <AuthNotice tone="danger">로그인 실패. {authError}</AuthNotice> : null}

              <div className="space-y-2">
                <label htmlFor="sign-in-email" className="block text-caption-bold text-ink">이메일</label>
                <Input
                  id="sign-in-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signInForm.email}
                  onChange={(e) => {
                    setLoginStatus('idle');
                    setAuthError('');
                    setAuthMessage('');
                    setSignInForm((c) => ({ ...c, email: e.target.value }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sign-in-password" className="block text-caption-bold text-ink">비밀번호</label>
                <Input
                  id="sign-in-password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={signInForm.password}
                  onChange={(e) => {
                    setLoginStatus('idle');
                    setAuthError('');
                    setAuthMessage('');
                    setSignInForm((c) => ({ ...c, password: e.target.value }));
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--axis-body)]">
                  <input
                    type="checkbox"
                    checked={signInForm.rememberMe}
                    onChange={(event) => setSignInForm((current) => ({ ...current, rememberMe: event.target.checked }))}
                    className="h-4 w-4 rounded border-[var(--axis-hairline)] accent-[var(--axis-accent)]"
                  />
                  이 기기에서 로그인 유지
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-action underline underline-offset-4"
                  onClick={() => changeAuthMode('forgotPassword')}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loginStatus === 'success'}
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px"
                style={primaryButtonStyle}
              >
                {loginButtonLabel}
              </button>

              <p className="text-center text-caption text-steel pt-2">
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  className="text-action underline underline-offset-4"
                  onClick={() => changeAuthMode('signUp')}
                >
                  회원가입
                </button>
              </p>
            </form>
          ) : isForgotPassword ? (
            <form className="space-y-6" onSubmit={handleForgotPasswordSubmit} noValidate>
              <div>
                <p className="mb-3 text-micro-eyebrow text-action">PASSWORD RESET</p>
                <h1 className="font-display text-heading-1 text-ink mb-3">비밀번호 재설정</h1>
                <p className="text-body-md leading-6 text-steel">가입 이메일을 입력하면 재설정 안내를 보내드립니다.</p>
              </div>

              {authMessage ? <AuthNotice tone="success">{authMessage}</AuthNotice> : null}
              {authError ? <AuthNotice tone="danger">{authError}</AuthNotice> : null}

              <div className="space-y-2">
                <label htmlFor="forgot-password-email" className="block text-caption-bold text-ink">이메일</label>
                <Input
                  id="forgot-password-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    setAuthError('');
                    setAuthMessage('');
                    setForgotPasswordEmail(e.target.value);
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !forgotPasswordEmail.trim()}
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-50"
                style={primaryButtonStyle}
              >
                {isSubmitting ? '전송 중' : '재설정 링크 보내기'}
              </button>

              <p className="text-center text-caption text-steel pt-2">
                비밀번호가 기억나셨나요?{' '}
                <button
                  type="button"
                  className="text-action underline underline-offset-4"
                  onClick={() => changeAuthMode('signIn')}
                >
                  로그인
                </button>
              </p>
            </form>
          ) : isConfirmPasswordReset ? (
            <form className="space-y-6" onSubmit={handlePasswordResetSubmit} noValidate>
              <div>
                <p className="mb-3 text-micro-eyebrow text-action">PASSWORD RESET</p>
                <h1 className="font-display text-heading-1 text-ink mb-3">비밀번호 재설정</h1>
                <p className="text-body-md leading-6 text-steel">새 비밀번호를 입력해 계정 접근을 복구하세요.</p>
              </div>

              {authMessage ? <AuthNotice tone="success">{authMessage}</AuthNotice> : null}
              {authError ? <AuthNotice tone="danger">{authError}</AuthNotice> : null}

              <div className="space-y-2">
                <label htmlFor="password-reset-new" className="block text-caption-bold text-ink">새 비밀번호</label>
                <Input
                  id="password-reset-new"
                  type="password"
                  minLength={8}
                  maxLength={64}
                  placeholder="비밀번호는 8자 이상 64자 이하"
                  value={passwordResetForm.password}
                  onChange={(e) => {
                    setAuthError('');
                    setPasswordResetForm((current) => ({ ...current, password: e.target.value }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password-reset-confirm" className="block text-caption-bold text-ink">새 비밀번호 확인</label>
                <Input
                  id="password-reset-confirm"
                  type="password"
                  minLength={8}
                  maxLength={64}
                  placeholder="새 비밀번호를 한 번 더 입력"
                  value={passwordResetForm.confirmPassword}
                  onChange={(e) => {
                    setAuthError('');
                    setPasswordResetForm((current) => ({ ...current, confirmPassword: e.target.value }));
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !passwordResetToken}
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-50"
                style={primaryButtonStyle}
              >
                {isSubmitting ? '변경 중' : '비밀번호 변경'}
              </button>

              <button
                type="button"
                onClick={() => changeAuthMode('signIn')}
                className="h-12 w-full rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-btn-md font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)]"
              >
                로그인 화면 이동
              </button>
            </form>
          ) : isPasswordResetComplete ? (
            <div className="space-y-6">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.10)] text-[var(--axis-success)]">
                  <CheckCircle2 size={26} />
                </div>
                <p className="mb-3 text-micro-eyebrow text-action">PASSWORD UPDATED</p>
                <h1 className="font-display text-heading-1 text-ink mb-3">비밀번호 변경 완료</h1>
                <p className="text-body-md leading-6 text-steel">{passwordResetCompleteMessage}</p>
              </div>

              <button
                type="button"
                onClick={() => changeAuthMode('signIn')}
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px"
                style={primaryButtonStyle}
              >
                로그인 화면 이동
              </button>
            </div>
          ) : isVerifyEmail ? (
            <div className="space-y-6">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--axis-radius-lg)] border border-[rgba(90,107,87,0.24)] bg-[rgba(90,107,87,0.10)] text-[var(--axis-success)]">
                  <MailCheck size={26} />
                </div>
                <p className="mb-3 text-micro-eyebrow text-action">EMAIL VERIFICATION</p>
                <h1 className="font-display text-heading-1 text-ink mb-3">이메일 인증이 필요합니다</h1>
                <p className="text-body-md leading-6 text-steel">
                  회원가입이 접수되었습니다. 인증 링크를 확인한 뒤 로그인할 수 있습니다.
                </p>
              </div>

              <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
                <p className="text-xs font-semibold uppercase text-[var(--axis-muted)]">인증 메일</p>
                <p className="mt-1 break-all text-sm font-semibold text-[var(--axis-ink)]">{verificationEmail}</p>
                {verificationExpiresAt ? (
                  <p className="mt-3 text-xs font-semibold text-[var(--axis-muted)]">만료 예정 {verificationExpiresAt}</p>
                ) : null}
              </div>

              {signupVerification?.message ? <AuthNotice tone="success">{signupVerification.message}</AuthNotice> : null}
              {resendMessage ? <AuthNotice tone="success">{resendMessage}</AuthNotice> : null}
              {resendError ? <AuthNotice tone="danger">{resendError}</AuthNotice> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isResending || !verificationEmail}
                  onClick={handleResendVerification}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-4 text-btn-md font-medium text-[var(--axis-ink)] transition hover:border-[var(--axis-accent)] disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isResending ? 'animate-spin' : ''} />
                  {isResending ? '재발송 중' : '메일 재발송'}
                </button>
                <button
                  type="button"
                  onClick={() => changeAuthMode('signIn')}
                  className="h-12 rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px"
                  style={primaryButtonStyle}
                >
                  로그인으로 이동
                </button>
              </div>

              <p className="text-center text-caption leading-5 text-steel">
                메일함에서 AXIS 인증 메일을 찾을 수 없다면 스팸함을 확인해 주세요.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSignUpSubmit} noValidate>
              <div>
                <h1 className="font-display text-heading-1 text-ink mb-3">회원가입</h1>
                <p className="text-body-md text-steel">새 계정을 만들어 시작하세요</p>
              </div>

              {authError ? <AuthNotice tone="danger">{authError}</AuthNotice> : null}

              {[
                { id: 'sign-up-name', label: '이름', type: 'text', placeholder: '이름을 입력하세요', key: 'name' as const },
                { id: 'sign-up-email', label: '이메일', type: 'email', placeholder: 'name@example.com', key: 'email' as const },
                { id: 'sign-up-password', label: '비밀번호', type: 'password', placeholder: '비밀번호는 8자 이상 64자 이하', key: 'password' as const },
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
                disabled={isSubmitting}
                className="h-12 w-full rounded-md border border-transparent bg-action text-btn-md font-medium text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:translate-y-px"
                style={primaryButtonStyle}
              >
                {isSubmitting ? '처리 중' : '계정 생성'}
              </button>

              <p className="text-center text-caption text-steel pt-2">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  className="text-action underline underline-offset-4"
                  onClick={() => changeAuthMode('signIn')}
                >
                  로그인
                </button>
              </p>
            </form>
          )}
        </div>
      </section>

      <aside
        className="absolute inset-y-0 right-0 hidden w-[44vw] min-w-[560px] overflow-hidden text-[var(--auth-hero-ink)] transition-colors duration-300 lg:flex lg:flex-col lg:justify-center lg:p-16 xl:p-24"
        style={authHeroStyle}
      >
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

        <div className="relative">
          <p className="mb-8 text-micro-eyebrow text-[var(--auth-hero-muted)]">PEER INTELLIGENCE</p>
          <h2 className="mb-6 font-display text-display-lg leading-tight text-[var(--auth-hero-ink)] drop-shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
            오늘의 동향을<br />내일의 결정으로
          </h2>
          <p className="max-w-[480px] text-subtitle text-[var(--auth-hero-ink)] opacity-90 drop-shadow-sm">
            삼성SDS · LG CNS · 현대오토에버 · 포스코DX 의 변화를 24/7 자동 감지하고,
            SK AX 관점의 시사점 초안을 매일 아침 받아보세요.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-sunset-stripe" />
      </aside>
    </div>
  );
}
