export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/gallery", label: "Gallery" },
  { href: "/reviews", label: "Reviews" },
  { href: "/learn", label: "Learn" },
  { href: "/calendar", label: "Calendar" },
  { href: "/research", label: "Workshop" },
  { href: "/about", label: "About" },
];

export const SHOP_LINK: NavLink = { href: "/shop", label: "Shop" };

/**
 * The nav, with Shop slotted in before About once the shop has something
 * for sale (see hasActiveShopProducts). Until then it's the original list.
 */
export function navLinks(shopLive: boolean): NavLink[] {
  if (!shopLive) return NAV_LINKS;
  return [...NAV_LINKS.slice(0, -1), SHOP_LINK, NAV_LINKS[NAV_LINKS.length - 1]];
}

/**
 * Once there's a "Shop" in the nav, a second "Shop Prints" beside it reads
 * as a duplicate — so the photo-prints button drops the word.
 */
export function printsButtonLabel(shopLive: boolean): string {
  return shopLive ? "Prints" : "Shop Prints";
}

export const LEGAL_LINKS: NavLink[] = [
  { href: "/disclosure", label: "Affiliate Disclosure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/contact", label: "Contact" },
];

export const SUPPORT_URL = "https://buymeacoffee.com/astromar";
