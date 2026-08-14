"use client";

import { useEffect, useRef } from "react";
import { starsAboveHorizon } from "@/lib/astro/starPositions";

const MIN_ALT = -5;
const MAX_ALT = 90;

/**
 * The real night sky as it stood at this exact photo's capture time —
 * not decoration, a genuine (if approximate) reconstruction using the
 * same astronomy-engine positions the visibility finder relies on.
 * Sits behind the lightbox content as atmosphere, not as data to read.
 */
export default function SkyBackdrop({ captureDate }: { captureDate?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!captureDate) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const stars = starsAboveHorizon(new Date(captureDate), MIN_ALT);

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);

      for (const { star, altitude, azimuth } of stars) {
        const x = (azimuth / 360) * width;
        const norm = (altitude - MIN_ALT) / (MAX_ALT - MIN_ALT);
        const y = height * (1 - norm);
        const size = Math.max(0.6, (2.6 - star.magnitude) * 0.5);
        const opacity = Math.max(0.12, Math.min(0.85, (2.6 - star.magnitude) / 4));
        ctx!.beginPath();
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 247, 250, ${opacity})`;
        ctx!.fill();
      }
    }

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [captureDate]);

  if (!captureDate) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full opacity-50"
    />
  );
}
