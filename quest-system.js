// ==========================================
// クエスト/目標ガイドシステム (Quest System)
// ==========================================
// 「次に何をすればいいか」を storyFlags から導出して提示する。
// 現在の目標 = QUEST_STEPS のうち done(flags) が false の最初のステップ。
// flags はセーブ対象なので、ロード後も自動的に正しい目標が復元される。

const QUEST_STEPS = [
  // --- 第1章 覚醒 ---
  {
    id: 'meet_akari', chapter: 1, chapterTitle: '第1章 覚醒',
    title: 'アカリと再会する',
    where: '新宿 中央広場 → 西の新宿駅',
    detail: '凍てついた街を抜け、西の新宿駅へ。幼馴染アカリと再会し、地下鉄の異変を聞こう。',
    target: 'shinjuku_station_gate',
    done: f => !!f.chapter1_started
  },
  {
    id: 'go_subway', chapter: 1,
    title: '独り、地下鉄の奥へ',
    where: '広場の西 → 新宿駅 → 改札の先（南）の地下コンコース',
    detail: 'カイトは単身、封鎖された地下へ。心を吸い上げる暴走監視ドローン・Ωが待つ。',
    target: 'subway_concourse_a',
    done: f => !!f.exploredSubway
  },
  {
    id: 'defeat_drone', chapter: 1,
    title: '暴走ドローン・Ωを倒す',
    where: '地下コンコースA',
    detail: '最奥の暴走監視ドローン・Ωを止めよう。',
    target: 'subway_concourse_a',
    done: f => !!f.chapter1_complete || !!f.bossDefeated
  },
  {
    id: 'recruit_riku', chapter: 1,
    title: '地下に残る元警備隊リクを仲間にする',
    where: '地下コンコースA',
    detail: 'Ωを倒した先に、元警備隊員リクがいる。話しかけ、力を示して仲間に加えよう。',
    target: 'subway_concourse_a',
    done: f => !!f.rikuJoined
  },
  {
    id: 'go_shrine', chapter: 1,
    title: '明治神宮で神託を聞く',
    where: '広場の北 → 明治神宮 南参道',
    detail: '謎の声に導かれ、神宮の老神主を訪ねよう。',
    target: 'shrine_south_gate',
    done: f => !!f.metPriest
  },

  // --- 第2章 神託と仲間 ---
  {
    id: 'recruit_yami', chapter: 2, chapterTitle: '第2章 神託と仲間',
    title: '闇市のヤミを仲間にする',
    where: '広場の南 → 商業街 → さらに南西の闇市',
    detail: '監視外の闇市へ。闇魔法使いヤミに話しかけ、仲間に引き入れよう。',
    target: 'black_market_entrance',
    done: f => !!f.yamiPactMade || !!f.yamiJoined
  },

  // --- 第3章 対決 ---
  {
    id: 'go_gov', chapter: 3, chapterTitle: '第3章 対決',
    title: '都庁へ乗り込む',
    where: '広場の東 → 東京都庁 前庭',
    detail: 'アークの中枢、東京都庁へ向かおう。前庭の警備を突破せよ。',
    target: 'tokyo_gov_approach',
    done: f => !!f.enteredGov
  },
  {
    id: 'defeat_arc', chapter: 3,
    title: 'アーク・プライムを倒す',
    where: '都庁を上り、最上階へ',
    detail: '都庁を上って最上階のアーク・プライムを討て。',
    target: 'tokyo_gov_floor3',
    done: f => !!f.arcDefeated
  }
];

const QUEST_ENDING = {
  title: '八百万の神託 — 物語をクリアした！',
  detail: 'アークを打ち倒し、人々に心が戻り始めた。（裏ダンジョン「深層トンネル」にも挑戦できる）'
};

class QuestSystem {
  constructor() {
    this.steps = QUEST_STEPS;
  }

  // 現在の目標（最初の未完了ステップ）。全完了なら null。
  getCurrent(flags = {}) {
    return this.steps.find(s => !s.done(flags)) || null;
  }

  isAllComplete(flags = {}) {
    return this.steps.every(s => s.done(flags));
  }

  getCompleted(flags = {}) {
    return this.steps.filter(s => s.done(flags));
  }

  // ステップが属する章タイトル（chapterTitle は章頭ステップにのみ付与）
  getChapterTitle(step) {
    if (!step) return '';
    for (let i = this.steps.indexOf(step); i >= 0; i--) {
      if (this.steps[i].chapterTitle) return this.steps[i].chapterTitle;
    }
    return `第${step.chapter}章`;
  }

  getProgress(flags = {}) {
    const done = this.getCompleted(flags).length;
    return { done, total: this.steps.length };
  }

  // クエストログ用: 章ごとにまとめた一覧。★未到達(未来)のステップは伏せる＝ネタバレ防止。
  // 完了済み＋現在の目的までを表示し、続きがあれば「？？？」で1つだけ示す。
  getLog(flags = {}) {
    const current = this.getCurrent(flags);
    const curIdx = current ? this.steps.indexOf(current) : this.steps.length - 1; // 全完了なら全部
    const groups = [];
    let g = null;
    this.steps.forEach((s, idx) => {
      if (idx > curIdx) return;  // 未来のステップ(どの仲間/どこ等)は出さない
      if (s.chapterTitle) { g = { chapterTitle: s.chapterTitle, items: [] }; groups.push(g); }
      if (!g) { g = { chapterTitle: `第${s.chapter}章`, items: [] }; groups.push(g); }
      g.items.push({ title: s.title, where: s.where, done: s.done(flags), current: s === current });
    });
    // 続きがあることだけ示す（中身は伏せる）
    if (current && curIdx < this.steps.length - 1) {
      if (!g) { g = { chapterTitle: '', items: [] }; groups.push(g); }
      g.items.push({ title: '？？？', where: '', done: false, current: false, locked: true });
    }
    return groups;
  }
}

if (typeof window !== 'undefined') {
  window.QuestSystem = QuestSystem;
  window.QUEST_STEPS = QUEST_STEPS;
  window.QUEST_ENDING = QUEST_ENDING;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuestSystem, QUEST_STEPS, QUEST_ENDING };
}
