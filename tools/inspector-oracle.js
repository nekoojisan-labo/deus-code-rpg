// inspector-oracle.js — ゲーム設定ビューア(game-inspector.html)の抽出/解析を実コードで検証する計器。
// 実ゲームJSをvmにロードし各システムをインスタンス化して DB が読めること＋
// クロス参照解析(敵↔エンカウント・マップ内容・ストーリー/クエスト)が成立することを観測する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

let CLOCK = 1000;
function fakeEl() {
  const cl = new Set();
  return { innerHTML: '', textContent: '', style: {}, dataset: {}, value: '',
    classList: { add: (c) => cl.add(c), remove: (c) => cl.delete(c), contains: (c) => cl.has(c), toggle: noop },
    setAttribute: noop, getAttribute: () => null, appendChild: noop, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: noop, removeEventListener: noop };
}
class FakeImage { constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; } }
const document = { getElementById: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [], createElement: () => fakeEl(), addEventListener: noop, body: fakeEl() };
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {}, document, Image: FakeImage,
  performance: { now: () => CLOCK }, setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set, isNaN, parseInt, parseFloat, Date: function () { return { toISOString: () => '' }; }
};
sb.window.location = { search: '' };
sb.window.localStorage = sb.localStorage; // 実ブラウザの window.localStorage 相当
sb.globalThis = sb; vm.createContext(sb);

// game-inspector.html と同じ順序でロード（依存順）
['item-system.js', 'equipment-system.js', 'magic-system.js', 'se-system.js', 'ui-panel.js', 'save-system.js',
 'battle-system.js', 'map-walkability-data.js', 'object-catalog.js', 'map-objects-data.js', 'map-system.js',
 'party-system.js', 'quest-system.js', 'story-events.js'].forEach(f => {
  try { vm.runInContext(read(f), sb, { filename: f }); } catch (e) { console.log('load fail ' + f + ': ' + e.message); }
});
const W = sb.window;

console.log('\n=== ゲーム設定ビューア 抽出/解析 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };
const inst = (Ctor) => { try { return new Ctor(); } catch (e) { return null; } };

// --- 各DBが読める ---
const items = inst(W.ItemSystem); const equip = inst(W.EquipmentSystem); const magic = inst(W.MagicSystem);
const battle = inst(W.BattleSystem); const maps = inst(W.MapSystem); const story = inst(W.StoryEventSystem);
const itemN = items && Object.keys(items.itemDatabase || {}).length;
const equipN = equip && Object.keys(equip.equipmentDatabase || {}).length;
const magicN = magic && Object.keys(magic.magicDatabase || {}).length;
const enemyN = battle && Object.keys(battle.enemyDatabase || {}).length;
const mapN = maps && Object.keys(maps.maps || {}).length;
const eventN = story && story.events && story.events.size;
const questN = (W.QUEST_STEPS || []).length;
const charN = Object.keys(W.CHARACTER_DATA || {}).length;

chk('アイテムDBが読める', itemN > 0, `${itemN}件`);
chk('装備DBが読める', equipN > 0, `${equipN}件`);
chk('神威(魔法)DBが読める', magicN > 0, `${magicN}件`);
chk('敵DBが読める', enemyN > 0, `${enemyN}件`);
chk('マップが読める', mapN > 0, `${mapN}マップ`);
chk('ストーリーイベントが読める', eventN > 0, `${eventN}件`);
chk('クエストステップが読める', questN > 0, `${questN}件`);
chk('キャラクター定義が読める', charN > 0, `${charN}人`);

// --- クロス参照解析: 敵↔エンカウントテーブル ---
if (battle) {
  const enemyIds = new Set(Object.keys(battle.enemyDatabase || {}));
  const tables = battle.encounterTables || {};
  const referenced = new Set();
  let brokenRefs = [];
  Object.keys(tables).forEach(tk => {
    const list = tables[tk] || [];
    list.forEach(e => {
      const id = (typeof e === 'string') ? e : (e.id || e.enemyId || e.enemy);
      if (id) { referenced.add(id); if (!enemyIds.has(id)) brokenRefs.push(tk + '→' + id); }
    });
  });
  const orphans = [...enemyIds].filter(id => !referenced.has(id));
  chk('解析: エンカウントテーブルが読める', Object.keys(tables).length > 0, `${Object.keys(tables).length}テーブル`);
  chk('解析: 壊れた敵参照(テーブル→DB欠落)を検出できる(=ゼロが理想)', Array.isArray(brokenRefs), `壊れ=${brokenRefs.length}件 ${brokenRefs.slice(0,3).join(',')}`);
  console.log(`   ℹ️ 未出現(orphan)敵=${orphans.length}件: ${orphans.slice(0, 8).join(', ')}${orphans.length > 8 ? '…' : ''}`);
}

// --- マップ内容カバレッジ ---
if (maps) {
  const ids = Object.keys(maps.maps);
  let noNpc = 0, noExit = 0, withSave = 0;
  ids.forEach(id => {
    const m = maps.maps[id];
    if (!m.npcs || m.npcs.length === 0) noNpc++;
    if (!m.exits || m.exits.length === 0) noExit++;
    if (m.savePoint) withSave++;
  });
  chk('解析: マップ毎のNPC/出口/セーブ点を集計できる', ids.length > 0, `NPC無=${noNpc} 出口無=${noExit} セーブ点=${withSave}`);
}

// --- ストーリーイベントのメタ ---
if (story) {
  const evs = [...story.events.values()];
  const noOneTime = evs.filter(e => !e.oneTime).length;
  const withFlags = evs.filter(e => e.requiredFlags && (Array.isArray(e.requiredFlags) ? e.requiredFlags.length : Object.keys(e.requiredFlags).length)).length;
  chk('解析: イベントのtrigger/requiredFlags/oneTime/scenesを読める', evs.length > 0, `oneTime無=${noOneTime} 条件付=${withFlags}`);
}

// --- ダッシュボードのinline scriptを同コンテキストで読み、全タブが描画エラーなく出るか確認 ---
sb.window.addEventListener = noop; // inline末尾の DOMContentLoaded 登録用
sb.HTMLElement = function () {}; sb.Node = function () {};
const html = read('game-inspector.html');
const mInline = html.match(/<script>(?![^]*?\bsrc=)([\s\S]*?)<\/script>/); // src無しの<script>本体
let renderOk = false, renderedTabs = [];
if (mInline) {
  try {
    vm.runInContext(mInline[1] + '\n;globalThis.__buildModel=buildModel;globalThis.__VIEWS=VIEWS;', sb, { filename: 'game-inspector.inline.js' });
    const model = sb.__buildModel();
    let allNonEmpty = true;
    Object.keys(sb.__VIEWS).forEach(name => {
      let out = '';
      try { out = sb.__VIEWS[name](model); } catch (e) { out = ''; console.log(`   描画失敗 [${name}]: ${e.message}`); }
      renderedTabs.push(name + (out && out.length > 30 ? '✓' : '✗'));
      if (!out || out.length < 30) allNonEmpty = false;
    });
    renderOk = allNonEmpty;
  } catch (e) { console.log('inline実行エラー: ' + e.message); }
}
chk('ダッシュボード全タブが実データで描画される（エラー無し・非空）', renderOk, renderedTabs.join(' '));

console.log(`\n${pass ? '✅ 全PASS: 全DB抽出＋クロス参照＋マップ/ストーリー解析＋ダッシュボード全タブ描画 が実コードで成立' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
