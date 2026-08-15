import Link from "next/link";
import { NAV_LINKS } from "@/lib/navigation";
import Logo from "@/components/Logo";
import MobileNav from "./MobileNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-void-700 bg-void-950/85 backdrop-blur">
      <div className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-nebula-teal-400">
          <Logo className="h-6 w-6" />
          <span className="font-display text-2xl tracking-tight text-star-100">
            Astromar
          </span>
        </Link>

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

        <MobileNav />
      </div>
    </header>
  );
}
