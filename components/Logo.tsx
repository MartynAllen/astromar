interface LogoProps {
  className?: string;
}

/**
 * A faceted crescent moon wrapped around a camera-aperture glyph, as inline
 * SVG — stays crisp at any size and always matches the current accent color
 * via currentColor. Simplified from an earlier version that carried a fine
 * crosshatch of facet lines (strokeWidth 1.25, 80% opacity): at the icon's
 * actual display size (28-48px) those thin strokes just muddied into a grey
 * smear rather than reading as facets, so they were dropped and the two
 * remaining shapes' strokes bolded to pair with the header's bold mono
 * wordmark instead of looking thin next to it.
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
      {/* Crescent */}
      <path
        d="M50 12 C 18 12 3 30 3 50 C 3 70 18 88 50 88 C 28 88 22 70 22 50 C 22 30 28 12 50 12 Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Camera / aperture, nested in the crescent's opening */}
      <circle cx="60" cy="50" r="15" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="60" cy="50" r="6.5" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M75 39 L91 32 L91 68 L75 61 Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
