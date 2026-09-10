import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Served to Prodigi at order time (see stripe-webhook's placeProdigiOrder,
// which passes this route's own URL as branding.postcard) — Prodigi's
// servers fetch this URL once per order and print whatever it returns, so
// it must always resolve to a real, valid, print-ready image with no auth
// gate. Generated rather than a static asset so the wording (the climate/
// profit-use line especially) stays a one-line code edit, not a re-export
// from a design tool.
//
// A6 at 300dpi: 105x148mm = 4.134x5.827in -> 1240x1748px. Matches Prodigi's
// own real minimum-resolution guidance for a postcard-sized insert; no
// photographic detail here, so 300dpi is comfortably more than this
// text-and-line-art design actually needs.
const WIDTH = 1240;
const HEIGHT = 1748;

// Same six-figure hex values as app/globals.css's --color-* tokens — Satori
// (which ImageResponse renders through) can't read Tailwind/CSS custom
// properties, so these are re-declared here rather than imported.
const VOID_950 = "#05060a";
const VOID_700 = "#1b1e2c";
const STAR_100 = "#f5f7fa";
const STAR_300 = "#c7cbd9";
const STAR_500 = "#8a90a6";
const NEBULA_ROSE_400 = "#e2543f";
const NEBULA_TEAL_400 = "#6fdcec";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: VOID_950,
          padding: "140px 110px",
        }}
      >
        {/* Logo mark — same paths as components/Logo.tsx, redrawn here since
            Satori renders its own tree rather than importing React
            components that use next/image or browser-only APIs. */}
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 12 C 18 12 3 30 3 50 C 3 70 18 88 50 88 C 28 88 22 70 22 50 C 22 30 28 12 50 12 Z"
            stroke={NEBULA_TEAL_400}
            strokeWidth="3.5"
          />
          <circle cx="60" cy="50" r="15" stroke={NEBULA_TEAL_400} strokeWidth="3.5" />
          <circle cx="60" cy="50" r="6.5" stroke={NEBULA_TEAL_400} strokeWidth="2.5" />
          <path
            d="M75 39 L91 32 L91 68 L75 61 Z"
            stroke={NEBULA_TEAL_400}
            strokeWidth="3.5"
          />
        </svg>

        <div
          style={{
            marginTop: 36,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 6,
            color: STAR_100,
            textTransform: "uppercase",
          }}
        >
          Astromar
        </div>

        <div
          style={{
            marginTop: 64,
            width: 90,
            height: 3,
            backgroundColor: NEBULA_ROSE_400,
          }}
        />

        <div
          style={{
            marginTop: 64,
            fontSize: 52,
            fontWeight: 700,
            color: STAR_100,
            textAlign: "center",
            lineHeight: 1.25,
          }}
        >
          Thank you for your order
        </div>

        <div
          style={{
            marginTop: 48,
            fontSize: 32,
            color: STAR_300,
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 880,
          }}
        >
          This print was made just for you.
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 30,
            color: STAR_300,
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 880,
          }}
        >
          1% of this sale goes to carbon removal via Stripe Climate. The rest goes straight back
          into this site — new gear to review, and more nights under the stars.
        </div>

        <div
          style={{
            marginTop: 80,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: 60, height: 1, backgroundColor: VOID_700 }} />
          <div
            style={{
              marginTop: 40,
              fontSize: 30,
              fontStyle: "italic",
              color: STAR_100,
            }}
          >
            — Martyn, Astromar
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 22,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: STAR_500,
            }}
          >
            astromar.co.uk
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      // This route is public and unauthenticated (Prodigi's servers fetch
      // it with no key), and every response is byte-for-byte identical
      // until the next deploy. Let the CDN serve it so a flood of requests
      // can't rack up Satori render time on the origin — the image only
      // needs to be fresh within a day of a copy edit.
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    },
  );
}
