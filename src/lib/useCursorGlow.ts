import { useEffect } from 'react';

type GlowKind = 'interactive' | 'static';

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  '[role="button"]',
  'summary',
  'input',
  'select',
  'textarea',
  'label[for]',
  '[tabindex]:not([tabindex="-1"])',
  '.interactive-block',
].join(', ');

const STATIC_SELECTOR = [
  'section',
  'article',
  'aside',
  'header',
  'nav',
  'footer',
  'form',
  'table',
  'tbody tr',
  'li',
  '[data-scroll-reveal]',
  'div.rounded-2xl',
  'div.rounded-xl',
  'div.rounded-lg',
  'h1',
  'h2',
  'h3',
].join(', ');

function hasTailwindPseudoClass(el: HTMLElement): boolean {
  const cls = typeof el.className === 'string' ? el.className : '';
  return cls.includes('after:') || cls.includes('before:') || el.classList.contains('peer');
}

function classifyGlowElement(el: HTMLElement): GlowKind | null {
  if (!el || el.nodeType !== 1) return null;
  const tag = el.tagName;
  if (
    tag === 'HTML' ||
    tag === 'BODY' ||
    tag === 'CANVAS' ||
    tag === 'SCRIPT' ||
    tag === 'STYLE' ||
    el.id === 'root'
  ) {
    return null;
  }

  // Never hijack pseudo-elements on Tailwind peer toggle switches or SVG sub-shapes
  if (hasTailwindPseudoClass(el)) return null;
  if (el instanceof SVGElement && tag !== 'svg') return null;
  if (el.hasAttribute('data-cursor-glow-ignore')) return null;

  // Skip tiny inline icons or decorative 10px chips that don't have interactivity
  if (el.matches(INTERACTIVE_SELECTOR)) {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
      return null;
    }
    return 'interactive';
  }

  // Skip fixed full-screen modal backdrop itself, but allow modal card & sections inside it
  if (el.classList.contains('fixed') && el.classList.contains('inset-0')) {
    return null;
  }

  if (el.matches(STATIC_SELECTOR)) {
    // Avoid double-highlighting small spans or unstyled inline rows
    if (tag === 'LI' && el.clientHeight < 26) return null;
    if ((tag === 'H1' || tag === 'H2' || tag === 'H3') && el.closest('button, a')) return null;
    if (tag === 'DIV' && el.clientHeight < 28 && el.clientWidth < 48) return null;
    return 'static';
  }

  return null;
}

function isNearRect(rect: DOMRect, x: number, y: number, pad: number): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    x >= rect.left - pad &&
    x <= rect.right + pad &&
    y >= rect.top - pad &&
    y <= rect.bottom + pad
  );
}

export function useCursorGlow(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const activeElements = new Set<HTMLElement>();
    let rafId: number | null = null;
    let latestX = -9999;
    let latestY = -9999;
    let latestTarget: EventTarget | null = null;

    const deactivateAll = () => {
      activeElements.forEach((el) => {
        el.setAttribute('data-cursor-glow-active', 'false');
      });
      activeElements.clear();
      document.documentElement.style.setProperty('--global-cursor-active', '0');
    };

    const updateGlowFrame = () => {
      rafId = null;
      const clientX = latestX;
      const clientY = latestY;

      document.documentElement.style.setProperty('--global-cursor-x', `${clientX.toFixed(1)}px`);
      document.documentElement.style.setProperty('--global-cursor-y', `${clientY.toFixed(1)}px`);
      document.documentElement.style.setProperty('--global-cursor-active', '1');

      const nextActive = new Map<HTMLElement, GlowKind>();

      // 1. Walk up the DOM tree from the direct pointer target
      let curr: HTMLElement | null =
        latestTarget instanceof HTMLElement
          ? latestTarget
          : latestTarget instanceof Element
            ? (latestTarget.parentElement as HTMLElement | null)
            : null;

      let depth = 0;
      let ancestorGridOrFlex: HTMLElement | null = null;

      while (curr && curr !== document.body && depth < 14) {
        const kind = classifyGlowElement(curr);
        if (kind && !nextActive.has(curr)) {
          nextActive.set(curr, kind);
        }
        if (
          !ancestorGridOrFlex &&
          (curr.classList.contains('grid') ||
            curr.classList.contains('flex-wrap') ||
            curr.tagName === 'NAV' ||
            curr.tagName === 'TBODY')
        ) {
          ancestorGridOrFlex = curr;
        }
        curr = curr.parentElement;
        depth += 1;
      }

      // 2. Proximity illumination for neighboring cards & buttons inside the nearest grid/flex group
      if (ancestorGridOrFlex) {
        const nearbyCandidates = ancestorGridOrFlex.querySelectorAll<HTMLElement>(
          'button, a[href], div.rounded-2xl, div.rounded-xl, section, tbody tr'
        );
        const maxInspect = Math.min(nearbyCandidates.length, 28);
        for (let i = 0; i < maxInspect; i += 1) {
          const cand = nearbyCandidates[i];
          if (nextActive.has(cand)) continue;
          const kind = classifyGlowElement(cand);
          if (!kind) continue;
          const rect = cand.getBoundingClientRect();
          if (isNearRect(rect, clientX, clientY, 64)) {
            nextActive.set(cand, kind);
          }
        }
      }

      // 3. Fade out elements no longer under or near the cursor
      activeElements.forEach((prevEl) => {
        if (!nextActive.has(prevEl)) {
          prevEl.setAttribute('data-cursor-glow-active', 'false');
          activeElements.delete(prevEl);
        }
      });

      // 4. Update local radial gradient coordinates (--cursor-x / --cursor-y)
      nextActive.forEach((kind, el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        if (!el.hasAttribute('data-cursor-glow')) {
          el.setAttribute('data-cursor-glow', kind);
          const computedPos = window.getComputedStyle(el).position;
          if (computedPos === 'static') {
            el.setAttribute('data-cursor-rel', 'true');
          }
        }

        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        const glowRadius = Math.max(
          150,
          Math.min(30, Math.round(Math.max(rect.width, rect.height) * 0.85))
        );

        el.style.setProperty('--cursor-x', `${localX.toFixed(1)}px`);
        el.style.setProperty('--cursor-y', `${localY.toFixed(1)}px`);
        el.style.setProperty('--glow-size', `${glowRadius}px`);
        el.setAttribute('data-cursor-glow-active', 'true');
        activeElements.add(el);
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      latestX = e.clientX;
      latestY = e.clientY;
      latestTarget = e.target;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateGlowFrame);
      }
    };

    const handlePointerLeave = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      deactivateAll();
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      deactivateAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
