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

type Rect = ReturnType<typeof urlFor>;

/**
 * Trims a strip off one or more edges before the print/Quick-View crop runs
 * — for a photo where a plain centre-crop wouldn't reliably exclude
 * something in the raw frame (a roofline caught in shot, a foreground
 * object), same idea as printRotation but for cropping out content rather
 * than reorienting it. See astroPhoto schema's printCrop field. Fractions
 * (0-1) rather than pixels so the same value works at any resolution;
 * applied via .rect(), which @sanity/image-url takes in source pixels, so
 * this needs the source's own dimensions to convert.
 *
 * Must be called before .orientation()/.width() etc. — .rect() addresses
 * the *original*, unrotated image, so applying it after a rotation would
 * crop the wrong edges.
 */
export function applyPrintCrop(
  builder: Rect,
  crop: { top?: number; bottom?: number; left?: number; right?: number } | undefined,
  dimensions: { width: number; height: number } | undefined,
): Rect {
  if (!crop || !dimensions?.width || !dimensions?.height) return builder;
  const left = Math.round((crop.left ?? 0) * dimensions.width);
  const top = Math.round((crop.top ?? 0) * dimensions.height);
  const width = Math.round(dimensions.width * (1 - (crop.left ?? 0) - (crop.right ?? 0)));
  const height = Math.round(dimensions.height * (1 - (crop.top ?? 0) - (crop.bottom ?? 0)));
  return builder.rect(left, top, width, height) as Rect;
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
