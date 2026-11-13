# この19枚専用の座標指定を含む。未解決3種（banker・dark_merchant・npc_citizen_female）は入力のまま出す。
"""Rearrange the supplied 72x92 walk assets; never resample or paint pixels.

Usage: python fix_walk_row_seams.py INPUT_DIR OUTPUT_DIR
The contact contours below are asset-specific, manually inspected coordinates,
not a general image segmentation model. See report.md for unresolved ownership.
Only Pillow/numpy and the Python standard library are used.
"""
from pathlib import Path
import argparse
import json
import shutil
import numpy as np
from PIL import Image

HEALTHY = {'citizen','kaito','merchant_item','npc_elder','npc_resident','npc_worker'}
KINDS = {'akari','banker','dark_merchant','guildmaster','innkeeper','merchant_armor',
         'merchant_magic','merchant_weapon','npc_citizen_female','npc_citizen_male',
         'npc_priest','riku','yami'}
DIRS = ('down','left','right','up')
UNRESOLVED = {'banker','dark_merchant','npc_citizen_female'}

def row_runs(mask):
    ys=np.flatnonzero(mask.any(axis=1))
    return [g for g in np.split(ys,np.flatnonzero(np.diff(ys)>1)+1) if len(g)]

def contact_contour(kind, col):
    """First row owned by the right figure, at each x; observed contour."""
    edge=np.full(72,180,dtype=int)
    if kind in UNRESOLVED:
        raise ValueError(f'{kind}: ownership not established; no speculative cut')
    if kind=='riku':edge[:]=170
    elif kind=='innkeeper':
        if col in (0,2):edge[44:46]=179
        elif col==1:
            edge[35:42]=179
            edge[46:49]=179
    return edge

def split_column(strip,kind,col):
    h,w=strip.shape[:2];yy=np.arange(h)[:,None]
    alpha=strip[:,:,3]>0
    # Front baseline is explicitly supplied as the independent reference.
    # This asset also has detached front soles at y=90..92. They are two
    # narrow shoe-colored blobs, not the following head (which starts 98+).
    front_end=94 if kind=='npc_citizen_male' else 88
    front=alpha & (yy<front_end)
    seam=contact_contour(kind,col)[None,:]
    # The last isolated run before row 276 is the up-facing head fragment.
    runs=row_runs(alpha & (yy>=240) & (yy<276))
    if len(runs)<2:raise ValueError(f'{kind}/{col}: no isolated up head')
    up_start=int(runs[-1][0])
    left=alpha & (yy>=front_end) & (yy<seam)
    right=alpha & (yy>=seam) & (yy<up_start)
    up=alpha & (yy>=up_start)
    masks=[front,left,right,up]
    assert np.all(sum(m.astype(int) for m in masks)==alpha.astype(int))
    return masks

def fix_sheet(source,kind):
    if source.shape!=(368,288,4):raise ValueError('Expected 288x368 RGBA')
    dest=np.zeros_like(source); evidence=[]
    for col in range(4):
        strip=source[:,col*72:(col+1)*72]
        result=dest[:,col*72:(col+1)*72]
        masks=split_column(strip,kind,col)
        baseline=int(np.where(masks[0][:88])[0].max())
        for row,mask in enumerate(masks):
            ys,xs=np.where(mask)
            used=np.unique(ys)
            compact=(row==3 or (kind=='npc_citizen_male' and row==0))
            if compact:
                # Join only the observed split head; do not remove occupied rows.
                relative=np.searchsorted(used,ys)
                height=len(used)
            else:
                relative=ys-int(ys.min());height=int(ys.max()-ys.min()+1)
            top=baseline-height+1
            if top<1:raise ValueError(f'{kind}/{row}/{col}: cannot fit unclipped')
            dy=row*92+top+relative
            if np.any(result[dy,xs,3]):raise ValueError('Pixel collision')
            result[dy,xs]=strip[ys,xs]
            evidence.append(dict(direction=DIRS[row],frame=col,source_top=int(ys.min()),
                source_bottom=int(ys.max()),height=height,target_top=top,foot=baseline,
                pixels=len(ys),removed_empty_rows=int(ys.max()-ys.min()+1-height)))
        # Preserve even RGB values behind alpha=0. No color/alpha tuple changes.
        result[result[:,:,3]==0]=strip[strip[:,:,3]==0]
        assert np.count_nonzero(result[:,:,3])==np.count_nonzero(strip[:,:,3])
    return dest,evidence

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('input_dir',type=Path);p.add_argument('output_dir',type=Path)
    args=p.parse_args()
    if args.input_dir.resolve()==args.output_dir.resolve():p.error('Input and output must differ')
    args.output_dir.mkdir(parents=True,exist_ok=True)
    metadata={}
    files=sorted(args.input_dir.glob('*_walk.png'))
    if {f.stem[:-5] for f in files}!=KINDS|HEALTHY:raise ValueError('Expected exactly the supplied 19 kinds')
    for path in files:
        kind=path.stem[:-5];target=args.output_dir/path.name
        if kind in HEALTHY or kind in UNRESOLVED:
            shutil.copyfile(path,target)
            metadata[kind]={'copied':True,'status':'UNRESOLVED' if kind in UNRESOLVED else 'HEALTHY'}
            continue
        src=np.array(Image.open(path).convert('RGBA'))
        output,cells=fix_sheet(src,kind)
        Image.fromarray(output).save(target)
        metadata[kind]={'copied':False,'status':'REARRANGED','cells':cells}
    (args.output_dir/'rearrangement.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    print(f'Wrote {len(files)} sheets: 10 rearranged, 6 healthy copies, 3 UNRESOLVED original copies.')
    return 2 if UNRESOLVED else 0

if __name__=='__main__':raise SystemExit(main())
