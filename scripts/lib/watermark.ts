import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Rendered once via scripts/assets/render-watermark.py (Snell Roundhand Bold,
// off-white to match the site's own --color-star-100, soft shadow for
// legibility over bright regions) at high resolution so it stays crisp when
// scaled up for the largest source photos. Re-run that script and replace
// watermark.png if the look ever needs to change — nothing here regenerates
// it automatically.
const WATERMARK_PATH = path.join("scripts", "assets", "watermark.png");

// Deliberately substantial rather than a small corner mark — big enough that
// cropping it out costs real image content, not just a corner pixel-snip.
const WIDTH_FRACTION = 0.3;
const MARGIN_FRACTION = 0.03;

/**
 * Composites the site's watermark onto a photo, bottom-right, sized
 * proportionally to the photo's own width. Always returns a JPEG — this is
 * for the public-facing display copy only; the clean, unwatermarked
 * original must be kept separately (printMasterImage) for print orders.
 */
export async function applyWatermark(inputBuffer: Buffer): Promise<Buffer> {
  const watermarkBuffer = await readFile(WATERMARK_PATH);

  const photo = sharp(inputBuffer);
  const { width, height } = await photo.metadata();
  if (!width || !height) {
    throw new Error("applyWatermark: could not read source image dimensions");
  }

  const wmMeta = await sharp(watermarkBuffer).metadata();
  if (!wmMeta.width || !wmMeta.height) {
    throw new Error("applyWatermark: could not read watermark dimensions");
  }

  const targetWidth = Math.round(width * WIDTH_FRACTION);
  const targetHeight = Math.round(targetWidth * (wmMeta.height / wmMeta.width));

  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(targetWidth, targetHeight)
    .toBuffer();

  const margin = Math.round(width * MARGIN_FRACTION);

  return photo
    .composite([
      {
        input: resizedWatermark,
        left: width - targetWidth - margin,
        top: height - targetHeight - margin,
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}
