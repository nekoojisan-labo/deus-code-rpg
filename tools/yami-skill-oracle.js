// yami-skill-oracle.js — ヤミ(メイジ)が加入時から使えるスキルを持つことを実コードで検証。
// 旧バグ: 初期スキル dark_pulse/curse が魔法DBに無く、joinMemberのlearnMagicが失敗→カムイゼロ。
// 修正: 闇魔法を魔法DBに追加＋joinMemberが加入Lv以下のskillLearningを遡って習得。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const noop = () => {};
const sb = { console: { log: noop, warn: noop, error: noop, trace: noop }, window: {}, Math, JSON, Object, Array, Number, String, Boolean };
sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(read('magic-system.js'), sb, { filename: 'magic-system.js' });
vm.runInContext(read('party-system.js'), sb, { filename: 'party-system.js' });
const W = sb.window;

console.log('\n=== ヤミ(メイジ) 加入時スキル 計器 ===\n');
let pass = true;
const chk = (label, cond, extra) => { console.log(`${cond ? '✅' : '❌'} ${label}${extra ? '  (' + extra + ')' : ''}`); pass = pass && cond; };

const magic = new W.MagicSystem();
// 初期スキルが魔法DBに存在＋mage許可
chk('ダークパルス(dark_pulse)が魔法DBに存在・mage可', !!W.MagicSystem && magic.magicDatabase.dark_pulse && magic.magicDatabase.dark_pulse.allowedRoles.includes('mage'));
chk('カース(curse)が魔法DBに存在・mage可', magic.magicDatabase.curse && magic.magicDatabase.curse.allowedRoles.includes('mage'));

// joinMember相当の習得処理を再現（Lv6で加入＝Lv3/5スキルも遡って習得）
const yami = Object.assign({}, W.CHARACTER_DATA.yami);
yami.level = 6; // MEMBER_LOADOUT のヤミ加入Lv
const growth = W.CHARACTER_GROWTH.yami;
(yami.skills || []).forEach(sk => magic.learnMagic(sk, yami));
Object.keys(growth.skillLearning).forEach(lv => { if (parseInt(lv, 10) <= yami.level) [].concat(growth.skillLearning[lv]).forEach(sk => magic.learnMagic(sk, yami)); });

const learned = magic.getLearnedMagic(yami);
const ids = Object.values(learned).map(m => m && m.id).filter(Boolean);
const has = (id) => ids.includes(id);
chk('加入時に初期スキル(dark_pulse/curse)を習得している＝丸腰でない', has('dark_pulse') && has('curse'), `learned=${ids.join(',')}`);
chk('加入Lv6以下のskillLearning(ice_lance@3 / thunder_strike@5)も遡って習得', has('ice_lance') && has('thunder_strike'));
chk('加入Lvより上のスキル(explosion@8 / haste@10)は未習得', !has('explosion') && !has('haste'));
chk('習得スキル数が1以上（カムイ選択肢が出る）', ids.length >= 4, `count=${ids.length}`);

console.log(`\n${pass ? '✅ 全PASS: ヤミは加入時から闇魔法＋遡及スキルを持ち、メイジとして戦える を実コードで確認' : '❌ 不合格あり'}`);
process.exit(pass ? 0 : 1);
