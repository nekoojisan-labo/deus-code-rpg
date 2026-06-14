// spawn-oracle.js — 店退出スポーンの実座標を実コードパスで測る（ヘッドレス幾何オラクル）
// 使い方: node tools/spawn-oracle.js
// 依存: ブラウザ不要。window/document をスタブして map-system.js を実行する。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// --- 最小ブラウザスタブ ---
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sandbox = {
  console,
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => fakeEl,
  },
  URLSearchParams: URLSearchParams,
  Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0,
  performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy,
};
sandbox.window.location = { search: '' };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// データ → map-system の順に同一コンテキストで実行
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js']) {
  vm.runInContext(read(f), sandbox, { filename: f });
}

const MapSystem = sandbox.window.MapSystem;
const msys = new MapSystem();

// --- 全店マップを列挙し、戻り先タウンのドア箱を特定して実スポーンを再現 ---
const maps = msys.maps;
const shops = Object.keys(maps).filter((id) => maps[id] && maps[id].area === 'shop');

const rows = [];
for (const shopId of shops) {
  const shop = maps[shopId];
  const backExit = (shop.exits || []).find((e) => maps[msys.normalizeMapId(e.to)]);
  if (!backExit) { rows.push({ shopId, note: 'no back exit' }); continue; }
  const townId = msys.normalizeMapId(backExit.to);
  const town = maps[townId];
  if (!town) { rows.push({ shopId, townId, note: 'town missing' }); continue; }

  // 実コード getSpawnPoint の店退出ブランチを忠実に再現
  const door = (town.exits || []).find((e) => msys.normalizeMapId(e.to) === shopId);
  if (!door) { rows.push({ shopId, townId, note: 'no door on town' }); continue; }

  const doorScale = town.worldScale && town.worldScale > 0 ? town.worldScale : 1;
  const cx = door.x + door.width / 2;
  const cy = door.y + door.height + Math.round(28 * doorScale);
  const spawn = msys.findClearSpawnPoint(town, cx, cy, 24);

  const doorBottom = door.y + door.height;
  const dx = spawn.x - cx;                    // ドア中心からの横ズレ（参考）
  const dyBelow = spawn.y - doorBottom;        // ドア下端からの距離（+下=街路側）
  const free = msys.spawnFreeDirections(town, spawn.x, spawn.y, 24);
  const inExit = msys.isPointInsideExit(town, spawn.x, spawn.y, true);
  const anchorOK = msys.isSafeSpawnPoint(town, cx, cy, 24) && msys.spawnFreeDirections(town, cx, cy, 24) >= 3;

  // 真の仕様: 「ドア開口幅の中(±8px許容) かつ 街路側(下,0..90px)」に湧くか
  const inDoorSpan = spawn.x >= door.x - 8 && spawn.x <= door.x + door.width + 8;
  const streetSide = dyBelow >= 0 && dyBelow <= 90;
  const onMat = inDoorSpan && streetSide;

  // 外れた場合、ドア真下カラムが本当に塞がれている(=マップ形状問題)か診断
  let colBlocked = null;
  if (!onMat) {
    colBlocked = true;
    for (let d = 8; d <= 100; d += 6) {
      if (msys.isSafeSpawnPoint(town, cx, doorBottom + d, 24) &&
          msys.spawnFreeDirections(town, cx, doorBottom + d, 24) >= 3) { colBlocked = false; break; }
    }
  }

  rows.push({
    shopId, townId, scale: doorScale,
    door: `${door.x},${door.y} ${door.width}x${door.height}`,
    spawn: `${spawn.x},${spawn.y}`,
    dx, dyBelow, free, onMat, colBlocked,
  });
}

// --- レポート ---
const measured = rows.filter((r) => r.spawn);
console.log(`\n店マップ数: ${shops.length}  /  測定: ${measured.length}\n`);
console.log('shop | door(box) | spawn | dyBelow | free | onMat | 真下カラム');
console.log('-----|-----------|-------|---------|------|-------|----------');
for (const r of rows) {
  if (!r.spawn) { console.log(`${r.shopId} | ${r.note}`); continue; }
  const col = r.onMat ? '-' : (r.colBlocked ? '塞(マップ形状)' : '空き(要調整)');
  console.log(`${r.shopId} | ${r.door} | ${r.spawn} | ${r.dyBelow>=0?'+':''}${r.dyBelow} | ${r.free} | ${r.onMat?'✅':'❌'} | ${col}`);
}

const off = measured.filter((r) => !r.onMat);
console.log(`\n=== 仕様評価（ドア開口幅±8px内 かつ 街路側0..90px）===`);
console.log(`マット上に湧く: ${measured.filter(r=>r.onMat).length}/${measured.length}件`);
console.log(`可動<3方向: ${measured.filter(r=>r.free<3).length}件`);
console.log(`外れ ${off.length}件 → うちマップ形状(真下が壁): ${off.filter(r=>r.colBlocked).length}件 / 探索で改善余地: ${off.filter(r=>!r.colBlocked).length}件`);
if (off.length) console.log(`  外れ詳細: ${off.map(r=>`${r.shopId}[${r.colBlocked?'壁':'要調整'}]`).join(', ')}`);
