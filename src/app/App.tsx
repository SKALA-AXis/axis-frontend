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
