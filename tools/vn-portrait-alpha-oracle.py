#!/usr/bin/env python3
"""Validate separated character assets: stand art and shared bust-up art."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "characters"
GREENBACK_DIR = ASSET_DIR / "source" / "greenback"
CHARS = ["kaito", "akari", "riku", "yami"]
FORMATS = ["png", "webp"]


def is_green_key(r, g, b):
    return g >= 130 and (g - max(r, b)) >= 35


def alpha_bbox(image):
    return image.getchannel("A").point(lambda v: 255 if v > 0 else 0).getbbox()


def validate_green_source(path, min_margin):
    source = Image.open(path).convert("RGBA")
    width, height = source.size
    mask = Image.new("L", source.size, 0)
    mask_pixels = mask.load()
    green_count = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = source.getpixel((x, y))
            if a == 0 or is_green_key(r, g, b):
                green_count += 1
                continue
            mask_pixels[x, y] = 255
    bbox = mask.getbbox()
    source_margin = 0 if not bbox else min(bbox[0], bbox[1], width - bbox[2], height - bbox[3])
    cond = (
        source.size[0] >= 300
        and source.size[1] >= 300
        and bbox is not None
        and source_margin >= min_margin
        and green_count / (width * height) >= 0.2
    )
    print(
        f"{'OK' if cond else 'NG'} {path.name}: size={source.size} "
        f"character_bbox={bbox} min_margin={source_margin}"
    )
    return cond


def validate_alpha_asset(path, min_opaque, max_green=0.3):
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha_bbox(image)
    alpha_values = list(alpha.getdata())
    opaque = sum(1 for a in alpha_values if a >= 250) / len(alpha_values) * 100
    semi = sum(1 for a in alpha_values if 1 <= a < 250) / len(alpha_values) * 100
    green_visible = 0
    visible = 0
    for r, g, b, a in image.getdata():
        if a > 0:
            visible += 1
            if is_green_key(r, g, b):
                green_visible += 1
    green_ratio = green_visible / max(1, visible) * 100
    side_margin = 0 if not bbox else min(bbox[0], image.width - bbox[2])
    cond = (
        image.size == (360, 360)
        and bbox is not None
        and bbox[1] >= 8
        and side_margin >= 8
        and opaque >= min_opaque
        and semi <= 0.1
        and green_ratio <= max_green
        and all(image.getpixel(p)[3] == 0 for p in ((0, 0), (359, 0), (0, 359), (359, 359)))
    )
    print(
        f"{'OK' if cond else 'NG'} {path.name}: bbox={bbox} side_margin={side_margin} "
        f"opaque={opaque:.1f}% semi={semi:.2f}% green_visible={green_ratio:.3f}%"
    )
    return cond


ok = True
print("\n=== character stand/bust asset oracle ===\n")

for key in CHARS:
    ok = validate_green_source(GREENBACK_DIR / f"{key}_stand_green.png", min_margin=45) and ok
    ok = validate_green_source(GREENBACK_DIR / f"{key}_bust_green.png", min_margin=0) and ok
    for ext in FORMATS:
        ok = validate_alpha_asset(ASSET_DIR / f"{key}_stand.{ext}", min_opaque=15) and ok
        ok = validate_alpha_asset(ASSET_DIR / f"{key}_bust.{ext}", min_opaque=30) and ok

print("\n" + ("OK character stand/bust assets are separated and intact" if ok else "NG character asset regression detected"))
raise SystemExit(0 if ok else 1)
