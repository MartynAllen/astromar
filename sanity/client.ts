import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

// For anything where a stale read costs money: shop stock and prices at
// quote/checkout time. The default client above is CDN-backed, which can
// lag a Studio edit, so a price change or a sold-out item could still be
// served as the old value. No token needed — the dataset is public — it
// just skips the CDN.
export const freshClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});

// Server-only client for the import script: needs a write token and must
// bypass the CDN so it sees its own just-written drafts immediately.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: "raw",
});
