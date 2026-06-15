// ui-panel-oracle.js — 統一UI部品 UIPanel を実コードで検証する計器。
// 軽量だが本物に近いDOMスタブ(appendChild/classList/querySelectorAll/dataset)を用意し、
// (A)戦闘DOM契約の再現(.command-item+dataset.command+selected) (B)テキスト結合/エスケープ
// (C)オーバーレイ入力(矢印/WS・disabledスキップ・2列・決定/キャンセル・read-only) を観測する。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

function makeNode(tag) {
  const node = {
    tagName: tag || 'DIV', _children: [], _html: '', _cls: new Set(),
    dataset: {}, style: {}, textContent: '', onclick: null,
    scrollTop: 0, scrollHeight: 0, scrollIntoView: noop,
    appendChild(c) { this._children.push(c); return c; },
    set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get className() { return [...this._cls].join(' '); },
    set innerHTML(v) { this._html = v; if (v === '') this._children = []; },
    get innerHTML() { return this._html; },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    querySelectorAll(sel) {
      const cls = sel.replace(/^\./, '');
      const out = [];
      const walk = (n) => n._children.forEach(c => { if (c._cls && c._cls.has(cls)) out.push(c); walk(c); });
      walk(this);
      return out;
    }
  };
  node.classList = {
    add: (...cs) => cs.forEach(c => node._cls.add(c)),
    remove: (...cs) => cs.forEach(c => node._cls.delete(c)),
    contains: (c) => node._cls.has(c),
    toggle: (c, on) => { if (on === undefined ? node._cls.has(c) : !on) node._cls.delete(c); else node._cls.add(c); }
  };
  return node;
}

// host: render()が host.innerHTML=文字列 で list div を作る想定だが、文字列はパースしない。
// 代わりに querySelector('.ui-panel__list') が永続 listEl を返すようにし、renderList が実体に行を積む。
function makeHost() {
  const host = makeNode('DIV');
  const listEl = makeNode('DIV'); listEl._cls.add('ui-panel__list');
  const baseSet = host.innerHTML.bind ? null : null;
  Object.defineProperty(host, 'innerHTML', {
    set(v) { host._html = v; if (typeof v === 'string') listEl._children = []; },
    get() { return host._html; }
  });
  host.querySelector = (sel) => (sel.indexOf('ui-panel__list') >= 0 ? listEl : (listEl.querySelector(sel)));
  host._listEl = listEl;
  return host;
}

const sb = { console, window: {}, document: { createElement: (t) => makeNode(t), getElementById: () => null }, Math, JSON, Object, Array, String, Number, Boolean };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('ui-panel.js'), sb, { filename: 'ui-panel.js' });
const UIPanel = sb.window.UIPanel;

console.log('\n=== 統一UI部品 UIPanel 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// --- (A) 戦闘DOM契約: renderList が .command-item + dataset.command + selected を再現 ---
const battleBody = makeNode('DIV');
UIPanel.renderList(battleBody, [
  { label: 'たたかう', command: 'attack' },
  { label: 'スキル', command: 'skill' },
  { label: 'にげる', command: 'run' }
], { rowClass: 'command-item', selectedClass: 'selected', selectedIndex: 1, title: 'コマンド', titleClass: 'battle-cmd-title' });
const cmds = battleBody.querySelectorAll('.command-item');
chk('戦闘契約: .command-item が3件描画される', cmds.length === 3, `件数=${cmds.length}`);
chk('戦闘契約: dataset.command が保持される', cmds[0].dataset.command === 'attack' && cmds[2].dataset.command === 'run');
chk('戦闘契約: selectedIndex=1 の行に selected が付く', cmds[1]._cls.has('selected') && !cmds[0]._cls.has('selected'));
chk('戦闘契約: title要素(battle-cmd-title)が描画される', battleBody.querySelectorAll('.battle-cmd-title').length === 1);
UIPanel.setSelectedIndexIn(battleBody, 0, 'command-item', 'selected');
chk('戦闘契約: setSelectedIndexIn で選択が0行目へ移る', cmds[0]._cls.has('selected') && !cmds[1]._cls.has('selected'));

// --- (B) テキスト結合/エスケープ ---
const logBody = makeNode('DIV');
UIPanel.renderText(logBody, ['カイトの こうげき！', 'ケルベロスに 12の ダメージ！'], { join: '<br>', maxLines: 6, scrollBottom: true });
chk('テキスト: 行が <br> で結合される', logBody.innerHTML === 'カイトの こうげき！<br>ケルベロスに 12の ダメージ！');
const escBody = makeNode('DIV');
UIPanel.renderText(escBody, ['<script>&"'], {});
chk('テキスト: HTML特殊文字がエスケープされる', escBody.innerHTML === '&lt;script&gt;&amp;"', `out=${escBody.innerHTML}`);
const maxBody = makeNode('DIV');
UIPanel.renderText(maxBody, ['1', '2', '3', '4', '5', '6', '7', '8'], { join: '<br>', maxLines: 3 });
chk('テキスト: maxLines=3 で直近3行のみ', maxBody.innerHTML === '6<br>7<br>8');

// --- (C) オーバーレイ入力: 矢印/WS・disabledスキップ・決定/キャンセル ---
let selectedVal = null, cancelled = false;
const host = makeHost();
UIPanel.open({
  host, columns: 1,
  items: [
    { label: 'やくそう', value: 'herb' },
    { label: '（売切）', value: 'none', disabled: true },
    { label: 'エリクサー', value: 'elixir' }
  ],
  onSelect: (v) => { selectedVal = v; },
  onCancel: () => { cancelled = true; }
});
chk('オーバーレイ: open直後の選択は先頭(非disabled)', UIPanel.getSelectedIndex() === 0);
const key = (k) => UIPanel.handleKey({ key: k, preventDefault: noop });
key('ArrowDown');
chk('入力: ↓ で disabled(売切) を飛ばして index=2 へ', UIPanel.getSelectedIndex() === 2 && UIPanel.getSelectedValue() === 'elixir', `idx=${UIPanel.getSelectedIndex()}`);
key('w'); // 上（WSも効く）
chk('入力: w(上) で index=0 へ戻る（WS対応・disabledスキップ）', UIPanel.getSelectedIndex() === 0);
key('z'); // 決定
chk('入力: z 決定で onSelect(value) が発火', selectedVal === 'herb', `val=${selectedVal}`);
key('x'); // キャンセル
chk('入力: x キャンセルで onCancel が発火', cancelled === true);
UIPanel.close();

// disabled行は選択できない（setSelectedIndexでもクランプで回避＝決定対象にならない）
let selVal2 = null;
const host2 = makeHost();
UIPanel.open({ host: host2, items: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }], onSelect: v => { selVal2 = v; } });
UIPanel.setSelectedIndex(1); // disabledへ設定しようとしても…
chk('入力: setSelectedIndexはdisabledを回避（index=1にならず0へクランプ）', UIPanel.getSelectedIndex() === 0, `idx=${UIPanel.getSelectedIndex()}`);
key('z');
chk('入力: 決定で発火するのは選択可能行(A)のみ・disabled(B)は対象外', selVal2 === 'a');
UIPanel.close();

// 2列: ↓ は cols ぶん移動
const host3 = makeHost();
UIPanel.open({ host: host3, columns: 2, items: [{ label: 'a' }, { label: 'b' }, { label: 'c' }, { label: 'd' }] });
key('ArrowDown');
chk('入力: 2列パネルで ↓ は +2 移動', UIPanel.getSelectedIndex() === 2);
key('ArrowRight');
chk('入力: → は +1 移動', UIPanel.getSelectedIndex() === 3);
UIPanel.close();

// read-only(selectable:false): 移動しない・決定/キャンセル双方で閉じる
let roCloseCount = 0;
const host4 = makeHost();
UIPanel.open({ host: host4, selectable: false, bodyText: '読み物', items: [], onCancel: () => { roCloseCount++; } });
key('ArrowDown');
chk('入力: read-onlyは矢印で移動しない', UIPanel.getSelectedIndex() === 0);
key('z');
chk('入力: read-onlyは決定(z)でも閉じる(onCancel)', roCloseCount === 1);
key('x');
chk('入力: read-onlyはキャンセル(x)でも閉じる', roCloseCount === 2);
UIPanel.close();

chk('close後は isOpen()=false', UIPanel.isOpen() === false);

// ---------- bareモード: シェル無しでリストのみ描画（VN選択肢を既存コンテナへ埋め込む） ----------
let bareSel = null;
const hostB = makeHost();
UIPanel.open({ host: hostB, bare: true, selectable: true, items: [{ label: '人の心を取り戻す', value: 'a' }, { label: 'アークを壊す', value: 'b' }], onSelect: (v) => { bareSel = v; } });
chk('bare: シェル(head)を描画せずリストのみ', hostB.innerHTML.indexOf('ui-panel__head') < 0 && hostB.innerHTML.indexOf('ui-panel__list--bare') >= 0);
key('ArrowDown'); key('z');
chk('bare: 矢印選択＋Z決定でonSelectが発火（キーボード操作可＝スクロールバー不要で選べる）', bareSel === 'b');
UIPanel.close();

// ---------- ロード画面: 全スロット空→New Gameのみ選択可（SV3の核心不変条件） ----------
let pickedNewGame = false, pickedSlot = null;
const hostL = makeHost();
UIPanel.open({
  host: hostL, selectable: true,
  items: [
    { label: 'スロット1（空き）', value: { slot: 1, occupied: false }, disabled: true },
    { label: 'スロット2（空き）', value: { slot: 2, occupied: false }, disabled: true },
    { label: 'スロット3（空き）', value: { slot: 3, occupied: false }, disabled: true },
    { label: 'New Game', value: { newGame: true } }
  ],
  onSelect: (v) => { if (v.newGame) pickedNewGame = true; else pickedSlot = v.slot; }
});
chk('ロード(全空): 初期選択は唯一の選択可能行=New Game(index3)', UIPanel.getSelectedIndex() === 3, `idx=${UIPanel.getSelectedIndex()}`);
key('ArrowDown'); key('ArrowDown');
chk('ロード(全空): 矢印移動しても空スロット(disabled)には乗らずNew Gameのまま', UIPanel.getSelectedIndex() === 3);
key('z');
chk('ロード(全空): 決定でNew Gameのみ発火（空スロットはロード不可）', pickedNewGame === true && pickedSlot === null);
UIPanel.close();

// 占有スロットありの場合は占有行が選べる
let loadedSlot = null;
const hostL2 = makeHost();
UIPanel.open({
  host: hostL2, selectable: true,
  items: [
    { label: 'スロット1', value: { slot: 1, occupied: true } },
    { label: 'スロット2（空き）', value: { slot: 2, occupied: false }, disabled: true },
    { label: 'New Game', value: { newGame: true } }
  ],
  onSelect: (v) => { if (!v.newGame) loadedSlot = v.slot; }
});
chk('ロード: 占有スロット1が初期選択(index0)', UIPanel.getSelectedIndex() === 0);
key('z');
chk('ロード: 占有スロット決定でそのスロットをロード', loadedSlot === 1);
UIPanel.close();

console.log(`\n${pass ? '✅ 全PASS: 戦闘DOM契約再現／テキスト結合・エスケープ／統一入力(矢印WS/disabled/2列/決定キャンセル/read-only) を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
