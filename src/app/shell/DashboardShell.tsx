import { useEffect, useState } from 'react';
import { AdminView } from '../../features/admin/components/AdminView';
import { BriefingsView } from '../components/BriefingsView';
import { CardNewsWorkspaceView } from '../../features/card-news/components/CardNewsWorkspaceView';
import { HomeDashboardView } from '../../features/home/components/HomeDashboardView';
import { MixerView } from '../../features/mixer/components/MixerView';
import { PeerPlusView } from '../../features/peer-strategy/components/PeerPlusView';
import { InsightResultView } from '../../features/insight/components/InsightResultView';
import { KeywordGraphView } from '../../features/keyword-graph/components/KeywordGraphView';
import { GlobalTrendsView } from '../../features/global-trends/components/GlobalTrendsView';
import { RawArticlesView } from '../../features/raw-articles/components/RawArticlesView';
import { SettingsView } from '../../features/settings/components/SettingsView';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { FloatingAiChat } from '../components/FloatingAiChat';
import { useViewRouting } from '../../shared/hooks/useViewRouting';
import { peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../shared/mocks/peerPlus';
import { bookmarksStorageKey, themeStorageKey } from '../storage';
import { InAppGuideOverlay } from './InAppGuideOverlay';

export type UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer';
type ThemeMode = 'light' | 'dark';

function resolveAdaptiveFontSize() {
  if (window.innerWidth >= 1800 && window.innerHeight >= 900) return '14.4px';
  if (window.innerWidth >= 1440) return '14px';
  if (window.innerWidth >= 1280) return '13.8px';
  if (window.innerWidth <= 1180) return '14.3px';
  return '14.4px';
}

export function DashboardShell({
  onLogout,
  showGuide,
  onGuideDone,
}: {
  onLogout: () => void;
  showGuide: boolean;
  onGuideDone: () => void;
}) {
  // URL ↔ view state 양방향 동기화 — 브라우저 back/forward / direct URL / share link 지원
  const [activeView, setActiveView] = useViewRouting('home');
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

  // 직접 URL `/admin` 진입 시 비관리자라면 home 으로 redirect. (handleViewChange 는
  // sidebar/navigate 만 가드 — direct URL 우회 케이스 보완.)
  useEffect(() => {
    if (activeView === 'admin' && !isAdmin) {
      setActiveView('home');
    }
  }, [activeView, isAdmin, setActiveView]);

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
      case 'globalTrends':
        return <GlobalTrendsView />;
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
