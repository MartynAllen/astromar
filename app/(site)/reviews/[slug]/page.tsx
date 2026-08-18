import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RatingStars from "@/components/reviews/RatingStars";
import AffiliateButton from "@/components/reviews/AffiliateButton";
import AffiliateDisclosureBanner from "@/components/reviews/AffiliateDisclosureBanner";
import ReviewPhotoGallery from "@/components/reviews/ReviewPhotoGallery";
import PrintableAccessories from "@/components/reviews/PrintableAccessories";
import RecommendedAccessories from "@/components/reviews/RecommendedAccessories";
import ProductImagesThumbnails from "@/components/reviews/ProductImagesThumbnails";
import PortableTextContent from "@/components/PortableTextContent";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getReviewBySlug, getReviewSlugs } from "@/lib/sanity.queries";
import { buildMetadata, reviewJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getReviewSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/reviews/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const review = await getReviewBySlug(slug);
  if (!review) return {};
  return buildMetadata({
    title: review.seo?.metaTitle || review.title,
    description: review.seo?.metaDescription || review.verdict,
    path: `/reviews/${slug}`,
    image: review.seo?.ogImage || review.productImages?.[0]?.image,
  });
}

export default async function ReviewPage(props: PageProps<"/reviews/[slug]">) {
  const { slug } = await props.params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <JsonLd
        data={reviewJsonLd({
          productName: review.productName,
          rating: review.rating,
          reviewBody: review.verdict,
          path: `/reviews/${slug}`,
          datePublished: review.publishedAt,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Reviews", path: "/reviews" },
          { name: review.title, path: `/reviews/${slug}` },
        ]}
      />

      <AffiliateDisclosureBanner />

      <div className="flex flex-col items-start gap-5 sm:flex-row">
        {review.productImages && review.productImages.length > 0 && (
          <ProductImagesThumbnails images={review.productImages} />
        )}
        <div className="min-w-0">
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">{review.title}</h1>
          <p className="mt-1 text-star-500">{review.productType}</p>
          <div className="mt-2 text-lg">
            <RatingStars rating={review.rating} />
          </div>
        </div>
      </div>

      {review.verdict && (
        <p className="mt-8 border-l-2 border-nebula-rose-500 pl-4 text-lg text-star-100">
          {review.verdict}
        </p>
      )}

      {review.affiliateLinks && review.affiliateLinks.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {review.affiliateLinks.map((link) => (
            <AffiliateButton key={link.url} link={link} />
          ))}
        </div>
      )}

      {(review.pros?.length || review.cons?.length) && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {review.pros && review.pros.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-nebula-teal-400">
                Pros
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-star-300">
                {review.pros.map((pro) => (
                  <li key={pro}>+ {pro}</li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-nebula-rose-400">
                Cons
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-star-300">
                {review.cons.map((con) => (
                  <li key={con}>− {con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <PortableTextContent value={review.body} />

      {review.recommendedAccessories && (
        <RecommendedAccessories accessories={review.recommendedAccessories} />
      )}

      {review.printableAccessories && (
        <PrintableAccessories accessories={review.printableAccessories} />
      )}

      {review.galleryImages && <ReviewPhotoGallery photos={review.galleryImages} />}
    </div>
  );
}
