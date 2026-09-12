import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { isSafeHref } from "@/lib/safeUrl";
import { isAffiliateUrl } from "@/lib/affiliateLinks";
import ProductTierBlock from "@/components/guide/ProductTierBlock";
import SkyDiagram from "@/components/guide/SkyDiagram";
import ExpandableImageRow, { type ImageRowItem } from "@/components/guide/ExpandableImageRow";
import type { SanityImageWithDimensions } from "@/lib/sanity.queries";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-12 border-t border-void-700 pt-6 font-mono text-3xl uppercase tracking-wide text-star-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 font-mono text-2xl uppercase tracking-wide text-star-100">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mt-4 leading-relaxed text-star-300">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-nebula-teal-500 pl-4 text-star-300 italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    // Rich-text link hrefs are editor-entered free text, not a URL-typed
    // Sanity field — isSafeHref rules out a javascript:/data: scheme
    // executing on click. Renders as plain unlinked text rather than
    // silently dropping the content the editor actually wrote.
    link: ({ value, children }) =>
      isSafeHref(value?.href) ? (
        <a
          href={value.href}
          target="_blank"
          // Affiliate links get "sponsored nofollow" per Amazon's Associates
          // terms and Google's link-spam guidance; ordinary references stay
          // plain so the site can still vouch for what it links to.
          rel={isAffiliateUrl(value.href) ? "noopener noreferrer sponsored nofollow" : "noopener noreferrer"}
          className="text-nebula-teal-400 underline decoration-nebula-teal-700 underline-offset-2 hover:text-nebula-teal-300"
        >
          {children}
        </a>
      ) : (
        <>{children}</>
      ),
    strong: ({ children }) => (
      <strong className="text-star-100">{children}</strong>
    ),
  },
  types: {
    bodyImage: ({ value }) => {
      const small = value?.size === "small";
      return (
        <figure className={small ? "mx-auto mt-6 max-w-[420px]" : "mt-6"}>
          <span className="block overflow-hidden border border-void-700">
            <Image
              src={urlFor(value.image).width(small ? 840 : 1200).url()}
              alt={value?.alt ?? ""}
              width={small ? 840 : 1200}
              height={small ? 560 : 800}
              sizes={small ? "(min-width: 460px) 420px, 100vw" : "(min-width: 1024px) 672px, 100vw"}
              className="h-auto w-full"
            />
          </span>
          {value?.caption && (
            <figcaption className="mt-2 text-center text-sm text-star-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    bodyImageRow: ({ value }) => {
      const images: ImageRowItem[] = (value?.images ?? []).map(
        (item: { image: SanityImageWithDimensions; alt?: string; caption?: string }) => ({
          image: item.image,
          alt: item.alt ?? "",
          caption: item.caption,
        }),
      );
      return <ExpandableImageRow images={images} />;
    },
    productTier: ({ value }) => <ProductTierBlock value={value} />,
    specComparison: ({ value }) => {
      const rows: { label: string; valueA: string; valueB: string }[] = value?.rows ?? [];
      return (
        <div className="mt-6 overflow-x-auto border border-void-700 bg-void-900">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-void-700">
                <th className="w-1/3" />
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
                  {value?.deviceA}
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-nebula-amber-400">
                  {value?.deviceB}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i > 0 ? "border-t border-void-700" : undefined}>
                  <td className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-star-500">{row.label}</td>
                  <td className="px-4 py-3 text-star-300">{row.valueA}</td>
                  <td className="px-4 py-3 text-star-300">{row.valueB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
    skyDiagram: ({ value }) => <SkyDiagram kind={value?.kind} caption={value?.caption} />,
    code: ({ value }) => (
      <div className="mt-6 overflow-hidden border border-void-700 bg-void-900">
        {(value?.filename || value?.language) && (
          <div className="flex items-center justify-between border-b border-void-700 px-4 py-2">
            <span className="font-mono text-xs text-star-500">
              {value?.filename}
            </span>
            {value?.language && (
              <span className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
                {value.language}
              </span>
            )}
          </div>
        )}
        <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-star-300">
          <code>{value?.code}</code>
        </pre>
      </div>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-1 pl-5 text-star-300">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-star-300">
        {children}
      </ol>
    ),
  },
};

export default function PortableTextContent({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <div className="max-w-2xl">
      <PortableText value={value as never} components={components} />
    </div>
  );
}
