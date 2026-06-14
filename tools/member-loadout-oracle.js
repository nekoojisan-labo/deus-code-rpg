// member-loadout-oracle.js — メンバーの加入Lv＋初期装備（丸腰防止）を実システムで検証
// index.html の applyMemberLoadout と同一ロジックを実 EquipmentSystem/PartySystem に対して走らせる。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const sb = { console, window: {}, document: { getElementById: () => null }, Math, JSON, Object, Array, Number, String, Boolean };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['equipment-system.js', 'item-system.js', 'magic-system.js', 'party-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const W = sb.window;
W.equipmentSystem = new W.EquipmentSystem();
W.itemSystem = new W.ItemSystem();
W.magicSystem = new W.MagicSystem();
W.partySystem = new W.PartySystem();
W.updateUI = noop;

// ---- index.html と同一の loadout ロジック ----
const MEMBER_LOADOUT = {
  akari: { level: 1, equip: ['wooden_sword', 'cloth_armor'] },
  riku:  { level: 4, equip: ['iron_sword', 'leather_armor', 'iron_helmet'] },
  yami:  { level: 4, equip: ['wooden_sword', 'cloth_armor', 'mana_amulet'] }
};
function applyMemberLoadout(memberId, member) {
  const lo = MEMBER_LOADOUT[memberId];
  if (!lo || !member) return;
  const g = (s, d) => (W.calculateStatGrowth ? W.calculateStatGrowth(memberId, s) : d);
  while (member.level < lo.level) {
    member.level++;
    member.baseMaxHp = (member.baseMaxHp || member.maxHp) + g('hp', 18);
    member.baseMaxMp = (member.baseMaxMp || member.maxMp) + g('mp', 8);
    member.baseAttack = (member.baseAttack || member.attack) + g('attack', 3);
    member.baseDefense = (member.baseDefense || member.defense) + g('defense', 2);
    member.baseMagic = (member.baseMagic || member.magic || 0) + g('magic', 2);
    member.baseSpeed = (member.baseSpeed || member.speed || 5) + g('speed', 1);
  }
  member.magic = member.baseMagic; member.speed = member.baseSpeed;
  if (W.equipmentSystem) {
    lo.equip.forEach(id => { W.equipmentSystem.addEquipment(id, 1); W.equipmentSystem.equipItem(id, member); });
  }
  member.hp = member.maxHp; member.mp = member.maxMp;
}

console.log('\n=== メンバー加入Lv＋初期装備オラクル ===\n');
let allPass = true;
for (const id of ['akari', 'riku', 'yami']) {
  const base = W.CHARACTER_DATA[id];
  const baseAttack = base.baseAttack, baseDefense = base.baseDefense;
  W.partySystem.addMember({ ...base });
  const m = W.partySystem.getMember(id);
  applyMemberLoadout(id, m);
  const eq = W.equipmentSystem.getEquipped(m);
  const lo = MEMBER_LOADOUT[id];
  const weaponOk = eq.weapon === lo.equip.find(e => e.includes('sword'));
  const bodyOk = !!eq.body;
  const lvOk = m.level === lo.level;
  const armed = m.attack > baseAttack;       // 丸腰でない（武器で攻撃増）
  const defUp = m.defense > baseDefense;       // 防具で防御増
  const pass = weaponOk && bodyOk && lvOk && armed && defUp;
  allPass = allPass && pass;
  console.log(`${base.name}(${id}): Lv${m.level}(目標${lo.level}) 武器=${eq.weapon} 防具=${eq.body} 頭=${eq.head||'-'} アクセ=${eq.accessory||'-'}`);
  console.log(`  攻撃 ${baseAttack}→${m.attack} / 防御 ${baseDefense}→${m.defense} / HP ${m.maxHp} / 装備済み=${armed?'✅丸腰でない':'❌丸腰'} Lv=${lvOk?'✅':'❌'}`);
  console.log(`  → ${pass ? '✅ PASS' : '❌ FAIL'}\n`);
}
console.log(allPass ? '✅ 全メンバー: 加入Lv固定＋初期装備自動装備OK（丸腰解消）' : '❌ 不合格あり');
