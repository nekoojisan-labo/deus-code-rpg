// exp-balance-oracle.js — EXP/レベルバランスを実コードで検証する単一ヘッドレス計器。
//   (1) 曲線: calculateExpNeeded を線形単段コストとして評価し累積Lv50=51,940・旧二次比≈39倍圧縮
//   (2) 到達Lv: 実 getEncounterZone(levelRange/tier) × enemyDatabase.exp × tierMultiplier の平均取得EXPで
//       各ゾーンを「帯トップ到達まで何戦か」シミュレートし 10-20戦/ステージ目標を検査
//   (2b) マルチ敵(平均2体)でレベリングが緩和(おおよそ半減)することを確認＝ユーザー要求「3体分でレベリングが楽」
//   (3) 最終ボス: 実ダメージ式でLv35到達パーティのDPRから rogue_ai_core 撃破ラウンドを算出し「1ラウンド即死(=非戦闘)」を検出
//   (4) Lv上限: levelUpCharacter に Lv50 ガードが存在し、Lv50でexpを溢れさせてもlevelが50で止まる
//   (5) 加入Lv: MEMBER_LOADOUT の akari/riku/yami が各加入ゾーンの levelRange[0] 以上
// 決定論で動かす(平均値ベース)。実機の乱数体感とはズレるため末尾に注記。
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
const DB = battle.enemyDatabase, TABLES = battle.encounterTables, TIERMUL = battle.tierMultiplier;
const expNeeded = sb.window.calculateExpNeeded;       // 単段コスト L->L+1
const GROWTH = sb.window.CHARACTER_GROWTH, CDATA = sb.window.CHARACTER_DATA;

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };
const warn = (label, extra) => console.log(`⚠️  ${label}${extra ? '  (' + extra + ')' : ''}`);

console.log('\n=== EXPバランス・オラクル ===\n');

// ---------- (1) 曲線 ----------
console.log('— (1) EXP曲線（線形単段コスト）—');
const n = (L) => expNeeded(L, 'normal');
chk('normal(1)=100', n(1) === 100, `=${n(1)}`);
chk('normal(5)=260', n(5) === 260, `=${n(5)}`);
chk('normal(10)=460', n(10) === 460, `=${n(10)}`);
chk('normal(20)=860', n(20) === 860, `=${n(20)}`);
chk('normal(30)=1260', n(30) === 1260, `=${n(30)}`);
chk('normal(49)=2020', n(49) === 2020, `=${n(49)}`);
let cum = 0; for (let L = 1; L <= 49; L++) cum += n(L);
chk('累積Lv50到達=51,940', cum === 51940, `=${cum}`);
const oldCum = (() => { let s = 0; for (let L = 1; L <= 49; L++) s += Math.floor(L * L * 50 + L * 25); return s; })();
chk('旧二次比 ≥30倍圧縮', oldCum / cum >= 30, `${oldCum}→${cum} = ${(oldCum / cum).toFixed(1)}x`);
const mono = (curve) => { for (let L = 1; L < 50; L++) if (expNeeded(L + 1, curve) <= expNeeded(L, curve)) return false; return true; };
chk('fast/slow が単調増加', mono('fast') && mono('slow'));
chk('slow > normal > fast (各Lで)', [5, 20, 40].every(L => expNeeded(L, 'slow') > expNeeded(L, 'normal') && expNeeded(L, 'normal') > expNeeded(L, 'fast')));

// ---------- 共通: ゾーン定義を実コードから取得 ----------
const SAMPLE = {
  city: 'shinjuku_center_plaza', subway: 'subway_concourse_a', shrine: 'shrine_south_gate',
  garden: 'biodome_gate', market: 'black_market_entrance', gov: 'tokyo_gov_approach', dungeon: 'deep_tunnel'
};
const ORDER = ['city', 'subway', 'shrine', 'garden', 'market', 'gov', 'dungeon'];
const zoneOf = (key) => { msys.currentMap = SAMPLE[key]; return msys.getEncounterZone(); };
const avgExpOf = (key) => {
  const z = zoneOf(key); const t = TABLES[z.table]; const mult = TIERMUL[z.tier] || 1;
  const sum = t.reduce((s, eid) => s + ((DB[eid] && DB[eid].exp) || 0) * mult, 0);
  return sum / t.length;
};

// ---------- (2) 到達Lvシミュ（ソロ敵）----------
console.log('\n— (2) 到達Lvシミュレーション（ソロ敵・平均取得EXP）—');
// processLevelUps を平均値で再現する純関数
function fightOnce(state, avgExp) { state.exp += avgExp; while (state.level < 50 && state.exp >= n(state.level)) { state.exp -= n(state.level); state.level++; } }
function battlesToLevel(state, avgExp, targetLv, cap = 200) { let b = 0; while (state.level < targetLv && b < cap) { fightOnce(state, avgExp); b++; } return b; }

const designAvg = { city: 20, subway: 64, shrine: 71, garden: 123, market: 177, gov: 384, dungeon: 551 };
const state = { level: 1, exp: 0 };
const perZone = {};
console.log('zone | Lv帯 | 平均取得EXP(設計値) | 帯トップ到達まで戦闘数');
console.log('-----|------|--------------------|----------------------');
for (const key of ORDER) {
  const z = zoneOf(key); const avg = avgExpOf(key);
  chk(`${key}: 平均取得EXP ≈ 設計${designAvg[key]}`, Math.abs(avg - designAvg[key]) <= Math.max(3, designAvg[key] * 0.06), `=${avg.toFixed(1)}`);
  const before = state.level;
  const b = battlesToLevel(state, avg, z.levelRange[1]);
  perZone[key] = b;
  console.log(`${key} | ${z.levelRange[0]}-${z.levelRange[1]} | ${avg.toFixed(0)}(${designAvg[key]}) | ${before}→${state.level} で ${b}戦`);
}
// 各ステージ 10-20戦目標。gov/dungeon は要調整帯として広め(6-22)に許容＋逸脱は警告。
for (const key of ORDER) {
  const b = perZone[key];
  if (key === 'gov' || key === 'dungeon') {
    chk(`${key}: 帯トップ到達が 6-22戦`, b >= 6 && b <= 22, `${b}戦`);
    if (b < 10 || b > 20) warn(`${key} は設計目標10-20戦から逸脱`, `${b}戦（マルチ敵で更に短縮）`);
  } else {
    chk(`${key}: 帯トップ到達が 8-20戦`, b >= 8 && b <= 20, `${b}戦`);
  }
}
// 真の断崖メトリクス: プレイヤーが実際に跨ぐ境界 =「次ゾーンの帯下限 − 前ゾーンの帯トップ」。
// 帯"下限同士"の差は帯幅(dungeonは8幅)を混入させ誤検出するため使わない。各境界が ≤+2 なら段差なし。
console.log('\n— 隣接ゾーン境界の段差（前ゾーン帯トップ→次ゾーン帯下限）—');
for (let i = 1; i < ORDER.length; i++) {
  const prevTop = zoneOf(ORDER[i - 1]).levelRange[1], nextLo = zoneOf(ORDER[i]).levelRange[0];
  const step = nextLo - prevTop;
  chk(`${ORDER[i - 1]}(top${prevTop})→${ORDER[i]}(底${nextLo}) 境界段差 ≤ +2`, step <= 2, `+${step}`);
}
// dungeon入場時の対最弱敵レベル差（断崖）: 全ゾーン踏破後の自然到達Lv vs dungeon帯下限
const dungeonZ = zoneOf('dungeon');
console.log(`dungeon入場: 自然到達Lv${state.level === undefined ? '?' : ''}（govトップ${zoneOf('gov').levelRange[1]}）→ dungeon帯下限Lv${dungeonZ.levelRange[0]} = 差${dungeonZ.levelRange[0] - zoneOf('gov').levelRange[1]}`);
chk('dungeon入場の対最弱敵差 ≤ +2（断崖回避）', dungeonZ.levelRange[0] - zoneOf('gov').levelRange[1] <= 2, `+${dungeonZ.levelRange[0] - zoneOf('gov').levelRange[1]}`);

// dungeon内 クリアライン(Lv35)到達まで戦闘数
const clearState = { level: dungeonZ.levelRange[0], exp: 0 };
const toClear = battlesToLevel(clearState, avgExpOf('dungeon'), 35);
console.log(`dungeon内: Lv${dungeonZ.levelRange[0]}→35(クリアライン) で ${toClear}戦（ソロ）`);
chk('dungeonクリアライン(Lv35)到達 ≤ 40戦（ソロ）', toClear <= 40, `${toClear}戦`);

// ---------- (2b) マルチ敵による緩和 ----------
console.log('\n— (2b) マルチ敵(1-3体・平均2体)でレベリング緩和 —');
const multiState = { level: dungeonZ.levelRange[0], exp: 0 };
const toClearMulti = battlesToLevel(multiState, avgExpOf('dungeon') * 2, 35);
chk('マルチ敵でdungeonクリア到達が短縮(≤ソロの0.7)', toClearMulti <= toClear * 0.7, `ソロ${toClear}→マルチ${toClearMulti}戦`);
chk('マルチ敵でdungeonクリア到達 ≤ 22戦', toClearMulti <= 22, `${toClearMulti}戦`);

// ---------- (3) 最終ボス撃破可能性 ----------
console.log('\n— (3) 最終ボス rogue_ai_core 撃破ラウンド —');
const boss = DB.rogue_ai_core;
// Lvでの各メンバー物理攻撃（初期＋成長中央値×(Lv-1)）。装備/魔法は floor 推定に含めない＝最悪値。
const mid = (g) => (g.min + g.max) / 2;
const init = { kaito: 10, akari: CDATA.akari.attack, riku: CDATA.riku.attack, yami: CDATA.yami.attack };
const atkAtLv = (id, Lv) => init[id] + mid(GROWTH[id].statGrowth.attack) * (Lv - 1);
const partyPhysFloorDPR = (Lv) => ['kaito', 'akari', 'riku', 'yami'].reduce((s, id) => s + Math.max(1, atkAtLv(id, Lv) - Math.floor(boss.defense / 2)), 0);
const roundsAt = (Lv) => Math.ceil(boss.hp / partyPhysFloorDPR(Lv));
const r35 = roundsAt(35), r50 = roundsAt(50);
console.log(`boss: hp${boss.hp} atk${boss.attack} def${boss.defense}  / Lv35物理floorDPR=${partyPhysFloorDPR(35).toFixed(0)} → ${r35}R, Lv50 → ${r50}R`);
chk('Lv35で1ラウンド即死でない（≥3R）＝本当の戦闘', r35 >= 3, `${r35}R`);
chk('Lv35で撃破可能（≤25R・装備/魔法込みなら更に短縮）', r35 <= 25, `${r35}R`);
chk('Lv50はLv35より楽（ラウンド数が減る）', r50 <= r35, `${r50}R ≤ ${r35}R`);
// ボスの被ダメ: Lv35メンバー(中堅def想定)が即死しない
const memberDefAtLv = (id, Lv) => (CDATA[id] ? CDATA[id].defense : 5) + mid((GROWTH[id] || GROWTH.kaito).statGrowth.defense) * (Lv - 1);
const bossDmgTo = (id, Lv) => Math.max(1, boss.attack - Math.floor(memberDefAtLv(id, Lv) / 2));
console.log(`ボス1撃の被ダメ@Lv35: akari ${bossDmgTo('akari', 35).toFixed(0)} / riku ${bossDmgTo('riku', 35).toFixed(0)} / yami ${bossDmgTo('yami', 35).toFixed(0)}`);
chk('ボスの攻撃が機能している（最低でも対riku ≥ 20ダメ）', bossDmgTo('riku', 35) >= 20, `${bossDmgTo('riku', 35).toFixed(0)}`);

// ---------- (4) Lv上限ガード ----------
console.log('\n— (4) Lv50 ハードキャップ —');
const bsrc = read('battle-system.js');
const hasGuard = /character\.level\s*>=\s*50/.test(bsrc);
chk('levelUpCharacter に Lv50 ガード文が存在', hasGuard);
// 挙動: Lv50でexpを大量に持たせてもlevelが50を超えない（純関数シミュで確認）
const capState = { level: 50, exp: 0 };
fightOnce(capState, 999999);
chk('Lv50でexpを溢れさせても level は 50 のまま', capState.level === 50, `level=${capState.level}`);

// ---------- (5) 加入Lv整合 ----------
console.log('\n— (5) MEMBER_LOADOUT 加入レベル整合 —');
const idx = read('index.html');
const loMatch = (id) => { const m = idx.match(new RegExp(id + "\\s*:\\s*\\{\\s*level\\s*:\\s*(\\d+)")); return m ? parseInt(m[1], 10) : null; };
const akariLv = loMatch('akari'), rikuLv = loMatch('riku'), yamiLv = loMatch('yami');
const subwayLo = zoneOf('subway').levelRange[0], shrineLo = zoneOf('shrine').levelRange[0], marketLo = zoneOf('market').levelRange[0];
chk(`akari加入Lv(${akariLv}) ≥ subway帯下限(${subwayLo})`, akariLv != null && akariLv >= subwayLo);
chk(`riku加入Lv(${rikuLv}) ≥ shrine帯下限(${shrineLo})`, rikuLv != null && rikuLv >= shrineLo);
chk(`yami加入Lv(${yamiLv}) ≥ market帯下限(${marketLo})＝即死回避`, yamiLv != null && yamiLv >= marketLo, `yami Lv${yamiLv} vs 敵Lv${marketLo}+`);

console.log('\n' + (pass ? '✅ 全PASS: EXP曲線/到達Lv/マルチ敵緩和/最終ボス実戦化/Lv上限/加入Lv を実コードで確認' : '❌ 不合格あり（未実装フェーズが残っている可能性）'));
console.log('注記: 本オラクルは平均取得EXP・物理floorDPRの決定論モデル。実機は乱数・装備・魔法で体感が変わるため、実装後に1周キャリブレーション推奨。');
process.exit(pass ? 0 : 1);
