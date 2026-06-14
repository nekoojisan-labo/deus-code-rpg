// pacing-oracle.js — steady-drip 再配置の検証（NPC配置・ボス隠蔽ゲート・闇市ゲート）
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
const npcNames = (id) => (msys.maps[id] && msys.maps[id].npcs || []).map(n => n.name);

console.log('\n=== steady-drip 再配置オラクル ===\n');
let pass = true;
const chk = (label, cond) => { console.log(`${cond ? '✅' : '❌'} ${label}`); pass = pass && cond; };

// 1) アカリ: plaza から消え、station_gate に居る
chk('アカリが開始マップ shinjuku_center_plaza に居ない（スポーン至近を解消）', !npcNames('shinjuku_center_plaza').includes('アカリ'));
chk('アカリが shinjuku_station_gate に居る（駅で出会う）', npcNames('shinjuku_station_gate').includes('アカリ'));

// 2) リク: biodome から消え、subway に居る
chk('リクが biodome_gate に居ない', !npcNames('biodome_gate').includes('リク'));
chk('リクが subway_concourse_a に居る（第1章ボス手前）', npcNames('subway_concourse_a').includes('リク'));

// 3) 駅のパトロールドローンが非hostile（アカリ加入前の強制戦を回避）
const stationDrone = (msys.maps['shinjuku_station_gate'].npcs || []).find(n => n.name === 'パトロールドローン');
chk('駅のパトロールドローンが非hostile（演出のみ）', stationDrone && !stationDrone.hostile);

// 4) 暴走ドローン(ボス)はリク加入まで非表示
const boss = (msys.maps['subway_concourse_a'].npcs || []).find(n => n.name === '暴走ドローン');
chk('ボス: リク未加入では非表示（壁無し150ボス封じ）', msys.isNPCHidden(boss, {}) === true);
chk('ボス: リク加入後は表示', msys.isNPCHidden(boss, { rikuJoined: true }) === false);
chk('ボス: 撃破後は非表示', msys.isNPCHidden(boss, { rikuJoined: true, bossDefeated: true }) === true);

// 5) 闇市ゲートが rikuJoined（metPriest単独では開かない）
const sss = msys.maps['shopping_street_south'];
const bmExit = (sss.exits || []).find(e => msys.normalizeMapId(e.to) === 'black_market_entrance');
chk('闇市ゲートが requiredFlag=rikuJoined', bmExit && bmExit.requiredFlag === 'rikuJoined');

// 5b) 都庁ゲートが yamiPactMade（仮契約で開く＝二段加入の鶏卵soft-lockを回避。yamiJoinedだと入場前に立たず詰む）
const govExit = (msys.maps['shinjuku_center_plaza'].exits || []).find(e => msys.normalizeMapId(e.to) === 'tokyo_gov_approach');
chk('都庁ゲートが requiredFlag=yamiPactMade（soft-lock回避）', govExit && govExit.requiredFlag === 'yamiPactMade');

// 6) APPROACH にアカリ（駆け寄り型）— evalExitGate 経由で間接確認の代わりに updateApproachNPCs を実行
msys.currentMap = 'shinjuku_station_gate';
const ak = (msys.maps['shinjuku_station_gate'].npcs || []).find(n => n.name === 'アカリ');
// TRIGGER距離→REACH距離の2段で駆け寄り→到達returnを確認
msys.updateApproachNPCs(ak.x + 100, ak.y, {});          // _approaching を立てる
const reached = msys.updateApproachNPCs(ak.x, ak.y, {}); // 到達でnpc返却
chk('アカリが駆け寄り型（到達でengageトリガー）', reached && reached.name === 'アカリ');

console.log(`\n${pass ? '✅ 全PASS: アカリ=駅/リク=地下鉄ボス手前/ボス=リク加入まで封鎖/闇市=rikuJoinedゲート/駅ドローン非hostile' : '❌ 不合格あり'}`);
