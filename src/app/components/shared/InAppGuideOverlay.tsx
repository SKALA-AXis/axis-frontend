/*
 * 작성일: 2026-06-01
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-01 안가은 — 인앱 가이드 오버레이 추가 후 대시보드 키워드 트렌드 UI 및 튜토리얼/브리핑 관리자 UI 정리
 *   2026-06-18 안가은 — 모바일 가이드 패널을 하단 시트로 분리해 설명 대상이 가려지지 않도록 개선
 */
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  commonGuideSteps,
  guideTargetByAnchor,
  mixerHistoryGuideSteps,
  mixerResultGuideSteps,
  peerPlusGlobalGuideSteps,
  viewGuideMap,
  type ProductGuideStep,
} from '../../../shared/content/productGuide';
import { viewLabels } from '../../../shared/content/navigation';

type GuideLayout = {
  panelStyle?: CSSProperties;
  highlightStyle?: CSSProperties;
  arrowStyle?: CSSProperties;
  arrowClass?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isGuideTargetVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0';
}

function getGuideTargetElement(targetKey: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-guide="${targetKey}"]`))
    .find(isGuideTargetVisible) ?? null;
}

function isPeerPlusGlobalGuideActive(activeView: string) {
  return activeView === 'peerPlus' && Boolean(getGuideTargetElement('peer-global-trends'));
}

function getMixerGuideSteps(activeView: string) {
  if (activeView !== 'mixer') return null;
  if (getGuideTargetElement('mixer-result')) return mixerResultGuideSteps;
  if (getGuideTargetElement('mixer-history-filter')) return mixerHistoryGuideSteps;
  return null;
}

function createGuideLayout(rect: DOMRect): GuideLayout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gap = 18;
  const margin = 16;
  const isMobile = viewportWidth < 768;

  const panelWidth = Math.min(420, viewportWidth - margin * 2);
  const estimatedPanelHeight = Math.min(560, viewportHeight - margin * 2);
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;

  if (isMobile) {
    return {
      panelStyle: {
        left: 12,
        right: 12,
        bottom: 12,
        top: 'auto',
        width: 'auto',
        maxHeight: Math.min(360, viewportHeight * 0.46),
      },
      highlightStyle: {
        left: clamp(rect.left - 8, 8, viewportWidth - 16),
        top: clamp(rect.top - 8, 8, viewportHeight - 16),
        width: Math.max(24, Math.min(rect.width + 16, viewportWidth - Math.max(16, rect.left))),
        height: Math.max(24, Math.min(rect.height + 16, viewportHeight - Math.max(16, rect.top))),
      },
      arrowClass: 'hidden',
    };
  }

  if (rect.top < 96) {
    const top = clamp(rect.bottom + gap, margin, Math.max(margin, viewportHeight - estimatedPanelHeight - margin));
    return {
      panelStyle: {
        left: clamp(targetCenterX - panelWidth / 2, margin, viewportWidth - panelWidth - margin),
        top,
        width: panelWidth,
      },
      highlightStyle: {
        left: clamp(rect.left - 8, 8, viewportWidth - 16),
        top: clamp(rect.top - 8, 8, viewportHeight - 16),
        width: Math.max(24, Math.min(rect.width + 16, viewportWidth - Math.max(16, rect.left))),
        height: Math.max(24, Math.min(rect.height + 16, viewportHeight - Math.max(16, rect.top))),
      },
      arrowStyle: { left: clamp(targetCenterX - clamp(targetCenterX - panelWidth / 2, margin, viewportWidth - panelWidth - margin) - 10, 26, panelWidth - 34) },
      arrowClass: '-top-2 border-l border-t',
    };
  }

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
    behavior: 'auto',
  });
}

function broadcastGuideStep(activeView: string, anchor: string | null, step?: ProductGuideStep) {
  window.dispatchEvent(new CustomEvent('axis:guide-step-change', {
    detail: { activeView, anchor, step },
  }));
}

type InAppGuideOverlayProps = {
  activeView: string;
  onClose: () => void;
};

export function InAppGuideOverlay({
  activeView,
  onClose,
}: InAppGuideOverlayProps) {
  const viewSpecificSteps = useMemo(
    () => {
      if (isPeerPlusGlobalGuideActive(activeView)) return peerPlusGlobalGuideSteps;
      return getMixerGuideSteps(activeView) ?? viewGuideMap[activeView] ?? [];
    },
    [activeView],
  );
  const baseSteps = useMemo(
    () => (activeView === 'home'
      ? [...viewSpecificSteps, ...commonGuideSteps.slice(1)]
      : viewSpecificSteps),
    [activeView, viewSpecificSteps],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [guideLayout, setGuideLayout] = useState<GuideLayout>({});
  const panelRef = useRef<HTMLElement | null>(null);
  const steps = baseSteps;
  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const step = steps[safeStepIndex] ?? steps[0];
  const isLast = safeStepIndex === steps.length - 1;
  const hasDynamicPanel = Boolean(guideLayout.panelStyle);
  const hasDynamicHighlight = Boolean(guideLayout.highlightStyle);
  const stepTargetKey = step ? guideTargetByAnchor[step.anchor] : null;
  const hasMissingTargetFallback = Boolean(stepTargetKey && !hasDynamicPanel);

  const handleGuideClose = () => {
    setStepIndex(0);
    setGuideLayout({});
    onClose();
  };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setStepIndex(0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeView]);

  useEffect(() => {
    if (steps.length === 0) {
      handleGuideClose();
      return;
    }
    if (stepIndex !== safeStepIndex) {
      setStepIndex(safeStepIndex);
    }
  }, [safeStepIndex, stepIndex, steps.length]);

  useEffect(() => {
    if (!step) return;
    const targetKey = guideTargetByAnchor[step.anchor];

    const updateLayout = () => {
      if (!targetKey) {
        setGuideLayout({});
        return;
      }

      const targetElement = getGuideTargetElement(targetKey);
      if (!targetElement) {
        setGuideLayout({});
        return;
      }

      setGuideLayout(createGuideLayout(targetElement.getBoundingClientRect()));
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
  }, [activeView, safeStepIndex, step]);

  useEffect(() => {
    if (!step) return;

    const targetKey = guideTargetByAnchor[step.anchor];
    if (!targetKey) return;

    broadcastGuideStep(activeView, step.anchor, step);

    const timeoutIds: number[] = [];
    const frameId = window.requestAnimationFrame(() => {
      const targetElement = getGuideTargetElement(targetKey);
      if (!targetElement) return;

      scrollGuideTargetIntoView(targetElement);

      const refreshLayout = () => {
        const refreshedTarget = getGuideTargetElement(targetKey);
        if (!refreshedTarget) return;
        setGuideLayout(createGuideLayout(refreshedTarget.getBoundingClientRect()));
      };

      refreshLayout();
      [80, 180, 320].forEach((delay) => {
        timeoutIds.push(window.setTimeout(refreshLayout, delay));
      });
    });

    return () => {
      broadcastGuideStep(activeView, null);
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [activeView, safeStepIndex, step]);

  useEffect(() => {
    if (!step) return;

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
  }, [guideLayout.panelStyle, safeStepIndex, step]);

  if (!step) {
    return null;
  }

  const fallbackPanelClass = hasMissingTargetFallback
    ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
    : step.position;
  const fallbackHighlightClass = hasMissingTargetFallback
    ? 'hidden'
    : `hidden lg:block ${step.highlight}`;
  const fallbackArrowClass = hasMissingTargetFallback ? 'hidden' : step.arrow;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]">
      <div className="pointer-events-auto absolute inset-0 bg-[rgba(10,14,22,0.22)] backdrop-blur-[1px] md:bg-[rgba(10,14,22,0.38)]" />
      <div
        className={`pointer-events-none absolute z-10 rounded-[18px] border-2 border-[var(--axis-accent)] bg-[rgba(220,90,36,0.08)] shadow-[0_0_0_9999px_rgba(10,14,22,0.28)] ${
          hasDynamicHighlight ? '' : fallbackHighlightClass
        }`}
        style={guideLayout.highlightStyle}
      />
      <section
        ref={panelRef}
        className={`pointer-events-auto absolute z-20 max-h-[calc(100vh-32px)] w-[min(420px,calc(100vw-32px))] overflow-y-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.58)] transition-all duration-300 md:p-6 ${
          hasDynamicPanel ? '' : fallbackPanelClass
        }`}
        style={guideLayout.panelStyle}
      >
        <div
          className={`absolute h-5 w-5 rotate-45 border-[var(--axis-hairline)] bg-[var(--axis-canvas)] ${
            hasDynamicPanel ? `border ${guideLayout.arrowClass ?? '-left-2 border-b border-l'}` : fallbackArrowClass
          }`}
          style={guideLayout.arrowStyle}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="axis-kicker">{viewLabels[activeView] ?? 'AXIS'} guide</p>
            <h2 className="mt-2 text-xl font-display font-semibold leading-tight text-[var(--axis-ink)] md:text-2xl">{step.title}</h2>
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
        <p className="mt-3 text-sm font-medium leading-6 text-[var(--axis-body)] md:mt-4 md:text-base md:leading-7">{step.body}</p>
        <div className="mt-4 space-y-3 md:mt-5">
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
        <div className="mt-5 flex items-center justify-between gap-3 md:mt-6">
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
                setStepIndex((index) => Math.min(steps.length - 1, index + 1));
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
