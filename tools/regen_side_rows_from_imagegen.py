"""横向き(左・右)の歩行行を、画像生成の結果から作り直す後処理。

重要: 画像の生成そのものはこのスクリプトでは再現できない。
  生成は Codex CLI 内蔵の image_gen（API 鍵なし・`codex exec -s workspace-write --json`）で行い、
  手本は view_image で読ませ、背景はマゼンタ #FF00FF、4コマを横1列に描かせた。
  生成の元画像（マゼンタ背景の PNG）はリポジトリに入れていない。
  ここに入っているのは、その前後の決まった処理だけ:
    refs  : 手本づくり（下向きの行と今の左・右を 8 倍・マゼンタ地にした PNG）
    build : マゼンタ抜き → 4コマに分ける → 面積平均で縮小 → 下向きの行の色へ寄せる →
            不透明度を2値化 → 足の底 y=87・頭の中心 x を4コマで揃えて置く。
            後ろ向きの行は、右向きのコマ下端に残っていた頭のてっぺんの切れ端を
            後ろ向きの人物へつなぎ直す（画素の並べ直しだけ・塗らない）。
            下向きの行（y=0..87）は1画素も変えない。

使い方:
  python tools/regen_side_rows_from_imagegen.py refs  KIND OUTDIR --left-top Y --right-foot Y
  python tools/regen_side_rows_from_imagegen.py build KIND --left RAW_L.png --right RAW_R.png \
         --height H --out OUT_walk.png [--chroma-script PATH]
マゼンタ抜きには Codex の imagegen スキル同梱の remove_chroma_key.py を使う
（既定: ~/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py）。
Pillow / numpy / 標準ライブラリだけを使う。
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "characters" / "sprites"
W, H, FOOT = 72, 92, 87
HEAD_ROWS = 28  # 頭の中心 x を測る行数（人物の上端から）
MAGENTA = (255, 0, 255)
DEFAULT_KEY = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"


def load(kind, sprites=SPRITES):
    a = np.array(Image.open(Path(sprites) / f"{kind}_walk.png").convert("RGBA"))
    if a.shape != (H * 4, W * 4, 4):
        raise ValueError(f"{kind}: expected 288x368")
    return a


def on_magenta(rgba, scale=8):
    bg = Image.new("RGBA", (rgba.shape[1], rgba.shape[0]), MAGENTA + (255,))
    bg.alpha_composite(Image.fromarray(rgba))
    return bg.convert("RGB").resize((rgba.shape[1] * scale, rgba.shape[0] * scale), Image.NEAREST)


def cmd_refs(args):
    a = load(args.kind, args.sprites)
    out = Path(args.outdir)
    out.mkdir(parents=True, exist_ok=True)
    on_magenta(a[0:FOOT + 1]).save(out / "ref_down_x8.png")
    # 横向きはシート全体から、頭の上まで含めて切る（上下の端に隣の行の欠片が入ることがある）
    lt = args.left_top
    on_magenta(a[lt - 2:lt + 92]).save(out / "ref_left_x8.png")
    rf = args.right_foot
    on_magenta(a[rf - 92:rf + 3]).save(out / "ref_right_x8.png")
    print("wrote", out)


def chroma_key(raw, script, despill=True):
    """despill は紫の多い絵では紫を灰色に変えてしまうので --keep-spill で切る。"""
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "key.png"
        opts = ["--auto-key", "border", "--soft-matte"] + (["--despill"] if despill else [])
        subprocess.run([sys.executable, str(script), "--input", str(raw), "--out", str(out), *opts, "--force"],
                       check=True, capture_output=True)
        return np.array(Image.open(out).convert("RGBA"))


def split4(a):
    """生成画像を左から4人に分ける（不透明な列の塊を4つにまとめる）。"""
    al = a[..., 3] >= 128
    colany = al.any(0)
    runs, x = [], 0
    while x < len(colany):
        if colany[x]:
            s = x
            while x < len(colany) and colany[x]:
                x += 1
            runs.append((s, x))
        x += 1
    runs = [r for r in runs if r[1] - r[0] > 20]
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < 25:
            merged[-1] = (merged[-1][0], r[1])
        else:
            merged.append(r)
    if len(merged) != 4:
        raise ValueError(f"expected 4 figures, got {merged}")
    boxes = []
    for x0, x1 in merged:
        rows = np.where(al[:, x0:x1].any(1))[0]
        boxes.append((x0, int(rows.min()), x1, int(rows.max()) + 1))
    return boxes


def palette_of_down(sheet):
    down = sheet[0:FOOT + 1]
    px = down[down[..., 3] >= 128][:, :3]
    return np.unique(px, axis=0).astype(np.float32)


def to_palette(arr, pal):
    rgb = arr[..., :3].reshape(-1, 3).astype(np.float32)
    idx = np.empty(len(rgb), np.int64)
    for i in range(0, len(rgb), 4096):
        d = ((rgb[i:i + 4096, None, :] - pal[None]) ** 2).sum(2)
        idx[i:i + 4096] = d.argmin(1)
    out = arr.copy()
    out[..., :3] = pal[idx].reshape(arr.shape[0], arr.shape[1], 3).astype(np.uint8)
    return out


def box_resize(crop, nw, nh):
    """色をアルファで乗算してから面積平均（縁の黒ずみ・マゼンタ残りを防ぐ）。"""
    c = np.array(crop).astype(np.float32)
    pm = c.copy()
    pm[..., :3] *= c[..., 3:4] / 255
    rsp = np.array(Image.fromarray(pm.astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32)
    al = np.array(Image.fromarray(c[..., 3].astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32)
    rgb = np.where(al[..., None] > 0, rsp[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    return np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8)


def head_cx(fig):
    al = fig[..., 3] > 0
    top = int(np.where(al.any(1))[0].min())
    cols = np.where(al[top:top + HEAD_ROWS].any(0))[0]
    return float(cols.mean())


def build_row(keyed, pal, target_h):
    boxes = split4(keyed)
    scale = target_h / float(np.median([b[3] - b[1] for b in boxes]))
    figs = []
    for b in boxes:
        crop = Image.fromarray(keyed).crop(b)
        nw, nh = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
        rs = to_palette(box_resize(crop, nw, nh), pal)
        rs[..., 3] = np.where(rs[..., 3] >= 128, 255, 0)
        al = rs[..., 3] > 0
        rows = np.where(al.any(1))[0]
        cols = np.where(al.any(0))[0]
        figs.append(rs[rows.min():rows.max() + 1, cols.min():cols.max() + 1])
    # 頭の中心 x を4コマで同じ位置に置く（目標は外枠中央に置いた時の頭の中心の中央値）
    hcs = [head_cx(f) for f in figs]
    target = round(float(np.median([round((W - f.shape[1]) / 2) + hc for f, hc in zip(figs, hcs)])))
    cells, placed = [], []
    for f, hc in zip(figs, hcs):
        h, w = f.shape[:2]
        oy = FOOT + 1 - h
        ox = int(round(target - hc))
        if oy < 1 or ox < 0 or ox + w > W:
            raise ValueError(f"figure {w}x{h} does not fit at ({ox},{oy})")
        cell = np.zeros((H, W, 4), np.uint8)
        cell[oy:oy + h, ox:ox + w] = f
        cells.append(cell)
        placed.append(dict(x=ox, y=oy, w=w, h=h))
    return np.concatenate(cells, 1), dict(boxes=boxes, scale=scale, placed=placed)


def rejoin_up_row(sheet):
    """後ろ向きの行を作り直す: 右向きのコマ下端（y 240..275 の最後の塊）にある頭のてっぺんと
    後ろ向きの本体を、間の空行だけ詰めてつなぎ、足の底 y=87 に置く。画素は並べ直すだけ。"""
    out = np.zeros((H, W * 4, 4), np.uint8)
    notes = []
    for c in range(4):
        strip = sheet[:, c * W:(c + 1) * W]
        al = strip[..., 3] > 0
        ys = np.flatnonzero(al[240:276].any(1)) + 240
        runs = [g for g in np.split(ys, np.flatnonzero(np.diff(ys) > 1) + 1) if len(g)]
        if len(runs) < 2:
            raise ValueError(f"col {c}: no isolated up head fragment")
        up_start = int(runs[-1][0])
        yy, xx = np.where(al & (np.arange(H * 4)[:, None] >= up_start))
        used = np.unique(yy)
        rel = np.searchsorted(used, yy)
        top = FOOT - len(used) + 1
        if top < 1:
            raise ValueError(f"col {c}: up figure does not fit")
        out[top + rel, c * W + xx] = strip[yy, xx]
        notes.append(dict(col=c, fragment_start=up_start, rows=len(used), top=top,
                          removed_empty_rows=int(yy.max() - yy.min() + 1 - len(used))))
    return out, notes


def cmd_build(args):
    sheet = load(args.kind, args.sprites)
    pal = palette_of_down(sheet)
    new = np.zeros_like(sheet)
    new[0:FOOT + 1] = sheet[0:FOOT + 1]  # 下向きの人物（y=0..87）はそのまま
    info = {}
    for name, raw, row in (("left", args.left, 1), ("right", args.right, 2)):
        keyed = chroma_key(raw, args.chroma_script, not args.keep_spill)
        cells, info[name] = build_row(keyed, pal, args.height)
        new[row * H:(row + 1) * H] = cells
    new[3 * H:4 * H], info["up"] = rejoin_up_row(sheet)
    Image.fromarray(new).save(args.out)
    print(json.dumps(info, default=float))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--sprites", type=Path, default=SPRITES, help="入力の歩行シートのフォルダ")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("refs")
    r.add_argument("kind"); r.add_argument("outdir")
    r.add_argument("--left-top", type=int, required=True)
    r.add_argument("--right-foot", type=int, required=True)
    b = sub.add_parser("build")
    b.add_argument("kind")
    b.add_argument("--left", type=Path, required=True)
    b.add_argument("--right", type=Path, required=True)
    b.add_argument("--height", type=int, required=True)
    b.add_argument("--out", type=Path, required=True)
    b.add_argument("--chroma-script", type=Path, default=DEFAULT_KEY)
    b.add_argument("--keep-spill", action="store_true", help="マゼンタ抜きで despill をしない（紫の多い絵）")
    args = p.parse_args()
    {"refs": cmd_refs, "build": cmd_build}[args.cmd](args)


if __name__ == "__main__":
    main()
