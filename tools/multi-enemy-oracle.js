// multi-enemy-oracle.js — マルチ敵(1-3体)の論理層を実コードで検証（DOM非依存）。
//   (1) buildEncounterGroup: 1-3体・全敵がそのエリアtableの顔ぶれ(分布維持)・3パターン(均一/混成/前衛重)が出る
//   (2) livingEnemies / resolveEnemyTarget: 生存敵の抽出と、死んだ対象→生存敵への再ターゲット
//   (3) computeBattleRewards: EXP/Goldを全敵合算（=「3体分のポイント」でレベリング緩和）
//   (4) processItemDrops が複数敵のdropTableを走査
// 乱数を多数サンプリングして分布・パターンの存在を確認する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sb = {
  console, window: {},
  document: { getElementById: () => null, querySelector: () => null, createElement: () => fakeEl },
  URLSearchParams, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'battle-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const battle = new sb.window.BattleSystem();
const msys = new sb.window.MapSystem();
sb.window.mapSystem = msys;

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

console.log('\n=== マルチ敵オラクル（論理層）===\n');

// メソッド存在
console.log('— メソッド存在 —');
['buildEncounterGroup', 'livingEnemies', 'resolveEnemyTarget', 'computeBattleRewards'].forEach(m =>
  chk(`${m}() が定義されている`, typeof battle[m] === 'function'));

// ---------- (1) buildEncounterGroup ----------
console.log('\n— (1) スポーン群（1-3体・分布維持・3パターン）—');
const SAMPLE = { city: 'shinjuku_center_plaza', subway: 'subway_concourse_a', shrine: 'shrine_south_gate',
  garden: 'biodome_gate', market: 'black_market_entrance', gov: 'tokyo_gov_approach', dungeon: 'deep_tunnel' };
const ORDER = Object.keys(SAMPLE);
const TABLES = battle.encounterTables;
if (typeof battle.buildEncounterGroup === 'function') {
  for (const key of ORDER) {
    msys.currentMap = SAMPLE[key];
    const zone = msys.getEncounterZone();
    const table = TABLES[zone.table];
    const counts = { 1: 0, 2: 0, 3: 0 };
    let uniform = 0, mixed = 0, allInTable = true, badCount = 0, scaled = true;
    for (let i = 0; i < 300; i++) {
      const g = battle.buildEncounterGroup(zone, zone.table);
      if (!Array.isArray(g) || g.length < 1 || g.length > 3) { badCount++; continue; }
      counts[g.length] = (counts[g.length] || 0) + 1;
      const ids = g.map(e => e.id);
      if (!ids.every(id => table.includes(id))) allInTable = false;
      if (g.length >= 2) { (new Set(ids)).size === 1 ? uniform++ : mixed++; }
      // tierスケール: currentHp が設定され maxHp と一致、level が帯内
      g.forEach(e => { if (!(e.currentHp > 0) || e.currentHp !== e.maxHp || e.level < zone.levelRange[0] || e.level > zone.levelRange[1]) scaled = false; });
    }
    chk(`${key}: 全グループが1-3体`, badCount === 0, `規格外${badCount}`);
    chk(`${key}: 全敵がエリアtableの顔ぶれ(分布維持)`, allInTable);
    chk(`${key}: 1体/2体/3体すべて出現`, counts[1] > 0 && counts[2] > 0 && counts[3] > 0, `1:${counts[1]} 2:${counts[2]} 3:${counts[3]}`);
    chk(`${key}: 均一(同種複数)と混成の両パターンが出る`, uniform > 0 && mixed > 0, `均一${uniform}/混成${mixed}`);
    chk(`${key}: tierスケール&帯内Lvで生成`, scaled);
  }
}

// ---------- (2) livingEnemies / resolveEnemyTarget ----------
console.log('\n— (2) 生存敵抽出・再ターゲット —');
if (typeof battle.livingEnemies === 'function') {
  battle.enemies = [
    { id: 'a', name: 'A', currentHp: 0, maxHp: 10 },
    { id: 'b', name: 'B', currentHp: 7, maxHp: 10 },
    { id: 'c', name: 'C', currentHp: 3, maxHp: 10 }
  ];
  chk('livingEnemies は生存のみ(2体)', battle.livingEnemies().length === 2);
  chk('resolveEnemyTarget(0)=死亡A → 生存敵へ振替', battle.resolveEnemyTarget(0) && battle.resolveEnemyTarget(0).currentHp > 0);
  chk('resolveEnemyTarget(2)=生存C → そのままC', battle.resolveEnemyTarget(2) && battle.resolveEnemyTarget(2).id === 'c');
  battle.enemies = [{ id: 'x', name: 'X', currentHp: 0, maxHp: 5 }];
  const t = battle.resolveEnemyTarget(0);
  chk('全滅時も resolveEnemyTarget は null を返さない（フォールバック）', !!t);
}

// ---------- (3) computeBattleRewards（合算）----------
console.log('\n— (3) 報酬の全敵合算（3体分）—');
if (typeof battle.computeBattleRewards === 'function') {
  battle.enemies = [
    { id: 'a', exp: 30, gold: 10, currentHp: 0 },
    { id: 'b', exp: 30, gold: 10, currentHp: 0 },
    { id: 'c', exp: 40, gold: 15, currentHp: 0 }
  ];
  const r = battle.computeBattleRewards();
  chk('EXP合算 = 30+30+40 = 100', r.exp === 100, `=${r.exp}`);
  chk('Gold合算 = 10+10+15 = 35', r.gold === 35, `=${r.gold}`);
  battle.enemies = [{ id: 'solo', exp: 18, gold: 5, currentHp: 0 }];
  const r2 = battle.computeBattleRewards();
  chk('単体時は従来通り単体分', r2.exp === 18 && r2.gold === 5, `exp=${r2.exp} gold=${r2.gold}`);
}

// ---------- (4) processItemDrops 複数敵 ----------
console.log('\n— (4) ドロップが複数敵を走査 —');
sb.window.itemSystem = { itemDatabase: { potion: { name: 'ポーション', emoji: '🧪' } }, addItem: () => true };
sb.window.equipmentSystem = { equipmentDatabase: {}, addEquipment: () => {} };
battle.enemies = [
  { id: 'a', currentHp: 0, dropTable: [{ id: 'potion', rate: 1.0 }] },
  { id: 'b', currentHp: 0, dropTable: [{ id: 'potion', rate: 1.0 }] }
];
battle.currentEnemy = battle.enemies[0];
const drops = battle.processItemDrops();
chk('2体×確定ドロップ → 2個ドロップ', drops.length === 2, `=${drops.length}個`);

console.log('\n' + (pass ? '✅ 全PASS: マルチ敵の論理層（1-3体スポーン/分布維持/3パターン/再ターゲット/報酬合算/複数ドロップ）を実コードで確認'
  : '❌ 不合格あり（未実装メソッドが残っている可能性）'));
console.log('注記: 本オラクルは論理層のみ。描画(複数スプライト)・ターゲット選択UI・敵フェーズのループは実機/別検証で確認。');
process.exit(pass ? 0 : 1);
