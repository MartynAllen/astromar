import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getShopSettings, hasActiveShopProducts } from "@/lib/sanity.queries";
import { formatGBP } from "@/lib/shop/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "How print orders and shop orders are fulfilled, shipped, returned, and handled if something's wrong.",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">{children}</h2>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">{children}</p>
  );
}

export default async function ShippingReturnsPage() {
  const shopLive = await hasActiveShopProducts().catch(() => false);
  const settings = shopLive ? await getShopSettings().catch(() => null) : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "Shipping & Returns", path: "/shipping-returns" }]} />
      <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">
        Shipping &amp; Returns
      </h1>
      <p className="mt-2 text-star-500">
        {shopLive
          ? "For photo prints and for the 3D-printed items in the shop."
          : "For print orders bought through the site."}
      </p>

      <div className="mt-8 space-y-6 text-star-300">
        {shopLive && <GroupLabel>Photo prints</GroupLabel>}

        <section>
          <SectionHeading>Fulfilment</SectionHeading>
          <p className="mt-2">
            Prints are made to order through Prodigi, a print-on-demand company — Astromar
            doesn&apos;t hold stock or handle the printing itself. Your order goes straight from
            checkout to their production queue.
          </p>
        </section>

        <section>
          <SectionHeading>Production &amp; delivery times</SectionHeading>
          <p className="mt-2">
            Prodigi&apos;s own turnaround is 24–72 hours to produce most prints at their UK lab —
            occasionally up to a week for more complex framed or canvas pieces. Standard UK
            shipping typically adds another 2–3 working days on top. All in, allow{" "}
            <strong className="text-star-100">3–7 working days</strong> from order to delivery.
            Shipping is currently UK-only.
          </p>
        </section>

        <section>
          <SectionHeading>Cancellations</SectionHeading>
          <p className="mt-2">
            Every print is made specifically for your order, and production usually starts
            within hours of checkout — so{" "}
            <Link href="/contact" className="text-nebula-teal-400 hover:underline">
              get in touch
            </Link>{" "}
            as soon as possible if you need to cancel. If production hasn&apos;t started yet,
            it&apos;s usually no problem; once it has, we may not be able to stop or refund it.
          </p>
        </section>

        <section>
          <SectionHeading>If something arrives damaged or wrong</SectionHeading>
          <p className="mt-2">
            <Link href="/contact" className="text-nebula-teal-400 hover:underline">
              Get in touch
            </Link>{" "}
            and it&apos;ll be sorted — a replacement or refund, whichever&apos;s right for what
            went wrong.
          </p>
        </section>

        {shopLive && (
          <>
            <div className="border-t border-void-700 pt-6">
              <GroupLabel>Shop items (3D-printed)</GroupLabel>
            </div>

            <section>
              <SectionHeading>Who makes and posts them</SectionHeading>
              <p className="mt-2">
                Shop items are printed and posted by me, from the UK. Some are printed in advance
                and kept in stock; others are printed after you order — each product page says
                which, and how long to allow.
              </p>
            </section>

            <section>
              <SectionHeading>Postage</SectionHeading>
              <p className="mt-2">
                {settings
                  ? `UK postage is a flat ${formatGBP(settings.flatShippingPence)}${
                      settings.freeShippingThresholdPence
                        ? `, and free on orders over ${formatGBP(settings.freeShippingThresholdPence)}`
                        : ""
                    }.`
                  : "UK postage is charged at checkout."}{" "}
                Shop orders go to UK addresses only for now. Everything in an order is posted
                together, so the dispatch time shown at checkout is that of the slowest item in
                it. &ldquo;Dispatch&rdquo; means posted — how long it then takes to arrive
                depends on the postal service.
              </p>
            </section>

            <section>
              <SectionHeading>Changing your mind</SectionHeading>
              <p className="mt-2">
                You can cancel an order and return the items within 14 days of them arriving —
                just{" "}
                <Link href="/contact" className="text-nebula-teal-400 hover:underline">
                  tell me
                </Link>{" "}
                within that time, then send them back within a further 14 days. I&apos;ll refund
                what you paid for the items, and the standard postage you paid, within 14 days of
                getting them back. You&apos;d pay the postage for sending them back to me, and
                they should come back in the condition you received them.
              </p>
            </section>

            <section>
              <SectionHeading>If something arrives damaged or isn&apos;t right</SectionHeading>
              <p className="mt-2">
                <Link href="/contact" className="text-nebula-teal-400 hover:underline">
                  Get in touch
                </Link>{" "}
                as soon as you can — a photo helps — and I&apos;ll put it right with a
                replacement or a refund, and cover the postage for sending it back.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
