interface CategoryIconProps {
  // Despite the prop name (kept for backwards compat with plain category
  // values), this also accepts the more specific icon keys from
  // gearItem.icon — see the icon field's option list in gearItem.ts.
  category: string;
  className?: string;
}

const COG_TEETH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function CategoryIcon({
  category,
  className,
}: CategoryIconProps) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
  };

  if (category === "camera") {
    return (
      <svg {...props}>
        <rect
          x="3"
          y="7.5"
          width="18"
          height="12.5"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="8.5"
          y="4"
          width="6"
          height="3"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="12"
          cy="13.5"
          r="3.75"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (category === "telescope") {
    return (
      <svg {...props}>
        <line
          x1="6"
          y1="19"
          x2="17"
          y2="6"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="17" cy="6" r="1.75" fill="currentColor" />
        <path
          d="M10.5 14.5 L4 20 M10.5 14.5 L7.5 21 M10.5 14.5 L4.5 15.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (category === "guidescope") {
    // A smaller, unadorned version of the telescope tube below (thinner
    // stroke, no tripod — a guide scope clamps onto the main rig rather
    // than standing on its own) plus a mounting ring around its middle,
    // so it reads as "related to the telescope icon, but its own thing"
    // rather than an unrelated glyph.
    return (
      <svg {...props}>
        <line
          x1="6"
          y1="18"
          x2="16"
          y2="6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="6" r="1.4" fill="currentColor" />
        <circle cx="10" cy="13.5" r="2.75" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    );
  }

  if (category === "mount") {
    // Tripod + a tilted polar axis ending in a counterweight ball —
    // distinct from the telescope icon's thick diagonal tube.
    return (
      <svg {...props}>
        <path
          d="M12 10 L5 20 M12 10 L19 20 M12 10 L12 20.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="10" r="1.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 10 L17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18.4" cy="3.6" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (category === "controller") {
    // A small device body with wifi arcs above it — the ASIAIR is
    // literally a wireless imaging controller.
    return (
      <svg {...props}>
        <rect x="6" y="13" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
        <path d="M8.5 10.5a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 8a8 8 0 0 1 11 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (category === "battery") {
    // Battery body + terminal nub + a lightning bolt — for the catch-all
    // power/cabling tile.
    return (
      <svg {...props}>
        <rect x="4" y="8" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="18.5" y="11" width="2" height="3" rx="0.5" fill="currentColor" />
        <path d="M11.5 10.5 L9 13.5 h2.2 L9.8 16.5 L14 12.5 h-2.2 Z" fill="currentColor" />
      </svg>
    );
  }

  if (category === "software") {
    return (
      <svg {...props}>
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="12"
          cy="12"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // accessory — a simple cog, built from rotated teeth around a ring
  return (
    <svg {...props}>
      <circle
        cx="12"
        cy="12"
        r="4.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      {COG_TEETH_ANGLES.map((angle) => (
        <rect
          key={angle}
          x="10.9"
          y="1.8"
          width="2.2"
          height="3"
          rx="0.6"
          fill="currentColor"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  );
}
