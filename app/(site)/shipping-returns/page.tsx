import type { Metadata } from "next";
import Link from "next/link";
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
          <p className="mt-2">
            Prodigi&apos;s own turnaround is 24–72 hours to produce most prints at their UK lab —
            occasionally up to a week for more complex framed or canvas pieces. Standard UK
            shipping typically adds another 2–3 working days on top. All in, allow{" "}
            <strong className="text-star-100">3–7 working days</strong> from order to delivery.
            Shipping is currently UK-only.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">
            Cancellations
          </h2>
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
          <h2 className="font-mono text-xl uppercase tracking-wide text-star-100">
            If something arrives damaged or wrong
          </h2>
          <p className="mt-2">
            <Link href="/contact" className="text-nebula-teal-400 hover:underline">
              Get in touch
            </Link>{" "}
            and it&apos;ll be sorted — a replacement or refund, whichever&apos;s right for what
            went wrong.
          </p>
        </section>
      </div>
    </div>
  );
}
