#!/usr/bin/env python3
"""待機シート(*_idle.png)が歩行シートの列0から作られた「呼吸程度」の4コマであることを検査する。

守ること:
  - 歩行シートごとに同名の待機シートがあり、288x368・透過あり
  - 各方向の列0は歩行シートの列0と1画素も違わない(歩行⇄待機の切替で跳ねない)
  - 足元の帯(本体の下25%とその下)は4コマで完全一致
  - 不透明部分の外接矩形: 左右は不変、上下は列0から1px以内
  - 不透明画素数の変化は1行ぶん(72)以内(崩れ・欠けの歯止め)
  - 4コマのうち少なくとも1コマは列0と違う(実際に動く)
"""

from pathlib import Path
import sys

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / "assets" / "characters" / "sprites"
FRAME_W = 72
FRAME_H = 92
COLS = 4
ROWS = 4
FOOT_BAND_RATIO = 0.75


def main_segment(alpha: np.ndarray) -> tuple[int, int]:
    """縦方向に連続した不透明の塊のうち最大のもの(上下に混ざった他コマの欠片を除く)。"""
    occ = (alpha > 0).sum(axis=1)
    segs, start = [], None
    for y in range(alpha.shape[0]):
        if occ[y] > 0 and start is None:
            start = y
        if occ[y] == 0 and start is not None:
            segs.append((start, y - 1))
            start = None
    if start is not None:
        segs.append((start, alpha.shape[0] - 1))
    return max(segs, key=lambda s: int(occ[s[0]:s[1] + 1].sum()))


def bbox(alpha: np.ndarray):
    ys, xs = np.where(alpha > 0)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def main() -> int:
    walks = sorted(SPRITE_DIR.glob("*_walk.png"))
    failures = []
    print("\n=== 待機スプライト全件検査 ===\n")
    if not walks:
        print("NG 歩行シートが見つからない")
        return 1

    for walk_path in walks:
        name = walk_path.name.replace("_walk.png", "")
        idle_path = SPRITE_DIR / f"{name}_idle.png"
        if not idle_path.exists():
            failures.append(f"{idle_path.name}: ファイルが無い")
            print(f"NG {idle_path.name}: ファイルが無い")
            continue
        idle_img = Image.open(idle_path)
        if idle_img.size != (FRAME_W * COLS, FRAME_H * ROWS):
            failures.append(f"{idle_path.name}: size={idle_img.size}")
            print(f"NG {idle_path.name}: size={idle_img.size}")
            continue
        if idle_img.mode != "RGBA":
            failures.append(f"{idle_path.name}: mode={idle_img.mode}")
        idle = np.array(idle_img.convert("RGBA"))
        walk = np.array(Image.open(walk_path).convert("RGBA"))
        if not (idle[..., 3] < 255).any():
            failures.append(f"{idle_path.name}: 透過が無い")

        problems = []
        for row in range(ROWS):
            y0 = row * FRAME_H
            ref = walk[y0:y0 + FRAME_H, 0:FRAME_W]
            frames = [idle[y0:y0 + FRAME_H, c * FRAME_W:(c + 1) * FRAME_W] for c in range(COLS)]
            if not np.array_equal(frames[0], ref):
                problems.append(f"row{row}: 列0が歩行シートの列0と不一致")
                continue
            top, foot = main_segment(ref[..., 3])
            band = top + int(round((foot - top) * FOOT_BAND_RATIO))
            rb = bbox(ref[..., 3])
            ref_count = int((ref[..., 3] > 0).sum())
            moved = 0
            for c, fr in enumerate(frames[1:], start=1):
                if not np.array_equal(fr[band:], ref[band:]):
                    problems.append(f"row{row} col{c}: 足元の帯(y>={band})が動いた")
                if fr[..., 3].max() == 0:
                    problems.append(f"row{row} col{c}: 空のコマ")
                    continue
                b = bbox(fr[..., 3])
                if b[0] != rb[0] or b[2] != rb[2]:
                    problems.append(f"row{row} col{c}: 左右の外接が変化 {rb}->{b}")
                if abs(b[1] - rb[1]) > 1 or abs(b[3] - rb[3]) > 1:
                    problems.append(f"row{row} col{c}: 上下の外接が1pxを超えて変化 {rb}->{b}")
                cnt = int((fr[..., 3] > 0).sum())
                if abs(cnt - ref_count) > FRAME_W:
                    problems.append(f"row{row} col{c}: 不透明画素数の変化が大きい {ref_count}->{cnt}")
                if not np.array_equal(fr, ref):
                    moved += 1
            if moved == 0:
                problems.append(f"row{row}: 4コマとも列0と同じ(動かない)")

        ok = not problems
        print(f"{'OK' if ok else 'NG'} {idle_path.name}" + ("" if ok else f": {problems[:3]}"))
        failures.extend(f"{idle_path.name}: {p}" for p in problems)

    print(f"\n検査枚数={len(walks)} / 不合格={len(failures)}")
    if failures:
        for failure in failures[:40]:
            print(f"  {failure}")
        return 1
    print("PASS: 全待機シートが列0一致・足元固定・上下1px以内の呼吸4コマとして成立")
    return 0


if __name__ == "__main__":
    sys.exit(main())
