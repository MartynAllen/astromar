import { urlFor } from "@/sanity/image";
import PhotoHeroImage from "./PhotoHeroImage";
import ShotDetailsPanel from "./ShotDetailsPanel";
import GearNotesPanel from "./GearNotesPanel";
import ProcessingPanel from "./ProcessingPanel";
import BuyPrintPanel from "./BuyPrintPanel";
import PortableTextContent from "@/components/PortableTextContent";
import type { AstroPhotoDetail, PrintProduct } from "@/lib/sanity.queries";

export default function PhotoDetail({
  photo,
  printProducts,
  printCatalogUnavailable,
  compact = false,
}: {
  photo: AstroPhotoDetail;
  printProducts?: PrintProduct[];
  /** True only when fetching the print catalog itself threw — distinct from
   * printProducts being empty because no sizes are configured yet. Renders
   * a visible notice in place of the buy panel instead of the panel just
   * silently not appearing, which otherwise reads as "this photo stopped
   * being for sale" rather than "pricing failed to load." */
  printCatalogUnavailable?: boolean;
  /** True when rendered inside the gallery lightbox (@modal) — that fixed
   * full-viewport overlay has far less room to spare than a standalone
   * page, so a portrait or otherwise tall shot at full width was pushing
   * title/buy-panel/shot-details well below the fold, requiring far more
   * scrolling than a "quick view" modal should. Caps the image's own
   * display height there; the standalone page (default) keeps the full
   * width/height treatment, where scrolling past a big hero photo is
   * normal, expected page behaviour. See PhotoHeroImage. */
  compact?: boolean;
}) {
  const dims = photo.mainImage.dimensions;
  const posterUrl = urlFor(photo.mainImage).width(1600).url();

  return (
    <div>
      <PhotoHeroImage
        posterUrl={posterUrl}
        videoUrl={photo.videoUrl}
        alt={photo.caption || photo.title}
        width={dims?.width ?? 1600}
        height={dims?.height ?? 1000}
        compact={compact}
      />

      {/* Narrowed to match the About/Reviews pages' own reading column —
          title, buy panel and technical details all read better at this
          width than stretched across the full image's span. Tighter gap
          in compact/lightbox mode — the same scroll budget the height cap
          above is trying to protect. */}
      <div className={compact ? "mx-auto mt-4 max-w-2xl" : "mx-auto mt-8 max-w-2xl"}>
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
        {/* Gear notes sits right after what was captured and before how it
            was finished — capture gear, then processing, in that order. A
            plain muted paragraph here previously undersold it: for a shot
            that needs nothing more than a lens and a tripod, this is
            genuinely a "you can do this too" recipe, not a footnote. */}
        {photo.gearNotes && (
          <div className="mt-4">
            <GearNotesPanel notes={photo.gearNotes} />
          </div>
        )}
        {photo.processingTools && photo.processingTools.length > 0 && (
          <div className="mt-4">
            <ProcessingPanel tools={photo.processingTools} />
          </div>
        )}

        {Array.isArray(photo.story) && photo.story.length > 0 && (
          <div className="mt-8">
            <PortableTextContent value={photo.story} />
          </div>
        )}
      </div>
    </div>
  );
}
