// map-entry-feel-oracle.js
// マップの出入りの「体感」を、実コードの updatePlayer / runMapTransition（index.html から切り出し）と
// MapSystem で 1 フレームずつ歩かせて検査する。時間は performance.now を差し替えて進め、
// transitionToMap → 300ms でマップ切替 → 350ms で到着点へ移動、の順序もそのまま再現する。
//
// 検査（全遷移・全出口）:
//   A1 到着→すぐ戻る      : 到着直後に戻り出口の方向キーを押すと 20 フレーム以内に元のマップへ戻れる
//   A2 押し続けで戻されない : 入ってきた方向キーを押したまま到着し、2 秒押し続けても元のマップへ戻されない
//   A3 離してから押せば戻る : A2 の後に一度キーを離し、戻り出口の方向を押すと 40 フレーム以内に戻れる
//   A4 到着の向き          : 到着時の向きが戻り出口（120px 以内）の方を向いていない
//   A5 自動扉の斜め進入    : 扉の正面の筋から「入る向き＋横」の斜め押しでも入店できる
//   A6 鍵付き出口の案内    : 押し続けたまま Z で閉じても、同じ出口の案内は 1 回だけ
//   A7 セーブポイント      : 歩ける位置から判定距離 50 に余裕（45 未満）で届く
//   A8 案内の矢印          : 自動扉の矢印は入る向き（requireFacing）と一致する
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const fakeEl = () => ({ style: {}, dataset: {}, textContent: '', classList: { add: noop, remove: noop, contains: () => false, toggle: noop }, appendChild: noop, remove: noop, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null });
const ALL_FLAGS = { chapter1_complete: true, yamiJoined: true, chapter1_started: true, arcDefeated: true, leviathanDefeated: true, rikuJoined: true, metPriest: true, archonDefeated: true, enteredGov: true };
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

function grabFunction(html, name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) return null;
  let i = html.indexOf('{', start), depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

function createWorld(flags) {
  let clock = 1000;
  const timers = [];
  const addTimer = (fn, ms) => { timers.push({ at: clock + (ms || 0), fn }); return timers.length; };
  const sb = { console: { log: noop, warn: noop, error: noop }, window: { location: { search: '' } }, document: { getElementById: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [], createElement: fakeEl, body: fakeEl() }, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} }, performance: { now: () => clock }, setTimeout: addTimer, clearTimeout: noop, requestAnimationFrame: noop, localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, Math, JSON, Object, Array, Number, String, Boolean, Date, Map, Set, URLSearchParams };
  sb.window.localStorage = sb.localStorage;
  sb.globalThis = sb;
  vm.createContext(sb);
  ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js'].forEach((f) => vm.runInContext(read(f), sb, { filename: f }));
  sb.window.storyFlags = flags;
  const ms = new sb.window.MapSystem();
  ms.updateApproachNPCs = () => null;   // 駆け寄りNPCの会話は対象外
  ms.showMapName = noop;

  const html = read('index.html');
  const env = {
    window: { isGameOver: false, storyFlags: flags }, keys: {}, player: { x: 0, y: 0, facing: 'down', stepCount: 0 },
    mapSystem: ms, battleSystem: { inBattle: false, countStep: noop, encounterSteps: 0, encounterThreshold: 999 },
    gameStarted: true, isMessageShown: false, storyFlags: flags, storyEventSystem: null,
    document: { getElementById: () => fakeEl() }, console: { log: noop },
    canvas: { width: 800, height: 450 }, messages: [], transitions: [],
    updateMapInfo: noop, onEnterMap: noop, handleApproachConversation: noop, checkInteractions: noop,
    checkSavePoint: () => false, openSaveScreen: noop, setTimeout: addTimer, Math, Object
  };
  env.showMessage = (t) => { env.messages.push({ t, map: ms.currentMap }); env.isMessageShown = true; };
  // updatePlayer が呼ぶ index.html 側の関数（出入りに関わるもの）は実物を切り出して同じスコープに置く
  const names = ['updatePlayer', 'runMapTransition', 'heldMoveKey', 'checkExitAt', 'noticeLockedExit', 'checkAutoEnter'];
  const src = names.map((n) => grabFunction(html, n)).filter(Boolean).join('\n');
  // index.html の let 宣言（案内の重複防止用）をここでも用意
  const lets = (html.match(/^\s*let lastLockedNoticeExit = null;\s*$/m) ? 'let lastLockedNoticeExit = null;\n' : '');
  const fns = new Function('env', 'with (env) {\n' + lets + src + '\nreturn { updatePlayer, runMapTransition };\n}')(env);
  const realT = ms.transitionToMap.bind(ms);
  ms.transitionToMap = (id) => { env.transitions.push({ from: ms.currentMap, to: ms.normalizeMapId(id) }); return realT(id); };

  const runTimers = () => {
    timers.sort((a, b) => a.at - b.at);
    while (timers.length && timers[0].at <= clock) { const t = timers.shift(); t.fn(); timers.sort((a, b) => a.at - b.at); }
  };
  const frame = (dirs) => {
    Object.values(KEY).forEach((k) => { env.keys[k] = false; });
    (dirs || []).forEach((d) => { env.keys[KEY[d]] = true; });
    fns.updatePlayer();
    clock += 1000 / 60;
    runTimers();
  };
  const reset = (mapId, x, y, facing) => {
    timers.length = 0;
    ms.currentMap = mapId; ms.previousMap = null; ms.transitioning = false; ms.transitionCooldownUntil = 0;
    ms._backExitArmed = true; ms._arrivalHeldKey = null;
    env.transitions.length = 0; env.messages.length = 0; env.isMessageShown = false;
    env.player.x = x; env.player.y = y; if (facing) env.player.facing = facing;
  };
  // from の exit を実際に通って to へ着いた直後（到着点へ移動した次のフレーム）までを再現する
  const arriveVia = (from, exit, holdKeys) => {
    reset(from, Math.round(exit.x + exit.width / 2), Math.round(exit.y + exit.height / 2));
    fns.runMapTransition({ nextMap: ms.normalizeMapId(exit.to), exit });
    const t0 = clock;
    while (clock - t0 < 351) frame(holdKeys || []);
    env.transitions.length = 0;
    return { x: env.player.x, y: env.player.y, facing: env.player.facing };
  };
  return { ms, env, sb, frame, reset, arriveVia };
}

// ---- 共通 ----
const FACE = { north: 'up', south: 'down', west: 'left', east: 'right' };
const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function enterKey(ms, mapId, e) {
  if (e.requireFacing) return e.requireFacing;
  if (FACE[e.direction]) return FACE[e.direction];
  const m = ms.maps[mapId];
  const dx = e.x + e.width / 2 - (m.worldWidth || 800) / 2, dy = e.y + e.height / 2 - (m.worldHeight || 450) / 2;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

const W = createWorld(ALL_FLAGS);
const { ms, env } = W;
const N = (id) => ms.normalizeMapId(id);
const fails = [];
const table = [];
const fail = (code, msg) => fails.push(`${code} ${msg}`);

// ---- A1〜A4: 全遷移 ----
let transitions = 0;
for (const [from, m] of Object.entries(ms.maps)) {
  for (const e of (m.exits || [])) {
    const to = N(e.to);
    const target = ms.maps[to];
    if (!target) continue;
    const back = (target.exits || []).find((b) => N(b.to) === from);
    if (!back) continue;
    transitions++;
    const inKey = enterKey(ms, from, e);
    const backKey = enterKey(ms, to, back);
    const row = { from, to, inKey, backKey };

    // A1 キーを離して到着 → すぐ戻り方向を押す
    const sp = W.arriveVia(from, e, []);
    row.spawn = `${sp.x},${sp.y}/${sp.facing || '-'}`;
    let a1 = -1;
    for (let f = 0; f < 240; f++) { W.frame([backKey]); if (env.transitions.length) { a1 = N(env.transitions[0].to) === from ? f : -2; break; } }
    row.a1 = a1 >= 0 ? `${a1}f` : (a1 === -2 ? '別の出口' : `戻れず(${env.player.x},${env.player.y})`);
    if (!(a1 >= 0 && a1 <= 20)) fail('A1', `${from} -> ${to}: 到着直後に ${backKey} で戻れない (${row.a1})`);

    // A2 入ってきたキーを押したまま到着し、2 秒押し続ける
    const held = W.arriveVia(from, e, [inKey]);
    let a2 = null;
    for (let f = 0; f < 120; f++) { W.frame([inKey]); if (env.transitions.length) { a2 = { to: N(env.transitions[0].to), f }; break; } }
    row.a2 = a2 ? `${a2.to}@${a2.f}f` : '-';
    if (a2 && a2.to === from) fail('A2', `${from} -> ${to}: ${inKey} を押し続けると ${a2.f} フレームで元のマップへ戻される`);

    // A3 押したまま到着→0.5 秒押し続け→一度離す→戻り方向を押す
    W.arriveVia(from, e, [inKey]);
    let a3 = -1;
    for (let f = 0; f < 30 && !env.transitions.length; f++) W.frame([inKey]);
    if (!env.transitions.length) {
      W.frame([]);
      for (let f = 0; f < 240; f++) { W.frame([backKey]); if (env.transitions.length) { a3 = N(env.transitions[0].to) === from ? f : -2; break; } }
      row.a3 = a3 >= 0 ? `${a3}f` : (a3 === -2 ? '別の出口' : `戻れず(${env.player.x},${env.player.y})`);
      if (!(a3 >= 0 && a3 <= 60)) fail('A3', `${from} -> ${to}: ${inKey} を押し続けた後、離して ${backKey} で戻れない (${row.a3})`);
    } else row.a3 = '-';

    // A4 ゲームが到着時に与える向き（spawnFace 等。無ければ歩いてきた向きのまま）が近くの戻り出口を向いていない
    ms.currentMap = to; ms.previousMap = from; ms._pendingSpawnFrom = from; ms._pendingSpawnTo = to;
    const sp0 = ms.getSpawnPoint({ ...e, to }, null);
    const face0 = sp0.facing || inKey;
    const bx = back.x + back.width / 2 - sp0.x, by = back.y + back.height / 2 - sp0.y;
    const v = VEC[face0];
    const dist = Math.hypot(Math.max(back.x - sp0.x, 0, sp0.x - (back.x + back.width)), Math.max(back.y - sp0.y, 0, sp0.y - (back.y + back.height)));
    row.a4 = v && dist < 120 && (v[0] * bx + v[1] * by) > 0 && Math.abs(v[0] ? bx : by) > Math.abs(v[0] ? by : bx) ? '戻り出口を向く' : 'OK';
    if (row.a4 !== 'OK') fail('A4', `${from} -> ${to}: 到着の向き ${face0} が ${Math.round(dist)}px 先の戻り出口を向いている`);
    void held;
    table.push(row);
  }
}

// ---- A5: 自動扉への斜め進入 ----
let autoDoors = 0;
for (const [id, m] of Object.entries(ms.maps)) {
  for (const e of (m.exits || [])) {
    if (!e.autoEnter) continue;
    const k = e.requireFacing || 'up';
    const [nx] = VEC[k];
    const lat = nx === 0 ? ['left', 'right'] : ['up', 'down'];
    const s = ms.getMapScale(id), R = Math.round(28 * s);
    let tried = 0, ok = 0;
    for (const side of lat) {
      // 扉の正面の筋（扉幅の中）から、帯の少し外側で斜めに押す
      for (let t = 0.25; t <= 0.75; t += 0.25) {
        let sx, sy;
        if (k === 'up') { sx = e.x + e.width * t; sy = e.y + e.height + R + 6; }
        else if (k === 'down') { sx = e.x + e.width * t; sy = e.y - R - 6; }
        else if (k === 'left') { sy = e.y + e.height * t; sx = e.x + e.width + R + 6; }
        else { sy = e.y + e.height * t; sx = e.x - R - 6; }
        sx = Math.round(sx); sy = Math.round(sy);
        W.reset(id, sx, sy, k);
        if (!ms.isSafeSpawnPoint(m, sx, sy, 24)) continue;
        tried++;
        for (let f = 0; f < 40; f++) { W.frame([k, side]); if (env.transitions.length || env.messages.length) { ok++; break; } }
      }
    }
    autoDoors++;
    if (tried && ok === 0) fail('A5', `${id} -> ${N(e.to)}: 斜め（${k}+横）で ${tried} 筋とも入れない`);
  }
}

// ---- A6: 鍵付き出口の案内は 1 回 ----
{
  const L = createWorld({});
  const cases = [];
  for (const [id, m] of Object.entries(L.ms.maps)) for (const e of (m.exits || [])) if (e.requiredFlag || e.locked) cases.push([id, e]);
  for (const [id, e] of cases) {
    const k = enterKey(L.ms, id, e);
    const [nx, ny] = VEC[k];
    // 出口の正面 80px 手前の歩ける点から押し続ける
    let start = null;
    for (let d = 80; d <= 160 && !start; d += 6) {
      const x = Math.round(e.x + e.width / 2 - nx * (e.width / 2 + d)), y = Math.round(e.y + e.height / 2 - ny * (e.height / 2 + d));
      L.ms.currentMap = id;
      if (L.ms.isSafeSpawnPoint(L.ms.maps[id], x, y, 24)) start = { x, y };
    }
    if (!start) continue;
    L.reset(id, start.x, start.y, k);
    for (let f = 0; f < 180; f++) { L.frame([k]); if (L.env.isMessageShown) L.env.isMessageShown = false; }
    const same = L.env.messages.length;
    if (same > 1) fail('A6', `${id} -> ${N(e.to)}: 押し続けたまま閉じると案内が ${same} 回出る`);
  }
}

// ---- A7: セーブポイントに届く ----
for (const [id, m] of Object.entries(ms.maps)) {
  if (!m.savePoint) continue;
  ms.currentMap = id;
  let best = Infinity;
  for (let dx = -60; dx <= 60; dx += 2) for (let dy = -60; dy <= 60; dy += 2) {
    const x = m.savePoint.x + dx, y = m.savePoint.y + dy;
    if (!ms.isMapPositionWalkable(m, x, y, 24)) continue;
    best = Math.min(best, Math.hypot(dx, dy));
  }
  if (!(best < 45)) fail('A7', `${id}: セーブポイント ${m.savePoint.x},${m.savePoint.y} に歩ける位置から ${best === Infinity ? '60px 以内で届かない' : best.toFixed(1) + 'px'}（判定 50 未満・余裕 45 未満が必要）`);
}

// ---- A8: 自動扉の案内矢印 ----
{
  const labels = [];
  const ctx = { save: noop, restore: noop, fillRect: noop, strokeRect: noop, measureText: (t) => ({ width: t.length * 7 }), fillText: (t) => labels.push(t) };
  const ARROW = { up: '↑', down: '↓', left: '←', right: '→' };
  for (const [id, m] of Object.entries(ms.maps)) {
    for (const e of (m.exits || [])) {
      if (!e.autoEnter || !e.requireFacing) continue;
      W.reset(id, 0, 0);
      ms.worldToScreenPoint = () => ({ x: 400, y: 225 });
      const before = labels.length;
      const only = m.exits;
      m.exits = [e];
      try { ms.drawExitGuides(ctx, { width: 800, height: 450 }); } finally { m.exits = only; }
      const label = labels.slice(before)[0];
      if (label && !label.startsWith(ARROW[e.requireFacing])) fail('A8', `${id} -> ${N(e.to)}: 矢印 "${label}" が入る向き ${e.requireFacing} と違う`);
    }
  }
}

// ---- A9: ゲーム開始位置（index.html の初期 spawnX/spawnY）から少し押しただけで出口に入らない ----
{
  const html = read('index.html');
  const m0 = html.match(/const initialSpawn = mapSystem\.getSpawnPoint\(\{\s*to: mapSystem\.currentMap,\s*spawnX: (\d+),\s*spawnY: (\d+)/);
  if (!m0) fail('A9', '開始位置の定義が見つからない');
  else {
    const startMap = new ms.constructor().currentMap;
    const s = ms.getMapScale(startMap);
    ms.previousMap = null; ms._pendingSpawnFrom = null;
    const p = ms.getSpawnPoint({ to: startMap, spawnX: Number(m0[1]), spawnY: Number(m0[2]) }, null);
    for (const d of ['up', 'down', 'left', 'right']) {
      W.reset(startMap, p.x, p.y, 'down'); ms.previousMap = null;
      let f = 0;
      for (; f < 10; f++) { W.frame([d]); if (env.transitions.length) break; }
      if (env.transitions.length) fail('A9', `開始位置 ${p.x},${p.y}（${startMap}）から ${d} を ${f + 1} フレーム押すと ${N(env.transitions[0].to)} へ出る（10 フレーム未満）`);
    }
    // 読み込み時の旧セーブ互換の開始位置も同じ座標であること
    const legacy = html.match(/getSpawnPoint\(\{ to: mapId, spawnX: (\d+), spawnY: (\d+) \}/);
    if (legacy && (legacy[1] !== m0[1] || legacy[2] !== m0[2])) fail('A9', `旧セーブの開始位置 ${legacy[1]},${legacy[2]} が初期位置 ${m0[1]},${m0[2]} と違う`);
    void s;
  }
}

// ---- A10: 出口の正面から入れる ----
//   各出口の「入る向き」の真後ろに歩ける筋（出口の幅の 5 か所 × 手前 10/40/80/120px）を取り、その筋から入る向きのキーだけを押し続けて
//   出口が発動する（鍵付きは案内が出る）か。歩ける筋があるのに 1 本も着かない＝出口の判定が絵の入口より奥／手前に壁がある。
//   歩ける筋が 1 本も無い（出口の手前が塞がれている）のも不合格。
const a10 = [];
for (const [id, m] of Object.entries(ms.maps)) {
  const sc = ms.getMapScale(id);
  for (const e of (m.exits || [])) {
    // 接触の出口は体の余白ぶん、自動扉は到達帯（28*scale）ぶんが、出口の前縁から手前に効く範囲
    const P = e.autoEnter ? Math.round(28 * sc) : 12 + Math.max(8, Math.round(8 * sc));
    const k = enterKey(ms, id, e);
    const [nx, ny] = VEC[k];
    let starts = 0, okLanes = 0, cStarts = 0, cOk = 0; const bad = [];
    const savedNpcs = m.npcs; m.npcs = [];   // 人の立ち位置は別の話（地形と出口のずれだけを見る）
    for (let li = 0; li < 5; li++) {
      const t = 0.15 + li * 0.175;
      for (const d of (e.autoEnter ? [-40, -20, -4, 20, 50, 90] : [-4, 20, 50, 90])) {
        // 出口が効き始める線（前縁＋P）から d 手前（d<0 は効く範囲の内側）
        let sx, sy;
        if (ny !== 0) { sx = e.x + e.width * t; sy = ny < 0 ? e.y + e.height + P + d : e.y - P - d; }
        else { sy = e.y + e.height * t; sx = nx < 0 ? e.x + e.width + P + d : e.x - P - d; }
        sx = Math.round(sx); sy = Math.round(sy);
        ms.currentMap = id;
        if (!ms.isSafeSpawnPoint(m, sx, sy, 24)) continue;
        starts++;
        W.reset(id, sx, sy, k);
        let hit = false;
        for (let f = 0; f < 240 && !hit; f++) { W.frame([k]); if (env.transitions.length || env.messages.length) hit = true; }
        if (hit) okLanes++; else bad.push(`${sx},${sy}→${env.player.x},${env.player.y}`);
        if (li === 2) { cStarts++; if (hit) cOk++; }
      }
    }
    m.npcs = savedNpcs;
    a10.push({ id, to: N(e.to), k, starts, okLanes, cStarts, cOk });
    if (starts > 0 && cOk < cStarts) fail('A11', `${id} -> ${N(e.to)}: 出口の中心の真後ろから ${k} 押し続けで入れない筋がある（${cStarts} 本中 ${cOk} 本・出口 ${Math.round(e.x)},${Math.round(e.y)} ${Math.round(e.width)}x${Math.round(e.height)}。判定の中心が絵の入口の真ん中からずれている）`);
    if (starts === 0) fail('A10', `${id} -> ${N(e.to)}: 出口の正面（${k} 向きの真後ろ）に歩ける筋が 1 本も無い（出口 ${Math.round(e.x)},${Math.round(e.y)} ${Math.round(e.width)}x${Math.round(e.height)}）`);
    else if (starts < 2 || okLanes / starts < 0.5) fail('A10', `${id} -> ${N(e.to)}: 正面の歩ける筋が ${starts} 本・うち ${okLanes} 本しか ${k} 押し続けで出口に着かない（2 本未満または半分未満）（例 ${bad[0]}・出口 ${Math.round(e.x)},${Math.round(e.y)} ${Math.round(e.width)}x${Math.round(e.height)}）`);
  }
}
if (process.env.A10_TABLE) a10.forEach((r) => console.log(`A10 ${r.id} -> ${r.to} ${r.k} starts=${r.starts} ok=${r.okLanes}`));

// ---- A12: 出口へ入る通路の幅 ----
//   出口が効く範囲（前縁 P 手前〜箱の奥）で、入る向きと直角に取った歩ける連続幅の最大が 40px（体 24px + 余裕）以上。
//   狭すぎると十字キーで通路の細い筋へ位置を合わせられず、出口の目の前まで来ても入れない。
for (const [id, m] of Object.entries(ms.maps)) {
  const sc = ms.getMapScale(id), WW = m.worldWidth || 800, HH = m.worldHeight || 450;
  for (const e of (m.exits || [])) {
    const k = enterKey(ms, id, e), vert = k === 'up' || k === 'down';
    const P = e.autoEnter ? Math.round(28 * sc) : 12 + Math.max(8, Math.round(8 * sc));
    ms.currentMap = id;
    let best = 0;
    const d0 = (vert ? e.y : e.x) - P, d1 = (vert ? e.y + e.height : e.x + e.width) + P;
    const l0 = (vert ? e.x : e.y) - P, l1 = (vert ? e.x + e.width : e.y + e.height) + P;
    for (let d = d0; d <= d1; d += 3) {
      let run = 0;
      for (let l = l0; l <= l1; l += 2) {
        const x = vert ? l : d, y = vert ? d : l;
        if (x >= 0 && y >= 0 && x < WW && y < HH && ms.isMapPositionWalkable(m, x, y, 24)) { run += 2; if (run > best) best = run; } else run = 0;
      }
    }
    if (best < 40) fail('A12', `${id} -> ${N(e.to)}: 出口へ入る通路の歩ける幅が ${best}px（40px 未満・出口 ${Math.round(e.x)},${Math.round(e.y)} ${Math.round(e.width)}x${Math.round(e.height)}）`);
  }
}

// ---- A13: 出口の判定が背景の絵の入口と合っている ----
//   絵を目で測った「入口（扉・階段・鳥居・転移門の足元）」の範囲（世界座標）を登録し、
//   出口の判定箱が入口の外へ 40px 以上はみ出さず（柱や壁の上に広がらない）、箱の中心が入口の中に入っていること。
//   接触の出口は、効き始める線（箱＋体の余白）も入口から 40px 以上手前に出ない（入口の遥か手前で転移しない）。
//   登録は絵を確かめた出口だけ（登録の増減は絵の差し替え時に見直す）。
const ART_OPENINGS = {
  'tokyo_gov_approach>tokyo_gov_floor2': { x: 570, y: 115, w: 130, h: 75 },     // 柱の間の扉（ガラス扉 605-662 / 柱 550-568・700-715）
  'shrine_south_gate>shrine_inner': { x: 552, y: 95, w: 100, h: 70 },           // 鳥居の脚の間〜石段（脚 537-552・652-667、石段 y122-158）
  'shopping_street_south>residential_street': { x: 1128, y: 350, w: 112, h: 38 } // 植え込みの低い壁と屋根の間の道
};
for (const [key, o] of Object.entries(ART_OPENINGS)) {
  const [from, to] = key.split('>');
  const m = ms.maps[from];
  const e = m && (m.exits || []).find((x) => N(x.to) === to);
  if (!e) { fail('A13', `${key}: 登録した出口が無い`); continue; }
  const sc = ms.getMapScale(from), TOL = 40;
  const P = e.autoEnter ? 0 : 12 + Math.max(8, Math.round(8 * sc));
  const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
  const out = (a, b, lo, hi) => Math.max(lo - a, 0, b - hi);
  const dx = out(e.x - P, e.x + e.width + P, o.x - TOL, o.x + o.w + TOL), dy = out(e.y - P, e.y + e.height + P, o.y - TOL, o.y + o.h + TOL);
  const centerIn = cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h;
  if (dx > 0 || dy > 0 || !centerIn) fail('A13', `${key}: 出口 ${Math.round(e.x)},${Math.round(e.y)} ${Math.round(e.width)}x${Math.round(e.height)}（効く範囲は体の余白 ${P}px 込み）が絵の入口 ${o.x},${o.y} ${o.w}x${o.h} から外へ ${Math.round(Math.max(dx, dy))}px はみ出す、または中心 ${Math.round(cx)},${Math.round(cy)} が入口の外`);
}

// ---- C1/C2: 闇市（black_market_entrance） ----
{
  const id = 'black_market_entrance';
  const m = ms.maps[id];
  ms.currentMap = id;
  // C1 階段の右の行き止まりの切れ込み（世界座標 x708〜762, y420〜515）に立てない
  let open = 0;
  for (let x = 708; x <= 762; x += 3) for (let y = 420; y <= 515; y += 3) if (ms.isMapPositionWalkable(m, x, y, 24)) open++;
  if (open) fail('C1', `${id}: 階段右の切れ込みに歩ける点が ${open} 点残っている`);
  // C2 店の扉の案内ラベル（概算: 全角12px・半角7px＋余白18、高さ22）がヤミの絵（足元基準 50x64）に重ならない
  const yami = (m.npcs || []).find((n) => n.name === 'ヤミ');
  const door = (m.exits || []).find((e) => N(e.to) === 'shop_black_market');
  if (yami && door) {
    const text = '↑ ' + (ms.maps.shop_black_market.name || '');
    const w = [...text].reduce((s, ch) => s + (ch.charCodeAt(0) > 255 ? 12 : 7), 0) + 18;
    const s = ms.getMapScale(id);
    const cx = door.x + door.width / 2 + (door.guideDx || 0) * s, cy = door.y + door.height / 2 + (door.guideDy || 0) * s;
    const L = { l: cx - w / 2, r: cx + w / 2, t: cy - 11, b: cy + 11 };
    const Y = { l: yami.x - 25, r: yami.x + 25, t: yami.y + 6 - 64, b: yami.y + 6 };
    if (L.l < Y.r && Y.l < L.r && L.t < Y.b && Y.t < L.b) fail('C2', `${id}: 店の扉の案内（${Math.round(L.l)}..${Math.round(L.r)}, ${Math.round(L.t)}..${Math.round(L.b)}）がヤミの絵に重なる`);
  }
}

console.log('=== マップ出入りの体感検査（実コードを1フレームずつ） ===');
console.log('遷移 | 入るキー | 到着点/向き | A1 すぐ戻る | A2 押し続け | A3 離して戻る | A4 向き');
table.forEach((r) => console.log(`${r.from} -> ${r.to} | ${r.inKey} | ${r.spawn} | ${r.a1} | ${r.a2} | ${r.a3} | ${r.a4}`));
console.log(`\n遷移 ${transitions} 件・自動扉 ${autoDoors} 件を検査`);
if (fails.length) {
  const byCode = {};
  fails.forEach((f) => { const c = f.split(' ')[0]; byCode[c] = (byCode[c] || 0) + 1; });
  console.log('[不合格] ' + Object.entries(byCode).map(([c, n]) => `${c}:${n}`).join(' '));
  fails.forEach((f) => console.log('  ' + f));
  console.log('❌ 不合格あり');
  process.exit(1);
}
console.log('✅ 全PASS: 出口の正面から入れる／入る通路の幅／出口の判定と絵の入口の一致／到着→すぐ戻れる／押し続けで戻されない／離せば戻れる／向き／自動扉の斜め進入／案内1回／セーブ判定／矢印／開始位置／闇市の切れ込みと案内位置');
