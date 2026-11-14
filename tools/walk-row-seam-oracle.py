# この19枚専用の座標指定を含む。未解決だった3種（banker・dark_merchant・npc_citizen_female）は横向きを画像生成で描き直したため（regen_side_rows_from_imagegen.py）、npc_priest は顔を埋めたため、画素の保存の検査から外す。
"""Independent cell inspection (does not import the repair implementation).

python check_walk_rows.py INPUT_DIR CANDIDATE_DIR [--json result.json]
python check_walk_rows.py in in --negative-control --json input_check.json
Nonzero exit means FAIL. --negative-control exits 0 only for exactly 13 failing
known defective kinds and 6 passing healthy kinds. Raw per-kind results remain.
"""
from pathlib import Path
from collections import deque
import argparse,hashlib,json
import numpy as np
from PIL import Image

HEALTHY={'citizen','kaito','merchant_item','npc_elder','npc_resident','npc_worker'}
BROKEN={'akari','banker','dark_merchant','guildmaster','innkeeper','merchant_armor',
        'merchant_magic','merchant_weapon','npc_citizen_female','npc_citizen_male',
        'npc_priest','riku','yami'}
DIRS=('down','left','right','up')
# 横向きを画像生成で描き直した種類（tools/regen_side_rows_from_imagegen.py）と、
# 透けた顔を同じ向きの正常なコマの画素で埋めた npc_priest は、画素の保存の検査の対象外。
# 代わりに下向きの人物（y=0..87）が入力と同じ画素であることを確かめる。足の底・上端・欠片の検査はそのまま。
REDRAWN={'banker','dark_merchant','npc_citizen_female','npc_priest'}
# Exact natural-height exceptions, not a free tolerance enlargement. The input
# already contains these complete, isolated figures. See report.md evidence.
HEIGHT_EXCEPTIONS={
    ('innkeeper','right',3):78,
    ('merchant_magic','left',0):78,('merchant_magic','left',1):78,
    ('merchant_magic','right',1):79,
    ('merchant_weapon','left',1):78,('merchant_weapon','left',3):78,
    ('merchant_weapon','right',3):79,
    ('npc_priest','up',1):80,('npc_priest','up',3):80,
    ('npc_elder','left',1):80,('npc_elder','right',0):77,
    ('npc_elder','right',1):77,('npc_elder','right',2):77,('npc_elder','right',3):77,
    ('npc_citizen_male','right',0):80,('npc_citizen_male','right',1):80,
    ('npc_citizen_male','right',2):80,('npc_citizen_male','right',3):80,
    ('npc_citizen_male','up',3):81,
    ('npc_citizen_male','left',1):81,('npc_citizen_male','left',3):80,
    ('banker','up',1):79,
}

def main_component(mask):
    todo=mask.copy();best=[];h,w=mask.shape
    for y,x in zip(*np.where(mask)):
        if not todo[y,x]:continue
        q=deque([(int(y),int(x))]);todo[y,x]=False;component=[]
        while q:
            yy,xx=q.popleft();component.append((yy,xx))
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    ny,nx=yy+dy,xx+dx
                    if 0<=ny<h and 0<=nx<w and todo[ny,nx]:
                        todo[ny,nx]=False;q.append((ny,nx))
        if len(component)>len(best):best=component
    return np.array(best,dtype=int)

def measure(cell):
    m=cell[:,:,3]>0
    pts=main_component(m)
    if not len(pts):return {'empty':True}
    top=int(np.where(m)[0].min());bottom=int(np.where(m)[0].max())
    foot=int(pts[:,0].max())
    # A detached head fragment must not become the inferred foot.
    below=int(m[foot+1:].sum())
    occupied=m.any(axis=1)
    empty_internal=int((~occupied[top:bottom+1]).sum())
    return dict(empty=False,top=top,bottom=bottom,height=bottom-top+1,
                foot=foot,below_foot_pixels=below,top_pixels=int(m[0].sum()),
                internal_empty_rows=empty_internal,visible_pixels=int(m.sum()),
                fully_opaque_pixels=int((cell[:,:,3]==255).sum()))

def multiset(a):
    return np.sort(np.ascontiguousarray(a).reshape(-1,4).view('<u4').ravel())

def check_one(path,reference,strict=False):
    a=np.array(Image.open(path).convert('RGBA'))
    b=np.array(Image.open(reference).convert('RGBA'))
    kind=path.stem[:-5];errors=[];exceptions=[];cells=[];strips=[]
    if a.shape!=(368,288,4) or b.shape!=(368,288,4):
        return dict(passed=False,errors=['size'],cells=[],strips=[])
    refs=[]
    for c in range(4):
        # Baseline is observed in the original down body, before spill/soles.
        mm=b[:88,c*72:(c+1)*72,3]>0
        refs.append(int(np.where(mm)[0].max()))
    downs=[measure(a[:92,c*72:(c+1)*72]) for c in range(4)]
    for r,direction in enumerate(DIRS):
        for c in range(4):
            m=measure(a[r*92:(r+1)*92,c*72:(c+1)*72])
            m.update(direction=direction,frame=c,reference_foot=refs[c])
            local=[]
            if m['empty']:local.append('empty')
            else:
                m['foot_error']=m['foot']-refs[c]
                m['height_delta']=m['height']-downs[c]['height']
                if abs(m['foot_error'])>1:local.append('foot')
                if m['below_foot_pixels']:local.append('fragment_below_foot')
                if m['internal_empty_rows']:local.append('detached_fragment_or_gap')
                if m['top_pixels'] and not np.any(b[0,c*72:(c+1)*72,3]):local.append('head_touches_top')
                if abs(m['height_delta'])>3:
                    allowed=HEIGHT_EXCEPTIONS.get((kind,direction,c))==m['height']
                    if allowed:exceptions.append(dict(direction=direction,frame=c,height=m['height'],delta=m['height_delta']))
                    if strict or not allowed:local.append('height')
            m['errors']=local;cells.append(m)
            errors.extend(f'{direction}[{c}]:{e}' for e in local)
    if kind in REDRAWN:
        same_down=np.array_equal(a[:88],b[:88])
        strips.append(dict(redrawn=True,down_rows_0_87_equal=same_down))
        if not same_down:errors.append('down:pixels_changed')
    for c in ([] if kind in REDRAWN else range(4)):
        aa=a[:,c*72:(c+1)*72];bb=b[:,c*72:(c+1)*72]
        va=aa[aa[:,:,3]>0];vb=bb[bb[:,:,3]>0]
        same=np.array_equal(multiset(va),multiset(vb))
        all_same=np.array_equal(multiset(aa),multiset(bb))
        count_delta=len(va)-len(vb)
        opaque_delta=int((aa[:,:,3]==255).sum()-(bb[:,:,3]==255).sum())
        strips.append(dict(frame=c,visible_count=len(va),visible_delta=count_delta,
            opaque_delta=opaque_delta,visible_rgba_multiset_equal=same,all_rgba_multiset_equal=all_same))
        if not same or not all_same or count_delta or opaque_delta:errors.append(f'strip[{c}]:pixel_conservation')
    sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    identical=sha(path)==sha(reference)
    if kind in HEALTHY and not identical:errors.append('healthy_sha256')
    return dict(passed=not errors,errors=errors,exceptions=exceptions,cells=cells,strips=strips,
                sha256=sha(path),input_sha256=sha(reference),byte_identical=identical)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('input_dir',type=Path);p.add_argument('candidate_dir',type=Path)
    p.add_argument('--json',type=Path);p.add_argument('--negative-control',action='store_true')
    p.add_argument('--strict-heights',action='store_true')
    p.add_argument('--visual-review',type=Path,help='Optional SHA256-bound human/agent image review')
    args=p.parse_args();results={}
    expected=BROKEN|HEALTHY
    found={f.stem[:-5] for f in args.candidate_dir.glob('*_walk.png')}
    if found!=expected:p.error('Expected exactly 19 walk sheets')
    for kind in sorted(expected):
        fn=kind+'_walk.png'
        results[kind]=check_one(args.candidate_dir/fn,args.input_dir/fn,args.strict_heights)
        if args.visual_review and kind in BROKEN:
            review=json.loads(args.visual_review.read_text(encoding='utf-8')).get(kind,{})
            if review.get('sha256')!=results[kind].get('sha256'):
                results[kind]['errors'].append('visual_review_missing_or_stale')
            elif not review.get('passed',False):
                results[kind]['errors'].append('visual_review_failed')
            results[kind]['passed']=not results[kind]['errors']
        r=results[kind]
        print(f'{kind}: {"PASS" if r["passed"] else "FAIL"}; errors={len(r["errors"])}; height exceptions={len(r["exceptions"])}')
    failed={k for k,v in results.items() if not v['passed']}
    control=failed==BROKEN if args.negative_control else None
    payload=dict(all_passed=not failed,failed=sorted(failed),negative_control_passed=control,
                 strict_heights=args.strict_heights,results=results)
    if args.json:args.json.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    if args.negative_control:
        print('NEGATIVE CONTROL:', 'PASS' if control else 'FAIL');return 0 if control else 1
    return 1 if failed else 0

if __name__=='__main__':raise SystemExit(main())
