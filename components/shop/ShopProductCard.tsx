import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/image";
import { LOW_STOCK_THRESHOLD, priceRangePence, productAvailable } from "@/lib/shop/availability";
import { formatGBP, type ShopProductSummary } from "@/lib/shop/types";
import StockPill from "@/components/shop/StockPill";

// Teal Held-Accent card (DESIGN.md): the left border stays lit on hover and
// only the other three sides brighten — a plain hover:border-void-600 would
// override the accent. One accent for the whole shop, no per-category hues.
export default function ShopProductCard({ product }: { product: ShopProductSummary }) {
  const cover = product.images[0];
  const { low, high } = priceRangePence(product.variants);
  const available = productAvailable(product);
  // One option: show its own state. Several: just "In stock" vs "Sold out"
  // for the product as a whole — per-variant counts belong on its page.
  const pillVariant =
    product.variants.length === 1
      ? product.variants[0]
      : { stock: available ? LOW_STOCK_THRESHOLD + 1 : 0 };

  return (
    <li>
      <Link
        href={`/shop/${product.slug.current}`}
        className="group flex h-full flex-col border border-void-700 border-l-2 border-l-nebula-teal-400 bg-void-900 transition-colors hover:border-t-void-600 hover:border-r-void-600 hover:border-b-void-600 hover:bg-nebula-teal-400/5"
      >
        <div className="relative aspect-square overflow-hidden border-b border-void-700 bg-void-950">
          {cover?.image.asset && (
            <Image
              src={urlFor(cover.image).width(640).height(640).fit("crop").url()}
              alt={cover.alt}
              width={640}
              height={640}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                available ? "" : "opacity-60"
              }`}
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-star-500">{product.category}</p>
          <h2 className="mt-1 font-mono text-xl uppercase tracking-wide text-star-100 group-hover:text-nebula-teal-400">
            {product.title}
          </h2>
          {product.summary && <p className="mt-1.5 text-sm text-star-500">{product.summary}</p>}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
            <p className="font-mono text-lg text-star-100">
              {low === high ? formatGBP(low) : `From ${formatGBP(low)}`}
            </p>
            <StockPill
              fulfilment={product.fulfilment}
              variant={pillVariant}
              leadTimeDays={product.leadTimeDays}
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
