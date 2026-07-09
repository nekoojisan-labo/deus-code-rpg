// vn-portrait-oracle.js — VN会話の「話者＝キャラグラ」一致を実コードで検証する計器。
// 旧バグ: 立ち絵が固定2スロット(左kaito/右=最初の非kaito)で、3人目(ヤミ)が話しても右に
// 前の人(アカリ)が残り話者とズレた。修正: assignSpeakerSlotで右を現在の非kaito話者へ動的追従。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

function fakeEl() {
  const cl = new Set();
  const el = {
    _src: '', _attrs: {},
    set src(v) { this._src = v; }, get src() { return this._src; },
    set innerHTML(v) {}, get innerHTML() { return ''; },
    textContent: '', style: {}, dataset: {}, children: [],
    classList: {
      add: (...c) => c.forEach(x => cl.add(x)), remove: (...c) => c.forEach(x => cl.delete(x)),
      contains: (c) => cl.has(c), toggle: (c, on) => { const has = (on === undefined) ? !cl.has(c) : on; if (has) cl.add(c); else cl.delete(c); }
    },
    setAttribute: (k, v) => { el._attrs[k] = v; }, getAttribute: (k) => el._attrs[k] || null,
    removeAttribute: (k) => { delete el._attrs[k]; el._src = ''; },
    appendChild: noop, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop
  };
  return el;
}
const els = {};
const document = { getElementById: (id) => (els[id] = els[id] || fakeEl()), querySelector: () => null, createElement: () => fakeEl(), addEventListener: noop, body: fakeEl() };
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, document, setTimeout: noop, clearTimeout: noop, setInterval: () => 0, clearInterval: noop, Math, JSON, Object, Array, Number, String, Boolean, Map, Set, Date: function () { return { toISOString: () => '' }; } };
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('story-events.js'), sb, { filename: 'story-events.js' });

const sys = new sb.window.StoryEventSystem();
const L = sys.vnLeft, R = sys.vnRight;
const speak = (name) => { sys.revealPortraitFor(name); sys.updateSpeaker(name); };
// 今“喋っている”として強調されている立ち絵のキー(srcから判定)
const speakingKey = () => {
  const pick = (el) => el.classList.contains('speaking') ? (String(el.src).match(/([a-z]+)_bust/) || [])[1] : null;
  return pick(L) || pick(R);
};

console.log('\n=== VN 話者＝キャラグラ 一致 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// 3人(カイト/アカリ/ヤミ)が登場するイベント
sys.setupPortraits({ scenes: [{ character: 'カイト' }, { character: 'アカリ' }, { character: 'ヤミ' }] });

speak('カイト');
chk('カイトが話す→強調される立ち絵=kaito（左）', speakingKey() === 'kaito' && sys.vnLeftKey === 'kaito', `speaking=${speakingKey()}`);

speak('アカリ');
chk('アカリが話す→強調=akari（右）・カイトは非強調', speakingKey() === 'akari' && sys.vnRightKey === 'akari' && !L.classList.contains('speaking'));

speak('ヤミ');
chk('★ヤミが話す→強調=yami（右が差し替わる・アカリのまま残らない）', speakingKey() === 'yami' && sys.vnRightKey === 'yami', `speaking=${speakingKey()} / right=${sys.vnRightKey}`);
chk('ヤミ発話時、画面に出ている話者立ち絵はヤミ本人（話者とキャラグラ一致）', String(R.src).indexOf('yami_bust') >= 0);

speak('カイト');
chk('再びカイトが話す→強調=kaito（左に戻る）・右は非強調', speakingKey() === 'kaito' && !R.classList.contains('speaking'));

// 立ち絵無しイベント(NPC/ナレ)は非表示
sys.setupPortraits({ scenes: [{ character: '老神主' }, { character: '' }] });
chk('立ち絵キーの無いイベントはポートレート非表示', !sys.vnPortraits.classList.contains('active'));

// カイト不在(アカリ↔リクの会話)でも話者が出る
sys.setupPortraits({ scenes: [{ character: 'アカリ' }, { character: 'リク' }] });
speak('アカリ'); chk('カイト不在: アカリが先に話す→左に出て強調', speakingKey() === 'akari');
speak('リク'); chk('カイト不在: リクが話す→出て強調（話者一致）', speakingKey() === 'riku');

console.log(`\n${pass ? '✅ 全PASS: 3人以上でも話者の立ち絵が動的追従し、話者とキャラグラが常に一致 を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
