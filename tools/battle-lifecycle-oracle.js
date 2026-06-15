// battle-lifecycle-oracle.js — 戦闘ライフサイクル全体を実コードで走らせ、例外ゼロ＆BGM発火を検証。
//   回帰対象: startBattle引数改名(enemy→enemyOrGroup)で末尾の enemy.boss が未定義参照になり
//   「BGM未開始＋gameLoopへ例外伝播でフィールド黒画面」になった二重バグ。
//   startBattle→(勝利)→battleVictory→processLevelUps→endBattle を例外なく通過し、
//   startBattleBGM/endBattleBGM が呼ばれることを確認する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true, has: () => true });
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {},
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => fakeEl, body: fakeEl },
  URLSearchParams, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'battle-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// 計器: BGM/SE 呼び出しを記録
const calls = { startBattleBGM: 0, endBattleBGM: 0, lastBoss: undefined };
sb.window.bgmSystem = {
  startBattleBGM: (boss) => { calls.startBattleBGM++; calls.lastBoss = boss; },
  endBattleBGM: () => { calls.endBattleBGM++; },
  stop: noop, changeFieldBGM: noop
};
sb.window.playSE = noop;
sb.window.updateUI = noop;
sb.window.resetBattleUIState = noop;
const mkMember = (id, hp) => ({ id, characterId: id, name: id, hp, maxHp: hp, baseMaxHp: hp, mp: 20, maxMp: 20, baseMaxMp: 20, attack: 50, baseAttack: 50, defense: 5, baseDefense: 5, magic: 5, baseMagic: 5, speed: 5, baseSpeed: 5, level: 3, exp: 0, statusAilments: {} });
sb.window.player = mkMember('kaito', 100);
sb.window.partySystem = { getMembers: () => [], _m: [] };

const battle = new sb.window.BattleSystem();
sb.window.battleSystem = battle;

console.log('\n=== 戦闘ライフサイクル・オラクル ===\n');

// (1) startBattle が例外なく完走し、戦闘BGMが開始される
let threw = null;
try { battle.startBattle([{ id: 'watcher', name: 'ウォッチャー', emoji: '👁️', hp: 10, maxHp: 10, attack: 5, defense: 0, exp: 18, gold: 20 }]); }
catch (e) { threw = e; }
chk('startBattle が例外を投げない（黒画面回帰の核）', threw === null, threw ? threw.message : '');
chk('戦闘BGM(startBattleBGM)が呼ばれた', calls.startBattleBGM === 1, `calls=${calls.startBattleBGM}`);
chk('inBattle = true', battle.inBattle === true);
chk('this.enemies が配列で設定', Array.isArray(battle.enemies) && battle.enemies.length === 1);

// (2) ボス(単体)でも例外なく開始＋boss=trueでBGM
calls.startBattleBGM = 0;
let threwBoss = null;
try { battle.startBattle({ id: 'rogue_ai_core', name: '暴走AIコア', emoji: '⚡', hp: 3500, maxHp: 3500, attack: 105, defense: 100, exp: 500, gold: 800, boss: true }, true); }
catch (e) { threwBoss = e; }
chk('ボス startBattle が例外を投げない', threwBoss === null, threwBoss ? threwBoss.message : '');
chk('ボスBGM(boss=true)で開始', calls.startBattleBGM === 1 && calls.lastBoss === true, `boss=${calls.lastBoss}`);

// (3) 勝利→レベルアップ→endBattle を例外なく通過し、フィールド復帰(inBattle=false)＋endBattleBGM
//     ビート機構を同期化して battleVictory を完走させる。
const b = new sb.window.BattleSystem();
b.presentBeat = (msgs, opts) => { if (opts && Array.isArray(opts.fx)) opts.fx.forEach(f => { if (typeof f === 'function') f(); }); };
b.afterBattleMessages = (cb) => { if (typeof cb === 'function') cb(); };
b.updateBattleUI = noop;
b.enemies = [{ id: 'a', name: 'A', currentHp: 0, maxHp: 10, exp: 5000, gold: 100, dropTable: [] }];  // 大量EXPで多段Lvアップ誘発
b.currentEnemy = b.enemies[0];
b.isBossBattle = false;
b.inBattle = true;
let threwVic = null;
try { b.battleVictory(sb.window.player); } catch (e) { threwVic = e; }
chk('battleVictory→processLevelUps→endBattle が例外を投げない', threwVic === null, threwVic ? threwVic.message : '');
chk('戦闘終了でフィールド復帰(inBattle=false)', b.inBattle === false);
chk('endBattleBGM(フィールドBGM復帰)が呼ばれた', calls.endBattleBGM >= 1, `calls=${calls.endBattleBGM}`);
chk('多段レベルアップでも player.level が上がっている', sb.window.player.level > 3, `level=${sb.window.player.level}`);

console.log('\n' + (pass ? '✅ 全PASS: 戦闘ライフサイクル(開始→BGM→勝利→多段Lv→終了→フィールド復帰)を例外ゼロで確認'
  : '❌ 不合格あり（戦闘経路に未定義参照/例外が残っている）'));
process.exit(pass ? 0 : 1);
