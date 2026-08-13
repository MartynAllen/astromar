import type { Metadata } from "next";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "How Astromar uses affiliate links.",
};

export default function DisclosurePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "Affiliate Disclosure", path: "/disclosure" }]} />
      <h1 className="font-display text-4xl text-star-100">Affiliate Disclosure</h1>

      <div className="mt-8 space-y-4 text-star-300">
        <p>
          Astromar is a participant in the Amazon EU Associates Programme, an affiliate
          advertising programme designed to provide a means for sites to earn advertising
          fees by advertising and linking to Amazon.co.uk. As an Amazon Associate, Astromar
          earns from qualifying purchases.
        </p>
        <p>
          In practice: some links on the Reviews and About/Gear pages point to Amazon or
          other retailers. If you buy something after clicking one of those links, Astromar
          may earn a small commission — at no extra cost to you.
        </p>
        <p>
          This never affects what gets reviewed or how. Every piece of gear covered here has
          actually been used to make the photos in the gallery, and the opinions are unpaid
          and unedited by any retailer or manufacturer.
        </p>
        <p>
          Any page that carries an affiliate link shows a short disclosure banner linking
          back to this page.
        </p>
      </div>
    </div>
  );
}
