// equip-class-oracle.js — 装備のクラス(role)別制限と術士装備の魔力反映を実コードで検証。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const sb = { console: { log: () => {}, warn: () => {}, error: () => {} }, window: {}, Math, JSON, Object, Array, Number, String, Boolean };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'equipment-system.js'), 'utf8'), sb, { filename: 'equipment-system.js' });
const eq = new sb.window.EquipmentSystem();

console.log('\n=== 装備クラス別 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// allowedRoles 付与確認
chk('物理武器(iron_sword)は戦士系のみ(mage不可)', !eq.equipmentDatabase.iron_sword.allowedRoles.includes('mage') && eq.equipmentDatabase.iron_sword.allowedRoles.includes('tank'));
chk('術士武器(mage_staff)はmage可・tank不可', eq.equipmentDatabase.mage_staff.allowedRoles.includes('mage') && !eq.equipmentDatabase.mage_staff.allowedRoles.includes('tank'));
chk('術士武器(mage_staff)は魔力(magic)を持つ', (eq.equipmentDatabase.mage_staff.magic || 0) > 0);
chk('軽装(cloth_armor)は全クラス可', ['all-rounder', 'tank', 'healer', 'mage'].every(r => eq.equipmentDatabase.cloth_armor.allowedRoles.includes(r)));

const tank = { name: 'リク', role: 'tank', attack: 20, defense: 10, magic: 0, baseMagic: 0 };
const mage = { name: 'ヤミ', role: 'mage', attack: 8, defense: 4, magic: 18, baseMagic: 18, mp: 80, maxMp: 80, hp: 70, maxHp: 70 };

// 装備可否（インベントリに入れてから）
eq.addEquipment('iron_sword', 1); eq.addEquipment('mage_staff', 1);
let r = eq.equipItem('mage_staff', tank);
chk('タンク(リク)は術士武器を装備できない', r.success === false, r.message);
r = eq.equipItem('iron_sword', tank);
chk('タンク(リク)は物理武器を装備できる', r.success === true);

eq.addEquipment('iron_sword', 1); eq.addEquipment('mage_staff', 1);
r = eq.equipItem('iron_sword', mage);
chk('メイジ(ヤミ)は物理武器を装備できない', r.success === false, r.message);
const magBefore = mage.magic;
r = eq.equipItem('mage_staff', mage);
chk('メイジ(ヤミ)は術士武器を装備できる', r.success === true);
chk('術士武器の装備で魔力(magic)が上がる（差別化）', mage.magic > magBefore, `magic ${magBefore}→${mage.magic}`);

console.log(`\n${pass ? '✅ 全PASS: クラス別の装備制限＋術士装備で魔力上昇＝パーティ差別化 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
