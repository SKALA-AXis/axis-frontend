import { type RefObject, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

function collectScrollTargets(scrollTargetRef: RefObject<HTMLElement | null>) {
  const root = scrollTargetRef.current;
  if (!root) return [];

  const targets = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>('.axis-executive-page')),
    ...Array.from(root.querySelectorAll<HTMLElement>('*')).filter((target) => target.scrollHeight - target.clientHeight > 24),
    document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null,
  ].filter((target): target is HTMLElement => Boolean(target));

  return Array.from(new Set(targets));
}

type ScrollToTopButtonProps = {
  scrollTargetRef: RefObject<HTMLElement | null>;
  watchKey: string;
};

export function ScrollToTopButton({
  scrollTargetRef,
  watchKey,
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const root = scrollTargetRef.current;
    if (!root) return;

    let frameId = 0;
    const updateVisibility = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const shouldShow = collectScrollTargets(scrollTargetRef).some((target) => {
          const isScrollable = target.scrollHeight - target.clientHeight > 24;
          return isScrollable && target.scrollTop > 240;
        });
        setIsVisible(shouldShow);
      });
    };

    updateVisibility();
    const timeoutId = window.setTimeout(updateVisibility, 0);
    const scrollTargets = collectScrollTargets(scrollTargetRef);
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
    collectScrollTargets(scrollTargetRef).forEach((target) => {
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
