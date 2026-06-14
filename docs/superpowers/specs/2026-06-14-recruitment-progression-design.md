# デウス・コード 仲間加入・初期装備/レベル・敵分布 設計書

作成: 2026-06-14 / 対象: deus-code-rpg（nekoojisan-labo）

## 背景・目的
プレイ体験で「仲間加入が薄い／近づくと勝手に仲間になる」「主人公が木刀＋布の服なのに鉄の剣等を最初から所持＝充実しすぎ」「メンバーが武器を持つが未装備」「どのフィールドも同じ敵・同じレベル帯」という違和感がある。これらを、加入を“プロセスのある特別イベント”に、装備/レベルを加入タイミングと整合、敵をフィールドごとに差別化して解消する。

ユーザー確定方針:
- 加入の深さ = 小さな加入クエスト
- 試練の味付け = キャラごとに最適化（混在）
- メンバー加入レベル = 物語段階で固定
- 敵分布 = 新敵を起こしてフィールド別に差別化

## 重要な実装規律
- **JS ファイルを変更したら必ず index.html の `?v=` をバンプ**（今回 v73→74 の反映漏れが「修正が出ない」原因だった）。map-system.js / battle-system.js / party-system.js / story-events.js / index.html 各々。
- 各フェーズで**ヘッドレス検証（tools/ のオラクル）**→ `node --check` → `?v=` バンプ → commit → push（push は sandbox 外で Keychain 使用）。

---

## Phase 1：初期所持品の整理 ＋ メンバー加入レベル/装備

### 1-1. カイトの初期所持品を「質素な出発」に
`index.html`（新規ゲーム初期化, 現状 4642-4661 付近）:
- 維持: `equipItem('wooden_sword')` ＋ `equipItem('cloth_armor')`（装備）、`heal_potion x3`
- **撤去**: `iron_sword` / `leather_armor` / `health_ring` / `elixir` / `energy_core` の初期付与
- 鉄の剣等は店購入・拾得で入手する前提（序盤の手応えを出す）

### 1-2. メンバーは加入時に装備を自動装備（共有インベントリに浮かせない）
加入処理（後述の各 onComplete／recruitMember）で、メンバーごとの初期キットを **addEquipment → equipItem(member)** で装備済みにする。

| 仲間 | 加入Lv（固定） | 自動装備キット |
|---|---|---|
| アカリ | 1 | wooden_sword, cloth_armor |
| リク | 4 | iron_sword, leather_armor, iron_helmet |
| ヤミ | 4 | wooden_sword, cloth_armor, mana_amulet |

- 加入レベルは固定。`CHARACTER_DATA[id].level` をその値にし、HP/MP/各stat をそのレベルで再計算（`CHARACTER_GROWTH` を用いた既存の成長計算を加入時に適用、または固定の妥当値を直接設定）。
- 装備の attack/defense はステータスに反映（既存 equipItem の挙動に従う）。

### Phase 1 検証
`tools/party-init-oracle.js`（新規）: DOMシムで CHARACTER_DATA/equipment/item を実体化 → 新規ゲーム初期化を再現 → 「カイトの所持品＝回復ポーションのみ＋鉄の剣等が無い」「各メンバー加入で指定Lv＋キットが装備済み」を assert。

---

## Phase 2：敵分布（新敵を起こしてフィールド別に差別化）

### 2-1. 新敵を enemyDatabase に追加（既存スプライト流用）
基礎ステータスは既存5体（hp25-60/atk8-15/def5-18/exp15-50）に準じた tier1 ベースライン。エリアの tier 倍率で自動スケールするため基礎は控えめにし、**役割**で差別化。スプライトは `assets/enemies/enemy_*.png`（npcSpriteMap 既出）。

| id | 名前 | スプライト | 役割/基礎傾向 |
|---|---|---|---|
| patrol_drone | パトロールドローン | enemy_patrol_drone | 弱・素早い索敵（city） |
| data_spider | データスパイダー | enemy_data_spider | 群れ・手数（subway） |
| phantom | ファントム | enemy_phantom | 回避・魔寄り（shrine） |
| security_drone | セキュリティドローン | enemy_security_drone | 硬め（garden） |
| shadow_entity | シャドウエンティティ | enemy_shadow_entity | 魔法・呪い（market） |
| guard_robo | ガードロボ | enemy_guard_robo | 重装甲（gov） |
| glitch_spirit | グリッチスピリット | enemy_glitch_spirit | 変則・状態異常（gov/dungeon） |
| queen_spider | クイーンスパイダー | enemy_queen_spider | 深層エリート（dungeon） |

各敵に hp/attack/defense/exp/gold/aiPattern を定義（既存敵の形式に合わせる）。

### 2-2. エリア別テーブル再構成（battle-system.js encounterTables）
levelRange/tier は現行 getEncounterZone を流用（city1[1-3]/subway2[3-5]/shrine2[5-7]/garden3[7-9]/market3[8-10]/gov4[10-13]/dungeon5[13-17]）。顔ぶれを差別化:

```
city:    [watcher, watcher, patrol_drone, cerberus]
subway:  [data_spider, dustGolem, data_spider, cerberus]
shrine:  [phantom, alraune, phantom, watcher]
garden:  [alraune, security_drone, data_spider, alraune]
market:  [shadow_entity, deusMachina, shadow_entity, cerberus]
gov:     [guard_robo, glitch_spirit, deusMachina, guard_robo]
dungeon: [queen_spider, glitch_spirit, shadow_entity, dustGolem]
```
（重複頻度で出現比率を表現。既存敵も各帯に残し連続性を保つ）

### 2-3. パラメータ調整
- 必要なら tierMultiplier（現 1:1.0/2:1.5/3:2.2/4:3.0/5:4.2）を微調整し、各帯の手応えを均す。
- 新敵の exp/gold を役割に応じて設定（エリート=高め）。

### Phase 2 検証
`tools/encounter-oracle.js`（新規）: 各マップ id で getEncounterZone→encounterTables を引き、(a) 全マップで顔ぶれが期待どおり差別化されているか、(b) tier 適用後の代表ステータス/レベルが levelRange と整合するか、(c) フォールバック（city/tier1）に落ちていないか、を出力。新敵スプライトの実ファイル存在も確認。

---

## Phase 3：仲間加入イベント（プロセス化）

### 3-1. 共通
- `handleApproachConversation` の即時 `recruitMember('riku'/'yami')` を撤去 → 各加入イベント発火に置換。
- 駆け寄り即加入をやめ、**話しかける（Z）でイベント開始**。`metPriest` 前は非加入の一言のみ。
- 加入は各イベントの `onComplete` で実行（addMember＋初期スキル＋Phase1の装備キット＋固定Lv）。

### 3-2. リク（戦闘の試練・バイオドーム）
新規 `recruit_riku`（manual）:
1. 話しかける → 警戒の口上＋紋様への言及＋「覚悟を試す」（下書きセリフ）
2. 試練の戦闘を開始（`security_drone` 等を流用した「守護の試練機」、現パーティで）
3. 勝利フックで `recruit_riku_join` シーン → リク加入
- フラグ: `rikuTrialStarted`（戦闘中断→勝利後に加入再開）。勝利検出は battle 終了コールバックで `rikuTrialStarted && !rikuJoined` を判定。
- 失敗（敗北）= 通常のゲームオーバー。特別な失敗分岐なし。

### 3-3. ヤミ（説得・選択肢・闇市）
新規 `recruit_yami`（manual, `scene.choices` 使用）:
1. 話しかける → 値踏みの口上
2. 選択肢「人の心を取り戻す／アークを壊す／分からない」（agency 重視、どれでも加入）
3. ヤミの短い返し → ヤミ加入（`yamiJoined`, `metYami`）

### 3-4. アカリ（オープニング増補・ドラマ＋一押し）
既存 `chapter1_start` を改稿:
1. 再会→机械兵の噂→紋様（既存活用）
2. カイトの逡巡「巻き込めない」→ 選択肢「一緒に来てくれ／待っててくれ」
3. どちらでもアカリは折れず決意 → アカリ加入（短い感情の payoff）

### 3-5. トーン
現状の「神話×サイバー・真面目寄り」を踏襲。セリフは本設計の下書きをベースに、実装時に整える（ユーザーが redline 可）。

### Phase 3 検証
`tools/recruit-oracle.js`（新規）: DOMシムで各イベントを発火 → 選択肢/戦闘勝利フックを模擬 → 加入フラグ・パーティ追加・装備・固定Lv を assert。`handleApproachConversation` 経由の即時加入が無くなったことも確認。

---

## ファイル変更一覧（想定）
- `index.html`: 初期所持品整理 / 加入経路の差し替え / 各 `?v=` バンプ
- `party-system.js`: CHARACTER_DATA の加入Lv・初期キット定義（または加入処理側で付与）
- `battle-system.js`: enemyDatabase 新敵・encounterTables 再構成・tier 微調整
- `story-events.js`: recruit_riku / recruit_yami / chapter1_start 改稿
- `map-system.js`: 駆け寄り即加入の撤去（必要なら）

## 未確定（実装中にユーザー確認しうる点）
- 各加入Lv の具体値（暫定: アカリ1 / リク・ヤミ4）
- 新敵の最終ステータス・exp/gold バランス
- 加入セリフの最終トーン
