// revive-oracle.js — 戦闘不能(KO)の蘇生仕様を実コードで検証。
// 通常回復(アイテム/魔法)はKOに効かない／専用の復活の石・リザレクトのみKO解除を確認。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, Math, JSON, Object, Array, Number, String, Boolean };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('item-system.js'), sb, { filename: 'item-system.js' });
vm.runInContext(read('magic-system.js'), sb, { filename: 'magic-system.js' });

const items = new sb.window.ItemSystem();
items.addItem('heal_potion', 5);
items.addItem('revival_stone', 5);
const magic = new sb.window.MagicSystem();
const caster = { name: 'アカリ', characterId: 'akari', role: 'healer', hp: 50, maxHp: 80, mp: 50, maxMp: 50 };
magic.learnMagic('heal', caster);   // 習得済みにして「KOガード」を実際に検証（未習得で弾かれるのと区別）
magic.learnMagic('revive', caster);

console.log('\n=== 戦闘不能 蘇生仕様 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// --- アイテム ---
let ko = { name: 'リク', hp: 0, maxHp: 100, mp: 10, maxMp: 20 };
let r = items.useItem('heal_potion', ko, true);
chk('通常回復アイテム(ヒールポーション)はKOに効かない', r.success === false && ko.hp === 0, `hp=${ko.hp}`);
r = items.useItem('revival_stone', ko, true);
chk('復活の石はKOを蘇生（HP50%）', r.success === true && ko.hp === 50, `hp=${ko.hp}`);
let alive = { name: 'カイト', hp: 60, maxHp: 100 };
r = items.useItem('revival_stone', alive, true);
chk('復活の石は生存中の仲間には使えない', r.success === false && alive.hp === 60);
r = items.useItem('heal_potion', alive, true);
chk('生存中なら通常回復アイテムは効く', r.success === true && alive.hp > 60, `hp=${alive.hp}`);

// --- 魔法 ---
let ko2 = { name: 'ヤミ', hp: 0, maxHp: 80, mp: 30, maxMp: 40 };
r = magic.useMagic('heal', caster, ko2, true);
chk('通常回復魔法(ヒール)はKOに効かない', r.success === false && ko2.hp === 0, `hp=${ko2.hp}`);
r = magic.useMagic('revive', caster, ko2, true);
chk('蘇生魔法(リザレクト)はKOを蘇生（HP50%）', r.success === true && ko2.hp === 40, `hp=${ko2.hp}`);
let alive2 = { name: 'カイト', hp: 70, maxHp: 100 };
r = magic.useMagic('revive', caster, alive2, true);
chk('蘇生魔法は生存中には使えない', r.success === false && alive2.hp === 70);

// --- DB存在確認 ---
chk('復活の石(revival_stone)がアイテムDBに存在', !!items.itemDatabase.revival_stone);
chk('蘇生魔法(revive/リザレクト)が魔法DBに存在', !!magic.magicDatabase.revive && magic.magicDatabase.revive.type === 'revive');

console.log(`\n${pass ? '✅ 全PASS: 通常回復はKOに無効／復活の石・蘇生魔法のみKO解除 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
