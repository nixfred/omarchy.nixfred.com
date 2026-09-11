#!/usr/bin/env python3
"""Bounding box of a plugin panel, as the difference between two frames.

    panel_bbox.py <before> <after>

Only valid when the background is genuinely static: an empty workspace with
Infomarchy's dashboard hidden. capture.sh arranges both. The bar strip is masked
out because it redraws its meters and clock constantly.
"""
import sys

from PIL import Image, ImageChops

BAR_H = 52          # Omarchy's bar, plus a little margin
THRESHOLD = 24      # ignore anti-aliasing and gradient dither

before = Image.open(sys.argv[1]).convert("RGB")
after = Image.open(sys.argv[2]).convert("RGB")

diff = ImageChops.difference(before, after).convert("L")
diff = diff.point(lambda v: 255 if v > THRESHOLD else 0)
diff.paste(0, (0, 0, diff.size[0], BAR_H))

box = diff.getbbox()
print(*(box and (box[0], box[1], box[2] - box[0], box[3] - box[1]) or (0, 0, 0, 0)))
