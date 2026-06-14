// verify-meeting-spots.js — meeting-spot-oracle の候補点を個別検証する使い捨て補助
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {}; const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sb = { console, window: {}, document: { getElementById: () => null, querySelector: () => null, createElement: () => fakeEl },
  URLSearchParams, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} }, setTimeout: () => 0, clearTimeout: noop,
  requestAnimationFrame: () => 0, performance: { now: () => 0 }, Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js']) vm.runInContext(read(f), sb, { filename: f });
const m = new sb.window.MapSystem(); const map = m.maps['shinjuku_center_plaza']; const S = map.worldScale;
const sp = m.findSafeSpawnPoint(map, Math.round(400 * S), Math.round(380 * S), 24);
const d = (x, y) => Math.round(Math.hypot(x - sp.x, y - sp.y));
console.log('\nspawn world', sp.x, sp.y, 'base', Math.round(sp.x / S), Math.round(sp.y / S));
const test = (label, bx, by) => {
  const x = Math.round(bx * S), y = Math.round(by * S);
  console.log(`${label} base(${bx},${by}) world(${x},${y}) walkable=${m.isMapPositionWalkable(map, x, y, 24)} free=${m.spawnFreeDirections(map, x, y, 24)} inExitBox=${m.isPointInsideExit(map, x, y, true)} spawnDist=${d(x, y)}`);
};
// citizen NPC at base(360,250). Akari could heal him → narrative anchor.
const cz = map.npcs.find(n => n.name === '感情を失った市民');
console.log('citizen world', cz.x, cz.y, 'base', Math.round(cz.x / S), Math.round(cz.y / S), 'spawnDist', d(cz.x, cz.y));
console.log('\n--- citizen-side mid/upper-left court (base 230..370 x 150..300), walkable & free>=3 & spawnDist>=220 ---');
let best = null;
for (let by = 150; by <= 300; by += 4) for (let bx = 230; bx <= 370; bx += 4) {
  const x = Math.round(bx * S), y = Math.round(by * S);
  if (m.isMapPositionWalkable(map, x, y, 24) && m.spawnFreeDirections(map, x, y, 24) >= 4 && !m.isPointInsideExit(map, x, y, true)) {
    const ds = d(x, y), dc = Math.round(Math.hypot(x - cz.x, y - cz.y));
    if (ds >= 220 && (!best || dc < best.dc)) best = { bx, by, ds, dc };
  }
}
console.log(best ? `  best near-citizen far-from-spawn: base(${best.bx},${best.by}) spawnDist=${best.ds} citizenDist=${best.dc}` : '  (none with spawnDist>=220 & free=4)');
console.log('\n--- final picks ---');
[['C1 shrine-front', 403, 103], ['C2 gov-front', 738, 227], ['C3 station-front', 52, 227], ['C4 plaza-center', 397, 227]].forEach(([l, bx, by]) => test(l, bx, by));
