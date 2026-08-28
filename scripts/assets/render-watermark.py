"""Regenerates watermark.png in this same directory.

Only needed if the watermark's look ever changes (text, fonts, size, colour,
layout) — the day-to-day import/checkout pipeline just reads the committed
PNG, it doesn't run this. Both fonts are bundled in ./fonts (OFL-licensed,
redistributable — see the OFL-*.txt files there), so this runs the same
anywhere, not just on this machine.

Layout: a script signature ("Martyn Allen", Sacramento) over a thin rule
over tracked-out small caps ("PHOTOGRAPHY", JetBrains Mono — the same
typeface carrying every other label on the site, see DESIGN.md's
Mono-Does-More rule) — a modern photographer's signature mark, not a
traditional calligraphic stamp.

Usage: python3 scripts/assets/render-watermark.py
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

NAME = "Martyn Allen"
SUB = "P H O T O G R A P H Y"  # manually letter-spaced — PIL has no tracking property

SCRIPT_FONT = os.path.join(BASE_DIR, "fonts", "Sacramento.ttf")
SUB_FONT = os.path.join(BASE_DIR, "fonts", "JetBrainsMono-Regular.ttf")

SCRIPT_SIZE = 340
SUB_SIZE = 68
RULE_GAP = 46  # space between signature baseline and the rule
RULE_WEIGHT = 4
SUB_GAP = 46  # space between the rule and "PHOTOGRAPHY"
PADDING = 90

SHADOW_BLUR = 10
SHADOW_OFFSET = (0, 5)
SHADOW_OPACITY = 110  # 0-255

TEXT_COLOR = (245, 247, 250)  # matches the site's --color-star-100 token
SUB_COLOR = (196, 199, 214)  # a shade dimmer, same relationship as star-100/star-300


def render_watermark():
    scratch = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(scratch)

    script_font = ImageFont.truetype(SCRIPT_FONT, SCRIPT_SIZE)
    sub_font = ImageFont.truetype(SUB_FONT, SUB_SIZE)

    name_bbox = d.textbbox((0, 0), NAME, font=script_font)
    name_w, name_h = name_bbox[2] - name_bbox[0], name_bbox[3] - name_bbox[1]

    sub_bbox = d.textbbox((0, 0), SUB, font=sub_font)
    sub_w, sub_h = sub_bbox[2] - sub_bbox[0], sub_bbox[3] - sub_bbox[1]

    rule_w = max(name_w, sub_w) * 0.92
    content_w = max(name_w, sub_w, rule_w)
    canvas_w = int(content_w + PADDING * 2)
    canvas_h = int(name_h + RULE_GAP + RULE_WEIGHT + SUB_GAP + sub_h + PADDING * 2)

    def build(offset=(0, 0), color=None, blur=0):
        layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)

        name_x = (canvas_w - name_w) / 2 - name_bbox[0] + offset[0]
        name_y = PADDING - name_bbox[1] + offset[1]
        dl.text((name_x, name_y), NAME, font=script_font, fill=color or TEXT_COLOR)

        rule_y = PADDING + name_h + RULE_GAP + offset[1]
        rule_x0 = (canvas_w - rule_w) / 2 + offset[0]
        rule_x1 = rule_x0 + rule_w
        dl.line([(rule_x0, rule_y), (rule_x1, rule_y)], fill=color or TEXT_COLOR, width=RULE_WEIGHT)

        sub_x = (canvas_w - sub_w) / 2 - sub_bbox[0] + offset[0]
        sub_y = rule_y + RULE_WEIGHT + SUB_GAP - sub_bbox[1] + offset[1]
        dl.text((sub_x, sub_y), SUB, font=sub_font, fill=color or SUB_COLOR)

        if blur:
            layer = layer.filter(ImageFilter.GaussianBlur(blur))
        return layer

    shadow = build(offset=SHADOW_OFFSET, color=(0, 0, 0, SHADOW_OPACITY), blur=SHADOW_BLUR)
    main = build()

    out = Image.alpha_composite(shadow, main)
    out_path = os.path.join(BASE_DIR, "watermark.png")
    out.save(out_path)
    print(f"{out_path}: {out.size}")
    return out


if __name__ == "__main__":
    render_watermark()
