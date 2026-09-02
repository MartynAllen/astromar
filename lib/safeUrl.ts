// Guards against a `javascript:`/`data:`/`vbscript:` URI stored in any
// editor-supplied link (affiliate links, social links, 3D-print accessory
// links, rich-text link marks) from executing when a visitor clicks it.
// Sanity Studio's own auth is the real gate on who can write these fields,
// but a stored script-scheme href would still run in a visitor's browser
// on click, whether from a compromised editor account or just an
// accidental paste of the wrong thing — cheap enough to guard regardless.
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

export function isSafeHref(href: string | null | undefined): boolean {
  if (!href) return false;
  // A relative path or in-page anchor ("/gallery", "#section") has no
  // scheme to abuse — safe without needing a full URL parse.
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    return SAFE_SCHEMES.has(new URL(href).protocol);
  } catch {
    return false;
  }
}
