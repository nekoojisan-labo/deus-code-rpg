// map-graph-dump.js — 実MapSystemから全マップの接続(出口)を抽出し、相関図データと異常を診断。
// area(エリア)・to(接続先)・direction・spawn・requiredFlag・autoEnter を一覧化し、
// クロスエリア接続/非対称な戻り/難易度跳ね を機械的に検出する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
function fakeEl() { const cl = new Set(); return { innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add: (c) => cl.add(c), remove: (c) => cl.delete(c), contains: () => false, toggle: noop }, setAttribute: noop, getAttribute: () => null, appendChild: noop, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop }; }
class FakeImage {}
const document = { getElementById: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [], createElement: () => fakeEl(), addEventListener: noop, body: fakeEl() };
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, document, Image: FakeImage, performance: { now: () => 1000 }, setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop, localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, Math, JSON, Object, Array, Number, String, Boolean, Map, Set, isNaN, parseInt, parseFloat, Date: function () { return { toISOString: () => '' }; } };
sb.window.location = { search: '' }; sb.window.localStorage = sb.localStorage; sb.globalThis = sb; vm.createContext(sb);
['item-system.js', 'equipment-system.js', 'magic-system.js', 'se-system.js', 'ui-panel.js', 'save-system.js', 'battle-system.js', 'map-walkability-data.js', 'object-catalog.js', 'map-objects-data.js', 'map-system.js', 'party-system.js', 'quest-system.js', 'story-events.js'].forEach(f => { try { vm.runInContext(read(f), sb, { filename: f }); } catch (e) { console.log('load fail ' + f + ': ' + e.message); } });
const ms = new sb.window.MapSystem();
const battle = new sb.window.BattleSystem();

// エリア分類（id前方一致）
function areaOf(id) {
  id = ms.normalizeMapId(id) || id;
  if (/^deep_tunnel/.test(id)) return 'dungeon-deep';
  if (/^subway/.test(id)) return 'subway';
  if (/^tokyo_gov/.test(id)) return 'gov';
  if (/^shrine/.test(id)) return 'shrine';
  if (/biodome/.test(id)) return 'garden';
  if (/^shop_/.test(id)) return 'shop';
  if (/^house|residential/.test(id)) return 'residential';
  if (/shinjuku|shopping|black_market/.test(id)) return 'town';
  return 'other';
}
function zoneOf(id) { try { ms.currentMap = id; return ms.getEncounterZone(); } catch (e) { return null; } }

const ids = Object.keys(ms.maps);
console.log('=== マップ接続グラフ（実MapSystem・' + ids.length + 'マップ） ===\n');

// 全エッジ
const edges = []; // {from, to, dir, spawn, flag, auto, fromArea, toArea}
ids.forEach(id => {
  const m = ms.maps[id];
  (m.exits || []).forEach(ex => {
    if (!ex.to) return;
    const to = ms.normalizeMapId(ex.to) || ex.to;
    edges.push({ from: id, to, dir: ex.direction || '(無)', flag: ex.requiredFlag || '', auto: !!ex.autoEnter, fromArea: areaOf(id), toArea: areaOf(to) });
  });
});

// エリア別に出力
const byArea = {};
ids.forEach(id => { (byArea[areaOf(id)] = byArea[areaOf(id)] || []).push(id); });
Object.keys(byArea).sort().forEach(area => {
  console.log('■ ' + area);
  byArea[area].forEach(id => {
    const z = zoneOf(id);
    const out = edges.filter(e => e.from === id);
    const zt = z ? `[T${z.tier} Lv${(z.levelRange || []).join('-')}]` : '';
    console.log(`  ${id} ${zt}`);
    out.forEach(e => console.log(`     → ${e.to} (${e.dir})${e.flag ? ' 🔒' + e.flag : ''}${e.auto ? ' [autoEnter]' : ''}${e.toArea !== e.fromArea ? '  ⚠️CROSS:' + e.toArea : ''}`));
    if (!out.length) console.log('     （出口なし）');
  });
});

// --- 異常検出 ---
console.log('\n=== 診断 ===');
// 1) クロスエリア接続（ダンジョン↔街 等）でゲート無し
const crossNoGate = edges.filter(e => e.fromArea !== e.toArea && !e.flag && e.fromArea !== 'shop' && e.toArea !== 'shop'
  && !(e.fromArea === 'town' && e.toArea === 'residential') && !(e.fromArea === 'residential' && e.toArea === 'town'));
console.log('\n[1] エリアをまたぐ無ゲート接続（早期に高難度へ飛べる疑い）:');
crossNoGate.forEach(e => { const zf = zoneOf(e.from), zt = zoneOf(e.to); const jump = (zf && zt) ? `Lv${(zf.levelRange||[])[1]}→Lv${(zt.levelRange||[])[1]}` : ''; console.log(`  ${e.from}(${e.fromArea}) → ${e.to}(${e.toArea}) ${jump}${e.dir ? ' /' + e.dir : ''}`); });
if (!crossNoGate.length) console.log('  なし');

// 2) 難易度跳ね（接続先のレベル上限が +3 以上跳ねる無ゲート接続）
console.log('\n[2] 難易度が跳ねる無ゲート接続（+3Lv以上）:');
let jumps = 0;
edges.filter(e => !e.flag).forEach(e => { const zf = zoneOf(e.from), zt = zoneOf(e.to); if (zf && zt) { const a = (zf.levelRange || [])[1] || 0, b = (zt.levelRange || [])[1] || 0; if (b - a >= 3) { console.log(`  ${e.from}(〜Lv${a}) → ${e.to}(〜Lv${b})  +${b - a}`); jumps++; } } });
if (!jumps) console.log('  なし');

// 3) 非対称な戻り（A→B はあるが B→A が無い）
console.log('\n[3] 戻れない接続（A→B はあるが B→A が無い）:');
let asym = 0;
edges.forEach(e => { const back = edges.find(x => x.from === e.to && x.to === e.from); if (!back) { console.log(`  ${e.from} → ${e.to}  （${e.to}から${e.from}へ戻る出口が無い）`); asym++; } });
if (!asym) console.log('  なし');

process.exit(0);
