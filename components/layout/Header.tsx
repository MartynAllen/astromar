import Link from "next/link";
import { NAV_LINKS } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/sanity.queries";
import { isSafeHref } from "@/lib/safeUrl";
import Logo from "@/components/Logo";
import MobileNav from "./MobileNav";

export default async function Header() {
  const settings = await getSiteSettings().catch(() => null);
  // shopUrl is a free-text Studio field, not URL-typed — isSafeHref rules
  // out a stored javascript:/data: scheme executing on click.
  const rawShopUrl = settings?.shopUrl;
  const shopUrl = isSafeHref(rawShopUrl) ? rawShopUrl : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-void-700 bg-void-950/85 backdrop-blur">
      <div className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 text-nebula-teal-400">
          <Logo className="h-8 w-8" />
          <span className="font-mono text-[22px] font-bold uppercase tracking-[0.15em] text-star-100">
            Astromar
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <nav className="hidden md:block">
            <ul className="flex items-center divide-x divide-void-700">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="px-4 lg:px-5">
                  <Link
                    href={link.href}
                    className="font-mono text-xs uppercase tracking-widest text-star-500 transition-colors hover:text-nebula-teal-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {shopUrl && (
            <Link
              href={shopUrl}
              className="hidden items-center gap-2 border border-nebula-rose-400 px-4 py-2 font-mono text-xs uppercase tracking-widest text-nebula-rose-400 transition-colors hover:bg-nebula-rose-400 hover:text-void-950 md:inline-flex"
            >
              Shop Prints
            </Link>
          )}

          <MobileNav shopUrl={shopUrl} />
        </div>
      </div>
    </header>
  );
}
