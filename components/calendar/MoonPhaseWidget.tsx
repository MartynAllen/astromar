"use client";

import { useEffect, useState } from "react";
import { getMoonPhase, getNextPhase, type NextPhaseInfo } from "@/lib/astro/moonPhase";

function moonPath(radius: number, phase: number): string {
  const theta = phase * 2 * Math.PI;
  const rx = Math.abs(radius * Math.cos(theta));
  const sweepOuter = phase < 0.5 ? 1 : 0;
  const sweepInner = phase < 0.5 ? 0 : 1;
  return `M0,${-radius} A${radius},${radius} 0 0,${sweepOuter} 0,${radius} A${rx},${radius} 0 0,${sweepInner} 0,${-radius} Z`;
}

function formatNextPhase(next: NextPhaseInfo): string {
  const label = next.target === "full" ? "Full moon" : "New moon";
  const days = Math.round(next.days);
  if (days <= 0) return `${label} today`;
  if (days === 1) return `${label} tomorrow`;
  return `${label} in ${days} days`;
}

const REVEAL_DURATION_MS = 1600;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function MoonPhaseWidget() {
  // Computed client-side (current Date, no server-only dependency) since
  // the reveal below needs a real animation loop either way. Phase changes
  // over days, not seconds, so a visitor's own local clock vs. server time
  // makes no observable difference here.
  const [{ fraction, phase, phaseName }] = useState(() => getMoonPhase());
  const [nextPhase] = useState(() => getNextPhase());
  const r = 30;

  // The reveal plays the real cycle forward from new moon (phase 0) up to
  // today's actual phase, rather than just fading the final shape in —
  // since `phase` already *is* real progress through this month's cycle,
  // animating through increasing phase values is a genuine (compressed)
  // replay of the real cycle so far, not decoration standing in for one.
  // Plays once per mount; prefers-reduced-motion skips straight to the
  // real value (see the Earned Moment Rule this mirrors from every other
  // authored motion on the site).
  // Reduced motion starts (and stays) at the real value — no synchronous
  // setState-in-effect needed to "skip" the animation, it just never
  // starts one. SSR has no matchMedia, so the initializer falls through to
  // the animated (0) start there; the effect below still won't run twice
  // or fight the initial paint since it's client-only anyway.
  const [animatedPhase, setAnimatedPhase] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? phase
      : 0,
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let start = 0;

    function tick(timestamp: number) {
      if (!start) start = timestamp;
      const t = Math.min(1, (timestamp - start) / REVEAL_DURATION_MS);
      setAnimatedPhase(phase * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Intentionally runs once per mount, not on every `phase` change —
    // `phase` is read once via useState's lazy initializer above and never
    // changes for the lifetime of this component (a new "tonight" only
    // ever arrives via a fresh page load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-5 border border-void-700 bg-void-900 p-5">
      <svg width={r * 2 + 4} height={r * 2 + 4} viewBox={`${-r - 2} ${-r - 2} ${r * 2 + 4} ${r * 2 + 4}`}>
        <defs>
          {/* Procedural crater texture — same feTurbulence trick as the
              print-frame mockup's moulding grain (BuyPrintPanel.tsx),
              tuned to a much finer scale for a disc this small. Rendered
              once, then blended over both the lit and dark portions via
              mix-blend-mode so it reads as surface texture on the sphere
              rather than a flat coloured fill sitting on top of it. */}
          <filter id="moon-texture" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.25"
              numOctaves="3"
              seed="11"
              stitchTiles="stitch"
              result="noise"
            />
            {/* luminanceToAlpha turns the turbulence's RGB noise into a
                black, variable-alpha mask (alpha = luminance) — feeding
                that noise straight into a plain alpha slope (the previous
                attempt) left alpha uniform, since turbulence's own alpha
                channel barely varies; this is the standard, reliable way
                to get a usable greyscale mask out of feTurbulence. */}
            <feColorMatrix in="noise" type="luminanceToAlpha" result="mask" />
            <feComponentTransfer in="mask">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
          </filter>
          <clipPath id="moon-disc">
            <circle cx={0} cy={0} r={r} />
          </clipPath>
        </defs>
        <circle cx={0} cy={0} r={r} fill="var(--color-void-700)" />
        <path d={moonPath(r, animatedPhase)} fill="var(--color-star-100)" />
        {/* multiply, not overlay — overlay's blend formula is mathematically
            a no-op against a near-white base (1-base ≈ 0 cancels the
            texture out entirely), which left the lit side of the disc
            completely untouched. multiply darkens proportionally to the
            mask's alpha regardless of how bright the base pixel is, so the
            same texture actually shows on both the lit and dark sides. */}
        <rect
          x={-r}
          y={-r}
          width={r * 2}
          height={r * 2}
          clipPath="url(#moon-disc)"
          filter="url(#moon-texture)"
          style={{ mixBlendMode: "multiply" }}
        />
      </svg>
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-nebula-indigo-400">
          Tonight&apos;s moon
        </p>
        <p className="mt-1 font-mono text-xl uppercase tracking-wide text-star-100">{phaseName}</p>
        <p className="text-sm text-star-500">{Math.round(fraction * 100)}% illuminated</p>
        <p className="mt-0.5 text-xs text-star-500">{formatNextPhase(nextPhase)}</p>
      </div>
    </div>
  );
}
