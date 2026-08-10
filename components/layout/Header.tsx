import Link from "next/link";
import { NAV_LINKS } from "@/lib/navigation";
import MobileNav from "./MobileNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-void-700 bg-void-950/80 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-gradient-nebula"
        >
          Astromar
        </Link>

        <nav className="hidden sm:block">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-star-300 transition-colors hover:text-nebula-teal-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
