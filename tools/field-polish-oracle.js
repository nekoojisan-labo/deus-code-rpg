// field-polish-oracle.js — フィールドの細かな不具合の直しを、実コードで確かめる計器。
//   F1 暴走ドローン: ボスでもドローンの絵は「浮く」動き（伸び縮みしない）
//   F2 銀行: 中央カウンターを素通りできない／銀行員が入口から出口への通り道に立たない／話しかけられる
//   F3 地下トンネル2〜4（同じ絵）: 絵の外の黒い所を歩けない
//   F4 S キー: セーブポイントの近くで S（下へ移動）を押してもセーブ画面が開かず、下へ歩く
//   F5 セーブ: セーブポイントの近くで「話す」キー（checkInteractions）を押すとセーブ画面が開く
//   F6 壁ずり: 斜めに壁へ当たった時、動ける方の向きだけ進む
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const html = read('index.html');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && !!cond; };

function grabFunction(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('index.html に ' + name + ' が無い');
  let i = html.indexOf('{', start), depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

const fakeEl = () => ({ style: {}, dataset: {}, textContent: '', innerHTML: '', classList: { add: noop, remove: noop, contains: () => false, toggle: noop }, appendChild: noop, remove: noop, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, setAttribute: noop, getAttribute: () => null });
const sb = { console: { log: noop, warn: noop, error: noop }, window: { location: { search: '' } }, document: { getElementById: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [], createElement: fakeEl, addEventListener: noop, body: fakeEl() }, Image: class { set src(_) {} set onload(_) {} set onerror(_) {} }, performance: { now: () => 1000 }, setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop, localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, Math, JSON, Object, Array, Number, String, Boolean, Date, Map, Set, URLSearchParams };
sb.window.localStorage = sb.localStorage; sb.globalThis = sb;
vm.createContext(sb);
['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js', 'battle-system.js'].forEach((f) => vm.runInContext(read(f), sb, { filename: f }));
const ms = new sb.window.MapSystem();
const BS = vm.runInContext('typeof BattleSystem !== "undefined" ? BattleSystem : window.BattleSystem', sb);
const battleSystem = new BS();

console.log('\n=== フィールドの細かな直し 計器 ===\n');

// ---- F1 暴走ドローン ----
{
  // index.html が setHoverSpritePaths に渡す式をそのまま評価する
  const m = html.match(/mapSystem\.setHoverSpritePaths\(([\s\S]*?\)\));\s*\n/);
  if (!m) throw new Error('index.html の setHoverSpritePaths 呼び出しが見つからない');
  const paths = new Function('battleSystem', 'return ' + m[1].replace(/\)\s*$/, ''))(battleSystem);
  ms.setHoverSpritePaths(paths);
  const drone = { name: '暴走ドローン', hostile: true, x: 400, y: 245 };
  const sprite = ms.npcImagePaths ? ms.npcImagePaths['暴走ドローン'] : 'assets/enemies/enemy_corrupted_drone.png';
  const kind = ms.getNPCAmbientKind(drone, sprite || 'assets/enemies/enemy_corrupted_drone.png');
  chk('F1 暴走ドローン（ボス）は浮く動き', kind === 'hover', `kind=${kind}`);
  chk('F1 ドローン以外の敵は今まで通り伸び縮み', ms.getNPCAmbientKind({ hostile: true }, 'assets/enemies/enemy_shadow_entity.png') === 'breathe');
}

// ---- F2 銀行 ----
{
  const id = 'shop_bank';
  const m = ms.maps[id];
  const s = m.worldScale || 1;
  const W = (x, y) => ms.isMapPositionWalkable(m, x * s, y * s, 24);
  const counter = [[300, 250], [400, 250], [500, 250], [400, 285]];
  chk('F2 中央カウンターの上を歩けない', counter.every(([x, y]) => !W(x, y)), counter.filter(([x, y]) => W(x, y)).join(' / '));
  const back = [[300, 120], [400, 130], [500, 120]];
  chk('F2 奥のカウンターの上を歩けない', back.every(([x, y]) => !W(x, y)), back.filter(([x, y]) => W(x, y)).join(' / '));
  const floor = [[400, 330], [150, 250], [620, 250], [400, 190]];
  chk('F2 カウンターの前・左右・奥の床は歩ける', floor.every(([x, y]) => W(x, y)), floor.filter(([x, y]) => !W(x, y)).join(' / '));
  const teller = m.npcs.find((n) => n.name === '銀行員');
  const tx = teller.x / s, ty = teller.y / s;
  // 到着点 (400,380) から出口 (350-450, 410-450) と、到着点から真上の通り道（x 340〜460）に立たない
  chk('F2 銀行員が入口からまっすぐの通り道に立たない', tx < 340 || tx > 460, `銀行員 ${Math.round(tx)},${Math.round(ty)}`);
  let talk = false;
  for (let dx = -40; dx <= 40 && !talk; dx += 4) for (let dy = -40; dy <= 40 && !talk; dy += 4) {
    const px = teller.x + dx, py = teller.y + dy;
    if (Math.hypot(dx, dy) < 50 && ms.isMapPositionWalkable(m, px, py, 24)) talk = true;
  }
  chk('F2 銀行員に話しかけられる位置がある', talk);
}

// ---- F3 地下トンネル2〜4 ----
{
  const offArt = [[60, 110], [80, 140], [750, 105], [40, 268], [770, 268], [490, 430], [515, 405]];
  for (const id of ['deep_tunnel_2', 'deep_tunnel_3', 'deep_tunnel_4']) {
    const m = ms.maps[id], s = m.worldScale || 1;
    const bad = offArt.filter(([x, y]) => ms.isMapPositionWalkable(m, x * s, y * s, 24));
    chk(`F3 ${id}: 絵の外の黒い所を歩けない`, bad.length === 0, bad.join(' / '));
    const keep = [[400, 300], [410, 400]];
    const lost = keep.filter(([x, y]) => !ms.isMapPositionWalkable(m, x * s, y * s, 24));
    chk(`F3 ${id}: 通路と南の階段は歩ける`, lost.length === 0, lost.join(' / '));
  }
}

// ---- F4〜F6 updatePlayer / checkInteractions ----
function makePlayerEnv(blocked) {
  const calls = { save: 0 };
  const stubMs = {
    transitioning: false, updateApproachNPCs: () => null,
    getMapBounds: () => ({ width: 2000, height: 2000 }), noteMoveInput: noop, advanceAnimTime: noop,
    checkCollision: (x, y) => blocked(x, y), checkMapTransition: () => null, checkAutoEnterAhead: () => null,
    getCurrentArea: () => 'town', getEncounterRate: () => 'none',
    checkNPCInteraction: () => null, checkTreasureInteraction: () => null, checkMapEntranceInteraction: () => null
  };
  const env = {
    window: { isGameOver: false }, keys: {}, player: { x: 500, y: 500, facing: 'down', stepCount: 0 },
    mapSystem: stubMs, battleSystem: { inBattle: false, countStep: noop, encounterSteps: 0, encounterThreshold: 999 },
    gameStarted: true, isMessageShown: false, storyFlags: {}, storyEventSystem: null,
    document: { getElementById: () => fakeEl() }, console: { log: noop },
    handleApproachConversation: noop, checkInteractions: noop, runMapTransition: noop, noticeLockedExit: noop,
    checkSavePoint: () => true, openSaveScreen: () => { calls.save++; }, showMessage: noop, Math, Object
  };
  const src = ['updatePlayer', 'checkExitAt', 'checkAutoEnter'].map(grabFunction).join('\n');
  const fns = new Function('env', 'with (env) {\nlet lastLockedNoticeExit = null;\n' + src + '\nreturn { updatePlayer };\n}')(env);
  return { env, calls, fns };
}
{
  // F4: セーブポイントの近くで S を押す → 開かず、下へ歩く
  const { env, calls, fns } = makePlayerEnv(() => false);
  env.keys.s = true;
  const y0 = env.player.y;
  fns.updatePlayer();
  chk('F4 S キーではセーブ画面が開かない', calls.save === 0, `開いた回数 ${calls.save}`);
  chk('F4 S キーで下へ歩く', env.player.y > y0, `y ${y0}→${env.player.y}`);
}
{
  // F5: 話すキー → checkInteractions がセーブ画面を開く
  const calls = { save: 0, talk: 0 };
  let npcNear = null;
  const env = {
    window: {}, battleSystem: { justEndedBattle: false }, player: { x: 400, y: 340 }, storyFlags: {}, storyEventSystem: null,
    mapSystem: { currentMap: 'inn', maps: { inn: { savePoint: { x: 400, y: 350 } } },
      checkNPCInteraction: () => npcNear, checkTreasureInteraction: () => null, checkMapEntranceInteraction: () => null },
    checkSavePoint: () => true, openSaveScreen: () => { calls.save++; }, runMapTransition: noop,
    showMessage: () => { calls.talk++; }, Math
  };
  const fns = new Function('env', 'with (env) {\n' + grabFunction('checkInteractions') + '\nreturn { checkInteractions };\n}')(env);
  fns.checkInteractions();
  chk('F5 セーブポイントの近くで話すキーを押すとセーブ画面が開く', calls.save === 1, `開いた回数 ${calls.save}`);
  // 宿屋のようにセーブポイント(400,350)と人(400,292)が両方近い時は、近い方
  npcNear = { name: '宿屋の主人', x: 400, y: 292, dialogue: 'いらっしゃい' };
  env.player.y = 340; calls.save = 0; calls.talk = 0;
  fns.checkInteractions();
  chk('F5 セーブポイントの方が近ければ、人が近くてもセーブ画面が開く', calls.save === 1 && calls.talk === 0, `save=${calls.save} talk=${calls.talk}`);
  env.player.y = 300; calls.save = 0;
  try { fns.checkInteractions(); } catch (_) { /* 会話の先は計器の対象外 */ }
  chk('F5 人の方が近ければ、会話が先（セーブ画面は開かない）', calls.save === 0);
  npcNear = null; env.player.y = 340;
  env.checkSavePoint = () => false; calls.save = 0;
  fns.checkInteractions();
  chk('F5 セーブポイントから離れていれば開かない', calls.save === 0);
  chk('F5 操作説明に「S: セーブ」が残っていない', !/S:\s*セーブ/.test(html));
}
{
  // F6: x>510 が壁。右下へ押すと、右には進めないが下へは滑る
  const { env, fns } = makePlayerEnv((x) => x > 510);
  env.player.x = 509; env.player.y = 500;
  env.keys.ArrowRight = true; env.keys.ArrowDown = true;
  fns.updatePlayer();
  chk('F6 斜めに壁へ当たると、動ける縦向きへ滑る', env.player.y > 500 && env.player.x <= 510, `${env.player.x},${env.player.y}`);
  chk('F6 滑った時は歩いている扱い', env.player.isMoving === true);
  // 両方塞がれていれば動かない
  const b = makePlayerEnv(() => true);
  b.env.keys.ArrowRight = true; b.env.keys.ArrowDown = true;
  b.fns.updatePlayer();
  chk('F6 どちらも塞がれていれば動かない', b.env.player.x === 500 && b.env.player.y === 500 && !b.env.player.isMoving);
}

console.log(`\n${pass ? '✅ 全PASS' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
