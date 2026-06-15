// battle-header-oracle.js — 戦闘コマンドのヘッダが「現在のメンバー」と一致することを実コードで検証。
// 旧バグ: showNextMemberCommandの addBattleLog("○○の こうどう") が_flashCommandHeaderMessageで
// ヘッダにフラッシュ→1800ms後の復元が、メンバー交代で更新した正しいヘッダを古いラベルで上書き。
// 修正: showCommandsが保留フラッシュタイマを確定キャンセルしてから正しいヘッダを描く。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const timers = [];
const fakeSetTimeout = (fn) => { timers.push(fn); return timers.length; };
const fakeClearTimeout = (id) => { if (typeof id === 'number' && timers[id - 1]) timers[id - 1] = null; };
const tick = () => { const t = timers.find(Boolean); if (t) { const i = timers.indexOf(t); timers[i] = null; t(); } return !!t; };
const els = {};
function fakeEl() {
  const cl = new Set();
  return {
    _html: '', set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    textContent: '', style: {}, dataset: {},
    classList: { add: (...c) => c.forEach(x => cl.add(x)), remove: (...c) => c.forEach(x => cl.delete(x)), contains: (c) => cl.has(c), toggle: noop },
    setAttribute: noop, getAttribute: () => null, removeAttribute: noop, appendChild: noop, querySelector: () => null, querySelectorAll: () => [], children: [], scrollIntoView: noop
  };
}
const document = { getElementById: (id) => (els[id] = els[id] || fakeEl()), querySelector: () => null, createElement: () => fakeEl(), addEventListener: noop, body: fakeEl() };
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, document, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout, Math, JSON, Object, Array, Number, String, Boolean, Map, Set, Date: { now: () => 0 } };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('ui-panel.js'), sb, { filename: 'ui-panel.js' });
vm.runInContext(read('battle-system.js'), sb, { filename: 'battle-system.js' });

const battle = new sb.window.BattleSystem();
battle.getPartyMembers = () => [{ name: 'カイト', speed: 8 }, { name: 'アカリ', speed: 12 }, { name: 'リク', speed: 6 }, { name: 'ヤミ', speed: 9 }];
sb.window.setupBattleCommands = noop;
const hdr = () => document.getElementById('gameMessageCharacter');
// コマンドモード扱いにする（_renderBeatが_flashCommandHeaderMessage経路になる）
document.getElementById('gameMessageBody').classList.add('battle-cmd-mode');
battle.inBattle = true; battle.battleLog = []; battle._resetBattleMessages();

console.log('\n=== 戦闘コマンドヘッダ＝現在メンバー 一致 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// 直前メンバー(アカリ)のヘッダが出ている状態を作る
hdr().textContent = 'アカリ のコマンド';
// リクのターン: addBattleLog("リクの こうどう") 相当のフラッシュ→showCommands(リク=index2)
battle._flashCommandHeaderMessage('リクの こうどう'); // dataset.battleOriginalLabel='アカリ のコマンド'・復元タイマ予約
chk('フラッシュ中はヘッダに「— リクの こうどう」が付く', hdr().textContent.indexOf('リクの こうどう') >= 0);
battle.currentMemberIndex = 2; // リク
battle.showCommands();
chk('showCommands後: ヘッダ＝現在メンバー「リク のコマンド」', hdr().textContent === 'リク のコマンド', `header=${hdr().textContent}`);
// 旧バグなら、ここで復元タイマが発火し「アカリ のコマンド」に戻ってしまう
let guard = 0; while (timers.find(Boolean) && guard++ < 8) tick();
chk('★復元タイマ発火後もヘッダは「リク のコマンド」のまま（古いラベルで上書きされない）', hdr().textContent === 'リク のコマンド', `header=${hdr().textContent}`);

// 別メンバー(ヤミ)でも一致
hdr().textContent = 'リク のコマンド';
battle._flashCommandHeaderMessage('ヤミの こうどう');
battle.currentMemberIndex = 3; battle.showCommands();
let g2 = 0; while (timers.find(Boolean) && g2++ < 8) tick();
chk('ヤミのターン: ヘッダ＝「ヤミ のコマンド」で固定', hdr().textContent === 'ヤミ のコマンド', `header=${hdr().textContent}`);

console.log(`\n${pass ? '✅ 全PASS: コマンドヘッダが現在メンバーと一致し、フラッシュ復元で古いラベルに戻らない を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
