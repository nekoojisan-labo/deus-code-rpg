// akari-npc-check.js — アカリ加入手段の存在を実データで検証
// 開始マップにアカリNPCが居る／加入前は可視・加入後(akariJoined)に消える、を確認（soft-lock防止）
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
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const msys = new sb.window.MapSystem();

const startMap = msys.currentMap;
const map = msys.maps[startMap];
const akari = (map.npcs || []).find(n => n.name === 'アカリ');

console.log('\n=== アカリ加入手段チェック ===\n');
console.log(`開始マップ: ${startMap}`);
let pass = true;
const inStart = !!akari;
console.log(`開始マップにアカリNPC: ${inStart ? `✅ (${akari.x},${akari.y})` : '❌ 居ない=加入不能soft-lock'}`);
pass = pass && inStart;

if (akari) {
  const visibleAtStart = !msys.isNPCHidden(akari, {});               // 加入前=可視であるべき
  const hiddenAfterJoin = msys.isNPCHidden(akari, { akariJoined: true }); // 加入後=非表示であるべき
  const notHiddenByOldFlags = !msys.isNPCHidden(akari, { chapter1_started: true, metAkari: true }); // 旧フラグでは消えないこと
  console.log(`加入前(フラグ無し)に可視: ${visibleAtStart ? '✅' : '❌ 会う前に消える=soft-lock'}`);
  console.log(`加入後(akariJoined)に非表示: ${hiddenAfterJoin ? '✅' : '❌ 加入後も立ったまま'}`);
  console.log(`chapter1_started/metAkari だけでは消えない(分離OK): ${notHiddenByOldFlags ? '✅' : '❌ 旧条件が残存=会う前に消える'}`);
  pass = pass && visibleAtStart && hiddenAfterJoin && notHiddenByOldFlags;
}

console.log(`\n${pass ? '✅ PASS: 開始マップでアカリに会える→加入後に消える。chapter1_started では消えない(soft-lock回避)' : '❌ FAIL'}`);
