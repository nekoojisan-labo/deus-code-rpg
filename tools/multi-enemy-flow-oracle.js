// multi-enemy-flow-oracle.js — マルチ敵の制御フロー（撃破判定・敵フェーズのループ）を実コードで検証。
//   presentBeat/afterBattleMessages を同期スタブ化して、実 memberAttack / enemyTurn を駆動する。
//   (A) 撃破判定: 3体の1体ずつ撃破では battleVictory せず、全滅でのみ勝利
//   (B) 敵フェーズ: 生存敵が全員1回ずつ行動 → turnCount+1 & startPlayerTurn 1回
//   (C) 途中で死んだ敵はフェーズ内で飛ばす / 味方全滅で gameOver
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {},
  document: { getElementById: () => null, querySelector: () => null, createElement: () => fakeEl },
  URLSearchParams, Image: class { set src(_) {} }, setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0; },
  clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'battle-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// プレイヤー/パーティを用意
const mkMember = (id, hp, atk) => ({ id, characterId: id, name: id, hp, maxHp: hp, attack: atk, defense: 2, speed: 5, mp: 0, statusAilments: {} });
sb.window.player = mkMember('kaito', 100, 999);   // 即撃破できる火力
sb.window.partySystem = { getMembers: () => [] };

function freshBattle() {
  const b = new sb.window.BattleSystem();
  // ビート機構を同期化（fxを即発火し、after は即実行）
  b.presentBeat = (msgs, opts) => { if (opts && Array.isArray(opts.fx)) opts.fx.forEach(f => { if (typeof f === 'function') f(); }); };
  b.afterBattleMessages = (cb) => { if (typeof cb === 'function') cb(); };
  b.updateBattleUI = noop; b.showDamageEffect = noop;
  b._victory = 0; b._playerTurns = 0; b._gameOver = 0;
  b.battleVictory = () => { b._victory++; };
  b.startPlayerTurn = () => { b._playerTurns++; };
  b.gameOver = () => { b._gameOver++; };
  b.processAllMembersStatusAilments = (cb) => cb();
  return b;
}

console.log('\n=== マルチ敵フロー・オラクル ===\n');

// ---------- (A) 撃破判定 ----------
console.log('— (A) 全滅でのみ勝利 —');
{
  const b = freshBattle();
  b.enemies = [
    { id: 'e0', name: 'E0', currentHp: 1, maxHp: 1, defense: 0 },
    { id: 'e1', name: 'E1', currentHp: 1, maxHp: 1, defense: 0 },
    { id: 'e2', name: 'E2', currentHp: 1, maxHp: 1, defense: 0 }
  ];
  let cbCount = 0;
  b.memberAttack(sb.window.player, () => cbCount++, 0);
  chk('1体目撃破: 勝利していない', b._victory === 0, `victory=${b._victory}`);
  chk('1体目撃破: 次の行動へ継続(callback)', cbCount === 1);
  chk('1体目撃破後の生存=2', b.livingEnemies().length === 2);
  b.memberAttack(sb.window.player, () => cbCount++, 1);
  chk('2体目撃破: まだ勝利していない', b._victory === 0, `victory=${b._victory}`);
  b.memberAttack(sb.window.player, () => cbCount++, 2);
  chk('3体目(最後)撃破: 勝利した', b._victory === 1, `victory=${b._victory}`);
  chk('全滅後 livingEnemies=0', b.livingEnemies().length === 0);
}

// ---------- (B) 敵フェーズのループ ----------
console.log('\n— (B) 敵フェーズ: 全生存敵が1回ずつ行動 → 次ラウンド1回 —');
{
  const b = freshBattle();
  b.enemies = [
    { id: 'a', name: 'A', currentHp: 50, maxHp: 50, attack: 1, defense: 0, aiPattern: null },
    { id: 'b', name: 'B', currentHp: 50, maxHp: 50, attack: 1, defense: 0, aiPattern: null },
    { id: 'c', name: 'C', currentHp: 50, maxHp: 50, attack: 1, defense: 0, aiPattern: null }
  ];
  const acted = [];
  b.enemyAttack = (p, done) => { acted.push(b.currentEnemy.id); done(); };
  b.enemySkillAttack = (p, done) => { acted.push(b.currentEnemy.id); done(); };
  b.enemyDefend = (p, done) => { acted.push(b.currentEnemy.id); done(); };
  b.checkPartyWipeout = () => false;
  b.turnCount = 1;   // 実戦は startBattle で1に初期化される。ここでも再現。
  b.enemyTurn(sb.window.player);
  chk('3体すべてが行動した', acted.length === 3, `acted=${acted.join(',')}`);
  chk('各敵がちょうど1回ずつ', new Set(acted).size === 3);
  chk('次プレイヤーターンへ1回だけ遷移', b._playerTurns === 1, `=${b._playerTurns}`);
  chk('turnCount が1進んだ', b.turnCount === 2, `=${b.turnCount}`);
}

// ---------- (C) 途中死亡スキップ / 味方全滅 ----------
console.log('\n— (C) フェーズ内死亡の敵を飛ばす / 味方全滅で gameOver —');
{
  const b = freshBattle();
  b.enemies = [
    { id: 'a', name: 'A', currentHp: 50, maxHp: 50, attack: 1, defense: 0 },
    { id: 'b', name: 'B', currentHp: 50, maxHp: 50, attack: 1, defense: 0 },
    { id: 'c', name: 'C', currentHp: 50, maxHp: 50, attack: 1, defense: 0 }
  ];
  const acted = [];
  // Aが行動したら Bを「死亡」させる → Bはスキップされる想定
  b.enemyAttack = (p, done) => { acted.push(b.currentEnemy.id); if (b.currentEnemy.id === 'a') b.enemies[1].currentHp = 0; done(); };
  b.enemySkillAttack = b.enemyAttack; b.enemyDefend = b.enemyAttack;
  b.checkPartyWipeout = () => false;
  b.enemyTurn(sb.window.player);
  chk('死亡したBはフェーズ内でスキップ（A,Cのみ行動）', acted.length === 2 && !acted.includes('b'), `acted=${acted.join(',')}`);

  const b2 = freshBattle();
  b2.enemies = [{ id: 'a', name: 'A', currentHp: 50, maxHp: 50, attack: 1, defense: 0 }];
  b2.checkPartyWipeout = () => true;   // 既に全滅
  b2.enemyTurn(sb.window.player);
  chk('味方全滅なら gameOver（次ターンへ進めない）', b2._gameOver >= 1 && b2._playerTurns === 0, `gameOver=${b2._gameOver} playerTurns=${b2._playerTurns}`);
}

console.log('\n' + (pass ? '✅ 全PASS: 撃破判定(全滅でのみ勝利)・敵フェーズの全員ループ・死亡スキップ/全滅gameOver を実コードで確認'
  : '❌ 不合格あり'));
process.exit(pass ? 0 : 1);
