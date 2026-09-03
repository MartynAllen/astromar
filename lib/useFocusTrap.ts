import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab/Shift+Tab cycling within a modal-like container while it's open,
 * rather than letting focus escape into the page content sitting behind it
 * (the still-mounted gallery grid behind a lightbox, the buy panel behind
 * Quick View, the page behind the mobile nav overlay). Every modal on this
 * site already moves initial focus onto its own close button on open and
 * closes on Escape; this is the missing third piece — see DESIGN.md/the
 * a11y audit that flagged it.
 *
 * `active` mirrors the open/closed state the caller already tracks — the
 * listener only attaches while true, so a closed (unmounted or hidden)
 * modal never intercepts Tab on the page behind it.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [containerRef, active]);
}
