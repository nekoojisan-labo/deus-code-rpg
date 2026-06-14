// recruit-oracle.js — リク/ヤミ加入イベントの登録と onComplete の加入処理を検証
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const calls = { join: [], trial: 0, timeouts: 0 };
const sb = {
  console, window: {}, document: { getElementById: () => null, addEventListener: noop, createElement: () => ({ style: {}, classList: { add: noop, remove: noop }, addEventListener: noop, appendChild: noop }) },
  setTimeout: (fn) => { calls.timeouts++; return 0; }, clearTimeout: noop,
  Math, JSON, Object, Array, Number, String, Boolean, Map, Set,
};
sb.window.location = { search: '' }; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('story-events.js'), sb, { filename: 'story-events.js' });
const W = sb.window;
const sys = W.storyEventSystem || new W.StoryEventSystem();

// テスト用スタブ
W.joinMember = (id) => { calls.join.push(id); return true; };
W.startRikuTrial = () => { calls.trial++; };

console.log('\n=== リク/ヤミ加入イベント オラクル ===\n');
let pass = true;
const need = ['recruit_riku', 'recruit_riku_join', 'recruit_yami'];
for (const id of need) {
  const ok = sys.events.has(id);
  console.log(`イベント登録 ${id}: ${ok ? '✅' : '❌'}`);
  pass = pass && ok;
}

// ヤミ: 選択肢シーンが3択あるか
const yami = sys.events.get('recruit_yami');
const choiceScene = yami && yami.scenes.find(s => s.choices);
const yamiChoicesOk = choiceScene && choiceScene.choices.length === 3;
console.log(`\nヤミ説得の選択肢(3択): ${yamiChoicesOk ? '✅ ' + choiceScene.choices.map(c => c.text).join(' / ') : '❌'}`);
pass = pass && yamiChoicesOk;

// 選択肢 action でフラグが立つか
const sf = {};
if (choiceScene) { choiceScene.choices[0].action({ storyFlags: sf }); }
console.log(`選択肢 action でフラグ設定: ${sf.yamiAnswer === 'hearts' ? '✅ yamiAnswer=hearts' : '❌'}`);
pass = pass && sf.yamiAnswer === 'hearts';

// onComplete の加入処理
const sf2 = {};
sys.events.get('recruit_yami').onComplete(sf2);
console.log(`\nヤミ onComplete → joinMember('yami'): ${calls.join.includes('yami') ? '✅' : '❌'}`);
pass = pass && calls.join.includes('yami');

sys.events.get('recruit_riku_join').onComplete(sf2);
console.log(`リク勝利 onComplete → joinMember('riku'): ${calls.join.includes('riku') ? '✅' : '❌'}`);
pass = pass && calls.join.includes('riku');

const sf3 = {};
sys.events.get('recruit_riku').onComplete(sf3);
const introOk = sf3.rikuTrialSeen === true && calls.timeouts >= 1;
console.log(`リク前口上 onComplete → rikuTrialSeen＋戦闘予約: ${introOk ? '✅' : '❌'}`);
pass = pass && introOk;

console.log(`\n${pass ? '✅ 全PASS: リク=前口上→試練→勝利で加入 / ヤミ=選択肢説得→加入 が配線済み' : '❌ 不合格あり'}`);
