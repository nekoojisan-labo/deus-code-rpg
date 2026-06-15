// battle-msg-oracle.js — バトルメッセージ部品(単一ポンプ)を実コードで検証する計器。
// DOMとsetTimeoutをスタブし、実際の addBattleLog→_pumpBattleMsg→afterBattleMessages を走らせて
// 「複数メッセージを同期addしても一気出しせず1行ずつ出るか」「全部出てから進行が同期されるか」を観測する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

// --- 制御可能なクロック（setTimeout を手動 tick） ---
const timers = [];
const fakeSetTimeout = (fn, delay) => { timers.push({ fn, delay }); return timers.length; };
const tick = () => { const t = timers.shift(); if (t) t.fn(); return !!t; };

// --- DOMスタブ: id ごとに偏fake要素を返す。innerHTML を読んで「今表示中の行」を観測する ---
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
const sb = { console, window: {}, document, setTimeout: fakeSetTimeout, clearTimeout: noop,
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set, Date: { now: () => 0 } };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('battle-system.js'), sb, { filename: 'battle-system.js' });

const battle = new sb.window.BattleSystem();
// 表示中の行を読む（gameMessageBody.innerHTML の <br> 区切り）
const shownLines = () => { const h = els['gameMessageBody'] && els['gameMessageBody'].innerHTML || ''; return h ? h.split('<br>') : []; };

console.log('\n=== バトルメッセージ部品 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  ('+extra+')' : ''}`); pass = pass && cond; };

// 戦闘開始相当をセット
battle.inBattle = true;
battle.battleLog = [];
battle._resetBattleMessages();

// ★状態異常＋敵攻撃の "バースト" を同期で add（実ゲームで一気出しになっていた経路の再現）
battle.addBattleLog('カイトは どくの ダメージを うけた！');
battle.addBattleLog('カイトに 10の ダメージ！');
battle.addBattleLog('カイトは しびれて うごけない！');
battle.addBattleLog('ケルベロスの こうげき！');
battle.addBattleLog('カイトに 11の ダメージ！');

// 同期add直後: 表示は1行だけであるべき（=一気出ししない）
chk('同期で5行addしても、表示は1行だけ（一気出ししない）', shownLines().length === 1, `shown=${shownLines().length}行`);

// 進行同期: 全部出るまで afterBattleMessages の cb は発火しない
let drainedAt = -1, step = 0;
battle.afterBattleMessages(() => { drainedAt = step; });
chk('afterBattleMessages: まだ全部出ていないので進行しない', drainedAt === -1);

// クロックを進めて1行ずつ出ることを確認
const seen = [shownLines().length];
for (let i = 0; i < 10 && timers.length; i++) { step++; tick(); seen.push(shownLines().length); }
// 表示行数が 1→2→3→4→5 と1つずつ増える（最大は直近6行窓だが今回5行なので全部）
const grewOneByOne = seen.slice(0, 5).every((n, i) => n === i + 1);
chk('クロックを進めると表示が1行ずつ増える', grewOneByOne, `推移=${seen.join('→')}`);
chk('5行すべて出た時点で表示=5行', shownLines().length === 5);
chk('全部出てから afterBattleMessages の進行が発火（同期OK）', drainedAt >= 0, `drainedAt=${drainedAt}`);

// 既にドレイン済みなら afterBattleMessages は即発火
let immediate = false;
battle.afterBattleMessages(() => { immediate = true; });
chk('ドレイン済みでは afterBattleMessages は即発火', immediate === true);

console.log(`\n${pass ? '✅ 全PASS: バースト非一気出し／1行ずつ／全部出てから進行同期／即発火 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
