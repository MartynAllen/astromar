"use client";

import { useSearchParams } from "next/navigation";

// Reads ?checkout=success|cancelled off the success_url/cancel_url that
// /api/checkout builds. Client component reading useSearchParams — kept out
// of the server-rendered page itself (see gallery/[slug]/page.tsx's
// Suspense wrapper) so the page stays statically generated.
export default function CheckoutStatusBanner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("checkout");

  if (status === "success") {
    return (
      <div className="mb-6 border border-nebula-teal-500 bg-nebula-teal-500/10 px-4 py-3 text-sm text-nebula-teal-300">
        Thanks — your order&apos;s confirmed. A receipt is on its way to your
        email, and the print will be made and shipped from here.
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="mb-6 border border-void-700 bg-void-900 px-4 py-3 text-sm text-star-500">
        Checkout cancelled — nothing was charged.
      </div>
    );
  }

  return null;
}
