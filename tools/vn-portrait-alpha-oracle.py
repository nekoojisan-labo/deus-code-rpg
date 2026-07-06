#!/usr/bin/env python3
"""Validate VN portrait alpha is reserved for background cutout, not character opacity."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "characters"
CHARS = ["kaito", "akari", "riku", "yami"]
FORMATS = ["png", "webp"]

ok = True
print("\n=== VN portrait alpha oracle ===\n")

for key in CHARS:
    for ext in FORMATS:
        path = ASSET_DIR / f"{key}_portrait_vn.{ext}"
        im = Image.open(path).convert("RGBA")
        alpha = list(im.getchannel("A").getdata())
        total = len(alpha)
        opaque = sum(1 for a in alpha if a >= 250) / total * 100
        semi = sum(1 for a in alpha if 1 <= a < 250) / total * 100
        cond = im.size == (240, 320) and semi <= 0.1 and opaque >= 20
        print(f"{'OK' if cond else 'NG'} {path.name}: size={im.size} opaque={opaque:.1f}% semi={semi:.2f}%")
        ok = ok and cond

print("\n" + ("OK all VN portraits are opaque where visible" if ok else "NG alpha regression detected"))
raise SystemExit(0 if ok else 1)
