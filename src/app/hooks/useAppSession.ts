import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { authRepository } from '../../features/auth/api/authRepository';
import { dashboardRepository } from '../../features/dashboard/api/dashboardRepository';
import type { AuthUser, SignupPayload } from '../../features/auth/model/auth';
import { clearAccessToken, setAccessToken } from '../../shared/api/authSession';
import {
  getAppliedTextScale,
  getStoredTextPreference,
  setStoredTextPreference,
  type TextPreference,
} from '../../shared/config/textPreferences';
import { resolveInitialAuthMode, type AuthMode, type SignInForm, type SignupResult } from '../components/auth/AuthScreen';

const authStorageKey = 'axis:authenticated';
const legacyAuthStorageKey = 'axis:authenticated';
const refreshMarkerStorageKey = 'axis:refresh-cookie-present';
const guideStorageKey = 'axis:guide-complete';

function isAuthCallbackPathname() {
  return window.location.pathname === '/auth/email-verifications/confirm' ||
    window.location.pathname === '/auth/password-reset/confirm';
}

function resolveAdaptiveFontSize() {
  if (window.innerWidth >= 1800 && window.innerHeight >= 900) return '14.4px';
  if (window.innerWidth >= 1440) return '14px';
  if (window.innerWidth >= 1280) return '13.8px';
  if (window.innerWidth <= 1180) return '14.3px';
  return '14.4px';
}

function hasRefreshMarker() {
  return window.localStorage.getItem(refreshMarkerStorageKey) === 'true' ||
    window.sessionStorage.getItem(refreshMarkerStorageKey) === 'true';
}

function clearRefreshMarker() {
  window.sessionStorage.removeItem(refreshMarkerStorageKey);
  window.localStorage.removeItem(refreshMarkerStorageKey);
}

function applyRefreshMarker(rememberMe: boolean) {
  if (rememberMe) {
    window.localStorage.setItem(refreshMarkerStorageKey, 'true');
    window.sessionStorage.removeItem(refreshMarkerStorageKey);
    return;
  }

  window.sessionStorage.setItem(refreshMarkerStorageKey, 'true');
  window.localStorage.removeItem(refreshMarkerStorageKey);
}

function warmupTodayInsightAfterAuth() {
  void dashboardRepository.warmupTodayInsight().catch(() => {
    // Warm-up은 로그인 UX를 막지 않는다. 홈 화면의 일반 조회 fallback 경로가 후속 처리한다.
  });
}

type UseAppSessionResult = {
  mode: AuthMode;
  setMode: Dispatch<SetStateAction<AuthMode>>;
  authToken: string | null;
  authInitializing: boolean;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  textPreference: TextPreference;
  setTextPreference: Dispatch<SetStateAction<TextPreference>>;
  showGuide: boolean;
  handleLogin: (form: SignInForm) => Promise<void>;
  handleLoginSuccess: () => void;
  handleSignup: (form: SignupPayload) => Promise<SignupResult>;
  handleResendVerification: (email: string) => Promise<void>;
  handleVerifyEmail: (token: string) => Promise<void>;
  handleRequestPasswordReset: (email: string) => Promise<void>;
  handleConfirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  handleGuideDone: () => void;
  handleLogout: () => Promise<void>;
};

export function useAppSession(): UseAppSessionResult {
  const [mode, setMode] = useState<AuthMode>(resolveInitialAuthMode);
  const [authToken] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [textPreference, setTextPreference] = useState<TextPreference>(getStoredTextPreference);
  const [authInitializing, setAuthInitializing] = useState(() => !isAuthCallbackPathname() && hasRefreshMarker());
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const applyAdaptiveScale = () => {
      const adaptiveFontSize = resolveAdaptiveFontSize();
      const scale = getAppliedTextScale(textPreference);
      document.documentElement.style.setProperty('--font-size', `calc(${adaptiveFontSize} * ${scale})`);
      document.documentElement.style.setProperty('--axis-user-font-scale', `${scale}`);
      document.documentElement.classList.toggle('axis-wide-viewport', window.innerWidth >= 1800 && window.innerHeight >= 900);
    };

    applyAdaptiveScale();
    window.addEventListener('resize', applyAdaptiveScale);

    return () => {
      window.removeEventListener('resize', applyAdaptiveScale);
      document.documentElement.style.removeProperty('--font-size');
      document.documentElement.style.removeProperty('--axis-user-font-scale');
      document.documentElement.classList.remove('axis-wide-viewport');
    };
  }, [textPreference]);

  useEffect(() => {
    setStoredTextPreference(textPreference);
  }, [textPreference]);

  useEffect(() => {
    window.localStorage.removeItem(legacyAuthStorageKey);
  }, []);

  useEffect(() => {
    if (isAuthCallbackPathname()) {
      clearAccessToken();
      clearRefreshMarker();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAuthInitializing(false);
      return;
    }

    if (!hasRefreshMarker()) {
      setAuthInitializing(false);
      return;
    }

    let cancelled = false;
    authRepository.refresh()
      .then(async (response) => {
        setAccessToken(response.access_token ?? null);
        warmupTodayInsightAfterAuth();
        return response.user ?? authRepository.me();
      })
      .then((user) => {
        if (cancelled || !user) return;
        setCurrentUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearAccessToken();
        clearRefreshMarker();
        if (!cancelled) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthInitializing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resetAuthState = () => {
    clearAccessToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleLogin = async (form: SignInForm) => {
    resetAuthState();
    const response = await authRepository.login({
      email: form.email,
      password: form.password,
      remember_me: form.rememberMe,
    });
    setAccessToken(response.access_token ?? null);
    warmupTodayInsightAfterAuth();
    setCurrentUser(response.user ?? await authRepository.me());
    applyRefreshMarker(form.rememberMe);
    setShowGuide(false);
  };

  const handleLoginSuccess = () => {
    // 인증 콜백 경로(/auth/...)에서 온 로그인만 URL 을 정리하고,
    // 일반 딥링크(예: /peer)는 보존해 로그인 후 원래 페이지로 진입한다.
    if (isAuthCallbackPathname()) {
      window.history.replaceState({}, '', '/');
    }
    setIsAuthenticated(true);
  };

  const handleSignup = async (form: SignupPayload): Promise<SignupResult> => {
    resetAuthState();
    clearRefreshMarker();
    const response = await authRepository.signup(form);
    const email = response.user?.email ?? form.email;

    return {
      loggedIn: false,
      email,
      name: response.user?.name ?? form.name,
      verificationExpiresAt: response.verification_expires_at,
      message: response.email_verification_required === false
        ? '회원가입이 완료되었습니다.'
        : '인증 메일을 발송했습니다.',
    };
  };

  const handleResendVerification = async (email: string) => {
    await authRepository.resendEmailVerification(email);
  };

  const handleVerifyEmail = async (token: string) => {
    await authRepository.verifyEmail(token);
  };

  const handleRequestPasswordReset = async (email: string) => {
    clearAccessToken();
    clearRefreshMarker();
    setCurrentUser(null);
    setIsAuthenticated(false);
    await authRepository.requestPasswordReset(email);
  };

  const handleConfirmPasswordReset = async (token: string, newPassword: string) => {
    clearAccessToken();
    clearRefreshMarker();
    setCurrentUser(null);
    setIsAuthenticated(false);
    await authRepository.confirmPasswordReset(token, newPassword);
  };

  const handleGuideDone = () => {
    window.localStorage.setItem(guideStorageKey, 'true');
    setShowGuide(false);
  };

  const handleLogout = async () => {
    try {
      await authRepository.logout();
    } catch {
      // 로그아웃은 클라이언트 세션 정리를 우선한다.
    }

    clearAccessToken();
    window.sessionStorage.removeItem(authStorageKey);
    clearRefreshMarker();
    setCurrentUser(null);
    setMode('signIn');
    setIsAuthenticated(false);
  };

  return {
    mode,
    setMode,
    authToken,
    authInitializing,
    isAuthenticated,
    currentUser,
    textPreference,
    setTextPreference,
    showGuide,
    handleLogin,
    handleLoginSuccess,
    handleSignup,
    handleResendVerification,
    handleVerifyEmail,
    handleRequestPasswordReset,
    handleConfirmPasswordReset,
    handleGuideDone,
    handleLogout,
  };
}
