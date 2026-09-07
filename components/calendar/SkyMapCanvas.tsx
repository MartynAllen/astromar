"use client";

import { useEffect, useRef, useState } from "react";
import type { SkySnapshot } from "@/lib/astro/skyMapPositions";

const COLORS = {
  ground: "#0a0c14", // void-900 — the strip below the horizon
  horizonLine: "#c7cbd9", // star-300 — a real, findable line at a glance
  grid: "#262a3b", // void-600
  compass: "#c7cbd9", // star-300
  compassFacing: "#f5f7fa", // star-100 — the exact direction centred
  constellationLine: "#8fb2f5", // nebula-indigo-400, at full strength — this
  // was the single biggest "fades into the backdrop" complaint, so it's no
  // longer diluted with a baked-in low alpha; dimScale (below) is the only
  // thing that ever reduces it now, and only when that's actually meaningful.
  constellationLabel: "#eef3ff", // near-white indigo tint, same reasoning
  star: "#f5f7fa", // star-100
  planet: "#f0c26f", // nebula-amber-400
  deepSky: "#6fdcec", // nebula-teal-400 — deep-sky gets its own bright,
  // distinct hue (teal is the site's own brand/nav accent, but used here as
  // a plain marker colour, not a section identity) precisely because it
  // was asked to stand out, not blend in with the star-coloured backdrop.
  moonBase: "#e8eaf0",
  moonShadow: "#05060a",
  moonEdge: "#565b6e",
  sun: "#e2543f", // nebula-rose-400
  textHalo: "rgba(5, 6, 10, 0.65)", // void-950 — the outline behind every
  // label, so text reads on any sky colour from midnight black to midday
  // blue without needing a different palette per time of day.
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
// Everything within this many degrees of the exact field of view is worth a
// draw call — wider than FOV_AZIMUTH/2 alone so a constellation line whose
// other endpoint is just outside frame still gets drawn (Canvas clips
// anything past the edge for free); using the SAME margin for every
// category (stars, lines, planets, deep-sky), checked per endpoint rather
// than an averaged midpoint, is what actually matters here — the earlier
// version used a wider, midpoint-based cutoff for lines than the strict
// per-star cutoff used for star dots, so a line could still be "in view"
// by that average while the actual star it terminated at wasn't drawn at
// all, making constellations look like they reshaped themselves while
// panning. There's nothing to reshape — real positions don't change when
// you turn your head — that was a filtering bug, not a rendering one.
const VISIBLE_MARGIN = 15;
const HALF_VISIBLE = FOV_AZIMUTH / 2 + VISIBLE_MARGIN;
// How much stars/constellations/deep-sky fade when it's too bright to
// actually see them — the Sun, Moon and planets stay at full strength (a
// bright planet or the Moon itself can be genuinely visible in a daytime
// sky; the faint background stars can't). Only ever applied in Live sky
// colour mode: Night view's entire purpose is a practical, always-legible
// view for exploring the sky regardless of the real time of day, so
// dimming things there — as an earlier version mistakenly did — defeated
// the point and made everything except the Sun/Moon/planets look washed
// out and grey (those three never dim, which is exactly what made this
// bug so obvious to spot).
const DAYLIGHT_OPACITY = 0.32;
// Labels never start closer to a canvas edge than this, and are skipped
// outright if they'd still run past it — the first version let text start
// just inside the field of view and then clip mid-word at the boundary.
const EDGE_MARGIN = 6;

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

export interface SkyMapLayers {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  deepSky: boolean;
}

/** Shortest signed angular difference a-b, in (-180, 180]. */
function angleDiff(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

function isRoughlyInView(azimuth: number, facing: number): boolean {
  return Math.abs(angleDiff(azimuth, facing)) < HALF_VISIBLE;
}

function project(
  altitude: number,
  azimuth: number,
  facing: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const dAz = angleDiff(azimuth, facing);
  const x = width / 2 + (dAz / (FOV_AZIMUTH / 2)) * (width / 2);
  const y = height - ((altitude - ALT_MIN) / ALT_RANGE) * height;
  return { x, y };
}

/** Fill text with a dark halo behind it (stroke-then-fill) so it reads on
 * any background — night black, twilight orange, or midday blue — without
 * needing a different colour per sky condition. */
function haloText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.textHalo;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
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
// doesn't overlap one already placed, or run past either canvas edge.
// Callers add candidates in priority order (Sun/Moon/planets first, then
// brightest stars, then constellation names last) so a crowded patch of
// sky quietly drops the least important label instead of stacking
// illegible text, and no label ever clips mid-word at the frame's edge.
function makeLabelPlacer(canvasWidth: number) {
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  return function tryPlace(x: number, y: number, width: number, height: number): boolean {
    const x0 = x;
    const y0 = y - height / 2;
    const x1 = x + width;
    const y1 = y + height / 2;
    if (x0 < EDGE_MARGIN || x1 > canvasWidth - EDGE_MARGIN) return false;
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
  onFacingChange,
  nightMode,
  layers,
}: {
  snapshot: SkySnapshot;
  facingAzimuth: number;
  onFacingChange: (azimuth: number) => void;
  /** Always render a dark, practical background regardless of the real
   * time of day — the alternative to skyGradient's own realistic (but
   * much lower-contrast in daylight) colouring. */
  nightMode: boolean;
  layers: SkyMapLayers;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Measured from the wrapping div's own width — a hardcoded pixel size
  // would either overflow a narrow phone screen or stay needlessly small
  // on a wide one. The container's own aspect-[4/3] (below) keeps height
  // in step with FOV_AZIMUTH/ALT_RANGE's own 120:90 ratio, so stars read
  // as circles rather than being stretched into ellipses.
  const [width, setWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ pointerId: number; startX: number; startFacing: number } | null>(null);

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

  // Drag-to-look-around — the natural way to explore a sky view (Stellarium,
  // Star Walk, Google Street View all work this way), rather than only
  // clicking small arrow buttons repeatedly. Pointer Events cover mouse and
  // touch with one code path. touch-action: pan-y (on the canvas below)
  // hands vertical page-scroll gestures back to the browser while claiming
  // horizontal drags for panning here.
  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startFacing: facingAzimuth };
    setIsDragging(true);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== e.pointerId || !width) return;
    // Dragging right pulls the sky right, revealing what's further left —
    // the content follows the cursor, so the facing direction moves the
    // opposite way, exactly like panning a photo or a map.
    const deltaX = e.clientX - drag.startX;
    const deltaDeg = (deltaX / width) * FOV_AZIMUTH;
    onFacingChange(((drag.startFacing - deltaDeg) % 360 + 360) % 360);
  }
  function endDrag(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragState.current?.pointerId === e.pointerId) dragState.current = null;
    setIsDragging(false);
  }

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
    // Night view is a practical exploration tool, not a brightness
    // simulation — it stays at full strength regardless of the real Sun
    // position. Live sky colour is the one place dimming actually means
    // something ("this genuinely isn't visible right now").
    const dimScale = nightMode || snapshot.isDarkEnoughToSeeStars ? 1 : DAYLIGHT_OPACITY;

    // Sky above the horizon line, as a real vertical gradient (zenith at
    // top, horizon at the bottom) rather than a flat fill — a flat colour
    // reads as a coloured rectangle; a gradient reads as an actual sky,
    // and is what makes a real sunset/sunrise look like one instead of a
    // muddy solid blue. Night mode gets the same treatment at a much
    // narrower, darker range, so it stays practical while still having a
    // little real depth to it.
    const [zenith, horizon] = nightMode ? nightGradientColors() : skyGradientColors(snapshot.sun.altitude);
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, `rgb(${zenith.join(",")})`);
    skyGradient.addColorStop(1, `rgb(${horizon.join(",")})`);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);
    // Ground below it — always the same flat dark tone, day or night;
    // this map has nothing useful to say about lit ground.
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    ctx.strokeStyle = COLORS.horizonLine;
    ctx.lineWidth = 2;
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
    ctx.font = `bold ${Math.max(10, width * 0.022)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    COMPASS_POINTS.forEach(([label, az]) => {
      const dAz = angleDiff(az, facingAzimuth);
      if (Math.abs(dAz) > FOV_AZIMUTH / 2 + 5) return;
      const x = width / 2 + (dAz / (FOV_AZIMUTH / 2)) * (width / 2);
      const isFacing = Math.abs(dAz) < 1;
      const color = isFacing ? COLORS.compassFacing : COLORS.compass;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, horizonY - 7);
      ctx.lineTo(x, horizonY + 7);
      ctx.stroke();
      ctx.fillStyle = color;
      haloText(ctx, label, x, horizonY + 22);
    });

    const placeLabel = makeLabelPlacer(width);
    const fontSize = Math.max(9, width * 0.018);
    const nameFont = `${fontSize}px ui-monospace, monospace`;
    const boldNameFont = `600 ${fontSize}px ui-monospace, monospace`;

    // Constellation lines, drawn before everything else so dots/labels sit
    // on top of them. A segment is worth drawing if EITHER real endpoint
    // is roughly in view — checked per star, not by averaging the two
    // azimuths together (that average breaks down completely near the
    // 0°/360° wraparound, and was the root cause of constellations
    // appearing to partially vanish/reshape while panning).
    let visibleLines: typeof snapshot.constellationLines = [];
    if (layers.constellations) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = withAlpha(COLORS.constellationLine, dimScale);
      visibleLines = snapshot.constellationLines.filter(
        (seg) => isRoughlyInView(seg.from.azimuth, facingAzimuth) || isRoughlyInView(seg.to.azimuth, facingAzimuth),
      );
      visibleLines.forEach((seg) => {
        const from = project(seg.from.altitude, seg.from.azimuth, facingAzimuth, width, height);
        const to = project(seg.to.altitude, seg.to.azimuth, facingAzimuth, width, height);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });
    }

    // Sun, Moon and planets — always shown at full strength (unlike the
    // faint stars, these can be genuinely visible in a daylight sky too)
    // and always labelled, they're the whole reason someone opens this.
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (snapshot.sun.altitude >= -2 && isRoughlyInView(snapshot.sun.azimuth, facingAzimuth)) {
      const { x, y } = project(snapshot.sun.altitude, snapshot.sun.azimuth, facingAzimuth, width, height);
      const r = Math.max(6, width * 0.012);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.sun;
      ctx.fill();
      ctx.font = boldNameFont;
      ctx.fillStyle = COLORS.sun;
      if (placeLabel(x + r + 5, y, ctx.measureText("Sun").width, fontSize)) haloText(ctx, "Sun", x + r + 5, y);
    }

    if (isRoughlyInView(snapshot.moon.azimuth, facingAzimuth)) {
      const { x, y } = project(snapshot.moon.altitude, snapshot.moon.azimuth, facingAzimuth, width, height);
      const r = Math.max(5, width * 0.011);
      const waxing =
        snapshot.moon.phaseName.startsWith("Waxing") || snapshot.moon.phaseName === "First Quarter";
      drawMoon(ctx, x, y, r, snapshot.moon.illuminatedFraction, waxing);
      ctx.font = boldNameFont;
      ctx.fillStyle = "#f5f7fa";
      if (placeLabel(x + r + 6, y, ctx.measureText("Moon").width, fontSize)) haloText(ctx, "Moon", x + r + 6, y);
    }

    if (layers.planets) {
      snapshot.planets.forEach((planet) => {
        if (!isRoughlyInView(planet.azimuth, facingAzimuth)) return;
        const { x, y } = project(planet.altitude, planet.azimuth, facingAzimuth, width, height);
        const r = Math.max(3.5, width * 0.008);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.planet;
        ctx.fill();
        ctx.font = boldNameFont;
        ctx.fillStyle = COLORS.planet;
        if (placeLabel(x + r + 5, y, ctx.measureText(planet.name).width, fontSize)) {
          haloText(ctx, planet.name, x + r + 5, y);
        }
      });
    }

    // Deep-sky objects — bright teal, filled AND outlined squares (an
    // extended object, not a point source, hence the shape) so they read
    // as a genuinely different, eye-catching kind of target rather than a
    // faint background detail.
    if (layers.deepSky) {
      const visibleDeepSky = snapshot.deepSkyObjects
        .filter((o) => isRoughlyInView(o.azimuth, facingAzimuth))
        .sort((a, b) => a.magnitude - b.magnitude);
      visibleDeepSky.forEach((obj) => {
        const { x, y } = project(obj.altitude, obj.azimuth, facingAzimuth, width, height);
        const size = Math.max(5, Math.min(11, 12 - obj.magnitude)) * (width / 500);
        const opacity = Math.max(0.55, Math.min(1, (10 - obj.magnitude) / 5)) * dimScale;
        ctx.fillStyle = withAlpha(COLORS.deepSky, opacity * 0.3);
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        ctx.strokeStyle = withAlpha(COLORS.deepSky, opacity);
        ctx.lineWidth = 1.75;
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        ctx.font = boldNameFont;
        ctx.fillStyle = withAlpha(COLORS.deepSky, opacity);
        if (placeLabel(x + size / 2 + 5, y, ctx.measureText(obj.catalogId).width, fontSize)) {
          haloText(ctx, obj.catalogId, x + size / 2 + 5, y);
        }
      });
    }

    // Stars — brightest first, so a genuinely crowded patch keeps the
    // recognisable named stars and quietly drops the fainter ones' labels
    // rather than stacking text. The dot itself always draws regardless.
    // Both dots and labels fade together when it's too bright to actually
    // see them (see dimScale above) — real reinforcement of the "not
    // visible right now" message, not just a caption underneath.
    if (layers.stars) {
      const visibleStars = snapshot.stars
        .filter((s) => isRoughlyInView(s.azimuth, facingAzimuth))
        .sort((a, b) => a.magnitude - b.magnitude);
      const USEFUL_LABEL_MAG = 2.4;
      visibleStars.forEach((star) => {
        const { x, y } = project(star.altitude, star.azimuth, facingAzimuth, width, height);
        const radius = Math.max(1.6, (2.6 - star.magnitude) * 1.15);
        const opacity = Math.max(0.65, Math.min(1, (2.6 - star.magnitude) / 2.2)) * dimScale;
        // A faint glow beneath the star core reads as genuinely bright,
        // rather than a hard, flat little circle — the difference between
        // a photo of a star and a bullet point.
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 247, 250, ${opacity * 0.18})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 247, 250, ${opacity})`;
        ctx.fill();
        if (star.magnitude <= USEFUL_LABEL_MAG) {
          ctx.font = nameFont;
          const w = ctx.measureText(star.name).width;
          if (placeLabel(x + radius + 4, y, w, fontSize)) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.8, opacity)})`;
            haloText(ctx, star.name, x + radius + 4, y);
          }
        }
      });
    }

    // One label per visible constellation, at the average position of its
    // own currently-drawn points — lowest priority of anything on the map,
    // so it's the first to be dropped in a crowded region.
    if (layers.constellations) {
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
      ctx.font = `600 ${Math.max(10, width * 0.019)}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      groups.forEach((g, name) => {
        const label = name.toUpperCase();
        const x = g.x / g.n;
        const y = g.y / g.n;
        const w = ctx.measureText(label).width;
        if (placeLabel(x - w / 2, y, w, fontSize)) {
          ctx.fillStyle = withAlpha(COLORS.constellationLabel, dimScale);
          haloText(ctx, label, x, y);
        }
      });
    }
  }, [snapshot, width, facingAzimuth, nightMode, layers]);

  return (
    <div ref={containerRef} className="aspect-[4/3] w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ width, height: width * (ALT_RANGE / FOV_AZIMUTH), touchAction: "pan-y" }}
        className={isDragging ? "cursor-grabbing" : "cursor-grab"}
        role="img"
        aria-label={`Sky view facing ${Math.round(facingAzimuth)}°: ${snapshot.stars.length} stars, ${snapshot.planets.length} planet${snapshot.planets.length === 1 ? "" : "s"}, and the Moon (${snapshot.moon.phaseName}), looking out toward the horizon — drag to look around`}
      />
    </div>
  );
}

/** #rrggbb + an alpha fraction -> rgba(...) string. */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type RGB = [number, number, number];

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round) as RGB;
}

/** Always the same dark tones regardless of the real Sun position — Night
 * view's whole point is a legible view, not a brightness simulation. A
 * gentle zenith->horizon gradient keeps it from reading as a flat block
 * of colour, without ever competing with the star/line colours on top. */
function nightGradientColors(): [RGB, RGB] {
  return [
    [5, 6, 10], // zenith — void-950
    [12, 15, 26], // horizon — a touch of depth, still near-black
  ];
}

/**
 * Real daylight vs twilight vs night, read off the Sun's own altitude —
 * not decoration, this is what actually determines whether a real sky
 * looks black, orange, or blue at this exact moment, and how different
 * the zenith looks from the horizon at each stage (a flat single colour
 * doesn't capture a sunset at all; a real one is dramatically warmer low
 * down than it is overhead). Returns [zenith, horizon] to feed a gradient.
 */
const SKY_STOPS: { alt: number; zenith: RGB; horizon: RGB }[] = [
  { alt: -18, zenith: [5, 6, 10], horizon: [10, 12, 20] }, // astronomical night
  { alt: -10, zenith: [8, 10, 22], horizon: [22, 18, 34] }, // astronomical/nautical twilight
  { alt: -6, zenith: [16, 16, 38], horizon: [70, 38, 46] }, // nautical twilight — dusk hint
  { alt: -2, zenith: [28, 30, 62], horizon: [150, 78, 62] }, // civil twilight — real sunset warmth
  { alt: 0, zenith: [42, 60, 105], horizon: [235, 150, 95] }, // Sun right on the horizon
  { alt: 6, zenith: [48, 100, 175], horizon: [200, 210, 225] }, // early/late day haze
  { alt: 20, zenith: [42, 115, 195], horizon: [200, 220, 238] }, // full daylight
];

function skyGradientColors(sunAltitude: number): [RGB, RGB] {
  const first = SKY_STOPS[0];
  const last = SKY_STOPS[SKY_STOPS.length - 1];
  if (sunAltitude <= first.alt) return [first.zenith, first.horizon];
  if (sunAltitude >= last.alt) return [last.zenith, last.horizon];
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (sunAltitude >= a.alt && sunAltitude <= b.alt) {
      const t = (sunAltitude - a.alt) / (b.alt - a.alt);
      return [mix(a.zenith, b.zenith, t), mix(a.horizon, b.horizon, t)];
    }
  }
  return [first.zenith, first.horizon];
}
