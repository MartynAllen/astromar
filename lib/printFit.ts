import type { AstroPhotoDetail, PrintProduct } from "@/lib/sanity.queries";

// Prodigi's own API auto-orients the physical print substrate to whichever
// way needs the least cropping, regardless of the SKU ordered — confirmed
// via their docs ("automatically rotate images so they need the least
// possible resizing"), not a fixed portrait shape forced onto every photo
// regardless of content. Everything here mirrors that same logic so the
// Quick View preview shows what actually gets printed, and so the buy
// panel can recommend whichever size wastes the least of the frame.

type PhotoForFit = Pick<AstroPhotoDetail, "mainImage" | "printRotation" | "printCrop">;
type ProductShape = Pick<PrintProduct, "widthIn" | "heightIn">;
type ProductForFit = Pick<PrintProduct, "_id" | "widthIn" | "heightIn">;

/**
 * width/height of the photo as it'll actually be printed, after both
 * printCrop and printRotation (see astroPhoto schema) — not the raw asset
 * dimensions. printCrop is applied first (it trims the *unrotated* frame,
 * same order applyPrintCrop uses), then the rotation swap. Falls back to 1
 * (square) if dimensions are missing, which just makes every size look
 * like an equally-imperfect fit rather than crashing.
 */
export function effectiveAspectRatio(photo: PhotoForFit): number {
  const dims = photo.mainImage.dimensions;
  if (!dims?.width || !dims?.height) return 1;
  const crop = photo.printCrop;
  const croppedWidth = dims.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0));
  const croppedHeight = dims.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0));
  const rotated = photo.printRotation === 90 || photo.printRotation === 270;
  const width = rotated ? croppedHeight : croppedWidth;
  const height = rotated ? croppedWidth : croppedHeight;
  return width / height;
}

/**
 * Like effectiveAspectRatio, but deliberately ignoring printRotation — used
 * only for the Quick View preview's own crop, kept visually consistent with
 * the gallery page by request, even though the actual order
 * (effectiveAspectRatio, checkout's imageUrl) may still rotate the
 * submitted image to avoid losing the edges of a diagonally-oriented
 * target. This is a deliberate, known mismatch — see BuyPrintPanel's
 * QuickViewModal for where it's surfaced to the customer.
 *
 * printCrop is still applied, unlike printRotation — unlike the rotation
 * override, a crop exists to exclude genuinely unwanted content, not to
 * offer a nicer-but-different preview, so it should never diverge from the
 * gallery page's own (crop-free) presentation any more than necessary.
 */
export function rawAspectRatio(photo: PhotoForFit): number {
  const dims = photo.mainImage.dimensions;
  if (!dims?.width || !dims?.height) return 1;
  const crop = photo.printCrop;
  const width = dims.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0));
  const height = dims.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0));
  return width / height;
}

/** The crop's own width/height ratio, oriented to match the source photo
 * rather than always the portrait shape the size is catalogued as. */
export function cropRatio(product: ProductShape, sourceIsLandscape: boolean): number {
  return sourceIsLandscape ? product.heightIn / product.widthIn : product.widthIn / product.heightIn;
}

/** Same ratio, as a CSS `aspect-ratio` value. */
export function cropRatioCss(product: ProductShape, sourceIsLandscape: boolean): string {
  return sourceIsLandscape ? `${product.heightIn} / ${product.widthIn}` : `${product.widthIn} / ${product.heightIn}`;
}

/**
 * Fraction of the source frame kept after a centred cover-crop to this
 * product's shape (in whichever orientation matches the source) — 1 means
 * the ratios already match and nothing is lost; lower means more of the
 * frame gets cropped away to fill that shape.
 */
export function retainedFraction(product: ProductShape, sourceAspectRatio: number): number {
  const target = cropRatio(product, sourceAspectRatio > 1);
  return Math.min(target, sourceAspectRatio) / Math.max(target, sourceAspectRatio);
}

/** The size that wastes the least of this specific photo's frame. */
export function bestFitProductId(products: ProductForFit[], photo: PhotoForFit): string | null {
  if (products.length === 0) return null;
  const ratio = effectiveAspectRatio(photo);
  let best = products[0];
  let bestScore = retainedFraction(best, ratio);
  for (const product of products.slice(1)) {
    const score = retainedFraction(product, ratio);
    if (score > bestScore) {
      best = product;
      bestScore = score;
    }
  }
  return best._id;
}
