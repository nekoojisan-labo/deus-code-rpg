// meeting-spot-oracle.js — 中央広場でアカリの自然な"出会いの場所"候補を実コードで算出
// 使い方: node tools/meeting-spot-oracle.js
// 依存: ブラウザ不要。window/document をスタブして map-system.js を実行する。
//
// 要件:
//  - 歩行可能 (isMapPositionWalkable(map,x,y,24)=true / spawnFreeDirections>=3 で余裕)
//  - カイト開始位置(world≈620,589 = base400,380)から world距離 >= 220px
//  - 出口(北神社/南商店街/東都庁/西駅) or ランドマーク近くで自然な出会いの場所
// 出力: base/world座標・spawnからの距離・近接フィーチャ・walkable・適性コメント
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// --- 最小ブラウザスタブ（spawn-oracle.js 流儀） ---
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sb = {
  console, window: {},
  document: { getElementById: () => null, querySelector: () => null, createElement: () => fakeEl },
  URLSearchParams,
  Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0,
  performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy,
};
sb.window.location = { search: '' };
sb.globalThis = sb;
vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });

const msys = new sb.window.MapSystem();
const MAP_ID = 'shinjuku_center_plaza';
const map = msys.maps[MAP_ID];
const SCALE = map.worldScale || 1.55;          // 1.55
const W = map.worldWidth, H = map.worldHeight;  // ≈1240×698
const SIZE = 24;

const toBase = (v) => Math.round(v / SCALE);
const dist = (ax, ay, bx, by) => Math.round(Math.hypot(ax - bx, ay - by));

// --- カイト実スポーン（実コードパス: 南商店街→広場 spawnX400,spawnY380 と同等の入口復帰） ---
// getSpawnPoint の通常ブランチ: round(spawnX*scale), round(spawnY*scale) → findSafeSpawnPoint
const spawnRaw = { x: Math.round(400 * SCALE), y: Math.round(380 * SCALE) }; // (620,589)
const spawn = msys.findSafeSpawnPoint(map, spawnRaw.x, spawnRaw.y, SIZE);
console.log(`\nマップ: ${MAP_ID}  base 800×450 / world ${W}×${H} / scale ${SCALE}`);
console.log(`カイト開始(world): (${spawn.x},${spawn.y})  base≈(${toBase(spawn.x)},${toBase(spawn.y)})  [raw狙い world(${spawnRaw.x},${spawnRaw.y})]`);

// --- フィーチャ: 出口中心(world) と 市民NPC(world) ---
// exits/npcs は prepareScrollableMap で既に ×scale 済み
const exits = (map.exits || []).map((e) => ({
  to: e.to, dir: e.direction,
  cx: e.x + e.width / 2, cy: e.y + e.height / 2,
}));
const labelByTo = {
  shrine_south_gate: '北・神社参道',
  shopping_street_north: '南・商店街',
  tokyo_gov_approach: '東・都庁',
  shinjuku_station_gate: '西・駅(地下鉄)',
};
const features = exits.map((e) => ({ key: e.to, label: labelByTo[e.to] || e.to, x: e.cx, y: e.cy, kind: 'exit' }));
const citizen = (map.npcs || []).find((n) => n.name === '感情を失った市民');
if (citizen) features.push({ key: 'citizen', label: '市民NPC(感情を失った市民)', x: citizen.x, y: citizen.y, kind: 'npc' });
// 広場の中心(噴水/広場ランドマーク相当): 中央 walkable 塊 base(296..496,128..328) 中心 ≈ base(396,228)
features.push({ key: 'plaza_center', label: '広場中央(中央床ブロック)', x: Math.round(396 * SCALE), y: Math.round(228 * SCALE), kind: 'landmark' });

console.log('\nフィーチャ(world / base):');
for (const f of features) console.log(`  ${f.label.padEnd(22)} world(${Math.round(f.x)},${Math.round(f.y)})  base≈(${toBase(f.x)},${toBase(f.y)})`);

// --- 格子走査（world座標、8px刻み）。歩行可能 & 余裕(free>=3) のセルを収集 ---
const STEP = 8;
const MIN_SPAWN_DIST = 220;   // world px
const cells = [];
for (let y = SIZE; y <= H - SIZE; y += STEP) {
  for (let x = SIZE; x <= W - SIZE; x += STEP) {
    if (!msys.isMapPositionWalkable(map, x, y, SIZE)) continue;
    const free = msys.spawnFreeDirections(map, x, y, SIZE);
    if (free < 3) continue;                       // 立ち回り余裕のある床のみ
    if (msys.isPointInsideExit(map, x, y, true)) continue; // 出口箱の中は除外(踏むと遷移)
    const dSpawn = dist(x, y, spawn.x, spawn.y);
    // 各フィーチャまでの距離
    let nearest = null, nd = Infinity;
    for (const f of features) {
      const d = dist(x, y, f.x, f.y);
      if (d < nd) { nd = d; nearest = f; }
    }
    cells.push({ x, y, free, dSpawn, nearest: nearest.key, nearestLabel: nearest.label, nearD: nd });
  }
}
const walkableTotal = cells.length;
const farEnough = cells.filter((c) => c.dSpawn >= MIN_SPAWN_DIST);
console.log(`\n歩行可能&余裕セル: ${walkableTotal}  / うち spawn距離>=${MIN_SPAWN_DIST}: ${farEnough.length}`);

// --- 候補抽出: 各フィーチャ近傍で「そのフィーチャに最も近く、spawnから十分離れ、床に余裕」のセルを1点ずつ ---
// 出会いの場として "出口の手前(踏まない位置)" を優先。神社/駅/都庁/商店街/広場中央 から良点を拾う。
function pickNearFeature(featureKey, { maxNearD = 9999, preferFar = true } = {}) {
  let pool = farEnough.filter((c) => c.nearest === featureKey && c.nearD <= maxNearD);
  if (pool.length === 0) pool = cells.filter((c) => c.nearest === featureKey && c.dSpawn >= 160 && c.nearD <= maxNearD);
  if (pool.length === 0) return null;
  // フィーチャに近く(出会いの場として自然)、かつ free 大きめ、spawnから離れている点を選好
  pool.sort((a, b) => {
    // 主: フィーチャ近接(小さいほど良) / 副: free大 / 三: spawn遠
    if (a.nearD !== b.nearD) return a.nearD - b.nearD;
    if (a.free !== b.free) return b.free - a.free;
    return b.dSpawn - a.dSpawn;
  });
  return pool[0];
}

// 南出口(shopping_street_north)はカイト開始位置の真上=spawn至近(全床<40px)。
// 「遠い出会いの場」には不適なので候補から外し、代わりに市民NPC脇(物語アンカー)を採る。
const wantFeatures = ['shrine_south_gate', 'tokyo_gov_approach', 'shinjuku_station_gate', 'plaza_center', 'citizen'];
const picks = [];
for (const key of wantFeatures) {
  const c = pickNearFeature(key);
  if (c) picks.push(c);
}

// 適性コメント生成
function suitability(c) {
  const f = features.find((x) => x.key === c.nearest);
  const parts = [];
  if (c.dSpawn >= 260) parts.push('spawnから十分遠く"探す"動線が成立');
  else if (c.dSpawn >= 220) parts.push('spawnから離れ自然');
  else parts.push('spawnやや近め');
  parts.push(`床の余裕${c.free}/4方向`);
  if (f.kind === 'exit') parts.push(`${f.label}の手前で旅立ち前の出会いとして自然`);
  else if (f.key === 'plaza_center') parts.push('広場中央のランドマーク前で象徴的な邂逅向き');
  else if (f.key === 'citizen') parts.push('感情を失った市民の脇=recruit_akari_joinのheal一幕と地続きで物語的に最自然');
  else parts.push(`${f.label}付近`);
  return parts.join(' / ');
}

console.log('\n=== 出会いの場所 候補（実座標） ===');
console.log('# | base(x,y) | world(x,y) | spawn距離 | 近接フィーチャ(まで) | free | 適性');
console.log('--|-----------|------------|-----------|---------------------|------|----');
const result = [];
picks.forEach((c, i) => {
  const f = features.find((x) => x.key === c.nearest);
  const bx = toBase(c.x), by = toBase(c.y);
  const sc = suitability(c);
  console.log(`${i + 1} | (${bx},${by}) | (${c.x},${c.y}) | ${c.dSpawn} | ${f.label}(${c.nearD}) | ${c.free} | ${sc}`);
  result.push({
    baseX: bx, baseY: by, worldX: c.x, worldY: c.y,
    distFromSpawnWorld: c.dSpawn, nearFeature: f.label, nearFeatureDist: c.nearD,
    walkable: true, free: c.free, suitability: sc,
  });
});

// JSON も吐く（呼び出し側が機械可読で拾える）
console.log('\n=== JSON ===');
console.log(JSON.stringify({
  spawnWorld: { x: spawn.x, y: spawn.y }, spawnBase: { x: toBase(spawn.x), y: toBase(spawn.y) },
  world: { w: W, h: H, scale: SCALE }, walkableCells: walkableTotal, candidates: result,
}, null, 2));
