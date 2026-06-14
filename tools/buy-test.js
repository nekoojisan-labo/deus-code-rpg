// buy-test.js — 購入レベル制限撤廃の機能検証（実 buyItem を呼ぶ）
// 期待: 低Lvでも所持金が足りれば武器/防具/アイテムは買える。魔法は従来どおりレベルで弾かれる。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const fakeEl = new Proxy({}, { get: () => noop, set: () => true });
const sb = { console, window: {}, document: { getElementById: () => null, querySelector: () => null, createElement: () => fakeEl },
  URLSearchParams, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} },
  setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js',
                 'equipment-system.js', 'item-system.js', 'magic-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const W = sb.window;
W.equipmentSystem = new W.EquipmentSystem();
W.itemSystem = new W.ItemSystem();
W.magicSystem = new W.MagicSystem();
const shop = W.gameShop;          // map-system末尾で new ShopSystem() 済み

// 通知/再描画を捕捉
let lastNotice = '';
shop.showShopNotice = (msg) => { lastNotice = msg || ''; };
shop.renderShopUI = () => {};
W.updateUI = () => {};

const eqCount = (id) => (W.equipmentSystem.inventory || W.equipmentSystem.ownedEquipment || []).filter(x => x === id || (x && x.id === id)).length;

function findItem(pred) {
  for (const type of Object.keys(shop.shopData)) {
    const list = shop.shopData[type];
    if (!Array.isArray(list)) continue;
    for (let i = 0; i < list.length; i++) {
      const d = shop.getItemDetails(type, i);
      if (d && pred(d, list[i])) return { type, i, d, raw: list[i] };
    }
  }
  return null;
}

console.log('=== 購入レベル制限 撤廃テスト ===\n');

// 1) 高requiredLevelの装備を Lv1 で購入 → 成功すべき（所持金のみ）
const eq = findItem((d) => d.isEquipment && d.requiredLevel && d.requiredLevel >= 3);
if (eq) {
  W.player = { level: 1, gold: 999999, role: 'all-rounder', name: 'テスト' };
  const before = W.player.gold;
  lastNotice = '';
  shop.buyItem(eq.type, eq.i);
  const paid = before - W.player.gold;
  const ok = paid === eq.d.price && lastNotice.includes('購入');
  console.log(`[装備] ${eq.d.name} (必要Lv${eq.d.requiredLevel}) を Lv1 で購入`);
  console.log(`  支払い=${paid}G (価格${eq.d.price}) / 通知="${lastNotice.split('\n')[0]}"`);
  console.log(`  → ${ok ? '✅ 買えた（レベル制限撤廃OK）' : '❌ 買えていない'}\n`);
} else console.log('[装備] requiredLevel>=3 の装備が見つからず\n');

// 2) 所持金不足なら買えない（従来どおり）
const eq2 = findItem((d) => d.isEquipment && d.price > 0);
if (eq2) {
  W.player = { level: 1, gold: 0, role: 'all-rounder', name: 'テスト' };
  lastNotice = '';
  shop.buyItem(eq2.type, eq2.i);
  const ok = lastNotice.includes('ゴールド') || lastNotice.includes('足り');
  console.log(`[装備/金欠] ${eq2.d.name} を 所持金0 で購入 → 通知="${lastNotice.split('\n')[0]}"`);
  console.log(`  → ${ok ? '✅ ちゃんと弾かれる（所持金ゲートは維持）' : '❌ 弾かれていない'}\n`);
}

// 3) 高requiredLevelの魔法を Lv1 で購入 → 従来どおりレベルで弾かれるべき
const mg = findItem((d) => d.isMagic && d.requiredLevel && d.requiredLevel >= 3 && !d.alreadyLearned);
if (mg) {
  W.player = { level: 1, gold: 999999, role: 'all-rounder', name: 'テスト', learnedMagic: [], magic: [] };
  const before = W.player.gold;
  lastNotice = '';
  shop.buyItem(mg.type, mg.i);
  const paid = before - W.player.gold;
  const blocked = paid === 0 && (lastNotice.includes('レベル') || lastNotice.includes('習得'));
  console.log(`[魔法] ${mg.d.name} (必要Lv${mg.d.requiredLevel}) を Lv1 で購入`);
  console.log(`  支払い=${paid}G / 通知="${lastNotice.split('\n')[0]}"`);
  console.log(`  → ${blocked ? '✅ 魔法は従来どおりレベルで弾かれる' : '❌ 魔法ゲートが壊れた'}\n`);
} else console.log('[魔法] テスト対象の魔法が見つからず\n');
