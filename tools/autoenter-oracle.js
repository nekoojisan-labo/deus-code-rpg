// autoenter-oracle.js — 全autoEnterドアで「到達地点から自動入店が発火するか」を旧/新ロジックで実測
// 退出スポーン地点(=再入店の起点)＋その周囲の接近格子で、向き=requireFacing のとき
// 自動入店が発火するかを数える。Z無し入店の体感を近似する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sb = { console, window: {}, document: { getElementById: () => null, querySelector: () => null, createElement: () => fakeEl },
  URLSearchParams, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const msys = new sb.window.MapSystem();

// --- 新ロジック(検証用・map-system.js へ入れる予定の式と同じ) ---
function newAutoEnter(map, playerX, playerY, facing, reach = null) {
  if (!map || !map.exits || !facing) return null;
  const scale = (map.worldScale && map.worldScale > 0) ? map.worldScale : 1;
  const R = reach != null ? reach : Math.round(28 * scale);
  const LAT = Math.round(14 * scale);
  for (const exit of map.exits) {
    if (!exit.autoEnter) continue;
    if (exit.requireFacing && exit.requireFacing !== facing) continue;
    const L = exit.x, Rt = exit.x + exit.width, T = exit.y, B = exit.y + exit.height;
    let hit = false;
    if (facing === 'up')         hit = playerX >= L - LAT && playerX <= Rt + LAT && playerY >= T && playerY <= B + R;
    else if (facing === 'down')  hit = playerX >= L - LAT && playerX <= Rt + LAT && playerY <= B && playerY >= T - R;
    else if (facing === 'left')  hit = playerY >= T - LAT && playerY <= B + LAT && playerX >= L && playerX <= Rt + R;
    else if (facing === 'right') hit = playerY >= T - LAT && playerY <= B + LAT && playerX <= Rt && playerX >= L - R;
    if (hit) return exit;
  }
  return null;
}

// 退出スポーン(街側ドア)を実コードで再現
const facingToOut = { up: { ox: 0, oy: 1 }, down: { ox: 0, oy: -1 }, left: { ox: 1, oy: 0 }, right: { ox: -1, oy: 0 } };
const maps = msys.maps;
const shops = Object.keys(maps).filter((id) => maps[id] && maps[id].area === 'shop');

const rows = [];
for (const shopId of shops) {
  const shop = maps[shopId];
  const backExit = (shop.exits || []).find((e) => maps[msys.normalizeMapId(e.to)]);
  if (!backExit) continue;
  const townId = msys.normalizeMapId(backExit.to);
  const town = maps[townId];
  const door = (town.exits || []).find((e) => msys.normalizeMapId(e.to) === shopId);
  if (!door) continue;
  const facing = door.requireFacing || null;
  const out = facingToOut[facing] || { ox: 0, oy: 1 };
  const doorScale = town.worldScale && town.worldScale > 0 ? town.worldScale : 1;
  const off = Math.round(28 * doorScale);
  const cx = door.x + door.width / 2 + out.ox * (door.width / 2 + off);
  const cy = door.y + door.height / 2 + out.oy * (door.height / 2 + off);
  const spawn = msys.findClearSpawnPoint(town, cx, cy, 24, 3, out);

  // 現在のマップを town にして実コードの checkAutoEnterAhead を直接呼べるようにする
  msys.currentMap = townId; msys.transitioning = false; msys._lastTransitionAt = -100000;

  // 退出スポーン地点＋接近格子(街路側±18, ドアへ近づく向き0..30)で発火数を数える
  let oldHits = 0, newHits = 0, total = 0;
  const perp = { ox: -out.oy, oy: out.ox };
  for (let s = -18; s <= 18; s += 6) {           // ドア軸に直交(横)
    for (let f = 0; f <= 30; f += 6) {           // 街路側→ドアへ近づく
      const x = Math.round(spawn.x + perp.ox * s - out.ox * f);
      const y = Math.round(spawn.y + perp.oy * s - out.oy * f);
      if (!msys.isMapPositionWalkable(town, x, y, 24)) continue;
      total++;
      if (facing) {
        if (msys.checkAutoEnterAhead(x, y, facing)) oldHits++;
        if (newAutoEnter(town, x, y, facing)) newHits++;
      }
    }
  }
  // スポーン地点ちょうどでの発火（最重要：そこに立って入れるか）
  const atSpawnOld = facing ? !!msys.checkAutoEnterAhead(spawn.x, spawn.y, facing) : null;
  const atSpawnNew = facing ? !!newAutoEnter(town, spawn.x, spawn.y, facing) : null;

  // 非回帰: 「店の前を横切る」=requireFacingに直交する向きで前を歩く時に発火しないこと
  // 直交2方向で、ドア前面帯をドア中心±60px掃いて、実関数の発火数を数える（0であるべき）
  const perpFacings = (facing === 'up' || facing === 'down') ? ['left', 'right'] : ['up', 'down'];
  const dcx = door.x + door.width / 2, dcy = door.y + door.height / 2;
  let passByFires = 0, passByTested = 0;
  for (const pf of perpFacings) {
    for (let t = -60; t <= 60; t += 6) {
      // ドア前面（街路側）に沿って横移動する想定の位置
      const x = Math.round((facing === 'up' || facing === 'down') ? dcx + t : spawn.x);
      const y = Math.round((facing === 'up' || facing === 'down') ? spawn.y : dcy + t);
      if (!msys.isMapPositionWalkable(town, x, y, 24)) continue;
      passByTested++;
      if (msys.checkAutoEnterAhead(x, y, pf)) passByFires++;
    }
  }

  rows.push({ shopId, townId, facing: facing || '(無)', spawn: `${spawn.x},${spawn.y}`,
    atSpawnOld, atSpawnNew, oldHits, newHits, total, passByFires, passByTested });
}

console.log('\nshop | 入店向き | spawnで自動入店 | 接近帯 発火/歩行可 | 横切り発火/試行(0が正)');
console.log('-----|---------|----------------|------------------|----------------------');
for (const r of rows) {
  console.log(`${r.shopId} | ${r.facing} | ${r.atSpawnOld===null?'-':r.atSpawnOld?'✅':'❌'} | ${r.oldHits}/${r.total} | ${r.passByFires}/${r.passByTested}`);
}
const noFacing = rows.filter(r => r.facing === '(無)');
const passByTotal = rows.reduce((a, r) => a + r.passByFires, 0);
console.log(`\n=== 評価 ===`);
console.log(`スポーン地点で自動入店(到達したら入れる): ${rows.filter(r=>r.atSpawnOld).length}/${rows.length}`);
console.log(`★非回帰 横切りで誤入店: ${passByTotal}件（0であるべき）`);
console.log(`requireFacing 無しのautoEnter店(向きゲート効かず要注意): ${noFacing.length}件 ${noFacing.map(r=>r.shopId).join(',')||'なし'}`);
