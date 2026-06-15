// stat-model-oracle.js — 戦闘v2 ステータス基盤(魔法防御 magicDefense)を実コードで検証。
//   (1) getTotalStats が装備の magicDefense を集計
//   (2) recalculatePlayerStats が baseMagicDefense を baseDefense から導出＋装備分を加算(NaN無し)
//   (3) 物理防御の成長に魔法防御が追従(レベルアップ相当)
//   (4) makeScaledEnemy / startBattle が敵に magicDefense/element/weakness の既定を付与(NaN無し)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {},
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => new Proxy({}, { get: () => noop, set: () => true }) },
  URLSearchParams, Image: class { set src(_) {} }, setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'battle-system.js', 'map-system.js', 'equipment-system.js'])
  vm.runInContext(read(f), sb, { filename: f });

let pass = true;
const num = (v) => typeof v === 'number' && !Number.isNaN(v);
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

console.log('\n=== v2 ステータス基盤(魔法防御)オラクル ===\n');

const eq = new sb.window.EquipmentSystem();
// テスト用に magicDefense を持つ術士防具を注入(本番の装備拡充が入るまでのスタンドイン)
eq.equipmentDatabase.test_robe = { id: 'test_robe', name: 'テストローブ', slot: 'body', allowedRoles: ['all-rounder', 'mage', 'healer'], defense: 4, magic: 6, magicDefense: 8 };
sb.window.equipmentSystem = eq;

// (1) getTotalStats が magicDefense を集計
console.log('— (1) getTotalStats —');
const mage = { id: 'yami', characterId: 'yami', role: 'mage', attack: 8, defense: 4, magic: 18, baseAttack: 8, baseDefense: 4, baseMagic: 18, baseMaxHp: 70, baseMaxMp: 80, baseSpeed: 12, hp: 70, maxHp: 70, mp: 80, maxMp: 80, speed: 12 };
const blank = eq.getTotalStats(mage);
chk('getTotalStats に magicDefense フィールドがある', 'magicDefense' in blank, `=${blank.magicDefense}`);
eq.addEquipment('test_robe', 1); eq.equipItem('test_robe', mage);
const withRobe = eq.getTotalStats(mage);
chk('装備の magicDefense(+8) が集計される', withRobe.magicDefense === 8, `=${withRobe.magicDefense}`);

// (2) recalc: baseMagicDefense 導出＋装備加算
console.log('\n— (2) recalculatePlayerStats —');
chk('baseMagicDefense = floor(baseDefense*0.5) で導出', mage.baseMagicDefense === Math.floor(mage.baseDefense * 0.5), `base=${mage.baseMagicDefense} (def${mage.baseDefense})`);
chk('magicDefense = baseMagicDefense + 装備(8)', mage.magicDefense === mage.baseMagicDefense + 8, `=${mage.magicDefense}`);
chk('magicDefense が数値(NaN無し)', num(mage.magicDefense));

// (3) 物理防御の成長に追従
console.log('\n— (3) 防御成長への追従 —');
const before = mage.baseMagicDefense;
mage.baseDefense = 40;            // レベルアップで物理防御が伸びた相当
eq.recalculatePlayerStats(mage);
chk('baseDefense 成長で baseMagicDefense も増える', mage.baseMagicDefense === 20 && mage.baseMagicDefense > before, `${before}→${mage.baseMagicDefense}`);
chk('成長後も magicDefense = base + 装備', mage.magicDefense === 20 + 8, `=${mage.magicDefense}`);

// (4) 敵生成の既定
console.log('\n— (4) 敵の magicDefense/element/weakness 既定 —');
const battle = new sb.window.BattleSystem();
const msys = new sb.window.MapSystem(); sb.window.mapSystem = msys; msys.currentMap = 'subway_concourse_a';
const zone = msys.getEncounterZone();
const e = battle.makeScaledEnemy('watcher', zone);
chk('makeScaledEnemy: magicDefense が数値', num(e.magicDefense), `=${e.magicDefense}`);
chk('makeScaledEnemy: magicDefense ≈ floor(defense*0.5)', e.magicDefense === Math.floor(e.defense * 0.5), `magDef${e.magicDefense} def${e.defense}`);
chk('makeScaledEnemy: element 既定 none', e.element === 'none');
chk('makeScaledEnemy: weakness 既定 null', e.weakness === null);

// startBattle 経由(ボス等 makeScaledEnemy を通らない単体)でも既定が付く
sb.window.bgmSystem = { startBattleBGM: noop, endBattleBGM: noop, stop: noop };
sb.window.playSE = noop; sb.window.player = mage; sb.window.partySystem = { getMembers: () => [] };
battle.startBattle({ id: 'boss_test', name: 'テストボス', hp: 500, maxHp: 500, attack: 50, defense: 40, exp: 100, gold: 100, boss: true }, true);
chk('startBattle: ボスにも magicDefense 既定(数値)', num(battle.enemies[0].magicDefense), `=${battle.enemies[0].magicDefense}`);
chk('startBattle: ボス element=none / weakness=null', battle.enemies[0].element === 'none' && battle.enemies[0].weakness === null);

console.log('\n' + (pass ? '✅ 全PASS: 魔法防御が装備/再計算/成長/敵生成を通じて数値で機能(旧データ・新規どちらもNaN無し)'
  : '❌ 不合格あり'));
process.exit(pass ? 0 : 1);
