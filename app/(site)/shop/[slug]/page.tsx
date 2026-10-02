import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AddToBasket from "@/components/shop/AddToBasket";
import ShopGallery from "@/components/shop/ShopGallery";
import PortableTextContent from "@/components/PortableTextContent";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import BackLink from "@/components/BackLink";
import { getShopProductBySlug, getShopSettings, getShopSlugs } from "@/lib/sanity.queries";
import { buildMetadata, shopProductJsonLd } from "@/lib/seo";
import { formatGBP } from "@/lib/shop/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getShopSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getShopProductBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: product.seo?.metaTitle || product.title,
    description: product.seo?.metaDescription || product.summary,
    path: `/shop/${slug}`,
    image: product.images[0]?.image,
  });
}

export default async function ShopProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const [product, settings] = await Promise.all([getShopProductBySlug(slug), getShopSettings()]);
  if (!product) notFound();

  const facts = [
    product.material && { label: "Material", value: product.material },
    product.printer && { label: "Printed on", value: product.printer },
    product.dimensions && { label: "Dimensions", value: product.dimensions },
    {
      label: "How it's made",
      value:
        product.fulfilment === "madeToOrder"
          ? product.leadTimeDays
            ? `Printed after you order — about ${product.leadTimeDays} days before it's posted`
            : "Printed after you order"
          : "Printed in advance and kept in stock",
    },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <JsonLd
        data={shopProductJsonLd({
          name: product.title,
          description: product.summary,
          path: `/shop/${slug}`,
          images: product.images.map((i) => i.image),
          category: product.category,
          material: product.material,
          fulfilment: product.fulfilment,
          variants: product.variants,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Shop", path: "/shop" },
          { name: product.title, path: `/shop/${slug}` },
        ]}
      />
      <BackLink href="/shop" label="Shop" />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ShopGallery images={product.images} />

        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
            {product.category}
          </p>
          <h1 className="mt-2 font-mono text-4xl font-bold uppercase tracking-wide text-star-100">
            {product.title}
          </h1>
          {product.summary && <p className="mt-3 text-star-300">{product.summary}</p>}

          <div className="mt-8 border-y border-void-700 py-6">
            <AddToBasket
              productId={product._id}
              fulfilment={product.fulfilment}
              leadTimeDays={product.leadTimeDays}
              variants={product.variants}
              maxQtyPerLine={settings.maxQtyPerLine}
            />
          </div>

          <dl className="mt-6 space-y-3">
            {facts.map((f) => (
              <div key={f.label} className="grid grid-cols-[8rem_1fr] gap-3 text-sm">
                <dt className="font-mono text-xs uppercase tracking-widest text-star-500">{f.label}</dt>
                <dd className="text-star-300">{f.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-sm text-star-500">
            UK postage is {formatGBP(settings.flatShippingPence)}
            {settings.freeShippingThresholdPence
              ? `, free on orders over ${formatGBP(settings.freeShippingThresholdPence)}`
              : ""}
            .{" "}
            <Link href="/shipping-returns" className="underline hover:text-star-300">
              Shipping &amp; returns
            </Link>
            .
          </p>

          {product.description && product.description.length > 0 && (
            <PortableTextContent value={product.description} />
          )}
        </div>
      </div>
    </div>
  );
}
