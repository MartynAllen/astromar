"use client";

import { useEffect, useRef } from "react";
import type { ObjectVisibility } from "@/lib/astro/visibility";

const COLORS = {
  bg: "#0a0c14",
  ring: "#1b1e2c",
  ringUseful: "#262a3b",
  compass: "#8a90a6",
  star: "#8fb2f5", // nebula-indigo-400 — Calendar's section accent
  starActive: "#f5f7fa",
};

const SIZE = 240;
const USEFUL_ALTITUDE = 25;

function polarPoint(altitude: number, azimuth: number, center: number, maxRadius: number) {
  const r = ((90 - altitude) / 90) * maxRadius;
  const angle = (azimuth - 90) * (Math.PI / 180);
  return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r };
}

export default function SkyChart({
  objects,
  activeId,
}: {
  objects: ObjectVisibility[];
  activeId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const center = SIZE / 2;
    const maxRadius = center - 22;

    ctx.beginPath();
    ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();

    [0, USEFUL_ALTITUDE, 50, 75].forEach((alt) => {
      const r = ((90 - alt) / 90) * maxRadius;
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.strokeStyle = alt === USEFUL_ALTITUDE ? COLORS.ringUseful : COLORS.ring;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = COLORS.compass;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ([["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const).forEach(([label, az]) => {
      const { x, y } = polarPoint(-4, az, center, maxRadius + 12);
      ctx.fillText(label, x, y);
    });

    objects.forEach((v) => {
      const { x, y } = polarPoint(v.altitude, v.azimuth, center, maxRadius);
      const isActive = v.object.id === activeId;
      ctx.beginPath();
      ctx.arc(x, y, isActive ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? COLORS.starActive : COLORS.star;
      ctx.fill();
      if (isActive) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.star;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [objects, activeId]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={`Sky chart: ${objects.length} object${objects.length === 1 ? "" : "s"} above ${USEFUL_ALTITUDE}°, positioned by compass direction and altitude, zenith at centre`}
      />
      <p className="mt-2 font-mono text-xs text-star-500">
        Zenith at centre · horizon at edge
      </p>
    </div>
  );
}
