// battle-item-oracle.js — 戦闘中アイテム使用が「コマンド一巡」に乗ることを実コードで検証。
// 旧バグ: applyBattleItemが即適用→setTimeout(enemyTurn)で残りメンバーの選択をスキップ。
// 修正: commitItemCommandで partyCommands に積み currentMemberIndex を進める→全員選択後の
// executeActionsSequentially → memberUseItem で効果適用（攻撃/カムイと同じ流れ）。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const timers = [];
const fakeSetTimeout = (fn) => { timers.push(fn); return timers.length; };
const tick = () => { const t = timers.shift(); if (t) t(); return !!t; };
function fakeEl() { const cl = new Set(); return { innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add: (c) => cl.add(c), remove: (c) => cl.delete(c), contains: (c) => cl.has(c), toggle: noop }, setAttribute: noop, getAttribute: () => null, appendChild: noop, querySelector: () => null, querySelectorAll: () => [], children: [], scrollIntoView: noop }; }
const document = { getElementById: () => fakeEl(), querySelector: () => null, createElement: () => fakeEl(), addEventListener: noop, body: fakeEl() };
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, document, setTimeout: fakeSetTimeout, clearTimeout: noop, Math, JSON, Object, Array, Number, String, Boolean, Map, Set, Date: { now: () => 0 } };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('ui-panel.js'), sb, { filename: 'ui-panel.js' });
vm.runInContext(read('battle-system.js'), sb, { filename: 'battle-system.js' });

const battle = new sb.window.BattleSystem();
const m0 = { name: 'カイト', hp: 30, maxHp: 50, mp: 10, maxMp: 20, speed: 8 };
const m1 = { name: 'アカリ', hp: 40, maxHp: 60, mp: 20, maxMp: 40, speed: 12 };
battle.getPartyMembers = () => [m0, m1];
battle.updateBattleUI = noop; battle.updateCurrentMemberDisplay = noop; battle.showCommands = noop;
sb.window.updateUI = noop;
let useItemCalls = 0;
sb.window.itemSystem = { useItem: (id, target, inBattle) => { useItemCalls++; target.hp = Math.min(target.maxHp, target.hp + 30); return { success: true, item: { name: 'ヒールポーション' }, message: `${target.name}の HPが かいふくした！` }; } };
battle.inBattle = true; battle.battleLog = []; battle._resetBattleMessages();

console.log('\n=== 戦闘アイテム＝コマンド一巡 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// ---------- (1) commitItemCommand: 即敵ターンに飛ばず、コマンドとして積み次メンバーへ ----------
battle.partyCommands = [null, null];
battle.currentMemberIndex = 0;
let enemyTurnCalled = false; battle.enemyTurn = () => { enemyTurnCalled = true; };
battle.commitItemCommand('heal_potion', 1); // カイトのターンで、アカリにポーション
const cmd = battle.partyCommands[0];
chk('アイテムが partyCommands に「コマンド」として積まれる', cmd && cmd.command === 'item' && cmd.itemId === 'heal_potion' && cmd.targetIndex === 1, JSON.stringify(cmd));
chk('即時に効果適用しない（選択時はuseItem未呼び出し）', useItemCalls === 0);
chk('即敵ターンに飛ばない', enemyTurnCalled === false);
chk('currentMemberIndex が次メンバーへ進む(0→1)', battle.currentMemberIndex === 1);
// 予約された showNextMemberCommand が走り、次メンバー(アカリ)のコマンド選択になる
battle.waitingForCommand = false;
tick();
chk('次メンバー(アカリ)のコマンド選択へ（waitingForCommand=true・まだ敵ターンでない）', battle.waitingForCommand === true && enemyTurnCalled === false);

// ---------- (2) 行動フェーズ: 'item' コマンドが memberUseItem で実行される（スキップでない） ----------
useItemCalls = 0;
battle._resetBattleMessages();
const actions = [{ member: m0, command: 'item', itemId: 'heal_potion', targetIndex: 0, speed: 8 }];
m0.hp = 10;
battle.executeActionsSequentially(actions, 0);
// memberUseItem→presentBeat→afterBattleMessages を tick で進める
for (let i = 0; i < 12 && timers.length; i++) tick();
chk('行動フェーズで item コマンドが実行され useItem が呼ばれる', useItemCalls === 1, `calls=${useItemCalls}`);
chk('対象のHPが回復している（効果適用は実行時）', m0.hp > 10, `hp=${m0.hp}`);

console.log(`\n${pass ? '✅ 全PASS: アイテムはコマンドとして積まれ即敵ターンに飛ばず／一巡後の行動フェーズで実行 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
