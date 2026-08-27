import PhotoCard from "./PhotoCard";
import type { AstroPhotoSummary } from "@/lib/sanity.queries";

export default function PhotoGrid({
  photos,
  fromPriceGBP,
}: {
  photos: AstroPhotoSummary[];
  fromPriceGBP?: number;
}) {
  if (photos.length === 0) {
    return (
      <p className="py-16 text-center text-star-500">
        No photos in this category yet — check back soon.
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {photos.map((photo) => (
        <PhotoCard key={photo._id} photo={photo} fromPriceGBP={fromPriceGBP} />
      ))}
    </div>
  );
}
