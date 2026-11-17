// npc-approach-walk-oracle.js — 駆け寄りNPC(アカリ等)が走り寄る間、歩きの絵になることを実コードで検証する計器。
// 1フレーム = updateApproachNPCs → updateNPCs（index.html の gameLoop と同じ順）。
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
  console: { log: noop, warn: noop, error: console.error }, window: {}, document, Image: FakeImage,
  performance: { now: () => CLOCK },
  setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set, isNaN, parseInt, parseFloat,
  Date: function () { return { toISOString: () => '' }; }
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('map-system.js'), sb, { filename: 'map-system.js' });
const ms = new sb.window.MapSystem();

const testMap = {
  walkableRects: [{ x: 40, y: 40, width: 720, height: 370 }],
  buildings: [],
  npcs: [
    { x: 300, y: 225, emoji: '👤', name: 'アカリ' },
    { x: 600, y: 300, emoji: '🧍', name: '静止市民', static: true },
    { x: 500, y: 100, emoji: '🧍', name: '普通の人', static: true }
  ]
};
ms.maps = { test: testMap };
ms.currentMap = 'test';
ms.prepareScrollableMap(testMap);
ms.initializeNPCMotionControllers();
const akari = testMap.npcs[0], still = testMap.npcs[1];

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && !!cond; };
const sheet = (w = 288, h = 368) => ({ complete: true, naturalWidth: w, naturalHeight: h });
const walk = sheet(), idle = sheet();
const pick = (n) => ms.selectCharacterFrame(walk, idle, n.facing, n.isMoving, n.animTime || 0, CLOCK, 0);
const frame = (px, py) => { CLOCK += 16; const r = ms.updateApproachNPCs(px, py, {}); ms.updateNPCs(); return r; };

console.log('\n=== 駆け寄りNPC 歩行アニメ 計器 ===\n');
// 主人公は アカリ の右 100px（TRIGGER=132 以内・REACH=40 より遠い）。
const px = akari.x + 100, py = akari.y;
frame(px, py); // 1フレーム目で _approaching が立つ
let walkFrames = 0, idleFrames = 0, cols = new Set(), n = 0, reached = null;
while (n++ < 200 && !reached) {
  reached = frame(px, py);
  if (reached) break;
  const f = pick(akari);
  if (akari.isMoving && !f.idle) { walkFrames++; cols.add(f.sx); } else idleFrames++;
}
chk('駆け寄り中は全フレームで isMoving=true・歩きのシート', walkFrames > 5 && idleFrames === 0, `walk=${walkFrames} idle=${idleFrames}`);
chk('駆け寄り中に歩きのコマが循環する(複数列)', cols.size >= 2, `列=${[...cols].join(',')}`);
chk('到達したら会話用に返る', reached === akari);

// 到達後（会話前）: 止まり、待機の絵
ms.updateNPCs();
chk('到達後は isMoving=false・待機の絵', akari.isMoving === false && pick(akari).idle === true);
for (let i = 0; i < 5; i++) frame(px, py);
chk('到達後(完了済み)は動かず待機のまま', akari.isMoving === false && pick(akari).idle === true);

// static / 普通のNPC
for (let i = 0; i < 30; i++) frame(px, py);
chk('static のNPCは isMoving=false・待機の絵', still.isMoving === false && pick(still).idle === true);

// 会話中に止める処理は変わらない
const a2 = { x: 300, y: 225, name: 'アカリ', isMoving: true, _approaching: true };
testMap.npcs.push(a2);
ms._npcPaused = false;
sb.window.isMessageShown = true;
ms.updateNPCs();
chk('会話中(メッセージ表示中)は駆け寄り中でも isMoving=false', a2.isMoving === false);
sb.window.isMessageShown = false;

// 壁に詰まった駆け寄り: 主人公との間に壁があり、ほとんど進めない時は「その場で足踏み」せず立って待つ。
// (闇市の入口でヤミが障害物に当たり、y が毎フレーム 0.0x px ずつしか動かないのに歩きの絵のまま足踏みしていた)
const wallMap = {
  walkableRects: [{ x: 40, y: 40, width: 720, height: 370 }],
  buildings: [{ x: 230, y: 150, width: 30, height: 200 }],   // ヤミと主人公の間の縦長の壁
  npcs: [{ x: 300, y: 250, emoji: '👤', name: 'ヤミ' }]
};
ms.maps.wall = wallMap; ms.currentMap = 'wall';
ms.prepareScrollableMap(wallMap);
ms.initializeNPCMotionControllers();
const yami = wallMap.npcs[0];
// prepareScrollableMap で座標が拡大されるので、拡大後の壁とヤミの位置から主人公を置く。
const wall = wallMap.buildings[0];
const wpx = wall.x - 20, wpy = yami.y - 2;   // 壁の向こう(左)。距離は TRIGGER(132) 以内
if (!(Math.hypot(yami.x - wpx, yami.y - wpy) <= 132)) throw new Error('試験の配置が駆け寄りの範囲外');
CLOCK += 16; ms.updateApproachNPCs(wpx, wpy, {}); ms.updateNPCs();
let stuckWalk = 0, last = { x: yami.x, y: yami.y };
for (let i = 0; i < 120; i++) {
  frame(wpx, wpy);
  const moved = Math.hypot(yami.x - last.x, yami.y - last.y);
  last = { x: yami.x, y: yami.y };
  if (i > 30 && moved < 0.5 && yami.isMoving) stuckWalk++;
}
chk('壁に詰まって進めない時は足踏みしない(isMoving=false・待機の絵)', stuckWalk === 0 && yami.isMoving === false && pick(yami).idle === true, `足踏み${stuckWalk}フレーム x=${yami.x.toFixed(1)} y=${yami.y.toFixed(1)}`);
chk('詰まっても主人公の方を向いている', yami.facing === 'left', `facing=${yami.facing}`);
chk('詰まっても駆け寄りは続いている(主人公が近づけば会話になる)', yami._approaching === true);
const reach2 = frame(yami.x - 30, yami.y);
chk('主人公が近づけば会話用に返る', reach2 === yami);

console.log(`\n${pass ? '✅ 全PASS' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
