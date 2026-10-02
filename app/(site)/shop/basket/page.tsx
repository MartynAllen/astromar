import { Suspense } from "react";
import type { Metadata } from "next";
import BackLink from "@/components/BackLink";
import BasketView from "@/components/shop/BasketView";
import ShopCheckoutBanner from "@/components/shop/ShopCheckoutBanner";

// A personal basket page has nothing to index.
export const metadata: Metadata = {
  title: "Your basket",
  robots: { index: false, follow: false },
};

export default function BasketPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <BackLink href="/shop" label="Shop" />
      <h1 className="mt-4 font-mono text-4xl font-bold uppercase tracking-wide text-star-100">
        Your basket
      </h1>
      <div className="mt-8">
        <Suspense>
          <ShopCheckoutBanner />
        </Suspense>
        <BasketView />
      </div>
    </div>
  );
}
