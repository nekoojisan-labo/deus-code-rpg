"""歩行シート(*_walk.png)の列0から、待機用の呼吸4コマ(*_idle.png)を画像処理だけで作る。

やり方(種類ごとに同じ規則・乱数なし・再実行で同じ結果):
  1. 各方向の列0から、縦に連続した最大の不透明の塊を「本体」とする
     (歩行シートの横向きには上下の別コマの欠片が混ざっているため、それを本体に数えない)。
  2. 本体の高さの 45%〜65% の範囲で、上下の行の色の差がいちばん小さい行を境目 B に選ぶ
     (胴のあたり。体格の違う老人・子ども・店員でも割合で決まる)。
  3. B より上だけを1px上げる(行 B-1 を1行複製)/1px下げる(行 B-1 を1行削る)。
     B から下(足元)は全コマで1画素も動かさない。幅は変えない。
  4. 4コマの並び:
       標準     0 / 下げ / 0 / 上げ
       上端接触 0 / 下げ / 下げ / 0   (列0の1行目に絵がある=頭が枠で切れている向き。
                                      上げると頭がさらに1行欠けるため、下げだけで呼吸させる)
出力: assets/characters/sprites/<名前>_idle.png (288x368・4列x4行・透過)。
"""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITE_DIR = ROOT / "assets" / "characters" / "sprites"

FRAME_W = 72
FRAME_H = 92
COLS = 4
ROWS = 4
SEAM_RANGE = (0.45, 0.65)
STANDARD_CYCLE = (0, 1, 0, -1)    # +1 = 上半身を1px下げる(縮む) / -1 = 1px上げる(伸びる)
TOP_CLIPPED_CYCLE = (0, 1, 1, 0)


def main_segment(alpha: np.ndarray) -> tuple[int, int]:
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


def choose_seam(frame: np.ndarray) -> int:
    """境目 B(この行から下は動かさない)。本体の45〜65%で上下の行の差が最小の行。"""
    top, foot = main_segment(frame[..., 3])
    height = foot - top
    lo = top + int(round(height * SEAM_RANGE[0]))
    hi = top + int(round(height * SEAM_RANGE[1]))
    px = frame.astype(np.int32)
    best, best_cost = lo, None
    for b in range(max(lo, 2), hi + 1):
        cost = int(np.abs(px[b] - px[b - 1]).sum())
        if best_cost is None or cost < best_cost:
            best, best_cost = b, cost
    return best


def shift_upper(frame: np.ndarray, seam: int, offset: int) -> np.ndarray:
    out = frame.copy()
    if offset == 1:      # 上半身を1px下げる: 行 seam-1 を削り、最上行は透明
        out[1:seam] = frame[0:seam - 1]
        out[0] = 0
    elif offset == -1:   # 上半身を1px上げる: 行 seam-1 を複製
        out[0:seam - 1] = frame[1:seam]
        out[seam - 1] = frame[seam - 1]
    return out


def build_idle_sheet(walk: Image.Image) -> tuple[Image.Image, list[dict]]:
    src = np.array(walk.convert("RGBA"))
    sheet = np.zeros((FRAME_H * ROWS, FRAME_W * COLS, 4), dtype=np.uint8)
    notes = []
    for row in range(ROWS):
        y0 = row * FRAME_H
        base = src[y0:y0 + FRAME_H, 0:FRAME_W]
        seam = choose_seam(base)
        top_clipped = bool((base[0, :, 3] > 0).any())
        cycle = TOP_CLIPPED_CYCLE if top_clipped else STANDARD_CYCLE
        for col, offset in enumerate(cycle):
            sheet[y0:y0 + FRAME_H, col * FRAME_W:(col + 1) * FRAME_W] = shift_upper(base, seam, offset)
        notes.append({"row": row, "seam": seam, "mode": "top_clipped" if top_clipped else "standard"})
    return Image.fromarray(sheet, "RGBA"), notes


def main() -> None:
    walks = sorted(SPRITE_DIR.glob("*_walk.png"))
    for walk_path in walks:
        walk = Image.open(walk_path)
        if walk.size != (FRAME_W * COLS, FRAME_H * ROWS):
            print(f"skip {walk_path.name}: size={walk.size}")
            continue
        sheet, notes = build_idle_sheet(walk)
        out_path = SPRITE_DIR / walk_path.name.replace("_walk.png", "_idle.png")
        sheet.save(out_path, optimize=True)
        summary = " ".join(f"r{n['row']}:B{n['seam']}{'*' if n['mode'] != 'standard' else ''}" for n in notes)
        print(f"wrote {out_path.relative_to(ROOT)}  {summary}")


if __name__ == "__main__":
    main()
