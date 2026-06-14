// encounter-oracle.js — 敵分布の検証。各マップの getEncounterZone→encounterTables を引き、
// 顔ぶれ差別化・敵id実在・tierスケール後の代表ステータス・スプライト実在を確認する。
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
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'battle-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const msys = new sb.window.MapSystem();
const battle = new sb.window.BattleSystem();
sb.window.mapSystem = msys;

const DB = battle.enemyDatabase, TABLES = battle.encounterTables, TIERMUL = battle.tierMultiplier;
const imgMap = battle.enemyImageMap || {};

// 代表マップ（各ゾーンを引ける id）
const sampleMaps = ['shinjuku_center_plaza', 'shopping_street_north', 'subway_concourse_a',
  'shrine_south_gate', 'biodome_gate', 'black_market_entrance', 'tokyo_gov_approach', 'deep_tunnel'];

console.log('\n=== 敵分布オラクル ===\n');
console.log('map | zone(table/tier/Lv帯) | 顔ぶれ | 先頭敵のtierスケール後 hp/atk @minLv');
console.log('----|----------------------|--------|----------------------------------');
const missing = [], spriteMissing = [];
const leadByZone = {};
for (const id of sampleMaps) {
  msys.currentMap = id;
  const zone = msys.getEncounterZone();
  const table = TABLES[zone.table];
  if (!table) { console.log(`${id} | テーブル無し(${zone.table})`); continue; }
  // 敵id実在チェック
  for (const eid of table) if (!DB[eid]) missing.push(`${zone.table}:${eid}`);
  const lead = DB[table[0]];
  const mult = TIERMUL[zone.tier] || 1;
  const hp = lead ? Math.round(lead.hp * mult) : '?';
  const atk = lead ? Math.round(lead.attack * mult) : '?';
  const names = table.map(eid => DB[eid] ? DB[eid].name : `❌${eid}`);
  const uniq = [...new Set(names)];
  leadByZone[zone.table] = lead ? lead.name : '?';
  console.log(`${id} | ${zone.table}/t${zone.tier}/Lv${zone.levelRange[0]}-${zone.levelRange[1]} | ${uniq.join('・')} | ${hp}hp/${atk}atk @Lv${zone.levelRange[0]}`);
  // スプライト存在（名前→imgMap→ファイル）
  for (const eid of [...new Set(table)]) {
    const nm = DB[eid] && DB[eid].name;
    const sp = nm && imgMap[nm];
    if (sp && !fs.existsSync(path.join(root, sp))) spriteMissing.push(`${nm}:${sp}`);
  }
}

// 差別化チェック: 各ゾーンの先頭敵がなるべく異なるか
const leads = Object.values(leadByZone);
const dupLeads = leads.filter((v, i) => leads.indexOf(v) !== i);
console.log('\n=== 評価 ===');
console.log(`敵id 実在: ${missing.length === 0 ? '✅ 全て存在' : '❌ 欠落 ' + missing.join(', ')}`);
console.log(`先頭敵の重複(差別化): ${dupLeads.length === 0 ? '✅ 全ゾーン固有' : '⚠️ 重複 ' + [...new Set(dupLeads)].join(', ')}`);
console.log(`スプライト実在: ${spriteMissing.length === 0 ? '✅ 全て存在' : '❌ 欠落 ' + spriteMissing.join(', ')}`);
console.log(`新敵がDBに追加されたか: ${['patrol_drone','data_spider','phantom','security_drone','shadow_entity','guard_robo','glitch_spirit','queen_spider'].filter(k=>!DB[k]).length === 0 ? '✅ 8体OK' : '❌ 不足'}`);
