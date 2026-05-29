import { type CSSProperties, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, X } from 'lucide-react';
import {
  AdminView,
  BriefingsView,
  CardNewsWorkspaceView,
  HomeDashboardView,
  KeywordGraphView,
  MixerView,
  NotificationsView,
  PeerPlusView,
  RawArticlesView,
  SearchResultsView,
  SettingsView,
} from './components/pages';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { FloatingAiChat } from './components/shared/FloatingAiChat';
import { AuthScreen, resolveInitialAuthMode, type AuthMode, type SignInForm, type SignupResult } from './components/auth/AuthScreen';
import { authRepository } from '../features/auth/api/authRepository';
import { bookmarksRepository } from '../features/bookmarks/api/bookmarksRepository';
import type { AuthUser, SignupPayload } from '../features/auth/model/auth';
import { clearAccessToken, setAccessToken } from '../shared/api/authSession';
import { viewLabels } from '../shared/content/navigation';
import { useViewRouting } from '../shared/hooks/useViewRouting';
import { commonGuideSteps, guideTargetByAnchor, viewGuideMap, type ProductGuideStep } from '../shared/content/productGuide';
import { peerPlusSelectionStorageKey, type PeerPlusPeerId } from '../shared/mocks/peerPlus';
import type { SearchScope } from '../features/search/model/search';
import {
  getAppliedTextScale,
  getStoredTextPreference,
  setStoredTextPreference,
  type TextPreference,
} from '../shared/config/textPreferences';

export type UserRole = 'admin' | 'strategist' | 'analyst' | 'viewer';
type ThemeMode = 'light' | 'dark';

const bookmarksStorageKey = 'axis:bookmarked-cards';
const authStorageKey = 'axis:authenticated';
const legacyAuthStorageKey = 'axis:authenticated';
const refreshMarkerStorageKey = 'axis:refresh-cookie-present';
const themeStorageKey = 'axis:theme-mode';
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

type GuideLayout = {
  panelStyle?: CSSProperties;
  highlightStyle?: CSSProperties;
  arrowStyle?: CSSProperties;
  arrowClass?: string;
};

type ViewFreshnessMap = Partial<Record<string, string | null>>;

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

function ScrollToTopButton({
  scrollTargetRef,
  watchKey,
}: {
  scrollTargetRef: RefObject<HTMLElement | null>;
  watchKey: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  const getScrollTargets = () => {
    const root = scrollTargetRef.current;
    if (!root) return [];

    const targets = [
      root,
      ...Array.from(root.querySelectorAll<HTMLElement>('.axis-executive-page')),
      ...Array.from(root.querySelectorAll<HTMLElement>('*')).filter((target) => target.scrollHeight - target.clientHeight > 24),
      document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null,
    ].filter((target): target is HTMLElement => Boolean(target));

    return Array.from(new Set(targets));
  };

  useEffect(() => {
    const root = scrollTargetRef.current;
    if (!root) return;

    let frameId = 0;
    const updateVisibility = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const shouldShow = getScrollTargets().some((target) => {
          const isScrollable = target.scrollHeight - target.clientHeight > 24;
          return isScrollable && target.scrollTop > 240;
        });
        setIsVisible(shouldShow);
      });
    };

    updateVisibility();
    const timeoutId = window.setTimeout(updateVisibility, 0);
    const scrollTargets = getScrollTargets();
    scrollTargets.forEach((target) => target.addEventListener('scroll', updateVisibility, { passive: true }));
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      scrollTargets.forEach((target) => target.removeEventListener('scroll', updateVisibility));
      window.removeEventListener('resize', updateVisibility);
    };
  }, [scrollTargetRef, watchKey]);

  if (!isVisible) return null;

  const scrollToTop = () => {
    getScrollTargets().forEach((target) => {
      target.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        if (target.scrollTop > 8) {
          target.scrollTop = 0;
        }
      }, 280);
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="flex size-12 items-center justify-center rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-ink)] shadow-[0_16px_44px_-28px_rgba(0,0,0,0.48)] transition hover:-translate-y-0.5 hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent-strong)]"
      aria-label="맨 위로 이동"
      title="맨 위로 이동"
    >
      <ArrowUp size={20} strokeWidth={2.4} />
    </button>
  );
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">사용자 인사이트</p>
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

function DashboardShell({
  onLogout,
  showGuide,
  onGuideDone,
  currentUser,
  textPreference,
  onTextPreferenceChange,
}: {
  onLogout: () => void | Promise<void>;
  showGuide: boolean;
  onGuideDone: () => void;
  currentUser: AuthUser | null;
  textPreference: TextPreference;
  onTextPreferenceChange: (preference: TextPreference) => void;
}) {
  // URL ↔ view state 양방향 동기화 — 브라우저 back/forward / direct URL / share link 지원
  const [activeView, setActiveView] = useViewRouting('home');
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const [helpGuideOpen, setHelpGuideOpen] = useState(false);
  const [viewFreshness, setViewFreshness] = useState<ViewFreshnessMap>({});
  const [peerPlusSelectedPeer, setPeerPlusSelectedPeer] = useState<PeerPlusPeerId | undefined>(undefined);
  const [cardNewsSearchQuery, setCardNewsSearchQuery] = useState('');
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
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      window.localStorage.removeItem(bookmarksStorageKey);
      return [];
    }
  });

  const isAdmin = currentUserRole === 'admin';

  // direct URL `/admin` 진입 시 비관리자라면 home 으로. handleViewChange 는 sidebar 클릭만
  // 가드 → URL 직진입 우회 케이스 보완.
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
  }, [currentUser?.id, currentUser?.email]);

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
      if (current[view] === updatedAt) {
        return current;
      }
      return { ...current, [view]: updatedAt };
    });
  }, []);

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
    // 인사이트 페이지는 브리핑에 흡수됨 — back-compat redirect
    if (view === 'insight') {
      setActiveView('briefings');
      return;
    }
    setActiveView(view);
  };

  const handleSearchNavigate = (target: string, options?: { peerId?: PeerPlusPeerId; query?: string; scope?: SearchScope }) => {
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
            onUpdateTimeChange={(updatedAt) => handleViewFreshnessChange('home', updatedAt)}
          />
        );
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
        currentViewUpdatedAt={viewFreshness[activeView] ?? null}
        currentUser={currentUser}
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
        <main ref={mainScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-20 text-body-md md:pb-0">
          {renderView()}
        </main>
      </div>
      <FloatingAiChat
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

export default function App() {
  const [mode, setMode] = useState<AuthMode>(resolveInitialAuthMode);
  const [authToken] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [textPreference, setTextPreference] = useState<TextPreference>(getStoredTextPreference);
  const hasRefreshMarker = () =>
    window.localStorage.getItem(refreshMarkerStorageKey) === 'true' ||
    window.sessionStorage.getItem(refreshMarkerStorageKey) === 'true';
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
    // 이전 localStorage 인증 흔적 때문에 첫 진입에서 대시보드가 바로 뜨지 않도록 정리한다.
    window.localStorage.removeItem(legacyAuthStorageKey);
  }, []);

  useEffect(() => {
    if (isAuthCallbackPathname()) {
      clearAccessToken();
      window.sessionStorage.removeItem(refreshMarkerStorageKey);
      window.localStorage.removeItem(refreshMarkerStorageKey);
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
        return response.user ?? authRepository.me();
      })
      .then((user) => {
        if (cancelled || !user) return;
        setCurrentUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearAccessToken();
        window.sessionStorage.removeItem(refreshMarkerStorageKey);
        window.localStorage.removeItem(refreshMarkerStorageKey);
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

  const handleLogin = async (form: SignInForm) => {
    clearAccessToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    const response = await authRepository.login({
      email: form.email,
      password: form.password,
      remember_me: form.rememberMe,
    });
    setAccessToken(response.access_token ?? null);
    setCurrentUser(response.user ?? await authRepository.me());
    if (form.rememberMe) {
      window.localStorage.setItem(refreshMarkerStorageKey, 'true');
      window.sessionStorage.removeItem(refreshMarkerStorageKey);
    } else {
      window.sessionStorage.setItem(refreshMarkerStorageKey, 'true');
      window.localStorage.removeItem(refreshMarkerStorageKey);
    }
    setShowGuide(false);
  };

  const handleLoginSuccess = () => {
    window.history.replaceState({}, '', '/');
    setIsAuthenticated(true);
  };

  const handleSignup = async (form: SignupPayload): Promise<SignupResult> => {
    clearAccessToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    window.sessionStorage.removeItem(refreshMarkerStorageKey);
    window.localStorage.removeItem(refreshMarkerStorageKey);
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
    window.sessionStorage.removeItem(refreshMarkerStorageKey);
    window.localStorage.removeItem(refreshMarkerStorageKey);
    setCurrentUser(null);
    setIsAuthenticated(false);
    await authRepository.requestPasswordReset(email);
  };

  const handleConfirmPasswordReset = async (token: string, newPassword: string) => {
    clearAccessToken();
    window.sessionStorage.removeItem(refreshMarkerStorageKey);
    window.localStorage.removeItem(refreshMarkerStorageKey);
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
    window.sessionStorage.removeItem(refreshMarkerStorageKey);
    window.localStorage.removeItem(refreshMarkerStorageKey);
    setCurrentUser(null);
    setMode('signIn');
    setIsAuthenticated(false);
  };

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
