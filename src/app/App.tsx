import { useEffect, useState } from 'react';
import { AuthScreen, type AuthMode } from './auth/AuthScreen';
import { DashboardShell } from './shell/DashboardShell';
import { authStorageKey, guideStorageKey, legacyAuthStorageKey } from './storage';

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
