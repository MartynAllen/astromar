interface CategoryIconProps {
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
