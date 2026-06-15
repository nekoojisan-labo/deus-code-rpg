// combat-v2-oracle.js — 戦闘v2エンジン(属性/二系統式/全体攻撃/バフ)を実コードで検証。
//   (1) computeSkillDamage: 魔法=magic×bp×属性×(1-耐性)-magDef/3、弱点1.5/耐性減衰、物理=attack×bp-physDef/2
//   (2) computeHealAmount: floor(magic×bp)
//   (3) 全体攻撃: _kamuiAllEnemies が生存敵全員へ、MPは1回だけ消費
//   (4) バフ: applySupportEffect→buffs、_buffMul、tickBuffs で減衰
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
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'magic-system.js', 'battle-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

const ms = new sb.window.MagicSystem();
sb.window.magicSystem = ms;
console.log('\n=== 戦闘v2エンジン・オラクル ===\n');

// (1) computeSkillDamage 魔法
console.log('— (1) 魔法ダメージ式（属性/魔法防御）—');
const caster = { name: 'ヤミ', attack: 40, magic: 200 };
const lance = { name: 'ダークランス', type: 'offensive', element: 'dark', basePower: 2.0, scalingStat: 'magic' };
// 弱点不一致の敵(magDef 24)
const nonWeak = { name: '敵A', currentHp: 600, maxHp: 600, weakness: null, magicDefense: 24, elementalResistance: null };
const r1 = ms.computeSkillDamage(caster, nonWeak, lance);
const expectNoWeak = Math.floor(200 * 2.0) - Math.floor(24 / 3);   // variance無視の下限
chk('無属性扱いダメージ ≈ magic×bp - magDef/3', r1.damage >= expectNoWeak && r1.damage <= expectNoWeak + Math.floor(400 * 0.12) + 1, `=${r1.damage} (base${expectNoWeak}+)`);
chk('弱点不一致は weak=false', r1.weak === false);
// 弱点一致(dark)の敵 → 1.5倍
const weakEnemy = { name: '敵B', currentHp: 600, maxHp: 600, weakness: 'dark', magicDefense: 24, elementalResistance: null };
const r2 = ms.computeSkillDamage(caster, weakEnemy, lance);
chk('弱点一致(dark)で約1.5倍', r2.damage > Math.floor(r1.damage * 1.4) && r2.weak === true, `無${r1.damage}→弱${r2.damage}`);
// 耐性持ち(dark 0.5)
const resistEnemy = { name: '敵C', currentHp: 600, maxHp: 600, weakness: null, magicDefense: 24, elementalResistance: { dark: 0.5 } };
const r3 = ms.computeSkillDamage(caster, resistEnemy, lance);
chk('闇耐性0.5でダメージ半減・resisted=true', r3.damage < r1.damage && r3.resisted === true, `無${r1.damage}→耐性${r3.damage}`);

// 物理スキル: attack×bp - physDef/2、属性無関係
console.log('\n— 物理スキル式 —');
const riku = { name: 'リク', attack: 230, magic: 50 };
const smash = { name: 'ヘビースマッシュ', type: 'offensive', element: 'none', basePower: 1.6, scalingStat: 'attack' };
const physTgt = { name: '敵D', currentHp: 600, maxHp: 600, weakness: 'fire', defense: 80, magicDefense: 40 };
const r4 = ms.computeSkillDamage(riku, physTgt, smash);
const expPhys = Math.floor(230 * 1.6) - Math.floor(80 / 2);
chk('物理= attack×bp - physDef/2', r4.damage >= expPhys && r4.damage <= expPhys + Math.floor(368 * 0.12) + 1, `=${r4.damage} (base${expPhys}+)`);
chk('物理スキルは弱点(fire)でも倍率1.0(element=none)', r4.weak === false);

// (2) 回復量
console.log('\n— (2) 回復量 —');
const akari = { name: 'アカリ', magic: 233 };
chk('回復= floor(magic×bp): omega bp3.4 → 792', ms.computeHealAmount(akari, { basePower: 3.4 }) === Math.floor(233 * 3.4), `=${ms.computeHealAmount(akari, { basePower: 3.4 })}`);
chk('回復= floor(magic×bp): heal bp0.7 → 163', ms.computeHealAmount(akari, { basePower: 0.7 }) === Math.floor(233 * 0.7), `=${ms.computeHealAmount(akari, { basePower: 0.7 })}`);

// (3) 全体攻撃: 生存敵全員へ・MP1回
console.log('\n— (3) 全体攻撃ループ —');
const battle = new sb.window.BattleSystem();
battle.presentBeat = (m, o) => { if (o && o.fx) o.fx.forEach(f => f && f()); };
battle.afterBattleMessages = (cb) => cb && cb();
battle.updateBattleUI = noop; battle.showDamageEffect = noop; battle.battleVictory = () => { battle._win = (battle._win || 0) + 1; };
const yami = { name: 'ヤミ', characterId: 'yami', attack: 40, magic: 200, mp: 100, maxMp: 100 };
sb.window.player = yami; sb.window.partySystem = { getMembers: () => [] };
// 全体闇術を yami に習得させる
ms.learnedMagicByCharacter['yami'] = { dark_nova: { id: 'dark_nova', name: 'ダークノヴァ', type: 'offensive', target: 'all', element: 'dark', basePower: 1.05, scalingStat: 'magic', mpCost: 30 } };
battle.enemies = [
  { id: 'a', name: 'A', currentHp: 600, maxHp: 600, weakness: 'dark', magicDefense: 10, defense: 10 },
  { id: 'b', name: 'B', currentHp: 600, maxHp: 600, weakness: null, magicDefense: 10, defense: 10 },
  { id: 'c', name: 'C', currentHp: 600, maxHp: 600, weakness: null, magicDefense: 10, defense: 10 }
];
const mpBefore = yami.mp;
battle._kamuiAllEnemies(yami, noop, 'dark_nova', ms.getLearnedSkill(yami, 'dark_nova'));
chk('全体攻撃が3体全員にダメージ', battle.enemies.every(e => e.currentHp < 600), battle.enemies.map(e => e.currentHp).join('/'));
chk('MPは1回だけ消費(30)', yami.mp === mpBefore - 30, `${mpBefore}→${yami.mp}`);
chk('弱点(A,dark)が非弱点(B/C)より多く減っている', (600 - battle.enemies[0].currentHp) > (600 - battle.enemies[1].currentHp), `A減${600 - battle.enemies[0].currentHp} B減${600 - battle.enemies[1].currentHp}`);

// (4) バフ
console.log('\n— (4) バフ（プロテス/ウォークライ/挑発）—');
const m1 = { name: 'リク', defense: 100, buffs: {} };
ms.applySupportEffect(m1, { name: 'プロテス', effect: 'phys_def_up', buffMul: 1.5, duration: 3 });
chk('プロテスで physDef バフ(×1.5,3T)', m1.buffs.physDef && m1.buffs.physDef.mul === 1.5 && m1.buffs.physDef.turns === 3);
chk('_buffMul が 1.5 を返す', battle._buffMul(m1, 'physDef') === 1.5);
battle.tickBuffs(m1);
chk('tickBuffs で残り2ターンへ', m1.buffs.physDef.turns === 2);
const m2 = { name: 'アカリ', statusAilments: { poison: 2 }, buffs: {} };
ms.applySupportEffect(m2, { name: 'キュアラ', effect: 'cure_status' });
chk('状態治療で statusAilments クリア', Object.keys(m2.statusAilments).length === 0);
const m3 = { name: 'リク', buffs: {} };
ms.applySupportEffect(m3, { name: '挑発', effect: 'taunt', duration: 2 });
chk('挑発で taunting フラグ', m3.taunting === 2);

console.log('\n' + (pass ? '✅ 全PASS: v2エンジン(属性二系統式/弱点1.5・耐性/物理魔法分離/全体攻撃MP1回/バフ)を実コードで確認'
  : '❌ 不合格あり'));
process.exit(pass ? 0 : 1);
