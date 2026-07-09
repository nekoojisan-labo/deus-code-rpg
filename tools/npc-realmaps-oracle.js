// npc-realmaps-oracle.js — 実マップデータ(applyScreenMapOverrides由来)で A2 を検証する計器。
// 実際の MapSystem をインスタンス化し、npcs を持つ全マップで updateNPCs を回し、
// 「移動NPCの域外0件」「一般NPCの自動roam」「固定店員/ストーリーNPCの静止」を観測。
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
  Math: Object.assign(Object.create(Math), { random: (() => { let s = 67890; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000); })() }),
  JSON, Object, Array, Number, String, Boolean, Map, Set, isNaN, parseInt, parseFloat,
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
let enteredExit = 0;
const moved = new Set();      // 実際に歩いた map/name
const everPatrol = new Set(); // _patrol を持つ map/name
const frameColumns = new Map();
const mapsWithNpcs = [];

for (const id of Object.keys(ms.maps)) {
  const map = ms.maps[id];
  if (!map || !map.npcs || !map.npcs.length) continue;
  mapsWithNpcs.push(id);
  ms.currentMap = id;
  ms._lastNpcUpdate = 0;
  map.npcs.forEach(n => {
    const key = `${id}/${n.name}`;
    if (n._patrol) everPatrol.add(key);
    frameColumns.set(key, new Set());
  });
  for (let f = 0; f < FRAMES; f++) {
    CLOCK += 16;
    ms.updateNPCs();
    map.npcs.forEach(n => {
      const key = `${id}/${n.name}`;
      if (n._patrol && !ms.isMapPositionWalkable(map, n.x, n.y, 22)) totalOutOfDomain++;
      if (n._patrol && ms.isPointInsideExit(map, n.x, n.y, true)) enteredExit++;
      if (n.isMoving) {
        moved.add(key);
        if (ms.isCharacterWalkSpritePath(ms.getNPCSpritePath(n))) {
          frameColumns.get(key).add(ms.computeWalkFrame(n.facing, true, n.animTime || 0).sx);
        }
      }
    });
  }
}

console.log(`走査マップ数=${mapsWithNpcs.length}  /  移動NPC=${everPatrol.size}`);
console.log(`実際に歩いたNPC=[${[...moved].join(', ') || 'なし'}]\n`);

chk('不変条件: 全移動NPCが全フレームで可動域内（域外0件）', totalOutOfDomain === 0, `域外=${totalOutOfDomain}件`);
chk('不変条件: 移動NPCは出口トリガーへ侵入しない', enteredExit === 0, `侵入=${enteredExit}件`);
chk('移動コントローラを持つNPCは全員、実際に歩く', [...everPatrol].every(key => moved.has(key)), `移動=${moved.size}/${everPatrol.size}`);
const animatedWalkers = [...everPatrol].filter(key => {
  const [mapId, ...nameParts] = key.split('/');
  const npc = (ms.maps[mapId].npcs || []).find(item => item.name === nameParts.join('/'));
  return npc && ms.isCharacterWalkSpritePath(ms.getNPCSpritePath(npc));
});
chk('歩行シートを持つ移動NPCは複数の実コマを表示する', animatedWalkers.every(key => (frameColumns.get(key) || new Set()).size >= 2));
chk('中央広場の市民は自動roamで歩く', moved.has('shinjuku_center_plaza/感情を失った市民'));
chk('民家の住人とギルドの冒険者も歩く', moved.has('house_1/住人') && moved.has('shop_guild/冒険者A') && moved.has('shop_guild/冒険者B'));
chk('呼び込み/案内人(static)は歩かない',
  ![...moved].some(key => /呼び込み|案内人|路地裏の男/.test(key)));
chk('ストーリーNPC(アカリ/リク)は徘徊では歩かない（駆け寄りは別系統）',
  ![...moved].some(key => /\/(アカリ|リク|ヤミ|老神主)$/.test(key)));
chk('意図した可動NPCのみが歩く（移動集合 ⊆ controller保持集合）',
  [...moved].every(key => everPatrol.has(key)));

console.log(`\n${pass ? '✅ 全PASS: 一般NPCの歩行／4コマ再生／可動域・出口回避／固定NPC維持 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
