"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

const SESSION_KEY = "astromar-shutter-played";

// Regular hexagon, radius 45, centered at (50,50) in a 0-100 viewBox —
// matches the blade shape a real camera iris produces when stopped down.
const HEXAGON_POINTS = [
  [50, 5],
  [88.97, 27.5],
  [88.97, 72.5],
  [50, 95],
  [11.03, 72.5],
  [11.03, 27.5],
]
  .map(([x, y]) => `${x},${y}`)
  .join(" ");

// useLayoutEffect runs before paint, so a repeat-session skip never flashes
// the overlay first; falls back to useEffect for SSR (no-op there anyway).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ShutterIntro() {
  const [phase, setPhase] = useState<"pending" | "playing" | "done">("pending");
  // Guards against React Strict Mode's dev-only double-invocation of effects:
  // without this, the 2nd invocation reads the sessionStorage flag the 1st
  // invocation just set and concludes it "already played" in the same tick.
  const hasCheckedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);

    if (reduceMotion || alreadyPlayed) {
      setPhase("done");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "1");
    setPhase("playing");
  }, []);

  if (phase !== "playing") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100]"
      onAnimationEnd={(e) => {
        if (e.animationName === "shutter-wordmark-out") setPhase("done");
      }}
    >
      <svg
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 100 100"
      >
        <defs>
          <mask id="shutter-mask">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <polygon
              points={HEXAGON_POINTS}
              fill="black"
              className="shutter-hole"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="var(--color-void-950)"
          mask="url(#shutter-mask)"
        />
      </svg>
      <div className="shutter-wordmark absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Logo className="h-12 w-12 text-nebula-teal-400" />
        <span className="font-display text-3xl italic tracking-tight text-nebula-teal-400">
          Astromar
        </span>
      </div>
    </div>
  );
}
