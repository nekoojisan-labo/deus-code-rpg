// battle-msg-oracle.js — 戦闘「行動ごとビート」メッセージ部品を実コードで検証する計器。
// DOMとsetTimeoutをスタブし、実際の presentBeat→_pumpBattleMsg→afterBattleMessages を走らせ、
// 「2行動が可視窓に混在しない(ビート間でクリア)」「結果行が最後」「進行はビート+区切り完了後に発火」
// 「枯渇時は即発火」「resetでビート/タイマが残らない」を観測する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

// --- 制御可能なクロック（id付き。clearTimeoutで配列から除去・tickで先頭を実行） ---
let timers = [], nextId = 1;
const fakeSetTimeout = (fn) => { const id = nextId++; timers.push({ id, fn }); return id; };
const fakeClearTimeout = (id) => { timers = timers.filter(t => t.id !== id); };
const tick = () => { const t = timers.shift(); if (t) t.fn(); return !!t; };

// --- DOMスタブ: gameMessageBody.innerHTML を読んで「今表示中の行」を観測する ---
const els = {};
function fakeEl() {
  const cl = new Set();
  return {
    _html: '', set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    textContent: '', scrollTop: 0, scrollHeight: 0, style: {},
    dataset: {}, setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
    classList: { add: (c) => cl.add(c), remove: (c) => cl.delete(c), contains: (c) => cl.has(c), toggle: noop },
    querySelector: () => null, appendChild: noop,
  };
}
const document = { getElementById: (id) => (els[id] = els[id] || fakeEl()), querySelector: () => null, createElement: () => fakeEl(), addEventListener: noop };
const sb = { console, window: {}, document, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set, Date: { now: () => 0 } };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('ui-panel.js'), sb, { filename: 'ui-panel.js' }); // BattlePanelはUIPanelへforwardするので先にロード
vm.runInContext(read('battle-system.js'), sb, { filename: 'battle-system.js' });

const battle = new sb.window.BattleSystem();
const shownLines = () => { const h = (els['gameMessageBody'] && els['gameMessageBody'].innerHTML) || ''; return h ? h.split('<br>') : []; };
const isPrefixOf = (shown, full) => shown.length <= full.length && shown.every((l, i) => full[i] === l);
const reset = () => { battle.inBattle = true; battle.battleLog = []; battle._resetBattleMessages(); };

console.log('\n=== 戦闘ビートメッセージ部品 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// ---------- (a) NO-MIX: 2行動が同一フレームに混ざらず、間でクリアされる ----------
reset();
const A = ['カイトの こうげき！', 'ケルベロスに 12 の ダメージ！'];
const B = ['ケルベロスの こうげき！', 'カイトに 11 の ダメージ！'];
battle.presentBeat(A);
battle.presentBeat(B);
let mixed = false, sawEmpty = false, sawAonly = false, sawBonly = false;
const obs = [];
const rec = () => {
  const s = shownLines();
  obs.push('[' + s.join('|') + ']');
  if (s.length === 0) { sawEmpty = true; return; }
  const pa = isPrefixOf(s, A), pb = isPrefixOf(s, B);
  if (!pa && !pb) mixed = true;
  if (pa && !pb) sawAonly = true;
  if (pb && !pa) sawBonly = true;
};
rec(); // 同期キック直後: Aの1行目
for (let i = 0; i < 24 && timers.length; i++) { tick(); rec(); }
chk('NO-MIX: AとBの行が同一フレームに混在しない', !mixed, obs.join('→'));
chk('NO-MIX: ビート間でパネルが空(クリア)になる', sawEmpty);
chk('NO-MIX: 「Aのみ」と「Bのみ」を別々に観測（順次表示）', sawAonly && sawBonly);

// ---------- (b) RESULT-LAST: 結果行はビートの最後の行 ----------
reset();
const R = ['カイトの こうげき！', '30 の ダメージ！', 'ケルベロスを たおした！'];
battle.presentBeat(R);
let resultEarly = false, maxLen = 0, finalLines = [];
const recR = () => { const s = shownLines(); if (s.length > maxLen) { maxLen = s.length; finalLines = s; }
  if (s.indexOf('ケルベロスを たおした！') >= 0 && s.length < 3) resultEarly = true; };
recR();
for (let i = 0; i < 12 && timers.length; i++) { tick(); recR(); }
chk('RESULT-LAST: 全3行が1ビートで表示される', maxLen === 3, `maxLen=${maxLen}`);
chk('RESULT-LAST: 結果行は最後の行のみ（途中で先に出ない）', !resultEarly && finalLines[2] === 'ケルベロスを たおした！');

// ---------- (c) GATE-AFTER-PAUSE: 進行はビート全表示＋区切り完了後にのみ発火 ----------
reset();
let flow = false;
battle.presentBeat(['カイトの こうげき！', '12 の ダメージ！']);
battle.afterBattleMessages(() => { flow = true; });
chk('GATE: ビート途中(1行目表示時点)では進行しない', flow === false);
let firedAtEnd = false, prevTimers;
for (let i = 0; i < 12; i++) {
  const had = timers.length;
  if (!had) break;
  tick();
  if (flow && shownLines().length === 0) firedAtEnd = true; // クリア後に発火
}
chk('GATE: 進行は最終的に発火する', flow === true);
chk('GATE: 進行はビート+区切り完了後（クリア後）に発火', firedAtEnd);

// ---------- (d) DRAINED-IMMEDIATE: 空＆idleでは afterBattleMessages 即発火 ----------
reset();
let imm = false;
battle.afterBattleMessages(() => { imm = true; });
chk('DRAINED: 空キュー&idleでは即発火', imm === true);

// ---------- (e) RESET: ビート途中のresetでキュー/タイマが残らず、次は1行目から ----------
reset();
battle.presentBeat(['a', 'b', 'c']); // 1行目'a'表示・revealing中(タイマ保留)
const hadTimerBefore = timers.length > 0;
battle._resetBattleMessages();
chk('RESET: _beatQueueが空・phaseがidle', battle._beatQueue.length === 0 && battle._beatPhase === 'idle');
chk('RESET: 保留タイマが除去され、tick対象が無い', hadTimerBefore && timers.length === 0, `timers=${timers.length}`);
battle.presentBeat(['x']);
chk('RESET後: 次ビートは1行目から開始', shownLines().length === 1 && shownLines()[0] === 'x');

console.log(`\n${pass ? '✅ 全PASS: 混在ゼロ／結果行が最後／pause後ゲート／即時ドレイン／reset を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
