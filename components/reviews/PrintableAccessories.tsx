import Link from "next/link";
import type { PrintableAccessory } from "@/lib/sanity.queries";

export default function PrintableAccessories({
  accessories,
}: {
  accessories: PrintableAccessory[];
}) {
  if (!accessories || accessories.length === 0) return null;

  return (
    <div className="mt-12 border-t border-void-700 pt-8">
      <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
        3D-Printable Accessories
      </p>
      <p className="mt-2 text-sm text-star-500">
        If you&apos;ve got access to a 3D printer, these are worth printing instead of buying.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {accessories.map((accessory) => (
          <div key={accessory.url} className="border border-void-700 bg-void-900 p-4">
            <p className="font-mono uppercase tracking-wide text-star-100">{accessory.name}</p>
            {accessory.notes && (
              <p className="mt-1.5 text-sm text-star-300">{accessory.notes}</p>
            )}
            {accessory.designerCredit && (
              <p className="mt-1.5 text-xs text-star-600">{accessory.designerCredit}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <a
                href={accessory.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400 underline decoration-nebula-teal-700 underline-offset-2 hover:text-nebula-teal-300"
              >
                View print files ↗
              </a>
              {accessory.relatedGuideHref && (
                <Link
                  href={accessory.relatedGuideHref}
                  className="font-mono text-xs uppercase tracking-widest text-star-500 underline decoration-void-600 underline-offset-2 hover:text-star-300"
                >
                  See our guide →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
