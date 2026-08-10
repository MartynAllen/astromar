export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/gallery", label: "Gallery" },
  { href: "/reviews", label: "Reviews" },
  { href: "/discussions", label: "Discussion" },
  { href: "/guide", label: "Guide" },
  { href: "/calendar", label: "Calendar" },
  { href: "/about", label: "About" },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: "/disclosure", label: "Affiliate Disclosure" },
  { href: "/privacy", label: "Privacy" },
];
