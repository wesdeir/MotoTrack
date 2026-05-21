import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ROUTES = ['/', '/maintenance', '/fuel', '/reports', '/settings'];
const MIN_SWIPE_X = 70; // px — minimum horizontal travel to fire navigation

/** Walk up the DOM; return true if el is inside a horizontally-scrollable container. */
function inHorizontalScroller(el: Element): boolean {
  let node: Element | null = el;
  while (node && node !== document.body) {
    const { overflowX } = window.getComputedStyle(node);
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      node.scrollWidth > node.clientWidth
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Attaches touch listeners to document and navigates to the prev/next route
 * when the user performs a shallow horizontal swipe.
 *
 * Guards (all bail out early):
 *   • body overflow:hidden  → a modal/sheet is open
 *   • touch target is input / select / textarea
 *   • touch started inside a horizontally-scrollable container (chip bars etc.)
 *   • vertical displacement > 50 % of horizontal (angle > ~27° from horizontal)
 *   • horizontal distance < MIN_SWIPE_X
 */
export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const startRef = useRef<{ x: number; y: number } | null>(null);
  // Keep a mutable ref so the stable event handlers always read the current
  // pathname without being re-created (and re-attached) on every navigation.
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // A modal locks body scroll — don't swipe-navigate through an open sheet
      if (document.body.style.overflow === 'hidden') return;

      const target = e.target as Element;
      if (target.closest('input, select, textarea')) return;
      if (inHorizontalScroller(target)) return;

      const t = e.touches[0];
      startRef.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startRef.current) return;
      const { x: sx, y: sy } = startRef.current;
      startRef.current = null;

      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;

      // Reject swipes that are too short or too vertical
      if (Math.abs(dx) < MIN_SWIPE_X) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.5) return; // dy > 0.5 dx ≈ angle > 27°

      const idx = ROUTES.indexOf(pathnameRef.current);
      if (idx === -1) return;

      if (dx < 0 && idx < ROUTES.length - 1) {
        navigate(ROUTES[idx + 1]); // swipe left → next tab
      } else if (dx > 0 && idx > 0) {
        navigate(ROUTES[idx - 1]); // swipe right → previous tab
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate]); // navigate is stable — listeners are attached once for the lifetime of AppShell
}
