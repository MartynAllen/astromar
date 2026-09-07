"use client";

import { useEffect, useRef, useState } from "react";
import type { SkySnapshot } from "@/lib/astro/skyMapPositions";

const COLORS = {
  ring: "#262a3b", // void-600
  compass: "#8a90a6", // star-500
  constellationLine: "rgba(143, 178, 245, 0.32)", // nebula-indigo-400 at low opacity
  constellationLabel: "rgba(143, 178, 245, 0.55)",
  star: "#f5f7fa", // star-100
  planet: "#f0c26f", // nebula-amber-400
  moonBase: "#e8eaf0",
  moonShadow: "#05060a",
  moonEdge: "#565b6e",
  sun: "#e2543f", // nebula-rose-400
};

const USEFUL_LABEL_MAG = 1.6; // only label the genuinely bright, recognisable stars

/** Same azimuthal projection as the Calendar's SkyChart (zenith at centre,
 * horizon at the edge) — this map is the larger, richer version of the
 * same idea, so it deliberately reuses the identical math. */
function polarPoint(altitude: number, azimuth: number, center: number, maxRadius: number) {
  const r = ((90 - altitude) / 90) * maxRadius;
  const angle = (azimuth - 90) * (Math.PI / 180);
  return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r };
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

export default function SkyMapCanvas({ snapshot }: { snapshot: SkySnapshot }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Measured from the wrapping div's own width rather than a fixed pixel
  // prop — a hardcoded size here would either overflow a narrow phone
  // screen or stay needlessly small on a wide one. aspect-square on that
  // div (below) keeps it square at whatever width it's actually given.
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setSize(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !size) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const maxRadius = center - size * 0.06;

    // Sky dome background + horizon ring.
    ctx.beginPath();
    ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
    ctx.fillStyle = skyBackgroundColor(snapshot.sun.altitude);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COLORS.ring;
    ctx.stroke();

    // Altitude rings at 30°/60°, purely as gentle depth cues.
    [30, 60].forEach((alt) => {
      const r = ((90 - alt) / 90) * maxRadius;
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.ring;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.font = `${Math.max(10, size * 0.028)}px ui-monospace, monospace`;
    ctx.fillStyle = COLORS.compass;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ([["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const).forEach(([label, az]) => {
      const { x, y } = polarPoint(-2, az, center, maxRadius + size * 0.035);
      ctx.fillText(label, x, y);
    });

    // Constellation lines, drawn before stars so star dots sit on top.
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.constellationLine;
    snapshot.constellationLines.forEach((seg) => {
      const from = polarPoint(seg.from.altitude, seg.from.azimuth, center, maxRadius);
      const to = polarPoint(seg.to.altitude, seg.to.azimuth, center, maxRadius);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    // One faint label per constellation, at the average position of its
    // currently-visible points — moves night to night as the sky turns,
    // same as the shape itself.
    const groups = new Map<string, { x: number; y: number; n: number }>();
    snapshot.constellationLines.forEach((seg) => {
      for (const star of [seg.from, seg.to]) {
        const p = polarPoint(star.altitude, star.azimuth, center, maxRadius);
        const g = groups.get(seg.constellation) ?? { x: 0, y: 0, n: 0 };
        g.x += p.x;
        g.y += p.y;
        g.n += 1;
        groups.set(seg.constellation, g);
      }
    });
    ctx.font = `${Math.max(9, size * 0.022)}px ui-monospace, monospace`;
    ctx.fillStyle = COLORS.constellationLabel;
    groups.forEach((g, name) => {
      ctx.fillText(name.toUpperCase(), g.x / g.n, g.y / g.n);
    });

    // Stars — size/opacity by magnitude, same formula as the lightbox's
    // own real-sky reconstruction (SkyBackdrop.tsx), scaled up a little
    // since this canvas is the main attraction rather than ambient texture.
    snapshot.stars.forEach((star) => {
      const { x, y } = polarPoint(star.altitude, star.azimuth, center, maxRadius);
      const radius = Math.max(0.9, (2.6 - star.magnitude) * 0.7);
      const opacity = Math.max(0.25, Math.min(1, (2.6 - star.magnitude) / 3.5));
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 247, 250, ${opacity})`;
      ctx.fill();
      if (star.magnitude <= USEFUL_LABEL_MAG) {
        ctx.font = `${Math.max(9, size * 0.02)}px ui-monospace, monospace`;
        ctx.fillStyle = "rgba(199, 203, 217, 0.75)"; // star-300
        ctx.textAlign = "left";
        ctx.fillText(star.name, x + radius + 4, y);
      }
    });

    // Planets.
    snapshot.planets.forEach((planet) => {
      const { x, y } = polarPoint(planet.altitude, planet.azimuth, center, maxRadius);
      const radius = Math.max(2.5, size * 0.008);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.planet;
      ctx.fill();
      ctx.font = `${Math.max(10, size * 0.024)}px ui-monospace, monospace`;
      ctx.fillStyle = COLORS.planet;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(planet.name, x + radius + 5, y);
    });

    // Moon.
    if (snapshot.moon.altitude >= -2) {
      const { x, y } = polarPoint(snapshot.moon.altitude, snapshot.moon.azimuth, center, maxRadius);
      const radius = Math.max(5, size * 0.018);
      const waxing =
        snapshot.moon.phaseName.startsWith("Waxing") || snapshot.moon.phaseName === "First Quarter";
      drawMoon(ctx, x, y, radius, snapshot.moon.illuminatedFraction, waxing);
      ctx.font = `${Math.max(10, size * 0.024)}px ui-monospace, monospace`;
      ctx.fillStyle = "#c7cbd9";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Moon", x + radius + 6, y);
    }

    // Sun — only when it's actually above the horizon.
    if (snapshot.sun.altitude >= -2) {
      const { x, y } = polarPoint(snapshot.sun.altitude, snapshot.sun.azimuth, center, maxRadius);
      const radius = Math.max(6, size * 0.02);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.sun;
      ctx.fill();
      ctx.font = `${Math.max(10, size * 0.024)}px ui-monospace, monospace`;
      ctx.fillStyle = COLORS.sun;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Sun", x + radius + 6, y);
    }
  }, [snapshot, size]);

  return (
    <div ref={containerRef} className="aspect-square w-full">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Sky map: ${snapshot.stars.length} stars, ${snapshot.constellationLines.length > 0 ? "with constellation lines," : ""} ${snapshot.planets.length} planet${snapshot.planets.length === 1 ? "" : "s"}, and the Moon (${snapshot.moon.phaseName}) positioned by compass direction and altitude, zenith at centre`}
      />
    </div>
  );
}
