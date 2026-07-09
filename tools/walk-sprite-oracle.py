#!/usr/bin/env python3
"""全歩行シートが4方向x4コマで、各コマに実差分があることを検査する。"""

from hashlib import sha256
from pathlib import Path
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / "assets" / "characters" / "sprites"
FRAME_W = 72
FRAME_H = 92
COLS = 4
ROWS = 4


def frame_hash(image: Image.Image, col: int, row: int) -> str:
    box = (col * FRAME_W, row * FRAME_H, (col + 1) * FRAME_W, (row + 1) * FRAME_H)
    return sha256(image.crop(box).tobytes()).hexdigest()


def main() -> int:
    sheets = sorted(SPRITE_DIR.glob("*_walk.png"))
    failures = []

    print("\n=== 歩行スプライト全件検査 ===\n")
    for path in sheets:
        image = Image.open(path).convert("RGBA")
        if image.size != (FRAME_W * COLS, FRAME_H * ROWS):
            failures.append(f"{path.name}: size={image.size}")
            continue

        unique_per_row = []
        empty_frames = 0
        for row in range(ROWS):
            hashes = set()
            for col in range(COLS):
                frame = image.crop((col * FRAME_W, row * FRAME_H, (col + 1) * FRAME_W, (row + 1) * FRAME_H))
                if frame.getchannel("A").getbbox() is None:
                    empty_frames += 1
                hashes.add(frame_hash(image, col, row))
            unique_per_row.append(len(hashes))

        ok = unique_per_row == [4, 4, 4, 4] and empty_frames == 0
        print(f"{'OK' if ok else 'NG'} {path.name}: directions={unique_per_row} empty={empty_frames}")
        if not ok:
            failures.append(f"{path.name}: unique={unique_per_row}, empty={empty_frames}")

    print(f"\n検査枚数={len(sheets)} / 不合格={len(failures)}")
    if failures:
        for failure in failures:
            print(f"  {failure}")
        return 1
    print("PASS: 全歩行シートが4方向x4コマの実画像として成立")
    return 0


if __name__ == "__main__":
    sys.exit(main())
