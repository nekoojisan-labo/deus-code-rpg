// battle-command-back-oracle.js — Party command selection can step back
// before the turn is executed.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const noop = () => {};

function fakeEl() {
  const cl = new Set();
  return {
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    children: [],
    classList: {
      add: (...xs) => xs.forEach(x => cl.add(x)),
      remove: (...xs) => xs.forEach(x => cl.delete(x)),
      contains: x => cl.has(x),
      toggle: noop
    },
    setAttribute: noop,
    getAttribute: () => null,
    appendChild: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    scrollIntoView: noop
  };
}

const els = {};
const document = {
  getElementById: id => (els[id] = els[id] || fakeEl()),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => fakeEl(),
  addEventListener: noop,
  body: fakeEl()
};

const sb = {
  console: { log: noop, warn: noop, error: noop },
  window: {},
  document,
  setTimeout: fn => { if (typeof fn === 'function') fn(); return 1; },
  clearTimeout: noop,
  requestAnimationFrame: noop,
  performance: { now: () => 0 },
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set, Date: { now: () => 0 },
  URLSearchParams,
  Image: class { set src(_) {} }
};
sb.window.location = { search: '' };
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(read('ui-panel.js'), sb, { filename: 'ui-panel.js' });
vm.runInContext(read('battle-system.js'), sb, { filename: 'battle-system.js' });

const battle = new sb.window.BattleSystem();
const members = [
  { name: 'カイト', hp: 100, maxHp: 100, mp: 20, maxMp: 20, speed: 8 },
  { name: 'アカリ', hp: 80, maxHp: 80, mp: 30, maxMp: 30, speed: 12 },
  { name: 'リク', hp: 120, maxHp: 120, mp: 10, maxMp: 10, speed: 5 }
];
battle.getPartyMembers = () => members;
let showCommandsCalls = 0;
let updateCurrentMemberCalls = 0;
battle.showCommands = () => { showCommandsCalls++; };
battle.updateCurrentMemberDisplay = () => { updateCurrentMemberCalls++; };
battle.inBattle = true;

let pass = true;
const chk = (label, cond, extra) => {
  console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`);
  pass = pass && cond;
};

console.log('\n=== 戦闘コマンド戻り 計器 ===\n');

battle.partyCommands = [
  { member: members[0], command: 'attack', enemyTarget: 0 },
  null,
  null
];
battle.currentMemberIndex = 1;
battle.waitingForCommand = true;
battle.commandPhase = 'command';
battle.kamuiPlanning = true;
battle.kamuiPlanningMember = members[1];
battle.pendingMagic = { id: 'heal' };
battle.availableSkills = [{ id: 'heal' }];
battle.availableTargets = [{ member: members[0], index: 0 }];
const returned = battle.returnToPreviousMemberCommand();
chk('2人目のコマンド選択中に戻ると成功する', returned === true);
chk('currentMemberIndex が直前メンバーへ戻る', battle.currentMemberIndex === 0, `index=${battle.currentMemberIndex}`);
chk('直前メンバーの予約済みコマンドが消える', battle.partyCommands[0] === null);
chk('戻った後は command フェーズで入力待ち', battle.waitingForCommand === true && battle.commandPhase === 'command');
chk('スキル/対象選択の一時状態もクリアされる', !battle.kamuiPlanning && battle.pendingMagic === null && battle.availableSkills.length === 0 && battle.availableTargets.length === 0);
chk('表示更新が呼ばれる', showCommandsCalls > 0 && updateCurrentMemberCalls > 0);

battle.partyCommands = [
  { member: members[0], command: 'defend' },
  { member: members[1], command: 'skip' },
  null
];
battle.currentMemberIndex = 2;
battle.waitingForCommand = true;
showCommandsCalls = 0;
const skippedBack = battle.returnToPreviousMemberCommand();
chk('自動skip済みメンバーは飛ばして、最後に入力したメンバーへ戻る', skippedBack && battle.currentMemberIndex === 0, `index=${battle.currentMemberIndex}`);
chk('戻り先のコマンドだけ消える', battle.partyCommands[0] === null && battle.partyCommands[1]?.command === 'skip');

battle.currentMemberIndex = 0;
battle.partyCommands = [null, null, null];
chk('先頭メンバーでは戻れない', battle.returnToPreviousMemberCommand() === false);

battle.currentMemberIndex = 1;
battle.partyCommands = [{ member: members[0], command: 'attack' }, null, null];
battle.executingTurn = true;
chk('行動実行中は戻れない', battle.returnToPreviousMemberCommand() === false);
battle.executingTurn = false;

const indexSource = read('index.html');
chk('commandフェーズのキャンセルキーが戻り処理へ接続されている', /phase === 'command'[\s\S]{0,220}returnToPreviousMemberCommand\(\)/.test(indexSource));

console.log(`\n${pass ? '✅ 全PASS: コマンド確定後でも実行前なら前メンバーへ戻って選び直せる' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
