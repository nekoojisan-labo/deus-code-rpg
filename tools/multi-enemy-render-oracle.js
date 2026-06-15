// multi-enemy-render-oracle.js — renderEnemyGroup の DOM 構築を軽量Elスタブで検証。
//   N体 → N スロット / スロット0のスプライトは id="enemySprite" 維持 / data-enemy-index 付与 /
//   複数時のみ名前+HPプレート / 単体は従来構造（shadow+sprite）。CSSレイアウトは対象外（構造のみ）。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};

class El {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.style = {}; this.className = ''; this.id = ''; this.textContent = ''; this._attrs = {}; }
  setAttribute(k, v) { this._attrs[k] = v; }
  appendChild(c) { this.children.push(c); return c; }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
  // 子孫から className 一致を1つ返す簡易セレクタ（'.enemy-sprite' 等のみ対応）
  querySelector(sel) {
    const cls = sel.replace(/^\./, '').split('[')[0];
    const walk = (el) => {
      for (const c of el.children) {
        if (typeof c.className === 'string' && c.className.split(/\s+/).includes(cls)) return c;
        const f = walk(c); if (f) return f;
      }
      return null;
    };
    return walk(this);
  }
}

const stage = new El('div'); stage.className = 'enemy-stage';
const sb = {
  console: { log: noop, warn: noop, error: noop }, window: {},
  document: { getElementById: () => null, querySelector: (s) => (s === '.enemy-stage' ? stage : null), createElement: (t) => new El(t) },
  URLSearchParams, Image: class { set src(_) {} }, setTimeout: () => 0, clearTimeout: noop, requestAnimationFrame: () => 0, performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Date, Proxy
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['object-catalog.js', 'map-walkability-data.js', 'map-objects-data.js', 'party-system.js', 'battle-system.js', 'map-system.js'])
  vm.runInContext(read(f), sb, { filename: f });
const battle = new sb.window.BattleSystem();

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };
const findSprite = (slot) => slot.children.find(c => c.className === 'enemy-sprite');

console.log('\n=== マルチ敵レンダリング・オラクル（DOM構造）===\n');

// --- 3体 ---
stage.children = [];
battle.enemies = [
  { id: 'a', name: 'TestA', emoji: '🤖', currentHp: 10, maxHp: 10 },
  { id: 'b', name: 'TestB', emoji: '👾', currentHp: 5, maxHp: 10 },
  { id: 'c', name: 'TestC', emoji: '👻', currentHp: 0, maxHp: 10 }
];
battle.currentEnemy = battle.enemies[0];
battle.renderEnemyGroup();
chk('3体 → 3スロット生成', stage.children.length === 3, `=${stage.children.length}`);
chk('各スロットに data-enemy-index 0/1/2', stage.children.every((s, i) => s.dataset.enemyIndex === String(i)));
const sp0 = findSprite(stage.children[0]);
const sp1 = findSprite(stage.children[1]);
chk('スロット0のスプライトは id="enemySprite"（互換）', sp0 && sp0.id === 'enemySprite');
chk('スロット1のスプライトは id無し（重複しない）', sp1 && sp1.id === '');
chk('全スロットに .enemy-sprite が存在', stage.children.every(s => !!findSprite(s)));
chk('全スロットに .enemy-shadow が存在', stage.children.every(s => s.children.some(c => c.className === 'enemy-shadow')));
chk('複数時は各スロットに名前プレート(子3つ: 影/スプライト/プレート)', stage.children.every(s => s.children.length >= 3));
chk('★敵HPバーは描画しない(.enemy-slot-hp-fill 不在)', !stage.children.some(s => !!s.querySelector('.enemy-slot-hp-fill')));
chk('★HP0の敵スロットは display:none で画面から消える(透明化ではない)', stage.children[2].style.display === 'none', `display=${stage.children[2].style.display}`);
chk('生存スロットは表示されている(display!=none)', stage.children[0].style.display !== 'none' && stage.children[1].style.display !== 'none');
chk('スロット高さは100%継承(height:100%)＝spriteの高さ崩壊回避', stage.children.every(s => /height:100%/.test(s.style.cssText || '')));

// --- 1体（ボス/単体）---
stage.children = [];
battle.enemies = [{ id: 'boss', name: 'Boss', emoji: '😈', currentHp: 100, maxHp: 100 }];
battle.currentEnemy = battle.enemies[0];
battle.renderEnemyGroup();
chk('1体 → 1スロット', stage.children.length === 1);
const bsp = findSprite(stage.children[0]);
chk('単体スロットのスプライトは id="enemySprite"', bsp && bsp.id === 'enemySprite');
chk('単体時はプレート無し（shadow+spriteの2子）', stage.children[0].children.length === 2, `=${stage.children[0].children.length}`);

console.log('\n' + (pass ? '✅ 全PASS: renderEnemyGroup の DOM構造（N スロット/互換id/プレート/グレーアウト/高さ継承）を確認'
  : '❌ 不合格あり'));
process.exit(pass ? 0 : 1);
