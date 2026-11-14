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

console.log(`\n${pass ? '✅ 全PASS' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
