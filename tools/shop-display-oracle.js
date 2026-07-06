// shop-display-oracle.js — ショップ購入画面の分類表示と元shopIndex保持を検証する計器。
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
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy, Map, Set
};
sb.window.location = { search: '' };
sb.globalThis = sb;
vm.createContext(sb);

for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js',
                 'equipment-system.js', 'item-system.js', 'magic-system.js', 'map-system.js']) {
  vm.runInContext(read(f), sb, { filename: f });
}

const W = sb.window;
W.equipmentSystem = new W.EquipmentSystem();
W.itemSystem = new W.ItemSystem();
W.magicSystem = new W.MagicSystem();
W.player = { name: 'カイト', role: 'all-rounder', level: 1, gold: 999999, learnedMagic: [], magic: [] };
const shop = W.gameShop || new W.ShopSystem();

console.log('\n=== ショップ分類表示 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

function entryByEquipment(type, id) {
  return shop.getDisplayShopItems(type).find(e => e.raw && e.raw.equipmentId === id);
}

for (const type of Object.keys(shop.shopData)) {
  const entries = shop.getDisplayShopItems(type);
  chk(`${type}: 表示件数が元データ件数と一致`, entries.length === shop.shopData[type].length, `${entries.length}/${shop.shopData[type].length}`);
  chk(`${type}: 全行が元shopIndexを保持`, entries.every(e => Number.isInteger(e.shopIndex) && shop.shopData[type][e.shopIndex] === e.raw));
  chk(`${type}: 全行の詳細と分類が解決できる`, entries.every(e => e.details && e.category && e.category.label));
}

const steel = entryByEquipment('weapons', 'steel_saber');
const staff = entryByEquipment('weapons', 'oak_staff');
const rod = entryByEquipment('weapons', 'prayer_rod');
chk('武器店: 物理武器はカイト/リク向けに分類', steel && steel.category.label.includes('カイト/リク'), steel && steel.category.label);
chk('武器店: 杖はヤミ向けに分類', staff && /ヤミ/.test(staff.category.label), staff && staff.category.label);
chk('武器店: ロッドはアカリ向けに分類', rod && /アカリ/.test(rod.category.label), rod && rod.category.label);

const armorCats = shop.getDisplayShopItems('armor').map(e => e.category.label).join(' | ');
chk('防具店: 頭/体/腕/装飾の分類を含む', ['頭防具', '体防具', '腕防具', '装飾品'].every(k => armorCats.includes(k)), armorCats);
chk('防具店: 術士系と物理系の分類が混在せず表示できる', armorCats.includes('カイト/リク') && armorCats.includes('アカリ/ヤミ'), armorCats);

const black = shop.getDisplayShopItems('black_market');
chk('闇市: 装備/アイテム/魔法の混在分類を保持', black.some(e => e.details.isEquipment) && black.some(e => e.details.isItem) && black.some(e => e.details.isMagic));

const firstWeapon = shop.getDisplayShopItems('weapons')[0];
const beforeGold = W.player.gold;
shop.showShopNotice = noop;
shop.renderShopUI = noop;
const result = shop.buyItem('weapons', firstWeapon.shopIndex);
const boughtId = firstWeapon.raw.equipmentId;
chk('購入: 表示順変更後も value=元shopIndex で購入できる', result && result.success && W.equipmentSystem.inventory[boughtId], boughtId);
chk('購入: 価格分だけ所持金が減る', W.player.gold === beforeGold - firstWeapon.details.price, `${beforeGold} -> ${W.player.gold}`);

console.log(`\n${pass ? '✅ 全PASS: ショップ分類表示と購入index保持を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
