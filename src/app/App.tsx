/*
 * 작성일: 2026-04-23
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-23 안가은 — 프론트 초기 셋업 후 폴더 구조·화면 UI 개선, 관리자 화면·믹서·사용자 가이드 반영
 *   2026-04-28 박진 — 관리자 접근 제어 수정
 *   2026-05-15 최종민 — GlobalTrends 뷰, view↔URL 라우팅 동기화, 프론트 전면 개편 반영
 */
import { AuthScreen } from './components/auth/AuthScreen';
import { DashboardShell } from './components/layout/DashboardShell';
import { useAppSession } from './hooks/useAppSession';

export default function App() {
  const {
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
  } = useAppSession();

  if (authInitializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--axis-canvas)] text-sm font-semibold text-[var(--axis-muted)]">
        세션 확인 중
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <DashboardShell
        onLogout={handleLogout}
        showGuide={showGuide}
        onGuideDone={handleGuideDone}
        currentUser={currentUser}
        textPreference={textPreference}
        onTextPreferenceChange={setTextPreference}
      />
    );
  }

  return (
    <AuthScreen
      mode={mode}
      onModeChange={setMode}
      onLogin={handleLogin}
      onLoginSuccess={handleLoginSuccess}
      onSignup={handleSignup}
      onResendVerification={handleResendVerification}
      onVerifyEmail={handleVerifyEmail}
      onRequestPasswordReset={handleRequestPasswordReset}
      onConfirmPasswordReset={handleConfirmPasswordReset}
      verificationToken={authToken}
      passwordResetToken={authToken}
    />
  );
}
