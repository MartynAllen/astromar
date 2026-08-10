import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 font-display text-2xl font-semibold text-star-100">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 font-display text-xl font-semibold text-star-100">{children}</h3>
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
    strong: ({ children }) => <strong className="text-star-100">{children}</strong>,
  },
  types: {
    image: ({ value }) => (
      <span className="mt-6 block overflow-hidden rounded-lg border border-void-700">
        <Image
          src={urlFor(value).width(1200).url()}
          alt={value?.alt ?? ""}
          width={1200}
          height={800}
          className="h-auto w-full"
        />
      </span>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-1 pl-5 text-star-300">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-star-300">{children}</ol>
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
