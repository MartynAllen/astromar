export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/gallery", label: "Gallery" },
  { href: "/reviews", label: "Reviews" },
  { href: "/guide", label: "Guide" },
  { href: "/calendar", label: "Calendar" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: "/disclosure", label: "Affiliate Disclosure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/contact", label: "Contact" },
];

export const SUPPORT_URL = "https://buymeacoffee.com/astromar";
