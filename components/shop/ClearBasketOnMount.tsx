"use client";

import { useEffect } from "react";
import { useBasket } from "@/components/shop/useBasket";

// Rendered only on /shop/thanks, which Stripe sends the customer to after a
// successful payment — the basket has done its job, so empty it.
export default function ClearBasketOnMount() {
  const { clear } = useBasket();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
