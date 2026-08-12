import type { Metadata } from "next";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Astromar collects and why.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="font-display text-3xl font-semibold text-star-100">Privacy</h1>
      <p className="mt-2 text-star-500">Kept short, because there isn&apos;t much to say.</p>

      <div className="mt-8 space-y-6 text-star-300">
        <section>
          <h2 className="font-display text-lg font-semibold text-star-100">Analytics</h2>
          <p className="mt-2">
            Astromar uses Vercel Web Analytics to see roughly how many people visit and which
            pages they read. It&apos;s cookieless and doesn&apos;t track you individually or
            across other sites — nothing personally identifying is collected, so there&apos;s
            no cookie banner.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-star-100">Affiliate links</h2>
          <p className="mt-2">
            Some pages link out to Amazon and other retailers (see the{" "}
            <a href="/disclosure" className="text-nebula-teal-400 hover:underline">
              affiliate disclosure
            </a>
            ). Once you click through, that retailer&apos;s own cookies and tracking apply —
            not Astromar&apos;s, since none are set here.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-star-100">Contact</h2>
          <p className="mt-2">
            Questions about any of this can be raised via the social links in the footer.
          </p>
        </section>
      </div>
    </div>
  );
}
