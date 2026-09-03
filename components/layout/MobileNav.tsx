"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/navigation";
import { isSafeHref } from "@/lib/safeUrl";

export default function MobileNav({ shopUrl: rawShopUrl }: { shopUrl?: string }) {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  // Validated again here rather than trusting the caller already did —
  // Header passes an already-safe value today, but this component
  // shouldn't rely on that discipline holding for every future caller.
  const shopUrl = isSafeHref(rawShopUrl) ? rawShopUrl : undefined;

  // This is the site's one modal-like surface that didn't share the
  // scroll-lock/Escape/focus treatment Lightbox.tsx and QuickViewModal
  // already use — without it, opening the menu while scrolled down left
  // the page's own footer visibly (and confusingly) bleeding through
  // underneath the nav list, and a keyboard user had no Escape shortcut.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 flex h-11 w-11 items-center justify-center border border-void-600 bg-void-950 text-star-100 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {open ? (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* Opaque scrim behind the menu, at the same z-layer treatment as
              the gallery/reviews lightboxes — closes on click, same as
              clicking outside those modals, and stops the page content
              (including the footer) showing through underneath the list. */}
          <div
            className="fixed inset-0 z-40 bg-void-950/90 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed inset-x-0 top-20 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-void-700 bg-void-950 px-6 py-4"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {shopUrl && (
              <Link
                ref={firstLinkRef}
                href={shopUrl}
                onClick={() => setOpen(false)}
                className="mb-4 flex min-h-11 items-center justify-center gap-2 border border-nebula-rose-400 px-4 py-3 font-mono text-sm uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
              >
                Shop Prints
              </Link>
            )}
            <ul className="flex flex-col divide-y divide-void-700">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href}>
                  <Link
                    ref={!shopUrl && i === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-mono text-xl uppercase tracking-wide text-star-100 hover:text-nebula-teal-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
