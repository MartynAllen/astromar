import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShutterIntro from "@/components/ShutterIntro";
import JsonLd from "@/components/seo/JsonLd";
import { getSiteSettings } from "@/lib/sanity.queries";
import { personJsonLd, websiteJsonLd } from "@/lib/seo";
import { isSafeHref } from "@/lib/safeUrl";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Same free-text-field caveat as Footer's own social links: Studio's
  // socialLinks.url isn't a URL-typed field, so it's filtered the same way
  // before it goes anywhere near output, JSON-LD included.
  const settings = await getSiteSettings().catch(() => null);
  const sameAs = (settings?.socialLinks ?? [])
    .map((social) => social.url)
    .filter(isSafeHref);

  return (
    <>
      <JsonLd data={personJsonLd({ sameAs })} />
      <JsonLd data={websiteJsonLd()} />
      <ShutterIntro />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
