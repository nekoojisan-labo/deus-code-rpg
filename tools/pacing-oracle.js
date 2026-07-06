// pacing-oracle.js — steady-drip 再配置の検証（NPC配置・ボス隠蔽ゲート・闇市/都庁ゲート）
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

// 2) リク: 現行設計ではバイオドームで堕神戦に参加する
chk('リクが subway_concourse_a に居ない', !npcNames('subway_concourse_a').includes('リク'));
chk('リクが biodome_gate に居る（第2章・堕神戦前）', npcNames('biodome_gate').includes('リク'));

// 3) 駅のパトロールドローンが非hostile（アカリ加入前の強制戦を回避）
const stationDrone = (msys.maps['shinjuku_station_gate'].npcs || []).find(n => n.name === 'パトロールドローン');
chk('駅のパトロールドローンが非hostile（演出のみ）', stationDrone && !stationDrone.hostile);

// 4) 暴走ドローン(ボス)はリク加入まで非表示
const boss = (msys.maps['subway_concourse_a'].npcs || []).find(n => n.name === '暴走ドローン');
chk('ボス: アカリ再会前は非表示（単騎で街を体感する間は出さない）', msys.isNPCHidden(boss, {}) === true);
chk('ボス: アカリ再会後(単騎で地下鉄入り)は表示→Ωでアカリ乱入加入', msys.isNPCHidden(boss, { akariReunited: true }) === false);
chk('ボス: 撃破後は非表示', msys.isNPCHidden(boss, { akariReunited: true, bossDefeated: true }) === true);

// 5) 闇市ゲートが rikuJoined（metPriest単独では開かない）
const sss = msys.maps['shopping_street_south'];
const bmExit = (sss.exits || []).find(e => msys.normalizeMapId(e.to) === 'black_market_entrance');
chk('闇市ゲートが requiredFlag=rikuJoined', bmExit && bmExit.requiredFlag === 'rikuJoined');

// 5b) 都庁ゲートはヤミ正式加入後に開く（現行仕様では闇市内の処刑機戦後に yamiJoined）
const govExit = (msys.maps['shinjuku_center_plaza'].exits || []).find(e => msys.normalizeMapId(e.to) === 'tokyo_gov_approach');
chk('都庁ゲートが requiredFlag=yamiJoined', govExit && govExit.requiredFlag === 'yamiJoined');

// 6) APPROACH にアカリ（駆け寄り型）— evalExitGate 経由で間接確認の代わりに updateApproachNPCs を実行
msys.currentMap = 'shinjuku_station_gate';
const ak = (msys.maps['shinjuku_station_gate'].npcs || []).find(n => n.name === 'アカリ');
// TRIGGER距離→REACH距離の2段で駆け寄り→到達returnを確認
msys.updateApproachNPCs(ak.x + 100, ak.y, {});          // _approaching を立てる
const reached = msys.updateApproachNPCs(ak.x, ak.y, {}); // 到達でnpc返却
chk('アカリが駆け寄り型（到達でengageトリガー）', reached && reached.name === 'アカリ');

console.log(`\n${pass ? '✅ 全PASS: アカリ=駅/リク=バイオドーム/ボス=アカリ再会まで封鎖/闇市=rikuJoined/都庁=yamiJoined/駅ドローン非hostile' : '❌ 不合格あり'}`);
