import Stripe from "stripe";

// Server-only — never imported from a client component. Hosted Stripe
// Checkout means the browser only ever navigates to checkout.stripe.com;
// this key never reaches it.
const secretKey = process.env.STRIPE_SECRET_KEY;
export const stripeConfigured = Boolean(secretKey);

// The SDK's constructor validates its key eagerly and throws on an empty
// string — which would otherwise crash `next build`'s route analysis (and
// any other module evaluation) whenever STRIPE_SECRET_KEY isn't set yet.
// A placeholder keeps construction safe; stripeConfigured is what actually
// gates every route from using it for a real API call.
export const stripe = new Stripe(secretKey || "sk_test_not_configured", {
  // Pinned so a Stripe account-level API version bump can't silently change
  // this route's behavior; bump deliberately, not by default.
  apiVersion: "2026-07-29.dahlia",
});
