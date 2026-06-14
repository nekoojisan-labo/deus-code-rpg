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
  // 街路側(プレイヤーが立つ側)の外向き法線を requireFacing から決める（実コードと同じ）
  const out = ({ up: { ox: 0, oy: 1 }, down: { ox: 0, oy: -1 },
                left: { ox: 1, oy: 0 }, right: { ox: -1, oy: 0 } })[door.requireFacing]
              || { ox: 0, oy: 1 };
  const off1 = Math.round(28 * doorScale);
  const cx = door.x + door.width / 2 + out.ox * (door.width / 2 + off1);
  const cy = door.y + door.height / 2 + out.oy * (door.height / 2 + off1);
  const spawn = msys.findClearSpawnPoint(town, cx, cy, 24, 3, out);

  // ドアの「街路側エッジ中心」を基準に forward(街路方向の距離) と lateral(直交ズレ) を測る
  const edgeCX = door.x + door.width / 2 + out.ox * (door.width / 2);
  const edgeCY = door.y + door.height / 2 + out.oy * (door.height / 2);
  const sdx = spawn.x - edgeCX, sdy = spawn.y - edgeCY;
  const forward = sdx * out.ox + sdy * out.oy;        // +=街路側へ何px出たか
  const lateral = sdx * (-out.oy) + sdy * out.ox;      // ドア中心軸からの横ずれ
  const perpHalf = out.oy !== 0 ? door.width / 2 : door.height / 2;
  const free = msys.spawnFreeDirections(town, spawn.x, spawn.y, 24);

  // 仕様: 「ドア開口幅内(±8px) かつ 街路側0..90px」に湧くか（向き非依存）
  const onMat = Math.abs(lateral) <= perpHalf + 8 && forward >= 0 && forward <= 90;

  // 外れた場合、ドア正面カラム(街路方向)が本当に塞がれている(=マップ形状)か診断
  let colBlocked = null;
  if (!onMat) {
    colBlocked = true;
    for (let d = 8; d <= 100; d += 6) {
      if (msys.isSafeSpawnPoint(town, edgeCX + out.ox * d, edgeCY + out.oy * d, 24) &&
          msys.spawnFreeDirections(town, edgeCX + out.ox * d, edgeCY + out.oy * d, 24) >= 3) { colBlocked = false; break; }
    }
  }

  rows.push({
    shopId, townId, scale: doorScale, facing: door.requireFacing || '(下既定)',
    door: `${door.x},${door.y} ${door.width}x${door.height}`,
    spawn: `${spawn.x},${spawn.y}`,
    forward: Math.round(forward), lateral: Math.round(lateral), free, onMat, colBlocked,
  });
}

// --- レポート ---
const measured = rows.filter((r) => r.spawn);
console.log(`\n店マップ数: ${shops.length}  /  測定: ${measured.length}\n`);
console.log('shop | 入店向き | door(box) | spawn | forward(街路) | lateral(横ズレ) | free | onMat | 正面カラム');
console.log('-----|---------|-----------|-------|--------------|----------------|------|-------|----------');
for (const r of rows) {
  if (!r.spawn) { console.log(`${r.shopId} | ${r.note}`); continue; }
  const col = r.onMat ? '-' : (r.colBlocked ? '塞(マップ形状)' : '空き(要調整)');
  console.log(`${r.shopId} | ${r.facing} | ${r.door} | ${r.spawn} | +${r.forward} | ${r.lateral>=0?'+':''}${r.lateral} | ${r.free} | ${r.onMat?'✅':'❌'} | ${col}`);
}

const offRows = measured.filter((r) => !r.onMat);
console.log(`\n=== 仕様評価（ドア開口幅±8px内 かつ 街路側0..90px・入店向き対応）===`);
console.log(`マット上に湧く: ${measured.filter(r=>r.onMat).length}/${measured.length}件`);
console.log(`可動<3方向: ${measured.filter(r=>r.free<3).length}件`);
console.log(`外れ ${offRows.length}件 → うちマップ形状(正面が壁): ${offRows.filter(r=>r.colBlocked).length}件 / 探索で改善余地: ${offRows.filter(r=>!r.colBlocked).length}件`);
if (offRows.length) console.log(`  外れ詳細: ${offRows.map(r=>`${r.shopId}[${r.colBlocked?'壁':'要調整'}]`).join(', ')}`);
