import Link from "next/link";
import { NAV_LINKS, LEGAL_LINKS } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/sanity.queries";

export default async function Footer() {
  const settings = await getSiteSettings().catch(() => null);
  const siteName = settings?.siteName ?? "Astromar";
  const tagline =
    settings?.tagline ?? "Backyard deep-sky imaging with a Seestar S50.";

  return (
    <footer className="border-t border-void-700 bg-void-900/40">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold text-gradient-nebula">
              {siteName}
            </p>
            <p className="mt-2 max-w-xs text-sm text-star-500">{tagline}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-star-500">
              Explore
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-star-300 hover:text-nebula-teal-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            {settings?.socialLinks && settings.socialLinks.length > 0 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wider text-star-500">
                  Elsewhere
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {settings.socialLinks.map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-star-300 hover:text-nebula-rose-400"
                      >
                        {social.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-void-700 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-star-500">
            © {new Date().getFullYear()} {siteName}. All photos are the author&apos;s own.
          </p>
          <ul className="flex gap-4">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs text-star-500 hover:text-star-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
