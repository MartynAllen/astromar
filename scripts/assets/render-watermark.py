"""Regenerates watermark.png in this same directory.

Only needed if the watermark's look ever changes (text, font, size, colour,
opacity) — the day-to-day import/checkout pipeline just reads the committed
PNG, it doesn't run this. macOS-only as written: Snell Roundhand ships with
the OS (System/Library/Fonts/Supplemental). Point FONT_PATH at a real .ttf/
.otf/.ttc of your own to run this elsewhere.

Usage: python3 scripts/assets/render-watermark.py
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter

TEXT = "Martyn Allen Photography"
FONT_PATH = "/System/Library/Fonts/Supplemental/SnellRoundhand.ttc"
FONT_INDEX = 1  # 0 Regular, 1 Bold, 2 Black — Bold reads best at watermark size/opacity
FONT_SIZE = 480
PADDING = 130
SHADOW_BLUR = 13
SHADOW_OFFSET = (7, 9)
SHADOW_OPACITY = 130  # 0-255
TEXT_OPACITY = 210  # 0-255 — slightly translucent, reads as a stamp, not a sticker
TEXT_COLOR = (245, 247, 250)  # matches the site's --color-star-100 token


def render_watermark():
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE, index=FONT_INDEX)

    scratch = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(scratch)
    bbox = d.textbbox((0, 0), TEXT, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    canvas_w = text_w + PADDING * 2
    canvas_h = text_h + PADDING * 2

    shadow_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow_layer)
    ds.text(
        (PADDING - bbox[0] + SHADOW_OFFSET[0], PADDING - bbox[1] + SHADOW_OFFSET[1]),
        TEXT,
        font=font,
        fill=(0, 0, 0, SHADOW_OPACITY),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))

    text_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    dt = ImageDraw.Draw(text_layer)
    dt.text(
        (PADDING - bbox[0], PADDING - bbox[1]),
        TEXT,
        font=font,
        fill=(*TEXT_COLOR, TEXT_OPACITY),
    )

    out = Image.alpha_composite(shadow_layer, text_layer)
    out_path = __file__.rsplit("/", 1)[0] + "/watermark.png"
    out.save(out_path)
    print(f"{out_path}: {out.size}")
    return out


if __name__ == "__main__":
    render_watermark()
