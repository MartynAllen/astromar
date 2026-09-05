import type { NextConfig } from "next";

// Applies everywhere, including /studio — none of these break Sanity Studio,
// unlike a strict script-src/connect-src would.
const BASELINE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation stays same-origin-only rather than fully off: the calendar's
  // sky visibility finder genuinely calls navigator.geolocation for "use my
  // location". Camera/mic are unused anywhere on the site.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Scoped to the public site only. Sanity Studio (/studio) is a large
// interactive app that needs a much more permissive policy for its own
// bundler/plugins/realtime connections — Sanity's own auth gates who can
// actually read or write data there regardless of this header, so it's
// left alone rather than fighting it with a policy tuned for static pages.
const PUBLIC_SITE_CSP = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io data:",
  "media-src 'self' https://cdn.sanity.io",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    loader: "custom",
    loaderFile: "./lib/sanityLoader.ts",
  },
  async redirects() {
    // The Guide section was renamed to Learn (to make room for conceptual
    // explainer posts alongside the existing how-to guides) — this keeps
    // any indexed/bookmarked /guide links working rather than 404ing.
    return [{ source: "/guide/:path*", destination: "/learn/:path*", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/((?!studio).*)",
        headers: [
          ...BASELINE_SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: PUBLIC_SITE_CSP },
        ],
      },
      {
        source: "/studio/:path*",
        headers: BASELINE_SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
