import { useEffect } from 'react';

type RevealDirection = 'left' | 'right' | 'up' | 'down';

const DIRECTIONS: RevealDirection[] = ['left', 'up', 'right', 'down'];

function pickDirection(el: HTMLElement, index: number): RevealDirection {
  const rect = el.getBoundingClientRect();
  const viewportMid = window.innerWidth / 2;

  // Grid items or side-by-side panels float in from their outer horizontal edges
  if (rect.width > 0 && rect.width < window.innerWidth * 0.65) {
    const centerX = rect.left + rect.width / 2;
    if (centerX < viewportMid - 40) return 'left';
    if (centerX > viewportMid + 40) return 'right';
  }

  return DIRECTIONS[index % DIRECTIONS.length];
}

export function useGlobalScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.setAttribute('data-scroll-visible', 'true');
            io.unobserve(target);
          }
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -24px 0px',
        threshold: 0.05,
      }
    );

    const registerElements = () => {
      const rootNodes = document.querySelectorAll('main, footer');
      let counter = 0;

      rootNodes.forEach((root) => {
        const candidates = root.querySelectorAll<HTMLElement>(
          'section, div.rounded-2xl, div.rounded-xl, table, form, footer > p'
        );

        candidates.forEach((el) => {
          // Skip modals/fixed overlays, nested ScrollReveal-managed elements, or already registered blocks
          if (
            el.closest('.fixed') ||
            el.closest('[data-sr-managed="true"]') ||
            el.hasAttribute('data-sr-managed') ||
            el.hasAttribute('data-scroll-reveal')
          ) {
            return;
          }

          // Avoid double-animating deeply nested cards inside an already-revealed card
          const parentReveal = el.parentElement?.closest('[data-scroll-reveal]');
          if (parentReveal && el.classList.contains('rounded-xl') && !el.closest('.grid')) {
            return;
          }

          const rect = el.getBoundingClientRect();
          if (rect.height < 24 && el.tagName !== 'P') return;

          const dir = pickDirection(el, counter);
          const delayMs = Math.min((counter % 5) * 65, 260);
          counter += 1;

          el.setAttribute('data-scroll-reveal', dir);
          el.style.setProperty('--sr-delay', `${delayMs}ms`);

          if (prefersReduced) {
            el.setAttribute('data-scroll-visible', 'true');
            return;
          }

          // If already visible or above current fold, reveal on next animation frame
          if (rect.top < window.innerHeight * 0.96) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.setAttribute('data-scroll-visible', 'true');
              });
            });
          } else {
            io.observe(el);
          }
        });
      });
    };

    // Initial scan after tab mount
    const rafId = requestAnimationFrame(() => {
      registerElements();
    });

    // Observe dynamic DOM updates (sub-tabs, async panels, expanded accordions)
    const mainEl = document.querySelector('main');
    let mutationTimer: number | null = null;
    const mo = mainEl
      ? new MutationObserver(() => {
          if (mutationTimer) window.clearTimeout(mutationTimer);
          mutationTimer = window.setTimeout(registerElements, 60);
        })
      : null;

    if (mainEl && mo) {
      mo.observe(mainEl, { childList: true, subtree: true });
    }

    // Safety net: ensure no visible element remains hidden on fast scrolls
    const safetyTimer = window.setInterval(() => {
      const pending = document.querySelectorAll<HTMLElement>(
        '[data-scroll-reveal]:not([data-scroll-visible="true"])'
      );
      pending.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 60) {
          el.setAttribute('data-scroll-visible', 'true');
          io.unobserve(el);
        }
      });
    }, 350);

    return () => {
      cancelAnimationFrame(rafId);
      if (mutationTimer) window.clearTimeout(mutationTimer);
      window.clearInterval(safetyTimer);
      io.disconnect();
      mo?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
