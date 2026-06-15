// npc-realmaps-oracle.js — 実マップデータ(applyScreenMapOverrides由来)で A2 を検証する計器。
// 実際の MapSystem をインスタンス化し、npcs を持つ全マップで updateNPCs を回し、
// 「域外0件(不変条件)」「move付与NPCだけが歩く」「静止/呼び込み/感情を失った市民は静止」を観測。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

let CLOCK = 1000;
function fakeEl() {
  return { innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
    setAttribute: noop, getAttribute: () => null, appendChild: noop, querySelector: () => null };
}
class FakeImage { constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; } }
const document = { getElementById: () => fakeEl(), querySelector: () => null, createElement: () => fakeEl(), addEventListener: noop };
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {}, document, Image: FakeImage,
  performance: { now: () => CLOCK }, setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set, isNaN, parseInt, parseFloat,
  Date: function () { return { toISOString: () => '' }; }
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('map-system.js'), sb, { filename: 'map-system.js' });

const ms = new sb.window.MapSystem(); // 実マップを構築(applyScreenMapOverrides含む)

console.log('\n=== A2 実マップNPC移動 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

const FRAMES = 180;
let totalOutOfDomain = 0;
const moved = new Set();      // 実際に歩いたNPC名
const everPatrol = new Set(); // _patrol を持つNPC名
const mapsWithNpcs = [];

for (const id of Object.keys(ms.maps)) {
  const map = ms.maps[id];
  if (!map || !map.npcs || !map.npcs.length) continue;
  mapsWithNpcs.push(id);
  ms.currentMap = id;
  ms._lastNpcUpdate = 0;
  map.npcs.forEach(n => { if (n._patrol) everPatrol.add(n.name); });
  for (let f = 0; f < FRAMES; f++) {
    CLOCK += 16;
    ms.updateNPCs();
    map.npcs.forEach(n => {
      if (!ms.isMapPositionWalkable(map, n.x, n.y, 22)) totalOutOfDomain++;
      if (n.isMoving) moved.add(n.name);
    });
  }
}

console.log(`走査マップ数=${mapsWithNpcs.length}  /  _patrol保持NPC=[${[...everPatrol].join(', ') || 'なし'}]`);
console.log(`実際に歩いたNPC=[${[...moved].join(', ') || 'なし'}]\n`);

chk('不変条件: 全マップ・全フレームでNPCが可動域内（域外0件）', totalOutOfDomain === 0, `域外=${totalOutOfDomain}件`);
chk('move付与した2体（パトロールドローン/おばあさん）が _patrol を持つ',
  everPatrol.has('パトロールドローン') && everPatrol.has('おばあさん'),
  `_patrol=[${[...everPatrol].join(', ')}]`);
chk('「感情を失った市民」は静止（歩かない・物語設定どおり）', !moved.has('感情を失った市民'));
chk('呼び込み/案内人(static)は歩かない',
  !moved.has('武器店の呼び込み') && !moved.has('防具店の呼び込み') && !moved.has('道具店の呼び込み') &&
  !moved.has('魔法店の呼び込み') && !moved.has('宿屋の案内人') && !moved.has('銀行の案内人') && !moved.has('ギルド案内人'));
chk('ストーリーNPC(アカリ/リク)は徘徊では歩かない（駆け寄りは別系統）',
  !moved.has('アカリ') && !moved.has('リク'));
chk('意図した可動NPCのみが歩く（移動集合 ⊆ move付与集合）',
  [...moved].every(n => everPatrol.has(n)), `歩いた=[${[...moved].join(', ')}]`);

console.log(`\n${pass ? '✅ 全PASS: 実マップで域外なし／意図した2体のみ歩行／静止NPCは静止 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
