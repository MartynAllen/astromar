import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import RatingStars from "@/components/reviews/RatingStars";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { urlFor } from "@/sanity/image";
import { getAllReviews, getHeroPhoto } from "@/lib/sanity.queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Gear reviews for telescopes, filters, and imaging software, from real use.",
};

export default async function ReviewsPage() {
  const [reviews, heroPhoto] = await Promise.all([
    getAllReviews(),
    getHeroPhoto(2),
  ]);

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Reviews", path: "/reviews" }]} />
          <h1 className="font-display text-4xl italic text-star-100">Reviews</h1>
          <p className="mt-2 text-star-500">
            Gear that&apos;s actually been used to make the photos in the
            gallery — nothing reviewed sight-unseen.
          </p>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {reviews.length === 0 ? (
          <p className="mt-16 text-center text-star-500">
            No reviews published yet.
          </p>
        ) : (
          <ul className="mt-10 divide-y divide-void-700">
            {reviews.map((review) => (
              <li key={review._id} className="py-6">
                <Link
                  href={`/reviews/${review.slug.current}`}
                  className="group flex gap-4"
                >
                  {review.productImage?.asset && (
                    <Image
                      src={urlFor(review.productImage)
                        .width(160)
                        .height(160)
                        .url()}
                      alt={review.productName}
                      width={80}
                      height={80}
                      className="h-20 w-20 flex-none border border-void-700 object-cover"
                    />
                  )}
                  <div>
                    <h2 className="font-display text-xl italic text-star-100 group-hover:text-nebula-rose-400">
                      {review.title}
                    </h2>
                    <p className="text-sm text-star-500">
                      {review.productType}
                    </p>
                    <div className="mt-1">
                      <RatingStars rating={review.rating} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
