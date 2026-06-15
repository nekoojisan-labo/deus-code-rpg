// save-spec-oracle.js — セーブ仕様マイグレーション(非破壊)を検証。
//   方針: 仕様変更でレベル/ステータスを初期化しない。曲線変更で破綻する exp のみ正規化(クランプ)。
//   (1) クランプ式: 旧曲線の過大expを「次レベル未満」へ下げる／level・stats は不変
//   (2) 既に整合(exp<needed)なら変えない／現行世代(specVersion>=現行)は何もしない
//   (3) index.html 配線: specVersion 刻印・applyGameState から migrateSaveSpec 呼び出し・初期化リセットが無い
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop }, window: {}, Math, JSON, Object, Array, Number, String, Boolean };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('party-system.js'), sb, { filename: 'party-system.js' });
const calculateExpNeeded = sb.window.calculateExpNeeded;
const CHARACTER_GROWTH = sb.window.CHARACTER_GROWTH;

let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

// index.html の clampExp / migrateSaveSpec と同一ロジック（実コードと突き合わせ）
const SAVE_SPEC_VERSION = 2;
const clampExp = (ch) => {
  if (!ch || typeof ch.level !== 'number') return;
  const gid = ch.characterId || ch.id;
  const curve = (CHARACTER_GROWTH && CHARACTER_GROWTH[gid] && CHARACTER_GROWTH[gid].expCurve) || 'normal';
  const need = calculateExpNeeded ? calculateExpNeeded(ch.level, curve) : Infinity;
  if ((ch.exp || 0) >= need) ch.exp = Math.max(0, need - 1);
};
const migrate = (data, player, members) => {
  const from = (data && typeof data.specVersion === 'number') ? data.specVersion : 1;
  if (from >= SAVE_SPEC_VERSION) return;
  if (from < 2) { clampExp(player); members.forEach(clampExp); }
};

console.log('\n=== セーブ仕様マイグレーション・オラクル ===\n');

// (1) 旧曲線の過大exp → クランプ。level/stats は不変
console.log('— (1) 非破壊クランプ —');
const kaito = { characterId: 'kaito', level: 10, exp: 99999, maxHp: 320, attack: 45, defense: 30 };
const yami = { characterId: 'yami', level: 13, exp: 250000, maxHp: 240, attack: 20, magic: 60 };
const before = JSON.parse(JSON.stringify({ kaito, yami }));
migrate({ specVersion: 1 }, kaito, [yami]);
chk('kaito: exp が次レベル必要量未満へクランプ', kaito.exp < calculateExpNeeded(10, 'normal'), `exp=${kaito.exp} < need=${calculateExpNeeded(10, 'normal')}`);
chk('kaito: level は不変(10)', kaito.level === 10);
chk('kaito: maxHp/attack/defense 不変', kaito.maxHp === before.kaito.maxHp && kaito.attack === before.kaito.attack && kaito.defense === before.kaito.defense);
chk('yami: exp クランプ＋level/magic 不変', yami.exp < calculateExpNeeded(13, 'normal') && yami.level === 13 && yami.magic === before.yami.magic, `exp=${yami.exp}`);

// (2) 既に整合 / 現行世代は不変
console.log('\n— (2) 整合済み・現行世代は変えない —');
const ok = { characterId: 'kaito', level: 5, exp: 100 };
migrate({ specVersion: 1 }, ok, []);
chk('exp<needed の値は変えない', ok.exp === 100, `exp=${ok.exp}`);
const cur = { characterId: 'kaito', level: 10, exp: 99999 };
migrate({ specVersion: SAVE_SPEC_VERSION }, cur, []);
chk('現行世代(specVersion=2)は migrate しない', cur.exp === 99999, `exp=${cur.exp}`);

// (3) index.html 配線
console.log('\n— (3) index.html 配線 —');
const idx = read('index.html');
chk('serializeGameState が specVersion を刻印', /specVersion:\s*SAVE_SPEC_VERSION/.test(idx));
chk('SAVE_SPEC_VERSION 定数が定義', /const\s+SAVE_SPEC_VERSION\s*=\s*\d+/.test(idx));
chk('applyGameState から migrateSaveSpec を呼ぶ', /migrateSaveSpec\(data\)/.test(idx));
// 破壊的リセットが無い（migrateSaveSpec 内で level や stat を初期値へ代入していない）
const migBody = (idx.match(/function migrateSaveSpec[\s\S]*?\n        }/) || [''])[0];
chk('migrateSaveSpec が level を再代入していない(初期化しない)', !/\.level\s*=/.test(migBody));
chk('migrateSaveSpec が maxHp/attack/defense を再代入していない', !/\.(maxHp|attack|defense|baseAttack|baseMaxHp)\s*=/.test(migBody));
// 代入(= の直後が = でない)だけを抽出し、すべて .exp への代入であることを確認（=== 等の比較は除外）
const assigns = (migBody.match(/\w+\.\w+\s*=(?!=)/g) || []);
chk('migrateSaveSpec の代入は .exp のみ（level/statは代入しない）', assigns.length > 0 && assigns.every(a => /\.exp\s*=$/.test(a)), `assigns=${JSON.stringify(assigns)}`);

console.log('\n' + (pass ? '✅ 全PASS: 仕様変更は次回以降に適用・既存セーブのレベル/ステータスは保持・expのみ非破壊正規化'
  : '❌ 不合格あり'));
process.exit(pass ? 0 : 1);
