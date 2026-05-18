import { type CSSProperties, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { viewLabels } from '../../shared/content/navigation';
import { guideTargetByAnchor, viewGuideMap, type ProductGuideStep } from '../../shared/content/productGuide';

type GuideLayout = {
  panelStyle?: CSSProperties;
  highlightStyle?: CSSProperties;
  arrowStyle?: CSSProperties;
  arrowClass?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createGuideLayout(rect: DOMRect): GuideLayout {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gap = 18;
  const margin = 16;
  const panelWidth = Math.min(420, viewportWidth - margin * 2);
  const estimatedPanelHeight = Math.min(360, viewportHeight - margin * 2);
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

export function InAppGuideOverlay({
  activeView,
  onClose,
}: {
  activeView: string;
  onClose: () => void;
}) {
  const baseSteps = viewGuideMap[activeView] ?? viewGuideMap.home;
  const [availableSteps, setAvailableSteps] = useState<ProductGuideStep[]>(baseSteps);
  const [stepIndex, setStepIndex] = useState(0);
  const [guideLayout, setGuideLayout] = useState<GuideLayout>({});
  const steps = availableSteps.length > 0 ? availableSteps : baseSteps;
  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex === steps.length - 1;
  const hasDynamicLayout = Boolean(guideLayout.panelStyle && guideLayout.highlightStyle);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setAvailableSteps(resolveGuideSteps(baseSteps));
      setStepIndex(0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeView, baseSteps]);

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
  }, [activeView, step.anchor, stepIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(10,14,22,0.38)] backdrop-blur-[1px]">
      <div
        className={`pointer-events-none absolute rounded-[18px] border-2 border-[var(--axis-accent)] bg-[rgba(220,90,36,0.08)] shadow-[0_0_0_9999px_rgba(10,14,22,0.28)] ${
          hasDynamicLayout ? '' : `hidden lg:block ${step.highlight}`
        }`}
        style={guideLayout.highlightStyle}
      />
      <section
        className={`absolute w-[min(420px,calc(100vw-32px))] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-6 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.58)] transition-all duration-300 ${
          hasDynamicLayout ? '' : step.position
        }`}
        style={guideLayout.panelStyle}
      >
        <div
          className={`absolute h-5 w-5 rotate-45 border-[var(--axis-hairline)] bg-[var(--axis-canvas)] ${
            hasDynamicLayout ? `border ${guideLayout.arrowClass ?? '-left-2 border-b border-l'}` : step.arrow
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
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-ink)]"
            aria-label="사용 가이드 닫기"
          >
            <X size={17} />
          </button>
        </div>
        <p className="mt-4 text-base font-medium leading-7 text-[var(--axis-body)]">{step.body}</p>
        <div className="mt-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--axis-accent-strong)]">설명 위치</p>
          <p className="mt-1 text-sm font-semibold text-[var(--axis-ink)]">{step.anchor}</p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--axis-muted)]">{stepIndex + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              className="inline-flex h-10 items-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 text-sm font-semibold text-[var(--axis-body)] disabled:opacity-40"
            >
              <ArrowLeft size={15} />
              이전
            </button>
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setStepIndex((index) => index + 1))}
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
