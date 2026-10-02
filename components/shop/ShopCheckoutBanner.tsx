"use client";

import { useSearchParams } from "next/navigation";

// Reads ?checkout=cancelled off the cancel_url /api/shop/checkout builds.
// A client component reading useSearchParams, kept out of the server page
// behind a Suspense boundary so /shop/basket stays statically generated —
// the same arrangement as the print flow's CheckoutStatusBanner.
export default function ShopCheckoutBanner() {
  const status = useSearchParams().get("checkout");
  if (status !== "cancelled") return null;
  return (
    <div className="mb-6 border border-void-700 bg-void-900 px-4 py-3 text-sm text-star-500">
      Checkout cancelled — nothing was charged, and your basket is still here.
    </div>
  );
}
