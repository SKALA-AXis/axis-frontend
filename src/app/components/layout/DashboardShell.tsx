/*
 * 작성일: 2026-06-01
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-01 안가은 — 브리핑·믹서 사용자 기능 추가, Peer+ 레이아웃·브리핑/믹서 표시 동작 정리
 *   2026-06-08 최종민 — Peer+ 글로벌 산업 탭·Global Trends 연동, FloatingAiChat 라우팅 연결, 글로벌 트렌드 사이드바 제거
 *   2026-06-08 박진 — 플로팅 어시스턴트 챗 API 연동 및 챗봇 로직 수정
 *   2026-06-12 최종민 — 뷰를 라우트 단위 lazy 청크로 분할, 캐시 헤더 추가
 *   2026-06-18 안가은 — 모바일 한 줄 하단 내비와 플로팅 요소가 본문을 가리지 않도록 여백 조정
 */
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { bookmarksRepository } from '../../../features/bookmarks/api/bookmarksRepository';
import type { AuthUser } from '../../../features/auth/model/auth';
import type { BriefingGenerateResult } from '../../../features/briefings/api/briefingsRepository';
import type { BriefingPeriod } from '../pages/briefings/types';
import type { SearchScope } from '../../../features/search/model/search';
import type { UserRole } from '../../types/userRole';
import { peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../../../shared/content/peerPlus';
import { useViewRouting } from '../../../shared/hooks/useViewRouting';
import type { TextPreference } from '../../../shared/config/textPreferences';
import { PageSkeleton, type PageSkeletonVariant } from '../shared/PageState';
import { ViewErrorBoundary } from '../shared/ViewErrorBoundary';
import { FloatingAiChat } from '../shared/FloatingAiChat';
import { InAppGuideOverlay } from '../shared/InAppGuideOverlay';
import { ScrollToTopButton } from '../shared/ScrollToTopButton';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

// 뷰는 라우트 단위 코드 스플리팅 대상 — 배럴(../pages) 대신 파일 경로로 직접 lazy import 해야
// 한 뷰 진입 시 다른 뷰 청크가 딸려오지 않는다.
const AdminView = lazy(() => import('../pages/admin/AdminView').then((m) => ({ default: m.AdminView })));
const BriefingsView = lazy(() => import('../pages/briefings/BriefingsView').then((m) => ({ default: m.BriefingsView })));
const CardNewsWorkspaceView = lazy(() =>
  import('../pages/card-news-workspace/CardNewsWorkspaceView').then((m) => ({ default: m.CardNewsWorkspaceView })),
);
const HomeDashboardView = lazy(() =>
  import('../pages/home/dashboard/HomeDashboardView').then((m) => ({ default: m.HomeDashboardView })),
);
const KeywordGraphView = lazy(() =>
  import('../pages/keyword-graph/KeywordGraphView').then((m) => ({ default: m.KeywordGraphView })),
);
const MixerView = lazy(() => import('../pages/mixer/MixerView').then((m) => ({ default: m.MixerView })));
const NotificationsView = lazy(() =>
  import('../pages/notifications/NotificationsView').then((m) => ({ default: m.NotificationsView })),
);
const PeerPlusView = lazy(() => import('../pages/peer-plus/PeerPlusView').then((m) => ({ default: m.PeerPlusView })));
const RawArticlesView = lazy(() =>
  import('../pages/raw-articles/RawArticlesView').then((m) => ({ default: m.RawArticlesView })),
);
const SearchResultsView = lazy(() =>
  import('../pages/search/SearchResultsView').then((m) => ({ default: m.SearchResultsView })),
);
const SettingsView = lazy(() => import('../pages/settings/SettingsView').then((m) => ({ default: m.SettingsView })));

type ThemeMode = 'light' | 'dark';
type ViewFreshnessMap = Partial<Record<string, string | null>>;
type ViewUpdateStore = Record<string, string>;

const viewSkeletonVariants: Record<string, PageSkeletonVariant> = {
  home: 'dashboard',
  peerPlus: 'analysis',
  issues: 'cards',
  mixer: 'workspace',
  keywordGraph: 'analysis',
  briefings: 'briefing',
  notifications: 'cards',
  search: 'cards',
  rawArticles: 'cards',
  settings: 'workspace',
  admin: 'workspace',
};

const updateTimeViews = new Set(['home', 'peerPlus', 'issues', 'mixer', 'keywordGraph', 'briefings']);

const bookmarksStorageKey = 'axis:bookmarked-cards';
const themeStorageKey = 'axis:theme-mode';
const viewUpdateStorageKey = 'axis:view-data-updated-at:v2';

function readViewUpdateStore(): ViewUpdateStore {
  const stored = window.localStorage.getItem(viewUpdateStorageKey);
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).flatMap(([view, value]) => {
        return typeof value === 'string' ? [[view, value]] : [];
      }),
    );
  } catch {
    window.localStorage.removeItem(viewUpdateStorageKey);
    return {};
  }
}

function writeViewUpdateStore(store: ViewUpdateStore) {
  window.localStorage.setItem(viewUpdateStorageKey, JSON.stringify(store));
}

function observedUpdateMapFromStore(store: ViewUpdateStore): ViewFreshnessMap {
  return { ...store };
}

function normalizeUpdateTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

type DashboardShellProps = {
  onLogout: () => void | Promise<void>;
  showGuide: boolean;
  onGuideDone: () => void;
  currentUser: AuthUser | null;
  textPreference: TextPreference;
  onTextPreferenceChange: (preference: TextPreference) => void;
};

export function DashboardShell({
  onLogout,
  showGuide,
  onGuideDone,
  currentUser,
  textPreference,
  onTextPreferenceChange,
}: DashboardShellProps) {
  const [activeView, setActiveView] = useViewRouting('home');
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const [viewFreshness, setViewFreshness] = useState<ViewFreshnessMap>(() => observedUpdateMapFromStore(readViewUpdateStore()));
  const [peerPlusSelectedPeer, setPeerPlusSelectedPeer] = useState<PeerPlusPeerId | undefined>(undefined);
  const [cardNewsSearchQuery, setCardNewsSearchQuery] = useState('');
  const [briefingNavigationTarget, setBriefingNavigationTarget] = useState<{
    id?: string;
    period: BriefingPeriod;
    date: string;
    cachedResult?: BriefingGenerateResult | null;
    requestKey: number;
  } | null>(null);
  const [globalSearchRequest, setGlobalSearchRequest] = useState<{ query: string; scope: SearchScope; requestKey: number }>({
    query: '',
    scope: 'ALL',
    requestKey: 0,
  });
  const currentUserRole: UserRole = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin' ? 'admin' : 'strategist';
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const stored = window.localStorage.getItem(bookmarksStorageKey);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
    } catch {
      window.localStorage.removeItem(bookmarksStorageKey);
      return [];
    }
  });

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    if (activeView === 'admin' && !isAdmin) {
      setActiveView('home');
    }
  }, [activeView, isAdmin, setActiveView]);

  useEffect(() => {
    window.localStorage.setItem(bookmarksStorageKey, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    bookmarksRepository.listIds()
      .then((ids) => {
        if (!cancelled) {
          setBookmarkedIds(ids);
        }
      })
      .catch(() => {
        // 북마크 동기화 실패 시에는 기존 로컬 상태로 화면 사용을 유지한다.
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.email, currentUser?.id]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    window.localStorage.setItem(themeStorageKey, themeMode);
  }, [themeMode]);

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
    const wasBookmarked = bookmarkedIds.includes(cardId);
    setBookmarkedIds((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId],
    );

    const request = wasBookmarked ? bookmarksRepository.remove(cardId) : bookmarksRepository.add(cardId);
    request.catch(() => {
      setBookmarkedIds((current) =>
        wasBookmarked
          ? current.includes(cardId) ? current : [...current, cardId]
          : current.filter((id) => id !== cardId),
      );
    });
  };

  const handleViewFreshnessChange = useCallback((view: string, updatedAt: string | null) => {
    setViewFreshness((current) => {
      const normalizedUpdatedAt = normalizeUpdateTimestamp(updatedAt);
      if (!normalizedUpdatedAt) {
        return current;
      }

      const store = readViewUpdateStore();
      const previousUpdatedAt = normalizeUpdateTimestamp(store[view]);
      const effectiveUpdatedAt = previousUpdatedAt && Date.parse(previousUpdatedAt) > Date.parse(normalizedUpdatedAt)
        ? previousUpdatedAt
        : normalizedUpdatedAt;
      if (previousUpdatedAt === effectiveUpdatedAt) {
        if (store[view] !== effectiveUpdatedAt) {
          store[view] = effectiveUpdatedAt;
          writeViewUpdateStore(store);
        }
        return current[view] === effectiveUpdatedAt ? current : { ...current, [view]: effectiveUpdatedAt };
      }

      store[view] = effectiveUpdatedAt;
      writeViewUpdateStore(store);

      if (current[view] === effectiveUpdatedAt) {
        return current;
      }

      return { ...current, [view]: effectiveUpdatedAt };
    });
  }, []);

  const handleViewChange = (view: string, options?: { preservePeerSelection?: boolean }) => {
    if (view === 'admin' && !isAdmin) {
      setActiveView('home');
      return;
    }
    if (view === 'assignment' || view === 'monitoring') {
      setPeerPlusSelectedPeer(undefined);
      window.localStorage.setItem(peerPlusSelectionStorageKey, 'all');
      setActiveView('peerPlus');
      return;
    }
    if (view === 'peerPlus' && !options?.preservePeerSelection) {
      setPeerPlusSelectedPeer(undefined);
      window.localStorage.setItem(peerPlusSelectionStorageKey, 'all');
    }
    if (view === 'matching' || view === 'rawArticles') {
      setActiveView('mixer');
      return;
    }
    if (view === 'insight') {
      setBriefingNavigationTarget(null);
      setActiveView('briefings');
      return;
    }
    if (view === 'briefings') {
      setBriefingNavigationTarget(null);
    }
    setActiveView(view);
  };

  const handleSearchNavigate = (target: string, options?: {
    peerId?: PeerPlusPeerId;
    query?: string;
    scope?: SearchScope;
    briefingId?: string;
    briefingDate?: string;
    briefingPeriod?: BriefingPeriod;
    briefingPayload?: BriefingGenerateResult | null;
  }) => {
    if (target === 'search') {
      setGlobalSearchRequest((current) => ({
        query: options?.query ?? '',
        scope: options?.scope ?? 'ALL',
        requestKey: current.requestKey + 1,
      }));
      handleViewChange('search');
      return;
    }

    if (options?.peerId) {
      window.localStorage.setItem(peerPlusSelectionStorageKey, options.peerId);
      setPeerPlusSelectedPeer(options.peerId);
    }

    if (target === 'issues') {
      setCardNewsSearchQuery(options?.query ?? '');
    }

    if (target === 'briefings' && options?.briefingDate) {
      setBriefingNavigationTarget((current) => ({
        id: options.briefingId,
        period: options.briefingPeriod ?? 'daily',
        date: options.briefingDate ?? '',
        cachedResult: options.briefingPayload ?? null,
        requestKey: (current?.requestKey ?? 0) + 1,
      }));
      setActiveView('briefings');
      return;
    }

    handleViewChange(target, { preservePeerSelection: Boolean(options?.peerId) });
  };

  const homeView = (
    <HomeDashboardView
      onNavigate={handleViewChange}
      bookmarkedIds={bookmarkedIds}
      onToggleBookmark={toggleBookmark}
      onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('home', updatedAt)}
    />
  );

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return homeView;
      case 'peerPlus':
        return (
          <PeerPlusView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            selectedPeerId={peerPlusSelectedPeer}
            onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('peerPlus', updatedAt)}
          />
        );
      case 'issues':
        return (
          <CardNewsWorkspaceView
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            initialQuery={cardNewsSearchQuery}
            onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('issues', updatedAt)}
            canManageCards={isAdmin}
          />
        );
      case 'mixer':
        return (
          <MixerView
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('mixer', updatedAt)}
          />
        );
      case 'keywordGraph':
        return (
          <KeywordGraphView
            onNavigate={handleViewChange}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('keywordGraph', updatedAt)}
          />
        );
      case 'briefings':
        return (
          <BriefingsView
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('briefings', updatedAt)}
            initialSelection={briefingNavigationTarget}
          />
        );
      case 'notifications':
        return <NotificationsView onNavigate={handleViewChange} />;
      case 'search':
        return (
          <SearchResultsView
            initialQuery={globalSearchRequest.query}
            initialScope={globalSearchRequest.scope}
            requestKey={globalSearchRequest.requestKey}
            onNavigate={handleSearchNavigate}
          />
        );
      case 'rawArticles':
        return <RawArticlesView bookmarkedIds={bookmarkedIds} />;
      case 'settings':
        return (
          <SettingsView
            onLogout={onLogout}
            currentUser={currentUser}
            textPreference={textPreference}
            onTextPreferenceChange={onTextPreferenceChange}
          />
        );
      case 'admin':
        return isAdmin ? <AdminView /> : homeView;
      default:
        return homeView;
    }
  };

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-canvas">
      <TopNav
        activeView={activeView}
        currentViewUpdatedAt={viewFreshness[activeView] ?? null}
        showUpdateTime={updateTimeViews.has(activeView)}
        currentUser={currentUser}
        onLogoClick={() => handleViewChange('home')}
        onNotificationSelect={handleViewChange}
        onUserClick={() => handleViewChange('settings')}
        onHelpClick={() => setHelpGuideOpen(true)}
        onSearchNavigate={handleSearchNavigate}
      />

      <div className="flex flex-1 min-h-0 min-w-0">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          currentUserRole={currentUserRole}
          themeMode={themeMode}
          onThemeToggle={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
        />
        <main ref={mainScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 text-body-md md:pb-0">
          {/* key=activeView: 한 뷰에서 에러가 나도 다른 뷰로 이동하면 boundary 가 초기화되도록 */}
          <ViewErrorBoundary key={activeView}>
            <Suspense fallback={<PageSkeleton variant={viewSkeletonVariants[activeView] ?? 'dashboard'} />}>
              {renderView()}
            </Suspense>
          </ViewErrorBoundary>
        </main>
      </div>

      <FloatingAiChat
        activeView={activeView}
        onNavigate={handleViewChange}
        scrollToTopControl={<ScrollToTopButton scrollTargetRef={mainScrollRef} watchKey={activeView} />}
      />

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
