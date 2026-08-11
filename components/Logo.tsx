interface LogoProps {
  className?: string;
}

/**
 * Recreated from the source logo (a faceted crescent moon wrapped around a
 * camera-aperture glyph) as inline SVG rather than a raster asset — stays
 * crisp at any size and always matches the current accent color via
 * currentColor.
 */
export default function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Faceted crescent */}
      <path
        d="M50 12 C 18 12 3 30 3 50 C 3 70 18 88 50 88 C 28 88 22 70 22 50 C 22 30 28 12 50 12 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 12 L22 50 M50 88 L22 50 M8 32 L22 50 M8 68 L22 50 M50 12 C 34 22 26 36 26 50 M50 88 C 34 78 26 64 26 50"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Camera / aperture, nested in the crescent's opening */}
      <circle cx="60" cy="50" r="15" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="50" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M75 39 L91 32 L91 68 L75 61 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
