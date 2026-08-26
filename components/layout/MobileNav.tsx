"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/navigation";

export default function MobileNav({ shopUrl }: { shopUrl?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center border border-void-600 text-star-100 transition-colors hover:border-nebula-teal-500 hover:text-nebula-teal-400"
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
        <nav className="absolute inset-x-0 top-20 border-t border-void-700 bg-void-950 px-6 py-4 backdrop-blur">
          {shopUrl && (
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mb-4 flex items-center justify-center gap-2 border border-nebula-rose-400 px-4 py-3 font-mono text-sm uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950"
            >
              Shop Prints
            </a>
          )}
          <ul className="flex flex-col divide-y divide-void-700">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
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
      )}
    </div>
  );
}
