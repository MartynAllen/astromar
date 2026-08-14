import Link from "next/link";
import { NAV_LINKS, LEGAL_LINKS, SUPPORT_URL } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/sanity.queries";

export default async function Footer() {
  const settings = await getSiteSettings().catch(() => null);
  const siteName = settings?.siteName ?? "Astromar";
  const tagline = settings?.tagline ?? "Astronomy and astrophotography from a garden setup.";
  const hasSocial = Boolean(settings?.socialLinks && settings.socialLinks.length > 0);

  return (
    <footer className="border-t border-void-700 bg-void-900/40">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div
          className={
            hasSocial
              ? "grid gap-10 sm:grid-cols-3 sm:divide-x sm:divide-void-700"
              : "grid gap-10 sm:grid-cols-2 sm:divide-x sm:divide-void-700"
          }
        >
          <div className="sm:pr-8">
            <p className="font-display text-2xl italic text-star-100">{siteName}</p>
            <p className="mt-2 max-w-xs text-sm text-star-500">{tagline}</p>
            <p className="mt-3 max-w-xs text-sm text-star-500">
              Enjoying the photos?{" "}
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nebula-teal-400 hover:text-nebula-teal-300 hover:underline"
              >
                Buy me a coffee →
              </a>
            </p>
          </div>

          <div className="sm:px-8">
            <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
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

          {hasSocial && (
            <div className="sm:pl-8">
              <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
                Elsewhere
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {settings!.socialLinks!.map((social) => (
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
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-void-700 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-star-700">
            © {new Date().getFullYear()} {siteName} — all photos are the author&apos;s own.
          </p>
          <ul className="flex gap-4">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-mono text-xs text-star-700 hover:text-star-300"
                >
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
