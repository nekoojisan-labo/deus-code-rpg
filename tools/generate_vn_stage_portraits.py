#!/usr/bin/env python3
"""Build character display assets from full-body green-screen source art.

Asset roles:
- *_stand: full-body standing art.
- *_bust: shared bust-up art for VN dialogue and the status/menu screen.

The green-screen sources are the canonical character images. Old dark-background
portrait cutouts are intentionally not used because they erased faces, hair,
shoulders, and cloak edges.
"""
from pathlib import Path
from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "characters"
GREENBACK_DIR = ASSET_DIR / "source" / "greenback"
CHARS = ["kaito", "akari", "riku", "yami"]

CANVAS_W = 360
CANVAS_H = 360
STAND_MAX_W = 300
STAND_MAX_H = 342
BUST_MAX_W = 340
BUST_MAX_H = 342
GREEN_COMPONENT_MIN = 8
BUST_PAD_X_RATIO = 0.16
BUST_TOP_PAD_RATIO = 0.03
BUST_CROP_HEIGHT_RATIO = 0.40


def is_green_key(r, g, b):
    return g >= 118 and (g - max(r, b)) >= 34 and r <= 140 and b <= 140


def alpha_bbox(image):
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("empty alpha mask")
    return bbox


def prune_small_alpha_components(image, min_component):
    width, height = image.size
    pixels = image.load()
    seen = set()
    keep = set()

    for sx in range(width):
        for sy in range(height):
            if (sx, sy) in seen or pixels[sx, sy][3] == 0:
                continue
            queue = deque([(sx, sy)])
            seen.add((sx, sy))
            component = []
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if (
                        0 <= nx < width
                        and 0 <= ny < height
                        and (nx, ny) not in seen
                        and pixels[nx, ny][3] > 0
                    ):
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(component) >= min_component:
                keep.update(component)

    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0 and (x, y) not in keep:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)

    return image


def greenback_cutout(path):
    src = Image.open(path).convert("RGBA")
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    src_pixels = src.load()
    out_pixels = out.load()

    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = src_pixels[x, y]
            if a == 0 or is_green_key(r, g, b):
                continue
            green_dominance = g - max(r, b)
            if green_dominance > 20:
                g = min(g, max(r, b) + 18)
            out_pixels[x, y] = (r, g, b, 255)

    return prune_small_alpha_components(out, GREEN_COMPONENT_MIN)


def snap_visible_pixels_opaque(image):
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a > 0:
                pixels[x, y] = (r, g, b, 255)
    return image


def fit_to_canvas(cutout, max_w, max_h, align_bottom=True):
    bbox = alpha_bbox(cutout)
    cropped = cutout.crop(bbox)
    scale = min(max_w / cropped.width, max_h / cropped.height)
    new_w = max(1, round(cropped.width * scale))
    new_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    resized = snap_visible_pixels_opaque(resized)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    x = round((CANVAS_W - new_w) / 2)
    y = CANVAS_H - new_h if align_bottom else round((CANVAS_H - new_h) / 2)
    canvas.alpha_composite(resized, (x, y))
    return canvas, bbox, (new_w, new_h), (x, y)


def bust_cutout_from_stand(stand_cutout):
    bbox = alpha_bbox(stand_cutout)
    x1, y1, x2, y2 = bbox
    body_w = x2 - x1
    body_h = y2 - y1

    # Crop from top of the full-body source down to the upper waist. Horizontal
    # padding keeps shoulders/cloak intact; the lower crop is the intentional
    # bust-up boundary and not a damaged source edge.
    pad_x = round(body_w * BUST_PAD_X_RATIO)
    crop_x1 = max(0, x1 - pad_x)
    crop_x2 = min(stand_cutout.width, x2 + pad_x)
    crop_y1 = max(0, y1 - round(body_h * BUST_TOP_PAD_RATIO))
    crop_y2 = min(stand_cutout.height, y1 + round(body_h * BUST_CROP_HEIGHT_RATIO))
    return stand_cutout.crop((crop_x1, crop_y1, crop_x2, crop_y2))


def save_pair(image, key, kind):
    out_png = ASSET_DIR / f"{key}_{kind}.png"
    out_webp = ASSET_DIR / f"{key}_{kind}.webp"
    image.save(out_png)
    image.save(out_webp, "WEBP", lossless=True, method=6)
    return out_png, out_webp


def save_bust_green_source(key, stand_green_path, stand_cutout):
    bbox = alpha_bbox(stand_cutout)
    x1, y1, x2, y2 = bbox
    body_w = x2 - x1
    body_h = y2 - y1
    pad_x = round(body_w * BUST_PAD_X_RATIO)
    crop = (
        max(0, x1 - pad_x),
        max(0, y1 - round(body_h * BUST_TOP_PAD_RATIO)),
        min(stand_cutout.width, x2 + pad_x),
        min(stand_cutout.height, y1 + round(body_h * BUST_CROP_HEIGHT_RATIO)),
    )
    src = Image.open(stand_green_path).convert("RGBA").crop(crop)
    out = Image.new("RGBA", (src.width, src.height), (0, 255, 0, 255))
    out.alpha_composite(src)
    out.save(GREENBACK_DIR / f"{key}_bust_green.png")


def build_character_assets(key):
    stand_green = GREENBACK_DIR / f"{key}_stand_green.png"
    if not stand_green.exists():
        legacy = GREENBACK_DIR / f"{key}_portrait_green.png"
        if legacy.exists():
            legacy.replace(stand_green)
        else:
            raise FileNotFoundError(f"missing full-body green-screen source: {stand_green}")

    stand_cutout = greenback_cutout(stand_green)
    stand, stand_bbox, stand_size, stand_pos = fit_to_canvas(
        stand_cutout, STAND_MAX_W, STAND_MAX_H, align_bottom=True
    )
    save_pair(stand, key, "stand")

    save_bust_green_source(key, stand_green, stand_cutout)
    bust_cutout = bust_cutout_from_stand(stand_cutout)
    bust, bust_bbox, bust_size, bust_pos = fit_to_canvas(
        bust_cutout, BUST_MAX_W, BUST_MAX_H, align_bottom=True
    )
    save_pair(bust, key, "bust")

    return {
        "key": key,
        "stand_bbox": stand_bbox,
        "stand_size": stand_size,
        "stand_pos": stand_pos,
        "bust_bbox": bust_bbox,
        "bust_size": bust_size,
        "bust_pos": bust_pos,
    }


def main():
    for key in CHARS:
        result = build_character_assets(key)
        print(
            f"{key}: stand_bbox={result['stand_bbox']} stand_size={result['stand_size']} "
            f"stand_pos={result['stand_pos']} bust_size={result['bust_size']} bust_pos={result['bust_pos']}"
        )


if __name__ == "__main__":
    main()
