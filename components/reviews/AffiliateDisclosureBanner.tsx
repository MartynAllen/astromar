import Link from "next/link";

export default function AffiliateDisclosureBanner() {
  return (
    <div className="mb-8 border border-void-700 bg-void-900/60 px-4 py-3 text-xs text-star-500">
      This page may contain affiliate links. As an Amazon Associate, Astromar earns from
      qualifying purchases at no extra cost to you.{" "}
      <Link href="/disclosure" className="text-nebula-teal-400 hover:underline">
        Full disclosure
      </Link>
      .
    </div>
  );
}
