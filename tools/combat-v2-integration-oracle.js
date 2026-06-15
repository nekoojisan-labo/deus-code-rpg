const fs = require('fs'), path = require('path'), vm = require('vm');
const root = '/Users/takayamanoboruhaku/projects/_deus/clone2';
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {},
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => new Proxy({}, { get: () => noop, set: () => true }) },
  URLSearchParams, Image: class { set src(_) {} }, setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'magic-system.js', 'battle-system.js', 'map-system.js', 'equipment-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
let pass = true; const chk = (l, c, e) => { process.stdout.write((c ? '✅ ' : '❌ ') + l + (e ? '  (' + e + ')' : '') + '\n'); pass = pass && c; };

const ms = new sb.window.MagicSystem(); sb.window.magicSystem = ms;
const battle = new sb.window.BattleSystem(); sb.window.battleSystem = battle;
const eq = new sb.window.EquipmentSystem(); sb.window.equipmentSystem = eq;
const msys = new sb.window.MapSystem(); sb.window.mapSystem = msys; msys.currentMap = 'deep_tunnel';
const zone = msys.getEncounterZone();

process.stdout.write('\n=== v2 統合スモーク ===\n');
// 実DBの新規敵を生成（属性/魔法防御付き）
const oblivion = battle.makeScaledEnemy('oblivion_shade', zone);  // dark, weak=light, resist dark0.75
chk('新規敵 oblivion_shade 生成(magicDefense数値・dark属性・light弱点)', oblivion && typeof oblivion.magicDefense === 'number' && oblivion.weakness === 'light' && oblivion.element === 'dark', `mdef${oblivion.magicDefense} weak${oblivion.weakness}`);

// yami が実DBスキルを習得して使用
const yami = { name: 'ヤミ', characterId: 'yami', role: 'mage', attack: 55, magic: 288, mp: 200, maxMp: 200 };
chk('yami が abyssal_ruin(闇単体) を習得', ms.learnMagic('abyssal_ruin', yami) === true);
chk('yami が dark_nova(闇全体) を習得', ms.learnMagic('dark_nova', yami) === true);
// 闇術を light弱点・dark耐性0.75 の敵へ → resisted(効果いまひとつ)
const r = ms.useMagic('abyssal_ruin', yami, oblivion, true);
chk('闇術が dark耐性敵にダメージ(resisted)', r.success && r.damage > 0, `dmg${r.damage}`);
// akari が omega_heal を習得して使用（KO/通常）
const akari = { name: 'アカリ', characterId: 'akari', role: 'healer', magic: 233, hp: 100, maxHp: 815, mp: 200, maxMp: 200 };
chk('akari が omega_heal を習得', ms.learnMagic('omega_heal', akari) === true);
const beforeHp = akari.hp;
const rh = ms.useMagic('omega_heal', akari, akari, true);
chk('omega_heal で大回復(792相当)', rh.success && akari.hp > beforeHp + 600, `${beforeHp}→${akari.hp}`);
// riku が物理スキル shield_bash を習得・使用（物理スケール）
const riku = { name: 'リク', characterId: 'riku', role: 'tank', attack: 230, magic: 50, mp: 100, maxMp: 100 };
chk('riku が shield_bash を習得', ms.learnMagic('shield_bash', riku) === true);
const rp = ms.useMagic('shield_bash', riku, oblivion, true);
chk('物理スキルが命中(attackスケール)', rp.success && rp.damage > 0, `dmg${rp.damage}`);

// 新規装備が装備でき魔法防御が乗る
eq.addEquipment('kamui_robe', 1);
const r2 = eq.equipItem('kamui_robe', { id: 'yami', role: 'mage', attack: 8, defense: 4, magic: 18, baseAttack: 8, baseDefense: 4, baseMagic: 18, baseMaxHp: 70, baseMaxMp: 80, baseSpeed: 12, hp: 70, maxHp: 70, mp: 80, maxMp: 80, speed: 12, name: 'ヤミ' });
chk('新規術士装備 kamui_robe をメイジが装備できる(magicDefense付与)', r2.success === true, r2.message);

// 新規装備が店で買える
const shop = new sb.window.ShopSystem(); chk('新規武器 deus_executioner が店に並ぶ', (shop.shopData.black_market||[]).concat(shop.shopData.weapons||[]).some(x=>x.equipmentId==='deus_executioner'));

process.stdout.write('\n' + (pass ? '✅ 統合スモークPASS: 実DBの v2スキル/新規敵/装備/店 が一気通貫で機能\n' : '❌ 統合に問題あり\n'));
process.exit(pass ? 0 : 1);
