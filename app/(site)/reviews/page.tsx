import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ReviewSearch from "@/components/reviews/ReviewSearch";
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
    getHeroPhoto(1),
  ]);

  return (
    <>
      <PageHero photo={heroPhoto}>
        <div className="mx-auto w-full max-w-3xl px-6">
          <Breadcrumbs items={[{ name: "Reviews", path: "/reviews" }]} />
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wide text-star-100">Reviews</h1>
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
          <div className="mt-10">
            <ReviewSearch reviews={reviews} />
          </div>
        )}
      </div>
    </>
  );
}
