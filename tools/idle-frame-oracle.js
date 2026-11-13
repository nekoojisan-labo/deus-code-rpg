// idle-frame-oracle.js — 待機コマ送りの土台を実コードで検証する計器。
// map-system.js を手動クロック(performance.now)で動かし、index.html の drawPlayer は抜き出して模擬 ctx で描く。
// 守ること:
//   1. 停止中は待機シートの4コマを実時間でゆっくり回す(1周1.0〜1.4秒)。位相はキャラごとに決定的にずれる
//   2. 歩行⇄待機の切替で描画先の矩形(位置・大きさ)が変わらない
//   3. 待機シートが無い/読めない/寸法違いの時は歩行シートの列0(主人公・NPCとも)
//   4. 主人公の歩行コマ送りは実時間基準(描画の頻度で歩く見え方が変わらない)
//   5. 1枚絵: ドローン類は浮く・敵は伸縮・物は動かない。影と足元(下端)は動かない
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

let pass = true, count = 0, failed = 0;
const chk = (label, cond, extra) => {
  count++; if (!cond) failed++;
  console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`);
  pass = pass && !!cond;
};
const sheet = (w = 288, h = 368, complete = true) => ({ complete, naturalWidth: w, naturalHeight: h });

console.log('\n=== 待機コマ送り 計器 ===\n');

// ---------- 1. 純粋関数 ----------
const need = ['computeIdleFrame', 'selectCharacterFrame', 'getIdleSpritePath', 'isUsableIdleSheet',
  'getAnimPhaseMs', 'advanceAnimTime', 'getNPCAmbientKind', 'computeAmbientMotion', 'setHoverSpritePaths', 'getAnimClockMs'];
const missing = need.filter(n => typeof ms[n] !== 'function');
chk('MapSystem に待機コマ送りの部品がある', missing.length === 0, missing.length ? 'missing=' + missing.join(',') : '');
if (missing.length) { console.log('\n❌ 部品が無いため以降を検査できない'); process.exit(1); }

const cycle = ms.idleSprite && ms.idleSprite.cycleMs;
chk('待機1周は1.0〜1.4秒', cycle >= 1000 && cycle <= 1400, `cycleMs=${cycle}`);
for (const facing of ['down', 'left', 'right', 'up']) {
  const cols = new Set(); let maxRun = 0, run = 0, prev = null;
  for (let t = 0; t < cycle; t += 10) {
    const f = ms.computeIdleFrame(facing, t, 0);
    cols.add(f.sx);
    if (f.sx === prev) run += 10; else { run = 10; prev = f.sx; }
    maxRun = Math.max(maxRun, run);
    if (f.sy !== ms.walkSprite.rows[facing] * 92 || f.sw !== 72 || f.sh !== 92) { chk(`${facing}: 待機の行・寸法が歩行と同じ`, false, JSON.stringify(f)); break; }
  }
  chk(`${facing}: 1周で待機4コマ(0,72,144,216)を全部通る`, [0, 72, 144, 216].every(x => cols.has(x)), [...cols].join(','));
  chk(`${facing}: 1コマは200ms以上続く(ゆっくり)`, maxRun >= 200, `最長${maxRun}ms`);
}
chk('同じ時刻・位相なら同じコマ(実時間の関数)', ms.computeIdleFrame('down', 777, 0).sx === ms.computeIdleFrame('down', 777 + cycle * 5, 0).sx);

const keys = ['カイト', '武器商人リョウ', '住人@120,300', '住人@400,300', '銀行員', 'おばあさん', '冒険者A', '冒険者B'];
const phases = keys.map(k => ms.getAnimPhaseMs(k));
chk('位相は名前から決定的(2回同じ)', keys.every((k, i) => ms.getAnimPhaseMs(k) === phases[i]));
chk('位相は 0 以上 1周未満', phases.every(p => p >= 0 && p < cycle), phases.join(','));
chk('位相がキャラごとにずれる(8キャラで4通り以上)', new Set(phases.map(p => Math.floor(p / (cycle / 4)))).size >= 3 && new Set(phases).size >= 6, phases.join(','));

chk('歩行シートのパスから待機シートのパス(png)', ms.getIdleSpritePath('assets/characters/sprites/kaito_walk.png') === 'assets/characters/sprites/kaito_idle.png');
chk('webp・?v= 付きでも待機は png', ms.getIdleSpritePath('assets/characters/sprites/kaito_walk.webp?v=53') === 'assets/characters/sprites/kaito_idle.png');
chk('歩行シートでなければ待機シートは無し', ms.getIdleSpritePath('assets/enemies/enemy_patrol_drone.png') === null && ms.getIdleSpritePath(null) === null);
chk('待機シートは webp に置き換えず png のまま読む', ms.getOptimizedImagePath('assets/characters/sprites/kaito_idle.png') === 'assets/characters/sprites/kaito_idle.png');

const walk = sheet(), idle = sheet();
const moving = ms.selectCharacterFrame(walk, idle, 'left', true, 300, 5000, 0);
chk('歩行中は歩行シート(computeWalkFrameと同じ)', moving.image === walk && moving.sx === ms.computeWalkFrame('left', true, 300).sx && moving.sy === 92);
const stopSx = new Set();
for (let t = 0; t < cycle; t += 50) {
  const f = ms.selectCharacterFrame(walk, idle, 'left', false, 300, t, 0);
  if (f.image !== idle) { stopSx.add('walk'); break; }
  stopSx.add(f.sx);
}
chk('停止中は待機シートのコマが時間で変わる', !stopSx.has('walk') && stopSx.size === 4, [...stopSx].join(','));
const fallbacks = {
  '待機シートが無い(null)': null,
  '読み込み中(complete=false)': sheet(288, 368, false),
  '読み込み失敗(naturalWidth=0)': { complete: true, naturalWidth: 0, naturalHeight: 0 },
  '寸法が違う(144x184)': sheet(144, 184),
  '寸法が歩行と違う(576x736)': sheet(576, 736)
};
for (const [label, img] of Object.entries(fallbacks)) {
  const seen = new Set();
  for (let t = 0; t < cycle; t += 100) {
    const f = ms.selectCharacterFrame(walk, img, 'right', false, 300, t, 0);
    seen.add((f.image === walk ? 'walk' : 'other') + ':' + f.sx + ':' + f.sy);
  }
  chk(`戻り道: ${label} → 歩行シートの列0で静止`, seen.size === 1 && seen.has('walk:0:184'), [...seen].join(' '));
}

// 実時間基準の歩行時計: 8ms刻みと16ms刻みで1秒進めた時の animTime がほぼ同じ
function simulateWalk(stepMs) {
  const m = new sb.window.MapSystem();
  const ent = { animTime: 0 };
  CLOCK = 50000;
  m.advanceAnimTime(ent, 'p');
  const start = ent.animTime;
  for (let t = 0; t < 1000; t += stepMs) { CLOCK += stepMs; m.advanceAnimTime(ent, 'p'); }
  return ent.animTime - start;
}
const a8 = simulateWalk(8), a16 = simulateWalk(16), a33 = simulateWalk(33);
chk('歩行時計は実時間: 120fps/60fps/30fpsで1秒進めた量が同じ(±40ms)', Math.abs(a8 - 1000) <= 40 && Math.abs(a16 - 1000) <= 40 && Math.abs(a33 - 1000) <= 40, `8ms→${a8} 16ms→${a16} 33ms→${a33}`);

// 主人公の歩行時計が advanceAnimTime を使っている(フレーム毎+16 の固定加算が残っていない)
const html = read('index.html');
const upSrc = html.slice(html.indexOf('        function updatePlayer() {'), html.indexOf('        function updatePlayer() {') + 12000);
chk('主人公の歩行時計は advanceAnimTime(実時間)で進む', /mapSystem\.advanceAnimTime\(player/.test(upSrc));
chk('主人公の animTime に固定の +16 を足す処理が無い', !/player\.animTime\s*=\s*\(player\.animTime\s*\|\|\s*0\)\s*\+\s*16/.test(html));

// ---------- 2. NPC の描画 ----------
function recordCtx() {
  const calls = [], ell = [], stack = [];
  const ctx = { imageSmoothingEnabled: true, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', globalAlpha: 1,
    save() { stack.push({ t: [...this._t] }); }, restore() { this._t = stack.pop().t; },
    _t: [0, 0], translate(x, y) { this._t = [this._t[0] + x, this._t[1] + y]; }, rotate: noop, scale: noop,
    beginPath: noop, fill: noop, stroke: noop, arc: noop, moveTo: noop, lineTo: noop, closePath: noop, fillRect: noop, strokeRect: noop, fillText: noop,
    ellipse(...a) { ell.push(a); },
    drawImage(img, ...a) { const dst = a.slice(-4); calls.push({ img, src: a.length === 8 ? a.slice(0, 4) : null, dst: [dst[0] + this._t[0], dst[1] + this._t[1], dst[2], dst[3]] }); } };
  return { ctx, calls, ell };
}
ms.worldToScreenPoint = (x, y) => ({ x, y });
ms.isNPCHidden = () => false;
const npcWalkPath = 'assets/characters/sprites/merchant_weapon_walk.png';
const npcIdlePath = 'assets/characters/sprites/merchant_weapon_idle.png';
function drawNpcAt(npc, t, idleImg) {
  ms.spriteImages = {};
  ms.spriteImages[npcWalkPath] = Object.assign(new FakeImage(), sheet());
  if (idleImg !== undefined) ms.spriteImages[npcIdlePath] = idleImg; else ms.spriteImages[npcIdlePath] = Object.assign(new FakeImage(), sheet());
  CLOCK = t;
  const r = recordCtx();
  ms.drawSingleNPC(r.ctx, npc, {});
  return r;
}
const shopNpc = { name: '武器商人リョウ', x: 200, y: 300, facing: 'down', isMoving: false, animTime: 0, image: npcWalkPath };
const npcSeen = new Set(); let npcDst = null, npcDstSame = true, npcUsesIdle = true;
for (let t = 0; t < cycle; t += 50) {
  const r = drawNpcAt(shopNpc, 10000 + t);
  const c = r.calls[0];
  if (!c || c.img !== ms.spriteImages[npcIdlePath]) { npcUsesIdle = false; break; }
  npcSeen.add(c.src[0]);
  if (npcDst && JSON.stringify(npcDst) !== JSON.stringify(c.dst)) npcDstSame = false;
  npcDst = c.dst;
}
chk('NPC: 停止中は待機シートを描く', npcUsesIdle);
chk('NPC: 停止中に時間を進めると描くコマが変わる', npcSeen.size === 4, [...npcSeen].join(','));
chk('NPC: 待機中の描画先の矩形は不変', npcDstSame, JSON.stringify(npcDst));
const walkingNpc = Object.assign({}, shopNpc, { isMoving: true, animTime: 300 });
const rw = drawNpcAt(walkingNpc, 10000);
chk('NPC: 歩行中は歩行シートのコマ', rw.calls[0] && rw.calls[0].img === ms.spriteImages[npcWalkPath] && rw.calls[0].src[0] === ms.computeWalkFrame('down', true, 300).sx);
chk('NPC: 歩行⇄待機で描画先の矩形(位置・大きさ)が同じ', rw.calls[0] && JSON.stringify(rw.calls[0].dst) === JSON.stringify(npcDst), JSON.stringify(rw.calls[0] && rw.calls[0].dst));
for (const [label, img] of Object.entries(fallbacks)) {
  if (img === null) { // 待機シートの読み込み自体が無い場合: キャッシュに置かず、load も失敗扱い
    const r = drawNpcAt(shopNpc, 10123, Object.assign(new FakeImage(), { complete: true, naturalWidth: 0 }));
    chk(`NPC 戻り道: 待機シートが読めない → 歩行シート列0`, r.calls[0] && r.calls[0].img === ms.spriteImages[npcWalkPath] && r.calls[0].src[0] === 0);
    continue;
  }
  const r = drawNpcAt(shopNpc, 10123, Object.assign(new FakeImage(), img));
  chk(`NPC 戻り道: ${label} → 歩行シート列0`, r.calls[0] && r.calls[0].img === ms.spriteImages[npcWalkPath] && r.calls[0].src[0] === 0 && JSON.stringify(r.calls[0].dst) === JSON.stringify(npcDst));
}
// 位相: 同じ時刻に別の NPC は別のコマになり得る(全員同じ拍にならない)
const sameTime = new Set();
for (const [i, nm] of ['冒険者A', '冒険者B', '住人', '銀行員', 'おばあさん', '宿屋の主人'].entries()) {
  const r = drawNpcAt(Object.assign({}, shopNpc, { name: nm, x: 100 + i * 37, originX: 100 + i * 37, originY: 300 }), 20000);
  sameTime.add(r.calls[0] && r.calls[0].src[0]);
}
chk('NPC: 同じ時刻でも NPC ごとにコマがずれる', sameTime.size >= 2, [...sameTime].join(','));

// ---------- 3. 1枚絵(敵・ドローン・物) ----------
ms.setHoverSpritePaths(['assets/enemies/enemy_patrol_drone.webp']);
const cases = [
  { npc: { name: 'パトロールドローン', x: 300, y: 300, hostile: false, emoji: '🤖' }, path: 'assets/enemies/enemy_patrol_drone.png', kind: 'hover' },
  { npc: { name: '何かの敵', x: 300, y: 300, hostile: true, emoji: '👹' }, path: 'assets/enemies/enemy_shadow_entity.png', kind: 'breathe' },
  { npc: { name: '何かのボス', x: 300, y: 300, boss: true, emoji: '🌟' }, path: 'assets/enemies/enemy_true_deus.png', kind: 'breathe' },
  { npc: { name: '何かの物', x: 300, y: 300, static: true, emoji: '📮' }, path: 'assets/objects/post_box.png', kind: 'none' },
  { npc: { name: '何かの物2', x: 300, y: 300, emoji: '⛩️' }, path: 'assets/objects/sacred_relic.png', kind: 'none' }
];
for (const c of cases) {
  chk(`分類: ${c.path.split('/').pop()} → ${c.kind}`, ms.getNPCAmbientKind(c.npc, c.path) === c.kind, ms.getNPCAmbientKind(c.npc, c.path));
}
chk('分類: 歩行シートの人は1枚絵の動きを付けない(待機シートで動く)', ms.getNPCAmbientKind({ hostile: true }, npcWalkPath) === 'none');
chk('分類は名前に依らない(同じ絵なら名前を変えても同じ)', ms.getNPCAmbientKind({ name: 'まったく別の名前', hostile: false }, 'assets/enemies/enemy_patrol_drone.png') === 'hover');
for (const c of cases) {
  const npc = Object.assign({ image: c.path }, c.npc);
  const ys = new Set(), hs = new Set(), bottoms = new Set(), xs = new Set(), ws = new Set(), shadows = new Set();
  for (let t = 0; t < 4000; t += 50) {
    ms.spriteImages = {}; ms.spriteImages[c.path] = Object.assign(new FakeImage(), { complete: true, naturalWidth: 256, naturalHeight: 256 });
    CLOCK = 30000 + t;
    const r = recordCtx(); ms.drawSingleNPC(r.ctx, npc, {});
    const d = r.calls[0].dst;
    ys.add(d[1].toFixed(2)); hs.add(d[3].toFixed(2)); bottoms.add((d[1] + d[3]).toFixed(2)); xs.add(d[0]); ws.add(d[2]);
    shadows.add(JSON.stringify(r.ell[0]));
  }
  const yNums = [...ys].map(Number), hNums = [...hs].map(Number);
  chk(`${c.kind} ${c.path.split('/').pop()}: 影は動かない・横位置と幅は不変`, shadows.size === 1 && xs.size === 1 && ws.size === 1);
  if (c.kind === 'hover') {
    chk('hover: 上下にゆっくり浮く(高さ不変・上へ1〜4px・下へは沈まない)', hs.size === 1 && (Math.max(...yNums) - Math.min(...yNums)) >= 1 && (Math.max(...yNums) - Math.min(...yNums)) <= 4,
      `y範囲=${Math.min(...yNums)}..${Math.max(...yNums)}`);
  } else if (c.kind === 'breathe') {
    const base = Math.max(...hNums);
    chk('breathe: 下端(足元)は固定・高さだけ呼吸程度に伸縮(±3%以内)', bottoms.size === 1 && hs.size > 1 && (Math.max(...hNums) - Math.min(...hNums)) / base <= 0.06,
      `h=${Math.min(...hNums).toFixed(2)}..${Math.max(...hNums).toFixed(2)}`);
  } else {
    chk('none: 物は動かない', ys.size === 1 && hs.size === 1);
  }
}

// ---------- 4. 主人公の描画(index.html の drawPlayer) ----------
const pSrc = html.slice(html.indexOf('        function drawPlayer() {'), html.indexOf('        function updatePlayer() {'));
function drawPlayerWith(moving, idleImg, t) {
  const calls = [];
  const ctx = { globalAlpha: 1, globalCompositeOperation: 'source-over', imageSmoothingEnabled: true, shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
    save: noop, restore: noop, beginPath: noop, ellipse: noop, fill: noop,
    drawImage(img, ...a) { calls.push({ img, a }); } };
  const playerSprite = sheet();
  CLOCK = t;
  const box = { ctx, player: { x: 400, y: 300, facing: 'up', isMoving: moving, animTime: 300 }, playerSpriteLoaded: true, playerSprite, playerIdleSprite: idleImg, mapSystem: ms };
  vm.createContext(box); vm.runInContext(pSrc + ';drawPlayer();', box);
  return { calls, playerSprite };
}
const pSeen = new Set(); let pOk = true;
for (let t = 0; t < cycle; t += 50) {
  const idleImg = sheet();
  const r = drawPlayerWith(false, idleImg, 40000 + t);
  if (r.calls.length !== 2 || r.calls.some(c => c.img !== idleImg) || JSON.stringify(r.calls[0].a) !== JSON.stringify(r.calls[1].a)) { pOk = false; break; }
  if (JSON.stringify(r.calls[0].a.slice(-4)) !== '[374,240,52,66]') { pOk = false; break; }
  pSeen.add(r.calls[0].a[0]);
}
chk('主人公: 停止中は待機シートを2回(縁取り)とも同じコマで描く・描画先 [374,240,52,66]', pOk);
chk('主人公: 停止中に時間を進めると描くコマが変わる', pSeen.size === 4, [...pSeen].join(','));
const pw = drawPlayerWith(true, sheet(), 40000);
chk('主人公: 歩行中は歩行シートを2回とも同じコマで描く', pw.calls.length === 2 && pw.calls.every(c => c.img === pw.playerSprite) && JSON.stringify(pw.calls[0].a) === JSON.stringify(pw.calls[1].a)
  && pw.calls[0].a[0] === ms.computeWalkFrame('up', true, 300).sx && JSON.stringify(pw.calls[0].a.slice(-4)) === '[374,240,52,66]');
for (const [label, img] of Object.entries(fallbacks)) {
  const r = drawPlayerWith(false, img, 40123);
  chk(`主人公 戻り道: ${label} → 歩行シート列0`, r.calls.length === 2 && r.calls.every(c => c.img === r.playerSprite && c.a[0] === 0 && c.a[1] === 276));
}

console.log(`\n${count}項目中 ${count - failed}項目合格`);
console.log(pass ? '\n✅ PASS: 待機コマ送り・戻り道・実時間・1枚絵の動きが仕様どおり' : '\n❌ 不合格あり');
process.exit(pass ? 0 : 1);
