import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import ProductTierBlock from "@/components/guide/ProductTierBlock";

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
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-nebula-teal-400 underline decoration-nebula-teal-700 underline-offset-2 hover:text-nebula-teal-300"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="text-star-100">{children}</strong>
    ),
  },
  types: {
    bodyImage: ({ value }) => (
      <figure className="mt-6">
        <span className="block overflow-hidden border border-void-700">
          <Image
            src={urlFor(value.image).width(1200).url()}
            alt={value?.alt ?? ""}
            width={1200}
            height={800}
            sizes="(min-width: 1024px) 672px, 100vw"
            className="h-auto w-full"
          />
        </span>
        {value?.caption && (
          <figcaption className="mt-2 text-center text-sm text-star-500">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
    bodyImageRow: ({ value }) => {
      const images: { image: Parameters<typeof urlFor>[0]; alt?: string; caption?: string }[] =
        value?.images ?? [];
      return (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          {images.map((item, i) => (
            <figure key={i} className="min-w-0 flex-1">
              <span className="block overflow-hidden border border-void-700">
                <Image
                  src={urlFor(item.image).width(600).url()}
                  alt={item.alt ?? ""}
                  width={600}
                  height={400}
                  sizes="(min-width: 640px) 220px, 100vw"
                  className="h-auto w-full"
                />
              </span>
              {item.caption && (
                <figcaption className="mt-2 text-center text-sm text-star-500">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      );
    },
    productTier: ({ value }) => <ProductTierBlock value={value} />,
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
