import type { Metadata } from "next";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "How print orders are fulfilled, shipped, and handled if something's wrong.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Breadcrumbs items={[{ name: "Shipping & Returns", path: "/shipping-returns" }]} />
      <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">
        Shipping &amp; Returns
      </h1>
      <p className="mt-2 text-star-500">For print orders bought through the site.</p>

      <div className="mt-8 space-y-6 text-star-300">
        <section>
          <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">Fulfilment</h2>
          <p className="mt-2">
            Prints are made to order through Prodigi, a print-on-demand company — Astromar
            doesn&apos;t hold stock or handle the printing itself. Your order goes straight from
            checkout to their production queue.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">
            Production &amp; delivery times
          </h2>
          {/* TODO (Martyn): replace with real figures once confirmed — either
              Prodigi's own published SLA for the products offered, or your
              own observed turnaround. Don't publish a guess. */}
          <p className="mt-2">
            [Placeholder — real production and delivery timeframes to be confirmed before this
            page goes live.]
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">
            Cancellations
          </h2>
          <p className="mt-2">
            Every print is made specifically for your order once it&apos;s placed. Personalised
            and made-to-order goods are commonly exempt from the UK&apos;s standard 14-day
            distance-selling cancellation right — if you need the exact, current wording for your
            own terms, gov.uk is the authoritative source rather than this paragraph.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">
            If something arrives damaged or wrong
          </h2>
          <p className="mt-2">
            Get in touch and it&apos;ll be sorted — a replacement or refund, whichever&apos;s
            right for what went wrong.
          </p>
        </section>
      </div>
    </div>
  );
}
