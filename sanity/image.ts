import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { dataset, projectId } from "./env";
import type { SanityImageWithDimensions } from "@/lib/sanity.queries";

const imageBuilder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
  return imageBuilder.image(source);
}

/**
 * Shared crop logic for the two forced-aspect hero banners (PageHero, the
 * homepage hero). A Studio-set hotspot always wins — real art direction for
 * a photo whose subject sits away from the bottom edge (e.g. a nebula whose
 * structure doesn't reach the bottom of the frame). Without one, falls back
 * to anchoring the crop to the bottom edge, which — unlike a plain center
 * crop — reliably keeps mainImage's watermark (baked into its bottom-right
 * corner) inside frame.
 *
 * Note: .crop("focalpoint") alone does NOT read the source's own hotspot —
 * @sanity/image-url only auto-computes a crop rect from a hotspot when no
 * explicit .crop() call is made at all. Calling .crop() explicitly (as this
 * always does, for the bottom-anchor fallback) requires pairing it with an
 * explicit .focalPoint() call to actually use the hotspot coordinates.
 */
export function heroCropUrl(
  image: SanityImageWithDimensions,
  width: number,
  height: number,
): string {
  const builder = urlFor(image).width(width).height(height).fit("crop");
  return image.hotspot
    ? builder.crop("focalpoint").focalPoint(image.hotspot.x, image.hotspot.y).url()
    : builder.crop("bottom").url();
}
