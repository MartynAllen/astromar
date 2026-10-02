import type { Metadata } from "next";
import Link from "next/link";
import ClearBasketOnMount from "@/components/shop/ClearBasketOnMount";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

// Stripe's success_url for shop orders. Deliberately generic: this page
// can't know what was bought (that lives in Stripe, not here), so it makes
// no promises beyond what every order gets.
export default function ShopThanksPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <ClearBasketOnMount />
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">Order received</p>
      <h1 className="mt-2 font-mono text-4xl font-bold uppercase tracking-wide text-star-100">
        Thank you
      </h1>
      <p className="mt-4 text-star-300">
        Your payment went through and your order is with me. You&apos;ll get a receipt by email
        from Stripe, and everything is dispatched within the time shown at checkout.
      </p>
      <p className="mt-4 text-star-500">
        If something doesn&apos;t look right, or you need to change anything, get in touch as soon
        as you can via the{" "}
        <Link href="/contact" className="underline hover:text-star-300">
          contact page
        </Link>
        . Full details are on{" "}
        <Link href="/shipping-returns" className="underline hover:text-star-300">
          Shipping &amp; returns
        </Link>
        .
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-block border border-void-600 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-star-300 transition-colors hover:border-star-100 hover:text-star-100"
      >
        Back to the shop
      </Link>
    </div>
  );
}
