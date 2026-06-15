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
W.startAkariTrial = () => { calls.trial++; };

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
// ヤミは「仮契約」: recruit_yami.onComplete は yamiPactMade を立てるだけ（即joinMemberしない＝本加入は都庁入場時）
const sfY = {};
sys.events.get('recruit_yami').onComplete(sfY);
const yamiPact = sfY.yamiPactMade === true && !calls.join.includes('yami');
console.log(`\nヤミ onComplete → 仮契約 yamiPactMade（即加入しない）: ${yamiPact ? '✅' : '❌'}`);
pass = pass && yamiPact;

sys.events.get('recruit_riku_join').onComplete(sf2);
console.log(`リク勝利 onComplete → joinMember('riku'): ${calls.join.includes('riku') ? '✅' : '❌'}`);
pass = pass && calls.join.includes('riku');

const sf3 = {};
sys.events.get('recruit_riku').onComplete(sf3);
const introOk = sf3.rikuTrialSeen === true && calls.timeouts >= 1;
console.log(`リク前口上 onComplete → rikuTrialSeen＋戦闘予約: ${introOk ? '✅' : '❌'}`);
pass = pass && introOk;

// ---- アカリ: 第1章は再会のみ(単騎続行)→第2章Ω戦で乱入加入 ----
console.log('\n--- アカリ 再会保留→Ω加入 ---');
for (const id of ['recruit_akari_reunion', 'recruit_akari']) {
  const ok = sys.events.has(id);
  console.log(`イベント登録 ${id}: ${ok ? '✅' : '❌'}`);
  pass = pass && ok;
}
// chapter1_start がもう加入もchapter1_startedセットもしないこと（オープニング自動加入の廃止）
const c1 = sys.events.get('chapter1_start');
const sfC1 = {};
const before0 = calls.join.slice();
c1.onComplete(sfC1, {}, { addMember: () => {}, getMember: () => null });
const c1NoJoin = calls.join.length === before0.length && !sfC1.chapter1_started;
console.log(`chapter1_start: アカリ非加入＆chapter1_started立てない（自動加入廃止）: ${c1NoJoin ? '✅' : '❌'}`);
pass = pass && c1NoJoin;
// recruit_akari_reunion: 再会のみ(akariReunited+chapter1_started)・加入しない＝単騎続行
const beforeR = calls.join.slice();
const sfRe = {};
sys.events.get('recruit_akari_reunion').onComplete(sfRe);
const reunionOk = sfRe.akariReunited === true && sfRe.chapter1_started === true && calls.join.length === beforeR.length;
console.log(`recruit_akari_reunion → akariReunited＋chapter1_started・加入しない(単騎続行): ${reunionOk ? '✅' : '❌'}`);
pass = pass && reunionOk;
// recruit_akari(Ω乱入): joinMember('akari')で正式加入
const sfA = {};
sys.events.get('recruit_akari').onComplete(sfA);
const akariJoinOk = calls.join.includes('akari');
console.log(`recruit_akari(Ω乱入) → joinMember('akari')で加入: ${akariJoinOk ? '✅' : '❌'}`);
pass = pass && akariJoinOk;

console.log(`\n${pass ? '✅ 全PASS: 第1章=アカリ再会のみで単騎続行／第2章Ω戦でアカリ乱入加入／リク・ヤミ配線OK' : '❌ 不合格あり'}`);
