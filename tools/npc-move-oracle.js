// npc-move-oracle.js — NPC徘徊「意図駆動移動」部品を実コードで検証する計器。
// performance.now を手動クロック化し、実際の prepareScrollableMap→updateNPCs→computeWalkFrame を走らせて
// 「歩行中はsx列が循環する(0固定でない=脚が動く)」「静止NPCはsx=0固定」
// 「一般NPCには自動roamが付く」「全移動NPCが毎フレーム可動域内」を観測する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

// --- 手動クロック: updateNPCs を呼ぶ前に16ms進める ---
let CLOCK = 1000;
const advance = (ms) => { CLOCK += ms; };

function fakeEl() {
  return { innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
    setAttribute: noop, getAttribute: () => null, appendChild: noop, querySelector: () => null };
}
class FakeImage { constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; } }
const document = { getElementById: () => fakeEl(), querySelector: () => null, createElement: () => fakeEl(), addEventListener: noop };
const sb = {
  console, window: {}, document, Image: FakeImage,
  performance: { now: () => CLOCK },
  setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math: Object.assign(Object.create(Math), { random: (() => { let s = 12345; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000); })() }),
  JSON, Object, Array, Number, String, Boolean, Map, Set, isNaN, parseInt, parseFloat,
  Date: function () { return { toISOString: () => '' }; }
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('map-system.js'), sb, { filename: 'map-system.js' });

const ms = new sb.window.MapSystem();

// --- テストマップ(プレーン: walkableRectsベース・objectLayer無し) ---
// BASE座標。prepareScrollableMap が ×1.55 する。
const SCALE = 1.55;
const testMap = {
  walkableRects: [{ x: 40, y: 40, width: 720, height: 370 }],
  buildings: [],
  npcs: [
    { x: 400, y: 225, emoji: '🧍', name: '静止市民', static: true },
    { x: 500, y: 225, emoji: '👤', name: '街の住民' }, // 実スプライトを持つ一般NPC → 自動roam
    { x: 180, y: 225, emoji: '🚶', name: '往復市民', move: { type: 'pingpong', to: { x: 600, y: 225 } } },
    { x: 400, y: 300, emoji: '👾', name: '徘徊敵', hostile: true, move: { type: 'roam', radius: 50 } },
    { x: 300, y: 150, emoji: '💂', name: '巡回衛兵', move: { type: 'patrol', points: [{ x: 300, y: 150 }, { x: 600, y: 150 }, { x: 600, y: 360 }, { x: 300, y: 360 }], wait: 200 } }
  ]
};
ms.maps = { test: testMap };
ms.currentMap = 'test';
ms.prepareScrollableMap(testMap);
ms.initializeNPCMotionControllers();

const byName = {};
testMap.npcs.forEach(n => { byName[n.name] = n; });

console.log('\n=== NPC意図駆動移動 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// 初期状態の確認
chk('static NPCは _patrol=null（固定配置を維持）', byName['静止市民']._patrol === null);
chk('歩行スプライトを持つ一般NPCは move 指定なしでも自動roam', byName['街の住民']._patrol && byName['街の住民']._motionSource === 'ambient');
chk('pingpong/patrol/roam は _patrol を持つ',
  byName['往復市民']._patrol && byName['徘徊敵']._patrol && byName['巡回衛兵']._patrol);

// --- 観測ループ: 240フレーム(≈4秒) ---
const FRAMES = 240;
const sxSeen = {}; // name -> Set of sx while isMoving
let movingAnyFrame = {};
testMap.npcs.forEach(n => { sxSeen[n.name] = new Set(); movingAnyFrame[n.name] = false; });
let outOfDomain = 0;
let maxRoamDist = 0;
let syntheticTransformSeen = false;
const roam = byName['徘徊敵'];
const roamRadiusScaled = roam._patrol.radius;
let staticEverMoved = false;
let staticSxNonzero = false;

for (let f = 0; f < FRAMES; f++) {
  advance(16);
  ms.updateNPCs();
  testMap.npcs.forEach(n => {
    // 不変条件: 毎フレーム可動域内
    if (!ms.isMapPositionWalkable(testMap, n.x, n.y, 22)) outOfDomain++;
    const fr = ms.computeWalkFrame(n.facing, n.isMoving, n.animTime || 0);
    const juice = ms.computeWalkJuice(n.isMoving, n.animTime || 0);
    if (n.isMoving) { sxSeen[n.name].add(fr.sx); movingAnyFrame[n.name] = true; }
    if (Math.abs((juice.sx || 1) - 1) > 0.001 || Math.abs((juice.sy || 1) - 1) > 0.001 || Math.abs(juice.sway || 0) > 0.001 || Math.abs(juice.lean || 0) > 0.001) syntheticTransformSeen = true;
    if (n.name === '静止市民') {
      if (n.isMoving) staticEverMoved = true;
      if (fr.sx !== 0) staticSxNonzero = true;
    }
    if (n.name === '徘徊敵') {
      const d = Math.hypot(n.x - n.originX, n.y - n.originY);
      if (d > maxRoamDist) maxRoamDist = d;
    }
  });
}

// --- 検証 ---
chk('静止市民は一度も isMoving=true にならない', !staticEverMoved);
chk('静止市民の描画フレームは常に sx=0（idle列固定）', !staticSxNonzero);
chk('一般NPCは実際に移動する', movingAnyFrame['街の住民']);

const pingSx = [...sxSeen['往復市民']].filter(v => v !== 0);
chk('往復市民: 歩行中にsx列が「複数の非ゼロ列」を取る（脚が循環・0固定でない）',
  pingSx.length >= 2, `非ゼロ列=${[...sxSeen['往復市民']].sort((a, b) => a - b).join(',')}`);
chk('往復市民: animTimeが増加している（歩行コマが送られた）', (byName['往復市民'].animTime || 0) > 0, `animTime=${byName['往復市民'].animTime}`);

const guardSx = [...sxSeen['巡回衛兵']].filter(v => v !== 0);
chk('巡回衛兵: 歩行中にsx列が循環する', guardSx.length >= 2, `非ゼロ列=${[...sxSeen['巡回衛兵']].sort((a, b) => a - b).join(',')}`);

const roamSx = [...sxSeen['徘徊敵']].filter(v => v !== 0);
chk('徘徊敵: 歩行中にsx列が循環する', roamSx.length >= 2, `非ゼロ列=${[...sxSeen['徘徊敵']].sort((a, b) => a - b).join(',')}`);
chk('歩行シートを伸縮・傾斜させず足元固定で描画する', !syntheticTransformSeen);

chk('不変条件: 全NPCが全フレームで可動域内（域外0件）', outOfDomain === 0, `域外=${outOfDomain}件`);
chk('徘徊敵: 原点からの最大距離が半径+1歩以内（遠方ドリフトなし）',
  maxRoamDist <= roamRadiusScaled + 2.0, `max=${maxRoamDist.toFixed(1)} / radius=${roamRadiusScaled}`);

console.log(`\n${pass ? '✅ 全PASS: 歩行アニメ恒常化／静止は静止／可動域不変条件／遠方ドリフトなし を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
