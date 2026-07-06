#!/usr/bin/env python3
"""Validate VN portrait alpha is reserved for background cutout, not character opacity."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "characters"
CHARS = ["kaito", "akari", "riku", "yami"]
FORMATS = ["png", "webp"]

ok = True
print("\n=== VN portrait alpha oracle ===\n")


def estimate_internal_hole_ratio(alpha):
    """Estimate transparent holes inside a portrait silhouette."""
    mask = alpha.point(lambda v: 255 if v > 0 else 0)
    closed = mask.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11))
    inv = ImageChops.invert(closed)
    ImageDraw.floodfill(inv, (0, 0), 128, thresh=0)
    outside = inv.point(lambda v: 255 if v == 128 else 0)
    silhouette = ImageChops.invert(outside)
    holes = ImageChops.subtract(silhouette, mask)
    hole_px = sum(1 for a in holes.getdata() if a > 0)
    fg_px = sum(1 for a in mask.getdata() if a > 0)
    return (hole_px / max(1, fg_px)) * 100

for key in CHARS:
    for ext in FORMATS:
        path = ASSET_DIR / f"{key}_portrait_vn.{ext}"
        im = Image.open(path).convert("RGBA")
        alpha = list(im.getchannel("A").getdata())
        alpha_channel = im.getchannel("A")
        total = len(alpha)
        opaque = sum(1 for a in alpha if a >= 250) / total * 100
        semi = sum(1 for a in alpha if 1 <= a < 250) / total * 100
        holes = estimate_internal_hole_ratio(alpha_channel)
        cond = im.size == (240, 320) and semi <= 0.1 and opaque >= 20 and holes <= 1.0
        print(f"{'OK' if cond else 'NG'} {path.name}: size={im.size} opaque={opaque:.1f}% semi={semi:.2f}% holes={holes:.2f}%")
        ok = ok and cond

print("\n" + ("OK all VN portraits are opaque where visible" if ok else "NG alpha regression detected"))
raise SystemExit(0 if ok else 1)
