from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "objects"


def rgba(hex_color, alpha=255):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def shadow(draw, cx, cy, rx, ry):
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(0, 0, 0, 100))


def neon_line(draw, pts, color, width=2):
    glow = rgba(color, 90)
    draw.line(pts, fill=glow, width=width + 4, joint="curve")
    draw.line(pts, fill=rgba(color), width=width, joint="curve")


def save_with_webp(img, stem):
    png = OUT / f"{stem}.png"
    webp = OUT / f"{stem}.webp"
    img.save(png)
    img.save(webp, "WEBP", quality=92, method=6, lossless=False)
    print(f"wrote {png.relative_to(ROOT)}")
    print(f"wrote {webp.relative_to(ROOT)}")


def post_box():
    img = Image.new("RGBA", (80, 96), (0, 0, 0, 0))
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((18, 18, 62, 83), radius=7, fill=rgba("#ff336a", 62))
    glow = glow.filter(ImageFilter.GaussianBlur(5))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    shadow(d, 40, 86, 24, 6)
    d.rounded_rectangle((20, 17, 60, 82), radius=5, fill=rgba("#111a2a"), outline=rgba("#ff6e9c"), width=2)
    d.rectangle((24, 23, 56, 39), fill=rgba("#263b59"), outline=rgba("#9ffcff"))
    d.rectangle((26, 44, 54, 50), fill=rgba("#050812"), outline=rgba("#ffd5e3"))
    d.rectangle((27, 54, 53, 72), fill=rgba("#16263a"), outline=rgba("#2cd8ff"))
    d.polygon([(30, 58), (40, 65), (50, 58), (50, 70), (30, 70)], fill=rgba("#0b1422"), outline=rgba("#94faff"))
    d.ellipse((35, 29, 45, 39), fill=rgba("#56f6ff"), outline=rgba("#f4ffff"))
    d.rectangle((25, 80, 55, 85), fill=rgba("#080d16"), outline=rgba("#375a75"))
    return img


def sacred_relic():
    img = Image.new("RGBA", (88, 116), (0, 0, 0, 0))
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon([(44, 8), (66, 45), (56, 95), (32, 95), (22, 45)], fill=rgba("#2dfaff", 56))
    gd.ellipse((25, 28, 63, 66), fill=rgba("#ffe15d", 42))
    glow = glow.filter(ImageFilter.GaussianBlur(7))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    shadow(d, 44, 101, 26, 7)
    d.polygon([(44, 10), (64, 44), (56, 92), (32, 92), (24, 44)], fill=rgba("#122334"), outline=rgba("#ffe36f"))
    d.polygon([(44, 20), (56, 45), (51, 82), (37, 82), (32, 45)], fill=rgba("#183d4f"), outline=rgba("#5ff8ff"))
    d.ellipse((34, 37, 54, 57), fill=rgba("#8ffcff"), outline=rgba("#f7ffff"), width=2)
    d.line((44, 21, 44, 83), fill=rgba("#fff1a5"), width=2)
    d.rectangle((26, 92, 62, 100), fill=rgba("#0d1724"), outline=rgba("#ffdc72"), width=2)
    d.line((20, 45, 68, 45), fill=rgba("#42eaff"), width=2)
    return img


def save_point():
    img = Image.new("RGBA", (72, 88), (0, 0, 0, 0))
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((10, 18, 62, 70), fill=rgba("#25f4ff", 60))
    glow = glow.filter(ImageFilter.GaussianBlur(8))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    shadow(d, 36, 77, 22, 6)
    d.ellipse((15, 24, 57, 66), fill=rgba("#111b2c"), outline=rgba("#52f7ff"), width=2)
    d.polygon([(36, 17), (45, 34), (60, 43), (45, 52), (36, 69), (27, 52), (12, 43), (27, 34)], fill=rgba("#132b42"), outline=rgba("#dfffff"))
    d.ellipse((29, 36, 43, 50), fill=rgba("#78fbff"), outline=rgba("#f8ffff"), width=2)
    d.line((36, 18, 36, 68), fill=rgba("#ffe76f"), width=2)
    d.line((13, 43, 59, 43), fill=rgba("#43f2ff"), width=2)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    save_with_webp(post_box(), "post_box")
    save_with_webp(sacred_relic(), "sacred_relic")
    save_with_webp(save_point(), "save_point")


if __name__ == "__main__":
    main()
