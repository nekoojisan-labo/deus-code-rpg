// ui-frame-oracle.js — UIPanel の cfg.frame(FF風2ペイン master-detail)を検証。
//   (1) frame で 2ペインシェル(pane-l/pane-r/#ui-panel-detail)＋detailFor の初期描画
//   (2) 選択移動(↓)で右ペイン(#ui-panel-detail)だけ再描画＝master-detail
//   (3) setDetail で右ペイン差し替え
//   (4) 非frame(従来オーバーレイ)は frame マーカーを出さない＝回帰ゼロ
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const noop = () => {};
const fakeEl = new Proxy({ dataset: {}, style: {}, classList: { add: noop, remove: noop, contains: () => false }, appendChild: noop, querySelectorAll: () => [], setAttribute: noop }, { get: (t, k) => (k in t ? t[k] : noop), set: () => true });

function makeHost() {
  const detailEl = { _html: '', set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; }, querySelectorAll: () => [] };
  const listEl = { _html: '', set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; }, querySelectorAll: () => [], appendChild: noop, classList: { add: noop, remove: noop } };
  const host = {
    _html: '', set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    classList: { _s: new Set(), add(...c) { c.forEach(x => this._s.add(x)); }, remove(...c) { c.forEach(x => this._s.delete(x)); }, contains(c) { return this._s.has(c); } },
    querySelector(sel) { if (sel === '#ui-panel-detail') return detailEl; if (sel === '.ui-panel__list') return listEl; return null; },
  };
  host._detailEl = detailEl;
  return host;
}
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, document: { getElementById: () => null, createElement: () => fakeEl }, Math, JSON, Object, Array, Number, String, Boolean };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'ui-panel.js'), 'utf8'), sb, { filename: 'ui-panel.js' });
const UIPanel = sb.window.UIPanel;

let pass = true;
const chk = (l, c, e) => { console.log(`${c ? '✅' : '❌'} ${l}${e ? '  (' + e + ')' : ''}`); pass = pass && c; };
const key = (k) => ({ key: k, preventDefault: noop });

console.log('\n=== UIPanel frame(2ペイン)オラクル ===\n');

// (1) frame 初期描画
const host = makeHost();
const items = [
  { label: 'アイテムA', value: 'a' }, { label: 'アイテムB', value: 'b' }, { label: 'アイテムC', value: 'c' }
];
UIPanel.open({ host, frame: true, title: 'どうぐ', items, detailFor: (it) => `<div class="d">${it ? it.label : ''} の説明</div>`, footHtml: '<span class="lbl">所持金</span><span class="val">100G</span>' });
const h = host.innerHTML;
chk('frame: 2ペインシェル(ui-panel__frame)を描画', h.includes('ui-panel__frame'));
chk('frame: 左ペイン(pane-l)＋右ペイン(pane-r/#ui-panel-detail)', h.includes('ui-panel__pane-l') && h.includes('ui-panel__pane-r') && h.includes('id="ui-panel-detail"'));
chk('frame: detailFor で先頭項目の詳細を初期描画', h.includes('アイテムA の説明'), 'detail@open');
chk('frame: footHtml(所持金)を描画', h.includes('100G'));
chk('frame: host に ui-panel--frame クラス', host.classList.contains('ui-panel--frame'));

// (2) ↓で右ペインだけ再描画（master-detail）
UIPanel.handleKey(key('ArrowDown'));
chk('選択↓で右ペインが項目Bの詳細へ更新', host._detailEl.innerHTML.includes('アイテムB の説明'), `=${host._detailEl.innerHTML}`);
chk('左リストの再構築はしない(host.innerHTML不変=ちらつき無し)', host.innerHTML === h);
UIPanel.handleKey(key('ArrowDown'));
chk('さらに↓で項目Cの詳細へ', host._detailEl.innerHTML.includes('アイテムC の説明'));

// (3) setDetail で手動差し替え
UIPanel.setDetail('<div>対象を えらぶ</div>');
chk('setDetail で右ペインを差し替え', host._detailEl.innerHTML.includes('対象を えらぶ'));
UIPanel.close();

// (4) 非frame 回帰（従来オーバーレイ）
const host2 = makeHost();
UIPanel.open({ host: host2, title: 'メニュー', items: [{ label: 'X' }], onCancel: noop });
chk('非frame: frameマーカーを出さない(回帰ゼロ)', !host2.innerHTML.includes('ui-panel__frame') && !host2.classList.contains('ui-panel--frame'));
chk('非frame: 通常シェル(.ui-panel__list)を描画', host2.innerHTML.includes('ui-panel__list'));
UIPanel.close();

console.log('\n' + (pass ? '✅ 全PASS: cfg.frame の2ペイン描画/選択追従/手動差し替え/非frame回帰 を確認'
  : '❌ 不合格あり'));
process.exit(pass ? 0 : 1);
