import Image from "next/image";
import { urlFor } from "@/sanity/image";
import ShotDetailsPanel from "./ShotDetailsPanel";
import ProcessingPanel from "./ProcessingPanel";
import BuyPrintPanel from "./BuyPrintPanel";
import PortableTextContent from "@/components/PortableTextContent";
import type { AstroPhotoDetail, PrintProduct } from "@/lib/sanity.queries";

export default function PhotoDetail({
  photo,
  printProducts,
  printCatalogUnavailable,
}: {
  photo: AstroPhotoDetail;
  printProducts?: PrintProduct[];
  /** True only when fetching the print catalog itself threw — distinct from
   * printProducts being empty because no sizes are configured yet. Renders
   * a visible notice in place of the buy panel instead of the panel just
   * silently not appearing, which otherwise reads as "this photo stopped
   * being for sale" rather than "pricing failed to load." */
  printCatalogUnavailable?: boolean;
}) {
  const dims = photo.mainImage.dimensions;
  const posterUrl = urlFor(photo.mainImage).width(1600).url();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* lg:self-start: grid items stretch to the row's height by default,
          and the right-hand column (title, buy panel, shot details) is
          almost always taller than the image itself — without this, the
          image box stretches to match and leaves its own bg-void-900
          showing as empty space below the image. */}
      <div className="overflow-hidden border border-void-700 bg-void-900 lg:self-start">
        {photo.videoUrl ? (
          <video
            src={photo.videoUrl}
            poster={posterUrl}
            controls
            playsInline
            className="h-auto w-full"
          />
        ) : (
          <Image
            src={posterUrl}
            alt={photo.caption || photo.title}
            width={dims?.width ?? 1600}
            height={dims?.height ?? 1000}
            sizes="(min-width: 1024px) 65vw, 100vw"
            priority
            className="h-auto w-full"
          />
        )}
      </div>

      <div>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-wide text-star-100">{photo.title}</h1>
        {photo.caption && <p className="mt-2 text-star-500">{photo.caption}</p>}
        {/* Buy panel sits above the technical EXIF details — someone who
            lands straight on this page (social, search) should see "you can
            own this" before a table of exposure specs. */}
        {photo.availableAsPrint && printCatalogUnavailable && (
          <p className="mt-4 border border-void-600 bg-void-900 px-4 py-3 text-sm text-star-500">
            Pricing is temporarily unavailable — check back shortly.
          </p>
        )}
        {photo.availableAsPrint &&
          !printCatalogUnavailable &&
          printProducts &&
          printProducts.length > 0 && <BuyPrintPanel photo={photo} products={printProducts} />}
        <div className="mt-4">
          <ShotDetailsPanel details={photo.shotDetails} />
        </div>
        {photo.processingTools && photo.processingTools.length > 0 && (
          <div className="mt-4">
            <ProcessingPanel tools={photo.processingTools} />
          </div>
        )}
        {photo.gearNotes && (
          <p className="mt-4 text-sm text-star-500">
            <span className="text-star-300">Gear notes: </span>
            {photo.gearNotes}
          </p>
        )}
      </div>

      {Array.isArray(photo.story) && photo.story.length > 0 && (
        <div className="lg:col-span-2">
          <PortableTextContent value={photo.story} />
        </div>
      )}
    </div>
  );
}
