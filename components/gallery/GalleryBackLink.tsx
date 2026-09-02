"use client";

import { useSearchParams } from "next/navigation";
import BackLink from "@/components/BackLink";

// Client-side, not a server prop — reading searchParams server-side would
// opt this otherwise-statically-generated detail page out of ISR just to
// read one param (same reasoning as GallerySearch's own useInitialCategory).
//
// `from` is attacker-reachable (anyone can craft the URL), so only ever
// treated as a same-origin path back into the site's own photo lists —
// never handed to <Link> unvalidated, which would otherwise make this an
// open redirect. "/gallery" or "/gallery?..." or exactly "/prints" are the
// only lists that ever link a photo here (see PhotoCard's returnTo), so
// those are the only shapes accepted.
function isSafeReturnPath(value: string): boolean {
  if (value.startsWith("//")) return false;
  return /^\/gallery(?:$|[/?])/.test(value) || value === "/prints";
}

export default function GalleryBackLink() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const href = from && isSafeReturnPath(from) ? from : "/gallery";
  return <BackLink href={href} label="Gallery" />;
}
