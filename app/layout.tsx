import type { Metadata } from "next";
import { Instrument_Serif, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

// Single-weight display serif, engraved-instrument-plate feel — hierarchy
// comes from size and the italic cut, not font-weight (it has none to lean on).
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: "400",
  subsets: ["latin"],
});

// 700 loaded solely for the "Astromar" wordmark — everywhere else mono
// stays regular weight, so the one bold instance reads as the brand mark,
// not just another label.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Astromar",
    template: "%s — Astromar",
  },
  description:
    "Deep-sky photography, gear reviews, and beginner's notes from a garden observer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
