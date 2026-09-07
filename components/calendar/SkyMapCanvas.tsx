"use client";

import { useEffect, useRef, useState } from "react";
import type { SkySnapshot } from "@/lib/astro/skyMapPositions";

const COLORS = {
  ground: "#0a0c14", // void-900 — the strip below the horizon
  horizonLine: "#565b6e", // star-700
  grid: "#1b1e2c", // void-700
  compass: "#8a90a6", // star-500
  compassFacing: "#f5f7fa", // star-100 — the exact direction centred
  constellationLine: "rgba(143, 178, 245, 0.32)", // nebula-indigo-400 at low opacity
  constellationLabel: "rgba(143, 178, 245, 0.6)",
  star: "#f5f7fa", // star-100
  planet: "#f0c26f", // nebula-amber-400
  moonBase: "#e8eaf0",
  moonShadow: "#05060a",
  moonEdge: "#565b6e",
  sun: "#e2543f", // nebula-rose-400
};

// A wide-but-not-fisheye field of view, like looking ahead rather than up —
// most of a person's actual view of the sky when facing a direction. Height
// range is deliberately asymmetric: -8° gives a thin strip of "ground" for
// orientation, +82° covers everything up to near-zenith, since that's
// where almost everything actually worth seeing sits.
const FOV_AZIMUTH = 120;
const ALT_MIN = -8;
const ALT_MAX = 82;
const ALT_RANGE = ALT_MAX - ALT_MIN;

const COMPASS_POINTS: [string, number][] = [
  ["N", 0],
  ["NE", 45],
  ["E", 90],
  ["SE", 135],
  ["S", 180],
  ["SW", 225],
  ["W", 270],
  ["NW", 315],
];

/** Shortest signed angular difference a-b, in (-180, 180]. */
function angleDiff(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

function project(
  altitude: number,
  azimuth: number,
  facing: number,
  width: number,
  height: number,
): { x: number; y: number; dAz: number } {
  const dAz = angleDiff(azimuth, facing);
  const x = width / 2 + (dAz / (FOV_AZIMUTH / 2)) * (width / 2);
  const y = height - ((altitude - ALT_MIN) / ALT_RANGE) * height;
  return { x, y, dAz };
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  illuminatedFraction: number,
  waxing: boolean,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = COLORS.moonBase;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  // Two-overlapping-circles phase trick: a same-radius shadow disc slides
  // across the moon's face from fully-covering (new) to fully clear (full).
  // Not a literal terminator ellipse, but the standard, honest-enough
  // approximation for an icon this size — the phase name label is the
  // precise source of truth, this is the "at a glance" shape.
  const offset = (1 - illuminatedFraction) * 2 * r * (waxing ? 1 : -1);
  ctx.beginPath();
  ctx.arc(x + offset, y, r, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.moonShadow;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.moonEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Greedy label placement: each candidate is only drawn if its bounding box
// doesn't overlap one already placed. Callers add candidates in priority
// order (Sun/Moon/planets first, then brightest stars, then constellation
// names last) so a crowded patch of sky quietly drops the least important
// label instead of stacking illegible text — the exact complaint a first
// pass of this map got.
function makeLabelPlacer() {
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  return function tryPlace(x: number, y: number, width: number, height: number): boolean {
    const x0 = x;
    const y0 = y - height / 2;
    const x1 = x + width;
    const y1 = y + height / 2;
    for (const p of placed) {
      if (x0 < p.x1 && x1 > p.x0 && y0 < p.y1 && y1 > p.y0) return false;
    }
    placed.push({ x0, y0, x1, y1 });
    return true;
  };
}

export default function SkyMapCanvas({
  snapshot,
  facingAzimuth,
}: {
  snapshot: SkySnapshot;
  facingAzimuth: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Measured from the wrapping div's own width — a hardcoded pixel size
  // would either overflow a narrow phone screen or stay needlessly small
  // on a wide one. The container's own aspect-[4/3] (below) keeps height
  // in step with FOV_AZIMUTH/ALT_RANGE's own 120:90 ratio, so stars read
  // as circles rather than being stretched into ellipses.
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !width) return;

    const height = width * (ALT_RANGE / FOV_AZIMUTH);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const horizonY = height - ((0 - ALT_MIN) / ALT_RANGE) * height;

    // Sky above the horizon line, real colour for the actual time of day.
    ctx.fillStyle = skyBackgroundColor(snapshot.sun.altitude);
    ctx.fillRect(0, 0, width, horizonY);
    // Ground below it — always the same flat dark tone, day or night;
    // this map has nothing useful to say about lit ground.
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    ctx.strokeStyle = COLORS.horizonLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    // Altitude gridlines at 30°/60°, purely as gentle depth cues.
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    [30, 60].forEach((alt) => {
      const y = height - ((alt - ALT_MIN) / ALT_RANGE) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    // Compass ticks wherever a cardinal/intercardinal point actually falls
    // within the current field of view (usually 2-3 of them at once).
    ctx.font = `${Math.max(10, width * 0.022)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    COMPASS_POINTS.forEach(([label, az]) => {
      const dAz = angleDiff(az, facingAzimuth);
      if (Math.abs(dAz) > FOV_AZIMUTH / 2 + 5) return;
      const x = width / 2 + (dAz / (FOV_AZIMUTH / 2)) * (width / 2);
      const isFacing = Math.abs(dAz) < 1;
      ctx.strokeStyle = isFacing ? COLORS.compassFacing : COLORS.compass;
      ctx.beginPath();
      ctx.moveTo(x, horizonY - 6);
      ctx.lineTo(x, horizonY + 6);
      ctx.stroke();
      ctx.fillStyle = isFacing ? COLORS.compassFacing : COLORS.compass;
      ctx.fillText(label, x, horizonY + 22);
    });

    const placeLabel = makeLabelPlacer();
    const fontSize = Math.max(9, width * 0.018);
    const nameFont = `${fontSize}px ui-monospace, monospace`;

    // Constellation lines, drawn before everything else so dots/labels sit
    // on top of them. Only segments whose midpoint direction is roughly
    // within view are worth the draw call — cheap early-out for the rest
    // of the sky behind/beside the visitor.
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.constellationLine;
    const visibleLines = snapshot.constellationLines.filter((seg) => {
      const midAz = (seg.from.azimuth + seg.to.azimuth) / 2;
      return Math.abs(angleDiff(midAz, facingAzimuth)) < FOV_AZIMUTH / 2 + 20;
    });
    visibleLines.forEach((seg) => {
      const from = project(seg.from.altitude, seg.from.azimuth, facingAzimuth, width, height);
      const to = project(seg.to.altitude, seg.to.azimuth, facingAzimuth, width, height);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    // Sun, Moon and planets first — always shown, always labelled, they're
    // the whole reason someone opens this.
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (snapshot.sun.altitude >= -2 && Math.abs(angleDiff(snapshot.sun.azimuth, facingAzimuth)) < FOV_AZIMUTH / 2) {
      const { x, y } = project(snapshot.sun.altitude, snapshot.sun.azimuth, facingAzimuth, width, height);
      const r = Math.max(6, width * 0.012);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.sun;
      ctx.fill();
      ctx.font = nameFont;
      ctx.fillStyle = COLORS.sun;
      if (placeLabel(x + r + 5, y, ctx.measureText("Sun").width, fontSize)) ctx.fillText("Sun", x + r + 5, y);
    }

    if (Math.abs(angleDiff(snapshot.moon.azimuth, facingAzimuth)) < FOV_AZIMUTH / 2) {
      const { x, y } = project(snapshot.moon.altitude, snapshot.moon.azimuth, facingAzimuth, width, height);
      const r = Math.max(5, width * 0.011);
      const waxing =
        snapshot.moon.phaseName.startsWith("Waxing") || snapshot.moon.phaseName === "First Quarter";
      drawMoon(ctx, x, y, r, snapshot.moon.illuminatedFraction, waxing);
      ctx.font = nameFont;
      ctx.fillStyle = "#c7cbd9";
      if (placeLabel(x + r + 6, y, ctx.measureText("Moon").width, fontSize)) ctx.fillText("Moon", x + r + 6, y);
    }

    snapshot.planets.forEach((planet) => {
      if (Math.abs(angleDiff(planet.azimuth, facingAzimuth)) >= FOV_AZIMUTH / 2) return;
      const { x, y } = project(planet.altitude, planet.azimuth, facingAzimuth, width, height);
      const r = Math.max(2.5, width * 0.005);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.planet;
      ctx.fill();
      ctx.font = nameFont;
      ctx.fillStyle = COLORS.planet;
      if (placeLabel(x + r + 5, y, ctx.measureText(planet.name).width, fontSize)) {
        ctx.fillText(planet.name, x + r + 5, y);
      }
    });

    // Stars — brightest first, so a genuinely crowded patch keeps the
    // recognisable named stars and quietly drops the fainter ones' labels
    // rather than stacking text. The dot itself always draws regardless.
    const visibleStars = snapshot.stars
      .filter((s) => Math.abs(angleDiff(s.azimuth, facingAzimuth)) < FOV_AZIMUTH / 2)
      .sort((a, b) => a.magnitude - b.magnitude);
    const USEFUL_LABEL_MAG = 2.2;
    visibleStars.forEach((star) => {
      const { x, y } = project(star.altitude, star.azimuth, facingAzimuth, width, height);
      const radius = Math.max(0.9, (2.6 - star.magnitude) * 0.75);
      const opacity = Math.max(0.3, Math.min(1, (2.6 - star.magnitude) / 3.2));
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 247, 250, ${opacity})`;
      ctx.fill();
      if (star.magnitude <= USEFUL_LABEL_MAG) {
        ctx.font = nameFont;
        const w = ctx.measureText(star.name).width;
        if (placeLabel(x + radius + 4, y, w, fontSize)) {
          ctx.fillStyle = "rgba(199, 203, 217, 0.85)"; // star-300
          ctx.fillText(star.name, x + radius + 4, y);
        }
      }
    });

    // One faint label per visible constellation, at the average position
    // of its own currently-drawn points — lowest priority of anything on
    // the map, so it's the first to be dropped in a crowded region.
    const groups = new Map<string, { x: number; y: number; n: number }>();
    visibleLines.forEach((seg) => {
      for (const star of [seg.from, seg.to]) {
        const p = project(star.altitude, star.azimuth, facingAzimuth, width, height);
        const g = groups.get(seg.constellation) ?? { x: 0, y: 0, n: 0 };
        g.x += p.x;
        g.y += p.y;
        g.n += 1;
        groups.set(seg.constellation, g);
      }
    });
    ctx.font = `${Math.max(9, width * 0.016)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    groups.forEach((g, name) => {
      const label = name.toUpperCase();
      const x = g.x / g.n;
      const y = g.y / g.n;
      const w = ctx.measureText(label).width;
      if (placeLabel(x - w / 2, y, w, fontSize)) {
        ctx.fillStyle = COLORS.constellationLabel;
        ctx.fillText(label, x, y);
      }
    });
  }, [snapshot, width, facingAzimuth]);

  return (
    <div ref={containerRef} className="aspect-[4/3] w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{ width, height: width * (ALT_RANGE / FOV_AZIMUTH) }}
        role="img"
        aria-label={`Sky view facing ${Math.round(facingAzimuth)}°: ${snapshot.stars.length} stars, ${snapshot.planets.length} planet${snapshot.planets.length === 1 ? "" : "s"}, and the Moon (${snapshot.moon.phaseName}), looking out toward the horizon`}
      />
    </div>
  );
}

/** Real daylight vs twilight vs night, read off the Sun's own altitude —
 * not decoration, this is what actually determines whether a real sky
 * looks black, orange, or blue at this exact moment. */
function skyBackgroundColor(sunAltitude: number): string {
  const stops: [number, [number, number, number]][] = [
    [-18, [5, 6, 10]], // astronomical night — void-950
    [-10, [10, 14, 28]],
    [-4, [40, 32, 48]], // twilight purple/orange
    [0, [70, 50, 40]],
    [6, [70, 110, 150]],
    [20, [60, 120, 175]], // full daylight blue
  ];
  if (sunAltitude <= stops[0][0]) return `rgb(${stops[0][1].join(",")})`;
  if (sunAltitude >= stops[stops.length - 1][0]) {
    return `rgb(${stops[stops.length - 1][1].join(",")})`;
  }
  for (let i = 0; i < stops.length - 1; i++) {
    const [alt0, c0] = stops[i];
    const [alt1, c1] = stops[i + 1];
    if (sunAltitude >= alt0 && sunAltitude <= alt1) {
      const t = (sunAltitude - alt0) / (alt1 - alt0);
      const c = c0.map((v, idx) => Math.round(v + (c1[idx] - v) * t));
      return `rgb(${c.join(",")})`;
    }
  }
  return `rgb(${stops[0][1].join(",")})`;
}
